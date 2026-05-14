from pydantic import BaseModel, validator
from typing import Optional, Union
from datetime import date


class PhotoItem(BaseModel):
    id: int
    url: str


class UserRegisterRequest(BaseModel):
    telegram_id: int
    username: str
    telegram_username: Optional[str] = None  # настоящий @username из Telegram
    first_name: str
    last_name: Optional[str] = None
    gender: str  # обязательное поле NOT NULL в БД
    date_of_birth: date
    country: str
    city: str
    latitude: float
    longitude: float
    bio: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    country: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str] = None
    is_visible: Optional[bool] = True
    photos: list[PhotoItem] = []
    tags: list[str] = []
    test_results: Optional[dict] = None
    compatibility_with_viewer: Optional[float] = None

    class Config:
        # Игнорируем лишние поля из БД (liked_by и др.)
        extra = 'ignore'


class UserUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    bio: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_radius: Optional[int] = None
    is_visible: Optional[bool] = None