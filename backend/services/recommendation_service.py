from supabase import Client
from math import radians, cos, sin, asin, sqrt
import logging
from typing import List, Optional

from backend.cache import (
    cache,
    TTL_CANDIDATES, TTL_COMPAT, TTL_TAGS, TTL_OCEAN, TTL_FEED_SEEN,
    key_candidates, key_compat, key_tags, key_ocean, key_feed_seen,
)

logger = logging.getLogger(__name__)


class RecommendationService:
    """Генерирует ленту на основе геолокации, тегов и совместимости"""

    def __init__(self, db: Client):
        self.db = db

    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat, dlon = lat2 - lat1, lon2 - lon1
        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        return R * 2 * asin(sqrt(a))

    # ─── ТЕГИ ───────────────────────────────────────────────────────────
    async def _get_user_tags(self, user_id: int) -> set:
        cached = await cache.get(key_tags(user_id))
        if cached is not None:
            # из кэша приходит list, превращаем в set
            return set(cached)
        resp = self.db.table('user_tags').select('tags(name)').eq('user_id', user_id).execute()
        tags = {t['tags']['name'] for t in resp.data if t.get('tags')} if resp.data else set()
        # сохраняем list вместо set
        await cache.set(key_tags(user_id), list(tags), ttl=TTL_TAGS)
        return tags

    # ─── OCEAN ──────────────────────────────────────────────────────────
    async def _get_ocean(self, user_id: int):
        cached = await cache.get(key_ocean(user_id))
        if cached is not None:
            return None if cached is False else cached
        resp = self.db.table('test_results').select(
            'openness, conscientiousness, extraversion, agreeableness, neuroticism'
        ).eq('user_id', user_id).execute()
        record = resp.data[0] if resp.data else None
        await cache.set(key_ocean(user_id), record if record is not None else False, ttl=TTL_OCEAN)
        return record

    # ─── ПРОСМОТРЕННЫЕ ──────────────────────────────────────────────────
    async def _get_seen_ids(self, user_id: int) -> set:
        cached = await cache.get(key_feed_seen(user_id))
        if cached is not None:
            return set(cached)
        feed_row = self.db.table('feed').select('candidates').eq('user_id', user_id).execute()
        seen = set()
        if feed_row.data and feed_row.data[0].get('candidates'):
            seen = set(feed_row.data[0]['candidates'])
        await cache.set(key_feed_seen(user_id), list(seen), ttl=TTL_FEED_SEEN)
        return seen

    # ─── СОВМЕСТИМОСТЬ ──────────────────────────────────────────────────
    async def calculate_compatibility(self, user_id_a: int, user_id_b: int) -> float:
        """0-100%. Кэшируется на TTL_COMPAT (10 мин)."""
        ck = key_compat(user_id_a, user_id_b)
        cached = await cache.get(ck)
        if cached is not None:
            return cached

        NEUTRAL = 5.0
        try:
            set_a, set_b = await self._get_user_tags(user_id_a), await self._get_user_tags(user_id_b)
            tag_score = min(len(set_a & set_b) * 4, 20)

            tr_a = await self._get_ocean(user_id_a)
            tr_b = await self._get_ocean(user_id_b)

            if not tr_a and not tr_b:
                result = float(tag_score)
            else:
                ocean_dims = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']
                ocean_score = sum(
                    (9 - abs(float((tr_a or {}).get(d) or NEUTRAL) - float((tr_b or {}).get(d) or NEUTRAL))) / 9 * 16
                    for d in ocean_dims
                )
                result = round(min(tag_score + ocean_score, 100.0), 2)

            await cache.set(ck, result, ttl=TTL_COMPAT)
            return result

        except Exception as e:
            logger.error(f"Error calculating compatibility: {e}")
            return 0.0

    # ─── КАНДИДАТЫ ──────────────────────────────────────────────────────
    async def get_candidates(
            self,
            user_id: int,
            radius_km: float = 50.0,
            age_min: int = None,
            age_max: int = None,
            gender_filter: str = None
    ) -> List[dict]:
        ck = key_candidates(user_id, radius_km, age_min, age_max, gender_filter)
        cached = await cache.get(ck)
        if cached is not None:
            # ФИХ #4: не возвращаем закэшированный пустой список —
            # пустой результат мог быть следствием бага с координатами.
            if len(cached) > 0:
                logger.debug(f"[cache HIT] candidates for user {user_id}")
                return cached
            logger.debug(f"[cache HIT empty] candidates for user {user_id} — re-fetching")

        try:
            user_response = self.db.table('users').select(
                'latitude, longitude'
            ).eq('id', user_id).execute()
            if not user_response.data:
                logger.warning(f"User {user_id} not found in DB")
                return []

            # ФИХ #1: защита от NULL координат у текущего пользователя.
            # Если координаты не заданы — показываем анкеты без фильтра по расстоянию.
            raw_lat = user_response.data[0].get('latitude')
            raw_lon = user_response.data[0].get('longitude')
            has_location = raw_lat is not None and raw_lon is not None
            if not has_location:
                logger.warning(
                    f"User {user_id} has no coordinates — distance filter disabled"
                )
            user_lat = float(raw_lat) if has_location else None
            user_lon = float(raw_lon) if has_location else None

            # ФИХ #2: is_visible = NULL тоже пропускаем (как "видимый"),
            # фильтруем только явно выключенных (is_visible = false).
            all_users = self.db.table('users').select(
                'id, age, gender, latitude, longitude, is_visible'
            ).neq('id', user_id).or_('is_visible.eq.true,is_visible.is.null').execute()

            if not all_users.data:
                logger.warning("No other visible users found in DB")
                return []

            matches = self.db.table('matches').select('user1_id, user2_id').or_(
                f'user1_id.eq.{user_id},user2_id.eq.{user_id}'
            ).execute()
            matched_ids = set()
            for m in (matches.data or []):
                matched_ids.add(m['user1_id'])
                matched_ids.add(m['user2_id'])
            matched_ids.discard(user_id)

            seen_ids = await self._get_seen_ids(user_id)
            exclude_ids = matched_ids | seen_ids

            candidates = []
            for other in all_users.data:
                if other['id'] in exclude_ids:
                    continue

                # Расстояние: если у нас нет координат — пропускаем проверку.
                # Если у кандидата нет координат — тоже пропускаем кандидата.
                if has_location:
                    if other['latitude'] is None or other['longitude'] is None:
                        continue
                    distance = self.haversine_distance(
                        user_lat, user_lon,
                        float(other['latitude']), float(other['longitude'])
                    )
                    if distance > radius_km:
                        continue
                else:
                    # координат нет — расстояние неизвестно, ставим 0
                    distance = 0.0

                if age_min and other.get('age') is not None and other['age'] < age_min:
                    continue
                if age_max and other.get('age') is not None and other['age'] > age_max:
                    continue
                if gender_filter and gender_filter != 'all':
                    if (other.get('gender') or '').lower() != gender_filter.lower():
                        continue

                compatibility = await self.calculate_compatibility(user_id, other['id'])
                candidates.append({
                    'user_id': other['id'],
                    'compatibility': compatibility,
                    'distance': round(distance, 2),
                })

            candidates.sort(key=lambda x: x['compatibility'], reverse=True)

            # ФИХ #4: кэшируем только непустые результаты,
            # чтобы не фиксировать [] из-за временных проблем.
            if candidates:
                await cache.set(ck, candidates, ttl=TTL_CANDIDATES)
            logger.debug(f"[cache MISS] candidates user {user_id}: {len(candidates)} results")
            return candidates

        except Exception as e:
            logger.error(f"Error getting candidates for user {user_id}: {e}", exc_info=True)
            return []

    # ─── ИНВАЛИДАЦИЯ ─────────────────────────────────────────────────────
    @staticmethod
    async def invalidate_user(user_id: int) -> None:
        """
        Сбрасывает все кэши пользователя.
        Вызывай после: обновления профиля/тегов, сохранения OCEAN, свайпа.
        """
        await cache.delete(key_tags(user_id))
        await cache.delete(key_ocean(user_id))
        await cache.delete(key_feed_seen(user_id))
        await cache.delete_prefix(f"candidates:{user_id}:")
        await cache.delete_prefix(f"compat:{user_id}:")
        logger.info(f"Cache invalidated for user {user_id}")