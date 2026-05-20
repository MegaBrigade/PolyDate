"""
Использование:
    from backend.cache import cache

    # Сохранить
    await cache.set("key", value, ttl=60)

    # Получить (None если нет / истёк)
    value = await cache.get("key")

    # Удалить
    await cache.delete("key")

    # Удалить все ключи с префиксом
    await cache.delete_prefix("user:123")
"""

import time
import json
import logging
from typing import Any, Optional
import redis.asyncio as redis
from backend.config import get_settings

logger = logging.getLogger(__name__)


class RedisCache:
    def __init__(self):
        self._redis: Optional[redis.Redis] = None
        self._url = get_settings().REDIS_URL

    async def _get_redis(self) -> redis.Redis:
        if self._redis is None:
            self._redis = await redis.from_url(
                self._url, decode_responses=True, max_connections=20
            )
        return self._redis

    async def get(self, key: str) -> Optional[Any]:
        r = await self._get_redis()
        data = await r.get(key)
        if data is None:
            return None
        try:
            return json.loads(data)
        except Exception as e:
            logger.warning(f"Failed to decode JSON for key {key}: {e}")
            return None

    async def set(self, key: str, value: Any, ttl: int = 60) -> None:
        if value is None:
            await self.delete(key)
            return
        r = await self._get_redis()
        try:
            serialized = json.dumps(value, ensure_ascii=False)
            await r.setex(key, ttl, serialized)
        except Exception as e:
            logger.error(f"Redis set error: {e}")

    async def delete(self, key: str) -> None:
        r = await self._get_redis()
        await r.delete(key)

    async def delete_prefix(self, prefix: str) -> int:
        """Удаляет все ключи, начинающиеся с prefix. Возвращает кол-во удалённых."""
        r = await self._get_redis()
        deleted = 0
        async for key in r.scan_iter(match=f"{prefix}*", count=100):
            await r.delete(key)
            deleted += 1
        return deleted

    async def clear(self) -> None:
        """Очистка всей БД Redis (осторожно!). Для продакшена лучше не использовать."""
        r = await self._get_redis()
        await r.flushdb()

    async def close(self) -> None:
        """Закрыть соединение с Redis. Вызывать при завершении приложения."""
        if self._redis is not None:
            await self._redis.close()
            self._redis = None

    def stats(self) -> dict:
        """Возвращает примерную статистику размера кэша (только для мониторинга)."""
        # Простая заглушка, т.к. точная статистика по префиксам требует отдельного подхода
        return {
            "type": "redis",
            "info": "Use redis-cli INFO keyspace for details"
        }


cache = RedisCache()

# ── TTL константы ────────────────────────────────────────────
TTL_CANDIDATES   = 5 * 60    # 5 мин  — лента кандидатов
TTL_COMPAT       = 10 * 60   # 10 мин — совместимость пары
TTL_PROFILE      = 5 * 60    # 5 мин  — профиль пользователя
TTL_TAGS         = 10 * 60   # 10 мин — теги пользователя
TTL_OCEAN        = 30 * 60   # 30 мин — результаты теста OCEAN
TTL_FEED_SEEN    = 2 * 60    # 2 мин  — список просмотренных


# ── Хелперы для ключей ───────────────────────────────────────
def key_candidates(user_id: int, radius_km: float, age_min, age_max, gender) -> str:
    return f"candidates:{user_id}:{radius_km}:{age_min}:{age_max}:{gender}"

def key_compat(a: int, b: int) -> str:
    lo, hi = min(a, b), max(a, b)
    return f"compat:{lo}:{hi}"

def key_profile(user_id: int) -> str:
    return f"profile:{user_id}"

def key_tags(user_id: int) -> str:
    return f"tags:{user_id}"

def key_ocean(user_id: int) -> str:
    return f"ocean:{user_id}"

def key_feed_seen(user_id: int) -> str:
    return f"feed_seen:{user_id}"
