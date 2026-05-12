from typing import Optional, List, Dict
from pydantic import BaseModel
from datetime import datetime

class UserTag(BaseModel):
    user_id: int
    tag_id: int
    assigned_at: datetime

class Photo(BaseModel):
    id: int
    user_id: int
    url: str
    order_index: int
    moderation_status: str  # 'pending', 'approved', 'rejected'
    moderated_at: Optional[datetime]
    created_at: datetime

class TestResults(BaseModel):
    """OCEAN personality test results (1-10 scale)"""
    user_id: int
    openness: int  # O
    conscientiousness: int  # C
    extraversion: int  # E
    agreeableness: int  # A
    neuroticism: int  # N
    created_at: datetime
    updated_at: datetime