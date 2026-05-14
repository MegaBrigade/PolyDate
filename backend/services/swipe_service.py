from supabase import Client
from datetime import datetime
import logging
from typing import List, Dict, Optional
import json

logger = logging.getLogger(__name__)


class SwipeService:
    """
    likes.uid  = user_id (FK → users.id, GENERATED ALWAYS AS IDENTITY)
    likes.liked_by = jsonb[]  — массив JSON-значений id тех, кто лайкнул
    
    Для работы с jsonb[] используем Supabase RPC-функции add_like / remove_like,
    которые заданы в supabase_setup.sql
    """

    def __init__(self, db: Client):
        self.db = db

    def _id_in_jsonb_array(self, arr: list, user_id: int) -> bool:
        """Проверяем наличие user_id в jsonb[]-массиве из Supabase"""
        if not arr:
            return False
        for item in arr:
            # Supabase возвращает элементы jsonb[] как Python int или dict
            try:
                if isinstance(item, int) and item == user_id:
                    return True
                if isinstance(item, str) and int(item) == user_id:
                    return True
                # jsonb число может прийти как float
                if isinstance(item, float) and int(item) == user_id:
                    return True
            except (ValueError, TypeError):
                continue
        return False

    def _extract_ids_from_jsonb_array(self, arr: list) -> List[int]:
        """Извлекаем bigint ID из jsonb[]-массива"""
        result = []
        if not arr:
            return result
        for item in arr:
            try:
                result.append(int(item))
            except (ValueError, TypeError):
                continue
        return result

    # ------------------------------------------------------------------
    # HELPERS
    # ------------------------------------------------------------------
    def _mark_as_seen(self, user_id: int, seen_user_id: int):
        """Добавляем seen_user_id в feed.candidates (список просмотренных)"""
        try:
            feed_row = self.db.table('feed').select('candidates').eq('user_id', user_id).execute()
            if feed_row.data:
                candidates = feed_row.data[0].get('candidates') or []
                if seen_user_id not in candidates:
                    candidates.append(seen_user_id)
                    self.db.table('feed').update({'candidates': candidates}).eq('user_id', user_id).execute()
            else:
                self.db.table('feed').insert({'user_id': user_id, 'candidates': [seen_user_id]}).execute()
        except Exception as e:
            logger.warning(f'Could not update feed seen list: {e}')

    # ------------------------------------------------------------------
    # LIKE
    # ------------------------------------------------------------------
    async def like_user(self, user_id: int, liked_user_id: int, compatibility: float) -> Dict:
        """
        user_id лайкает liked_user_id.
        1. Записываем в таблицу likes (user_id, liked_user_id).
        2. Добавляем user_id в users.liked_by[liked_user_id] (JSONB).
        3. Проверяем взаимный лайк через users.liked_by[user_id].
        """
        try:
            # 1. Записываем лайк в таблицу likes
            self.db.table('likes').insert({
                'user_id': user_id,
                'liked_user_id': liked_user_id,
                'action': 'like',
                'compatibility_percentage': compatibility,
            }).execute()

            logger.info(f"✅ Like: {user_id} → {liked_user_id}")

            # 2. Добавляем user_id в liked_by цели (liked_user_id)
            target_row = self.db.table('users').select('liked_by').eq('id', liked_user_id).execute()
            if target_row.data:
                liked_by = target_row.data[0].get('liked_by') or []
                if not self._id_in_jsonb_array(liked_by, user_id):
                    liked_by.append(user_id)
                    self.db.table('users').update({'liked_by': liked_by}).eq('id', liked_user_id).execute()

            # 3. Проверяем взаимный лайк: есть ли liked_user_id в liked_by[user_id]?
            row = self.db.table('users').select('liked_by').eq('id', user_id).execute()
            user_liked_by = row.data[0].get('liked_by', []) if row.data else []

            is_match = self._id_in_jsonb_array(user_liked_by, liked_user_id)

            if is_match:
                # Проверяем нет ли уже матча
                u1, u2 = min(user_id, liked_user_id), max(user_id, liked_user_id)
                existing = self.db.table('matches').select('id').eq(
                    'user1_id', u1
                ).eq('user2_id', u2).execute()

                match_id = None
                if not existing.data:
                    resp = self.db.table('matches').insert({
                        'user1_id': u1,
                        'user2_id': u2,
                        'is_active': True,
                    }).execute()
                    match_id = resp.data[0]['id'] if resp.data else None
                    logger.info(f"✅ MATCH! {user_id} ↔ {liked_user_id}")
                else:
                    match_id = existing.data[0]['id']

                self._mark_as_seen(user_id, liked_user_id)
                return {'success': True, 'is_match': True, 'match_id': match_id, 'match_user_id': liked_user_id}

            self._mark_as_seen(user_id, liked_user_id)
            return {'success': True, 'is_match': False}

        except Exception as e:
            logger.error(f"❌ Error liking user: {e}")
            raise

    # ------------------------------------------------------------------
    # DISLIKE
    # ------------------------------------------------------------------
    async def dislike_user(self, user_id: int, disliked_user_id: int) -> Dict:
        """Дизлайк — записываем action=dislike в таблицу likes"""
        try:
            self.db.table("likes").insert({
                "user_id": user_id,
                "liked_user_id": disliked_user_id,
                "action": "dislike",
            }).execute()
            logger.info(f"Dislike: {user_id} → {disliked_user_id}")
        except Exception as e:
            logger.warning(f"Could not record dislike: {e}")
        self._mark_as_seen(user_id, disliked_user_id)
        return {"success": True}

    # ------------------------------------------------------------------
    # КТО ЛАЙКНУЛ МЕНЯ
    # ------------------------------------------------------------------
    async def get_likes_received(self, user_id: int) -> List[Dict]:
        try:
            row = self.db.table('users').select('liked_by').eq('id', user_id).execute()
            if not row.data:
                return []

            liked_by_raw = row.data[0].get('liked_by') or []
            liked_by_ids = self._extract_ids_from_jsonb_array(liked_by_raw)

            if not liked_by_ids:
                return []

            likers = self.db.table('users').select(
                'id, first_name, age, city'
            ).in_('id', liked_by_ids).execute()

            result = []
            for u in (likers.data or []):
                photos = self.db.table('photos').select('url').eq(
                    'user_id', u['id']
                ).order('order_index').limit(1).execute()
                u['photos'] = [p['url'] for p in photos.data] if photos.data else []
                result.append(u)

            return result

        except Exception as e:
            logger.error(f"❌ Error get_likes_received: {e}")
            return []

    # ------------------------------------------------------------------
    # ПРОВЕРИТЬ: лайкнул ли target меня
    # ------------------------------------------------------------------
    async def is_user_in_liked_by(self, user_id: int, target_user_id: int) -> bool:
        try:
            row = self.db.table('users').select('liked_by').eq('id', user_id).execute()
            if not row.data:
                return False
            liked_by = row.data[0].get('liked_by') or []
            return self._id_in_jsonb_array(liked_by, target_user_id)
        except Exception as e:
            logger.error(f"❌ Error is_user_in_liked_by: {e}")
            return False

    # ------------------------------------------------------------------
    # ВЗАИМНЫЙ ЛАЙК
    # ------------------------------------------------------------------
    async def is_mutual_like(self, user_id_a: int, user_id_b: int) -> bool:
        try:
            a_likes_b = await self.is_user_in_liked_by(user_id_b, user_id_a)
            b_likes_a = await self.is_user_in_liked_by(user_id_a, user_id_b)
            return a_likes_b and b_likes_a
        except Exception as e:
            logger.error(f"❌ Error is_mutual_like: {e}")
            return False

    # ------------------------------------------------------------------
    # МОИ МАТЧИ
    # ------------------------------------------------------------------
    async def get_matches(self, user_id: int) -> List[Dict]:
        try:
            resp = self.db.table('matches').select('*').or_(
                f'user1_id.eq.{user_id},user2_id.eq.{user_id}'
            ).eq('is_active', True).execute()

            result = []
            for match in (resp.data or []):
                other_id = match['user2_id'] if match['user1_id'] == user_id else match['user1_id']
                u = self.db.table('users').select('id, first_name, age, city, bio').eq('id', other_id).execute()
                if not u.data:
                    continue
                user_data = u.data[0]
                user_data['matched_at'] = match['matched_at']
                user_data['match_id'] = match['id']
                photos = self.db.table('photos').select('url').eq(
                    'user_id', other_id
                ).order('order_index').limit(1).execute()
                user_data['photos'] = [p['url'] for p in photos.data] if photos.data else []
                result.append(user_data)

            return result

        except Exception as e:
            logger.error(f"Error get_matches: {e}")
            return []