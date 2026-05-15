from supabase import Client
from backend.schemas.user import UserRegisterRequest, UserUpdateRequest
from backend.cache import cache, key_tags, key_ocean, key_profile
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)


class ProfileService:
    def __init__(self, db: Client):
        self.db = db

    async def register_user(self, user_data: UserRegisterRequest) -> dict:
        """Register new user with basic info"""
        try:
            today = date.today()
            age = today.year - user_data.date_of_birth.year - (
                (today.month, today.day) <
                (user_data.date_of_birth.month, user_data.date_of_birth.day)
            )

            user_record = {
                'id': user_data.telegram_id,
                'username': user_data.telegram_username or user_data.username,
                'first_name': user_data.first_name,
                'last_name': user_data.last_name,
                'gender': user_data.gender,  # NOT NULL в БД
                'age': age,
                'country': user_data.country,
                'city': user_data.city,
                'bio': user_data.bio or '',
                'latitude': float(user_data.latitude),
                'longitude': float(user_data.longitude),
                'is_visible': True,
            }

            response = self.db.table('users').insert(user_record).execute()
            return response.data[0] if response.data else None

        except Exception as e:
            logger.error(f"Error registering user: {e}")
            raise

    async def update_profile(self, user_id: int, update_data: UserUpdateRequest) -> dict:
        """Update user profile"""
        update_dict = update_data.dict(exclude_unset=True)
        update_dict['updated_at'] = datetime.utcnow().isoformat()
        response = self.db.table('users').update(update_dict).eq('id', user_id).execute()
        return response.data[0] if response.data else None

    async def get_profile(self, user_id: int) -> dict:
        """Get full user profile with photos and tags"""
        try:
            # Один запрос: пользователь + его фото + теги (через связующую таблицу)
            result = self.db.table('users') \
                .select('*, photos(id, url, order_index, moderation_status), user_tags(tags(name))') \
                .eq('id', user_id) \
                .execute()

            if not result.data:
                return None

            user = result.data[0]

            # Обработка фото: сначала approved, если нет – все
            raw_photos = user.pop('photos', [])
            approved_photos = [p for p in raw_photos if p.get('moderation_status') == 'approved']
            final_photos = approved_photos if approved_photos else raw_photos
            user['photos'] = [{'id': p['id'], 'url': p['url']} for p in final_photos]

            # Обработка тегов
            user_tags_data = user.pop('user_tags', [])
            user['tags'] = [item['tags']['name'] for item in user_tags_data if item.get('tags')]

            return user

        except Exception as e:
            logger.error(f"Error fetching profile: {e}")
            raise

    async def add_tags(self, user_id: int, tag_names: list[str]) -> bool:
        """Add up to 5 interest tags for user"""
        try:
            tags_response = self.db.table('tags').select('id, name').in_(
                'name', tag_names[:5]
            ).execute()

            tag_ids = [t['id'] for t in tags_response.data]
            self.db.table('user_tags').delete().eq('user_id', user_id).execute()

            if not tag_ids:
                return True

            user_tags = [{'user_id': user_id, 'tag_id': tag_id} for tag_id in tag_ids]
            self.db.table('user_tags').insert(user_tags).execute()
            # Инвалидируем кэш тегов
            await cache.delete(key_tags(user_id))
            await cache.delete_prefix(f"compat:{user_id}:")
            await cache.delete_prefix(f"candidates:{user_id}:")
            return True

        except Exception as e:
            logger.error(f"Error adding tags: {e}")
            raise

    async def save_test_results(self, user_id: int, results: dict) -> dict:
        """Save OCEAN test results into test_results table"""
        try:
            existing = self.db.table('test_results').select('id').eq('user_id', user_id).execute()
            record = {
                'user_id': user_id,
                'openness': results.get('openness'),
                'conscientiousness': results.get('conscientiousness'),
                'extraversion': results.get('extraversion'),
                'agreeableness': results.get('agreeableness'),
                'neuroticism': results.get('neuroticism'),
                'updated_at': datetime.utcnow().isoformat(),
            }
            if existing.data:
                response = self.db.table('test_results').update(record).eq('user_id', user_id).execute()
            else:
                record['created_at'] = datetime.utcnow().isoformat()
                response = self.db.table('test_results').insert(record).execute()
            # Инвалидируем кэш OCEAN и совместимости
            await cache.delete(key_ocean(user_id))
            await cache.delete_prefix(f"compat:{user_id}:")
            await cache.delete_prefix(f"candidates:{user_id}:")
            return response.data[0] if response.data else record

        except Exception as e:
            logger.error(f"Error saving test results: {e}")
            raise