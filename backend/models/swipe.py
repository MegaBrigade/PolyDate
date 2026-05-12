from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class Like(BaseModel):
    id: int
    user_id: int  # Who swiped
    liked_user_id: int  # Who was swiped on
    compatibility_percentage: float
    created_at: datetime

class Match(BaseModel):
    id: int
    user1_id: int
    user2_id: int
    matched_at: datetime
    is_active: bool = True

class Feed(BaseModel):
    user_id: int
    candidates: list[int]  # List of user IDs to show
    updated_at: datetime