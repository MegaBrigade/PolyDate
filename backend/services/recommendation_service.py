from supabase import Client
from math import radians, cos, sin, asin, sqrt
import logging
from typing import List

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

    async def get_candidates(
            self,
            user_id: int,
            radius_km: float = 50.0,
            age_min: int = None,
            age_max: int = None,
            gender_filter: str = None
    ) -> List[dict]:
        try:
            user_response = self.db.table('users').select(
                'latitude, longitude'
            ).eq('id', user_id).execute()
            if not user_response.data:
                return []

            user_lat = float(user_response.data[0]['latitude'])
            user_lon = float(user_response.data[0]['longitude'])

            # Получаем всех видимых пользователей кроме себя
            all_users = self.db.table('users').select(
                'id, age, gender, latitude, longitude, is_visible'
            ).neq('id', user_id).eq('is_visible', True).execute()

            if not all_users.data:
                return []

            # Кого уже лайкнули (есть в liked_by у других И записи в likes)
            # В нашей схеме "уже видели" = user_id есть в liked_by КОГО-ТО
            # Но проще: получаем из feed.candidates уже показанных
            # Fallback: пока просто исключаем тех, кто уже в matches

            # Получаем матчи — их не показываем
            matches = self.db.table('matches').select('user1_id, user2_id').or_(
                f'user1_id.eq.{user_id},user2_id.eq.{user_id}'
            ).execute()
            matched_ids = set()
            for m in (matches.data or []):
                matched_ids.add(m['user1_id'])
                matched_ids.add(m['user2_id'])
            matched_ids.discard(user_id)

            # Получаем тех, кто уже в нашем liked_by (мы их лайкнули)
            # В likes: строка uid=user_id, liked_by — те кто лайкнул нас
            # Нам нужно обратное: кого МЫ лайкнули
            # Это хранится как: наш id есть в liked_by[candidate_id]
            # Для фильтрации "уже свайпнутых" используем feed таблицу
            feed_row = self.db.table('feed').select('candidates').eq('user_id', user_id).execute()
            seen_ids = set()
            if feed_row.data and feed_row.data[0].get('candidates'):
                seen_ids = set(feed_row.data[0]['candidates'])

            exclude_ids = matched_ids | seen_ids

            candidates = []
            for other in all_users.data:
                if other['id'] in exclude_ids:
                    continue

                if other['latitude'] is None or other['longitude'] is None:
                    continue

                distance = self.haversine_distance(
                    user_lat, user_lon,
                    float(other['latitude']), float(other['longitude'])
                )
                if distance > radius_km:
                    continue

                if age_min and other.get('age', 0) < age_min:
                    continue
                if age_max and other.get('age', 999) > age_max:
                    continue

                if gender_filter and gender_filter != 'all':
                    if other.get('gender', '').lower() != gender_filter.lower():
                        continue

                compatibility = await self.calculate_compatibility(user_id, other['id'])
                candidates.append({
                    'user_id': other['id'],
                    'compatibility': compatibility,
                    'distance': round(distance, 2),
                })

            candidates.sort(key=lambda x: x['compatibility'], reverse=True)
            return candidates

        except Exception as e:
            logger.error(f"Error getting candidates: {e}")
            return []

    async def calculate_compatibility(self, user_id_a: int, user_id_b: int) -> float:
        """
        0-100%.
        20% — теги (4% за каждый совпадающий, макс 5)
        80% — OCEAN из test_results (по 16% на каждое из 5 измерений)

        Если у одного из пользователей нет результатов теста —
        используем нейтральные значения (5) для недостающих данных,
        что даёт 50% по OCEAN-части вместо полного игнорирования.
        Если тест не прошёл никто — возвращаем только tag_score.
        """
        NEUTRAL = 5.0  # нейтральное значение на шкале 1-10

        try:
            # Теги
            tags_a = self.db.table('user_tags').select('tags(name)').eq('user_id', user_id_a).execute()
            tags_b = self.db.table('user_tags').select('tags(name)').eq('user_id', user_id_b).execute()

            set_a = {t['tags']['name'] for t in tags_a.data if t.get('tags')} if tags_a.data else set()
            set_b = {t['tags']['name'] for t in tags_b.data if t.get('tags')} if tags_b.data else set()

            tag_score = min(len(set_a & set_b) * 4, 20)

            # OCEAN из таблицы test_results
            # Приводим id к int явно, чтобы избежать проблем с bigint/str из Supabase
            id_a = int(user_id_a)
            id_b = int(user_id_b)

            tr_resp = self.db.table('test_results').select(
                'user_id, openness, conscientiousness, extraversion, agreeableness, neuroticism'
            ).in_('user_id', [id_a, id_b]).execute()

            records = {int(r['user_id']): r for r in (tr_resp.data or [])}
            tr_a = records.get(id_a)
            tr_b = records.get(id_b)

            # Если ни у кого нет теста — только теги
            if not tr_a and not tr_b:
                return float(tag_score)

            ocean_dims = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']
            ocean_score = 0.0

            for dim in ocean_dims:
                x = float((tr_a or {}).get(dim) or NEUTRAL)
                y = float((tr_b or {}).get(dim) or NEUTRAL)
                # Чем меньше разница — тем выше совместимость
                # Максимальная разница на шкале 1-10 = 9
                ocean_score += (9 - abs(x - y)) / 9 * 16

            total = tag_score + ocean_score
            return round(min(total, 100.0), 2)

        except Exception as e:
            logger.error(f"Error calculating compatibility: {e}")
            return 0.0