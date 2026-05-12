from supabase import Client
from backend.schemas.user import UserRegisterRequest, UserUpdateRequest
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)


class ProfileService:
    def __init__(self, db: Client):
        self.db = db

    async def register_user(self, user_data: UserRegisterRequest) -> dict:
        """Register new user with basic info"""
        try:
            # Calculate age
            today = date.today()
            age = today.year - user_data.date_of_birth.year - (
                    (today.month, today.day) <
                    (user_data.date_of_birth.month, user_data.date_of_birth.day)
            )

            user_record = {
                'id': user_data.telegram_id,  # Use Telegram ID as primary key
                'username': user_data.username,
                'first_name': user_data.first_name,
                'last_name': user_data.last_name,
                'age': age,
                'gender': user_data.gender,
                'country': user_data.country,
                'city': user_data.city,
                'bio': user_data.bio or '',
                'latitude': user_data.latitude,
                'longitude': user_data.longitude,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat(),
                'is_visible': True
            }

            # Insert into Supabase
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
        """Get full user profile with photos, tags, and test results"""
        try:
            # Get user
            user_response = self.db.table('users').select('*').eq('id', user_id).execute()
            if not user_response.data:
                return None

            user = user_response.data[0]

            # Get approved photos
            photos_response = self.db.table('photos').select('url').eq(
                'user_id', user_id
            ).eq('moderation_status', 'approved').order('order_index').execute()

            # Get tags
            tags_response = self.db.table('user_tags').select(
                'tags(name)'
            ).eq('user_id', user_id).execute()

            # Get test results
            test_response = self.db.table('test_results').select('*').eq(
                'user_id', user_id
            ).order('created_at', desc=True).limit(1).execute()

            user['photos'] = [p['url'] for p in photos_response.data] if photos_response.data else []
            user['tags'] = [t['tags']['name'] for t in tags_response.data] if tags_response.data else []
            user['test_results'] = test_response.data[0] if test_response.data else None

            return user

        except Exception as e:
            logger.error(f"Error fetching profile: {e}")
            raise

    async def add_tags(self, user_id: int, tag_names: list[str]) -> bool:
        """Add up to 5 interest tags for user"""
        try:
            # Get tag IDs
            tags_response = self.db.table('tags').select('id, name').in_(
                'name', tag_names[:5]
            ).execute()

            tag_ids = [t['id'] for t in tags_response.data]

            # Clear existing tags
            self.db.table('user_tags').delete().eq('user_id', user_id).execute()

            # Insert new tags
            user_tags = [
                {'user_id': user_id, 'tag_id': tag_id, 'assigned_at': datetime.utcnow().isoformat()}
                for tag_id in tag_ids
            ]

            self.db.table('user_tags').insert(user_tags).execute()
            return True

        except Exception as e:
            logger.error(f"Error adding tags: {e}")
            raise

    async def save_test_results(self, user_id: int, results: dict) -> dict:
        """Save OCEAN personality test results"""
        test_record = {
            'user_id': user_id,
            'openness': results.get('openness'),
            'conscientiousness': results.get('conscientiousness'),
            'extraversion': results.get('extraversion'),
            'agreeableness': results.get('agreeableness'),
            'neuroticism': results.get('neuroticism'),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        response = self.db.table('test_results').insert(test_record).execute()
        return response.data[0] if response.data else None