from supabase import Client
from datetime import datetime
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class SwipeService:
    """
    Handles likes/dislikes with PostgreSQL triggers.

    JSONB liked_by column is automatically updated by database triggers.
    No manual JSONB updates needed from Python!
    """

    def __init__(self, db: Client):
        self.db = db

    # ============================================
    # LIKE USER (with action='like')
    # ============================================
    async def like_user(self, user_id: int, liked_user_id: int, compatibility: float) -> Dict:
        """
        User likes another user. Insert a 'like' record.
        PostgreSQL trigger still updates liked_by JSONB (if you have one).
        """
        try:
            # Insert or update like record
            like_record = {
                'user_id': user_id,
                'liked_user_id': liked_user_id,
                'compatibility_percentage': compatibility,
                'action': 'like',
                'created_at': datetime.utcnow().isoformat()
            }
            # Use upsert to avoid duplicates
            response = self.db.table('likes').upsert(
                like_record,
                on_conflict='user_id,liked_user_id'  # composite unique constraint
            ).execute()

            logger.info(f"✅ Like recorded: {user_id} → {liked_user_id} (compatibility: {compatibility}%)")

            # Check for mutual like (match) – look for a 'like' from the other side
            mutual = self.db.table('likes').select('id').eq(
                'user_id', liked_user_id
            ).eq('liked_user_id', user_id).eq('action', 'like').execute()

            is_match = bool(mutual.data)

            if is_match:
                match_record = {
                    'user1_id': min(user_id, liked_user_id),
                    'user2_id': max(user_id, liked_user_id),
                    'matched_at': datetime.utcnow().isoformat(),
                    'is_active': True
                }
                match_response = self.db.table('matches').insert(match_record).execute()
                logger.info(f"✅ MATCH! {user_id} ↔ {liked_user_id}")

                return {
                    'success': True,
                    'is_match': True,
                    'match_id': match_response.data[0]['id'],
                    'match_user_id': liked_user_id
                }

            return {'success': True, 'is_match': False}

        except Exception as e:
            logger.error(f"❌ Error liking user: {e}")
            raise

    # ============================================
    # DISLIKE USER (with action='dislike')
    # ============================================
    async def dislike_user(self, user_id: int, disliked_user_id: int) -> Dict:
        """
        User dislikes another user.
        Insert a 'dislike' record and remove any existing 'like' from the other side if present.
        """
        try:
            # Insert a dislike record (upsert to ensure only one record per pair)
            dislike_record = {
                'user_id': user_id,
                'liked_user_id': disliked_user_id,  # column name remains 'liked_user_id'
                'action': 'dislike',
                'created_at': datetime.utcnow().isoformat()
            }
            self.db.table('likes').upsert(
                dislike_record,
                on_conflict='user_id,liked_user_id'
            ).execute()

            # If the other user had liked this user, remove that like (break potential match)
            self.db.table('likes').delete().eq(
                'user_id', disliked_user_id
            ).eq('liked_user_id', user_id).eq('action', 'like').execute()

            logger.info(f"✅ Dislike recorded: {user_id} → {disliked_user_id} (action='dislike')")
            return {'success': True}

        except Exception as e:
            logger.error(f"❌ Error disliking user: {e}")
            raise

    # ============================================
    # GET LIKES RECEIVED (only 'like' actions)
    # ============================================
    async def get_likes_received(self, user_id: int) -> List[Dict]:
        """
        Get list of users who liked this user (action='like').
        Includes their first approved photo.
        """
        try:
            # If you have the liked_by JSONB column (fastest)
            user_response = self.db.table('users').select('liked_by').eq('id', user_id).execute()
            if user_response.data and user_response.data[0].get('liked_by'):
                liked_by_ids = user_response.data[0]['liked_by']
                if not liked_by_ids:
                    return []

                # Fetch user profiles (without photos)
                likers_response = self.db.table('users').select(
                    'id, first_name, last_name, age, gender, city'
                ).in_('id', liked_by_ids).execute()

                if not likers_response.data:
                    return []

                # For each liker, fetch first approved photo
                for user in likers_response.data:
                    photos_response = self.db.table('photos').select('url').eq(
                        'user_id', user['id']
                    ).eq('moderation_status', 'approved').order('order_index').limit(1).execute()
                    user['photos'] = [p['url'] for p in photos_response.data] if photos_response.data else []

                return likers_response.data

            # Fallback: query likes table
            likes_response = self.db.table('likes').select('user_id').eq(
                'liked_user_id', user_id
            ).eq('action', 'like').execute()
            if not likes_response.data:
                return []

            liker_ids = [row['user_id'] for row in likes_response.data]
            likers_response = self.db.table('users').select(
                'id, first_name, last_name, age, gender, city'
            ).in_('id', liker_ids).execute()

            if not likers_response.data:
                return []

            # Attach photos
            for user in likers_response.data:
                photos_response = self.db.table('photos').select('url').eq(
                    'user_id', user['id']
                ).eq('moderation_status', 'approved').order('order_index').limit(1).execute()
                user['photos'] = [p['url'] for p in photos_response.data] if photos_response.data else []

            return likers_response.data

        except Exception as e:
            logger.error(f"❌ Error getting likes received: {e}")
            return []

    async def is_user_in_liked_by(self, user_id: int, target_user_id: int) -> bool:
        """
        Check if target_user_id has liked user_id.

        ⚡ VERY FAST: Simple JSONB array lookup!

        Args:
            user_id: User to check if they were liked by
            target_user_id: User to check if they liked

        Returns:
            True if target_user_id liked user_id
        """
        try:
            user_response = self.db.table('users').select('liked_by').eq(
                'id', user_id
            ).execute()

            if not user_response.data:
                return False

            liked_by = user_response.data[0]['liked_by'] or []
            return target_user_id in liked_by

        except Exception as e:
            logger.error(f"❌ Error checking liked_by: {e}")
            return False

    async def is_mutual_like(self, user_id_a: int, user_id_b: int) -> bool:
        """
        Check if two users have mutual like (match).

        Args:
            user_id_a: First user
            user_id_b: Second user

        Returns:
            True if both users liked each other
        """
        try:
            # Get both users' liked_by arrays
            users_response = self.db.table('users').select('id, liked_by').in_(
                'id', [user_id_a, user_id_b]
            ).execute()

            if not users_response.data or len(users_response.data) < 2:
                return False

            user_a = next((u for u in users_response.data if u['id'] == user_id_a), None)
            user_b = next((u for u in users_response.data if u['id'] == user_id_b), None)

            if not user_a or not user_b:
                return False

            # Check if A likes B AND B likes A (using likes table)
            # More reliable than JSONB for match checking
            mutual = self.db.table('likes').select('id').eq(
                'user_id', user_id_a
            ).eq('liked_user_id', user_id_b).execute()

            if not mutual.data:
                return False

            mutual = self.db.table('likes').select('id').eq(
                'user_id', user_id_b
            ).eq('liked_user_id', user_id_a).execute()

            return bool(mutual.data)

        except Exception as e:
            logger.error(f"❌ Error checking mutual like: {e}")
            return False

    async def get_like_info(self, user_id: int, liked_user_id: int) -> Optional[Dict]:
        """
        Get like info (compatibility, timestamp).

        Args:
            user_id: Who liked
            liked_user_id: Who was liked

        Returns:
            {
                'id': int,
                'compatibility_percentage': float,
                'created_at': str (timestamp)
            }
        """
        try:
            response = self.db.table('likes').select('*').eq(
                'user_id', user_id
            ).eq('liked_user_id', liked_user_id).execute()

            if response.data:
                logger.info(f"✅ Found like info: {user_id} → {liked_user_id}")
                return response.data[0]

            return None

        except Exception as e:
            logger.error(f"❌ Error getting like info: {e}")
            return None

    # ============================================
    # GET MATCHES (mutual 'like' actions)
    # ============================================
    async def get_matches(self, user_id: int) -> List[Dict]:
        """
        Get all active matches for a user, including their first photo.
        Matches table columns: user1_id, user2_id, matched_at, is_active
        """
        try:
            matches_response = self.db.table('matches').select('*').or_(
                f'user1_id.eq.{user_id},user2_id.eq.{user_id}'
            ).eq('is_active', True).execute()

            if not matches_response.data:
                return []

            matches = []
            for match in matches_response.data:
                other_user_id = match['user2_id'] if match['user1_id'] == user_id else match['user1_id']

                # Fetch other user's profile (without photo first)
                user_response = self.db.table('users').select(
                    'id, first_name, last_name, age, gender, city, bio'
                ).eq('id', other_user_id).execute()

                if not user_response.data:
                    continue

                user_data = user_response.data[0]
                user_data['matched_at'] = match['matched_at']
                user_data['match_id'] = match['id']

                # Fetch first approved photo for this user
                photos_response = self.db.table('photos').select('url').eq(
                    'user_id', other_user_id
                ).eq('moderation_status', 'approved').order('order_index').limit(1).execute()
                user_data['photos'] = [p['url'] for p in photos_response.data] if photos_response.data else []

                matches.append(user_data)

            return matches

        except Exception as e:
            logger.error(f"Error getting matches: {e}")
            return []

    async def get_compatibility_with_user(
            self,
            user_id: int,
            other_user_id: int
    ) -> Optional[float]:
        """
        Get compatibility percentage with another user.

        Args:
            user_id: First user
            other_user_id: Second user

        Returns:
            Compatibility percentage or None if no like
        """
        try:
            like_info = await self.get_like_info(user_id, other_user_id)
            if like_info:
                return like_info['compatibility_percentage']
            return None

        except Exception as e:
            logger.error(f"❌ Error getting compatibility: {e}")
            return None