import httpx
from backend.config import get_settings
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Sends notifications via Telegram bot"""

    def __init__(self):
        self.settings = get_settings()
        self.bot_token = self.settings.TELEGRAM_BOT_TOKEN
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}"

    async def send_match_notification(
            self,
            user_id: int,
            match_user_id: int,
            match_user_name: str,
            match_user_username: str = None
    ) -> bool:
        """
        Send Telegram message when users match.

        Args:
            user_id: Who to send notification to
            match_user_id: The user they matched with (ID)
            match_user_name: The user they matched with (name)
            match_user_username: The user they matched with (username)
        """
        try:
            if match_user_username:
                message = (
                    f"🎉 <b>It's a match!</b>\n\n"
                    f"You and <b>{match_user_name}</b> liked each other!\n\n"
                    f"<a href='https://t.me/{match_user_username}'>View profile</a>"
                )
            else:
                message = (
                    f"🎉 <b>It's a match!</b>\n\n"
                    f"You and <b>{match_user_name}</b> liked each other!\n\n"
                    f"Check the app to see their profile!"
                )

            url = f"{self.base_url}/sendMessage"
            payload = {
                'chat_id': user_id,
                'text': message,
                'parse_mode': 'HTML'
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                logger.info(f"✅ Match notification sent to {user_id}")
                return True

        except Exception as e:
            logger.error(f"❌ Error sending match notification to {user_id}: {e}")
            return False

    async def send_like_received_notification(
            self,
            user_id: int,
            liker_name: str
    ) -> bool:
        """
        Send notification when someone likes you.

        Args:
            user_id: Who to send notification to
            liker_name: Name of person who liked you
        """
        try:
            message = (
                f"❤️ <b>{liker_name} likes you!</b>\n\n"
                f"Check who and swipe them back in the app!"
            )

            url = f"{self.base_url}/sendMessage"
            payload = {
                'chat_id': user_id,
                'text': message,
                'parse_mode': 'HTML'
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                logger.info(f"✅ Like notification sent to {user_id}")
                return True

        except Exception as e:
            logger.error(f"❌ Error sending like notification: {e}")
            return False