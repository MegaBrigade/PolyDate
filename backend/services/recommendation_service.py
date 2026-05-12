from supabase import Client
from math import sqrt, radians, cos, sin, asin
import logging
from typing import List

logger = logging.getLogger(__name__)


class RecommendationService:
    """Generates personalized feed based on location, tags, and compatibility"""

    def __init__(self, db: Client):
        self.db = db

    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two coordinates in kilometers
        """
        R = 6371  # Earth's radius in km

        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
        c = 2 * asin(sqrt(a))

        return R * c

    async def get_candidates(
            self,
            user_id: int,
            radius_km: float = 50.0,
            age_min: int = None,
            age_max: int = None,
            gender_filter: str = None
    ) -> List[dict]:
        """
        Get list of candidate profiles based on filters, excluding already swiped users.
        """
        try:
            # Get current user info
            user_response = self.db.table('users').select(
                'latitude, longitude, gender'
            ).eq('id', user_id).execute()
            if not user_response.data:
                return []
            user_lat, user_lon = user_response.data[0]['latitude'], user_response.data[0]['longitude']

            # Get all other active users
            all_users_response = self.db.table('users').select(
                'id, age, gender, latitude, longitude, is_visible'
            ).neq('id', user_id).eq('is_visible', True).execute()
            if not all_users_response.data:
                return []

            # Get all users already swiped (like OR dislike) by current user
            swiped_response = self.db.table('likes').select('liked_user_id').eq(
                'user_id', user_id
            ).execute()
            swiped_ids = {row['liked_user_id'] for row in swiped_response.data} if swiped_response.data else set()

            candidates = []
            for other_user in all_users_response.data:
                if other_user['id'] in swiped_ids:
                    continue  # Already swiped (liked or disliked)

                # Distance filter
                distance = self.haversine_distance(
                    user_lat, user_lon,
                    other_user['latitude'], other_user['longitude']
                )
                if distance > radius_km:
                    continue

                # Age filter
                if age_min and other_user['age'] < age_min:
                    continue
                if age_max and other_user['age'] > age_max:
                    continue

                # Gender filter
                if gender_filter and other_user['gender'] != gender_filter:
                    continue

                # Get compatibility score (tags + OCEAN)
                compatibility = await self.calculate_compatibility(user_id, other_user['id'])

                candidates.append({
                    'user_id': other_user['id'],
                    'compatibility': compatibility,
                    'distance': round(distance, 2)
                })

            # Sort by compatibility (highest first)
            candidates.sort(key=lambda x: x['compatibility'], reverse=True)
            return candidates

        except Exception as e:
            logger.error(f"Error getting candidates: {e}")
            return []

    async def calculate_compatibility(self, user_id_a: int, user_id_b: int) -> float:
        """
        Calculate compatibility percentage (0-100)
        40% from tags (4% per matching tag, max 5 tags)
        60% from OCEAN personality test (12% per dimension)
        """
        try:
            # Get tags for both users
            tags_a_response = self.db.table('user_tags').select(
                'tags(name)'
            ).eq('user_id', user_id_a).execute()

            tags_b_response = self.db.table('user_tags').select(
                'tags(name)'
            ).eq('user_id', user_id_b).execute()

            tags_a = {t['tags']['name'] for t in tags_a_response.data} if tags_a_response.data else set()
            tags_b = {t['tags']['name'] for t in tags_b_response.data} if tags_b_response.data else set()

            # Tag compatibility (4% per match, max 20%)
            matching_tags = len(tags_a & tags_b)
            tag_score = min(matching_tags * 4, 20)

            # Get test results
            test_a_response = self.db.table('test_results').select('*').eq(
                'user_id', user_id_a
            ).order('created_at', desc=True).limit(1).execute()

            test_b_response = self.db.table('test_results').select('*').eq(
                'user_id', user_id_b
            ).order('created_at', desc=True).limit(1).execute()

            if not test_a_response.data or not test_b_response.data:
                return tag_score  # Return only tag score if no test results

            test_a = test_a_response.data[0]
            test_b = test_b_response.data[0]

            # OCEAN compatibility using provided formula
            ocean_dimensions = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']
            ocean_score = 0

            for dimension in ocean_dimensions:
                x = test_a.get(dimension, 5)
                y = test_b.get(dimension, 5)

                # Formula: (9 - √((x-y)²)) / 9 * 0.16 * 100
                dimension_score = (9 - sqrt((x - y) ** 2)) / 9 * 0.16 * 100
                ocean_score += dimension_score

            # Total: tags (20%) + OCEAN (80%)
            total_compatibility = tag_score + ocean_score

            return round(min(total_compatibility, 100), 2)

        except Exception as e:
            logger.error(f"Error calculating compatibility: {e}")
            return 0.0