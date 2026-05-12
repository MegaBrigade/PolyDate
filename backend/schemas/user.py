from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import date


class UserRegisterRequest(BaseModel):
    telegram_id: int
    username: str
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str  # 'm', 'f', 'other'
    country: str
    city: str
    latitude: float
    longitude: float
    bio: Optional[str] = None

    @validator('gender')
    def validate_gender(cls, v):
        if v not in ['m', 'f', 'other']:
            raise ValueError('Invalid gender')
        return v


class UserProfileResponse(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: Optional[str] = None
    age: int
    gender: str
    country: Optional[str] = None
    city: Optional[str] = None
    bio: Optional[str]
    photos: list[str]  # Photo URLs
    tags: list[str]
    test_results: Optional[dict] = None  # OCEAN scores
    compatibility_with_viewer: Optional[float] = None


class UserUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None