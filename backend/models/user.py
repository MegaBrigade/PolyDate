from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

class User(BaseModel):
    id: int  # Telegram ID
    username: str
    first_name: str
    age: int
    country: str
    city: str
    bio: Optional[str] = None
    latitude: float
    longitude: float
    location_radius: float = 50.0
    gender: str  # 'm', 'f', 'other'
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    is_visible: bool = True