"""
Простой in-memory кэш для PolyDate.
Не требует Redis — всё хранится в памяти процесса.

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

import asyncio
import time
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


class MemoryCache:
    """Thread-safe async in-memory кэш с TTL."""

    def __init__(self):
        self._store: dict[str, tuple[Any, float]] = {}  # key -> (value, expires_at)
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Optional[Any]:
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, expires_at = entry
            if time.monotonic() > expires_at:
                del self._store[key]
                return None
            return value

    async def set(self, key: str, value: Any, ttl: int = 60) -> None:
        async with self._lock:
            self._store[key] = (value, time.monotonic() + ttl)

    async def delete(self, key: str) -> None:
        async with self._lock:
            self._store.pop(key, None)

    async def delete_prefix(self, prefix: str) -> int:
        """Удаляет все ключи, начинающиеся с prefix. Возвращает кол-во удалённых."""
        async with self._lock:
            keys_to_delete = [k for k in self._store if k.startswith(prefix)]
            for k in keys_to_delete:
                del self._store[k]
            return len(keys_to_delete)

    async def clear(self) -> None:
        async with self._lock:
            self._store.clear()

    def stats(self) -> dict:
        now = time.monotonic()
        total = len(self._store)
        alive = sum(1 for _, (_, exp) in self._store.items() if exp > now)
        return {"total_keys": total, "alive_keys": alive, "expired_keys": total - alive}


# Глобальный экземпляр — импортируй везде
cache = MemoryCache()


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
