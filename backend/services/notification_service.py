import httpx
from backend.config import get_settings
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Отправляет уведомления через Telegram-бота"""

    def __init__(self):
        self.settings = get_settings()
        self.bot_token = self.settings.TELEGRAM_BOT_TOKEN
        self.webapp_url = self.settings.WEBAPP_URL
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}"

    def _open_app_button(self) -> list | None:
        """Inline-кнопка «Открыть приложение», если задан WEBAPP_URL."""
        if not self.webapp_url:
            return None
        return [[{"text": "💌 Открыть PolyDate", "web_app": {"url": self.webapp_url}}]]

    async def _send(self, chat_id: int, text: str) -> bool:
        """Базовый метод отправки сообщения."""
        payload: dict = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML",
        }
        keyboard = self._open_app_button()
        if keyboard:
            payload["reply_markup"] = {"inline_keyboard": keyboard}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(f"{self.base_url}/sendMessage", json=payload)
                response.raise_for_status()
            return True
        except Exception as e:
            logger.error(f"❌ Ошибка отправки сообщения в chat_id={chat_id}: {e}")
            return False

    async def send_match_notification(
        self,
        user_id: int,
        match_user_id: int,
        match_user_name: str,
        match_user_username: str = None,  # оставлен для совместимости, не используется
    ) -> bool:
        """
        Уведомление о матче.

        Args:
            user_id: Telegram ID получателя (= users.id в БД)
            match_user_id: Telegram ID второго участника матча (не используется в тексте)
            match_user_name: Имя второго участника матча
            match_user_username: Не используется (Telegram username не хранится в БД)
        """
        text = (
            f"🎉 <b>Это мэтч!</b>\n\n"
            f"Вы и <b>{match_user_name}</b> понравились друг другу!\n\n"
            f"Напишите первым — не упустите момент 💬"
        )
        ok = await self._send(user_id, text)
        if ok:
            logger.info(f"✅ Match-уведомление отправлено → {user_id}")
        return ok

    async def send_like_received_notification(
        self,
        user_id: int,
        liker_name: str,
    ) -> bool:
        """
        Уведомление о лайке.

        Args:
            user_id: Telegram ID получателя (= users.id в БД)
            liker_name: Имя того, кто поставил лайк
        """
        text = (
            f"❤️ <b>{liker_name}</b> оценил(а) вашу анкету!\n\n"
            f"Загляните в приложение — вдруг это взаимно?"
        )
        ok = await self._send(user_id, text)
        if ok:
            logger.info(f"✅ Like-уведомление отправлено → {user_id}")
        return ok