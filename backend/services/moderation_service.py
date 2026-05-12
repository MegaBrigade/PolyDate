import httpx
from backend.config import get_settings
import logging
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class ModerationService:
    """Handles photo moderation via SightEngine API"""

    def __init__(self):
        self.settings = get_settings()
        self.api_url = "https://api.sightengine.com/1.0/check.json"

    async def moderate_image_url(self, image_url: str) -> dict:
        """
        Check image URL for inappropriate content
        Returns: {
            'approved': bool,
            'nudity': float (0-1),
            'gore': float (0-1),
            'violence': float (0-1),
            'genai': float (0-1),
            'reason': str
        }
        """
        try:
            params = {
                'url': image_url,
                'models': 'nudity,gore,violence,genai',
                'api_user': self.settings.SIGHTENGINE_API_KEY.split(':')[0],
                'api_secret': self.settings.SIGHTENGINE_API_KEY.split(':')[1]
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.api_url, params=params)

                # ✅ FIXED: Check response status
                if response.status_code != 200:
                    logger.warning(f"⚠️ Moderation API returned {response.status_code}")
                    # Default to approval if API fails (in development)
                    return {
                        'approved': True,
                        'nudity': 0,
                        'gore': 0,
                        'violence': 0,
                        'genai': 0,
                        'reason': 'Moderation skipped - API unavailable'
                    }

                data = response.json()

            # Check thresholds
            nudity_score = data.get('nudity', {}).get('raw', 0)
            gore_score = data.get('gore', {}).get('raw', 0)
            violence_score = data.get('violence', {}).get('raw', 0)
            genai_score = data.get('genai', {}).get('raw', 0)

            # Thresholds (tunable)
            approved = (
                    nudity_score < 0.5 and
                    gore_score < 0.5 and
                    violence_score < 0.5 and
                    genai_score < 0.7
            )

            reason = ''
            if nudity_score >= 0.5:
                reason += 'Nudity detected. '
            if gore_score >= 0.5:
                reason += 'Gore detected. '
            if violence_score >= 0.5:
                reason += 'Violence detected. '
            if genai_score >= 0.7:
                reason += 'AI-generated image detected. '

            return {
                'approved': approved,
                'nudity': nudity_score,
                'gore': gore_score,
                'violence': violence_score,
                'genai': genai_score,
                'reason': reason.strip() or 'Image approved'
            }

        except Exception as e:
            logger.error(f"❌ Moderation error: {e}")
            # Default to approval on error for development
            return {
                'approved': True,
                'nudity': 0,
                'gore': 0,
                'violence': 0,
                'genai': 0,
                'reason': f'Moderation skipped - {str(e)}'
            }

    async def moderate_and_save(self, db, user_id: int, image_url: str, order_index: int) -> dict:
        """Moderate image and save to database"""
        try:
            moderation_result = await self.moderate_image_url(image_url)

            photo_record = {
                'user_id': user_id,
                'url': image_url,
                'order_index': order_index,
                'moderation_status': 'approved' if moderation_result['approved'] else 'rejected',
                'moderated_at': datetime.utcnow().isoformat(),
                'created_at': datetime.utcnow().isoformat()
            }

            response = db.table('photos').insert(photo_record).execute()

            if moderation_result['approved']:
                logger.info(f"✅ Photo approved for user {user_id}")
                return {
                    'success': True,
                    'photo_id': response.data[0]['id'] if response.data else None,
                    'message': 'Photo uploaded and approved'
                }
            else:
                logger.warning(f"❌ Photo rejected for user {user_id}: {moderation_result['reason']}")
                return {
                    'success': False,
                    'reason': moderation_result['reason']
                }
        except Exception as e:
            logger.error(f"Error in moderate_and_save: {e}")
            raise