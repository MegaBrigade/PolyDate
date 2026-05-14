from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class User(BaseModel):
    """Отражает реальную схему таблицы users в Supabase"""
    id: int                              # Telegram ID (PK)
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    country: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_radius: Optional[int] = None
    is_visible: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    test_results: Optional[dict] = None  # JSONB: OCEAN-результаты теста
