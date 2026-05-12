from pydantic import BaseModel, Field
from typing import Optional

# class SwipeRequest(BaseModel):
#     candidate_id: int
#     action: str  # 'like' or 'dislike'
#
# class SwipeResponse(BaseModel):
#     success: bool
#     is_match: bool = False
#     match_user_id: Optional[int] = None  # If match occurred

class SwipeRequest(BaseModel):
    candidate_id: int = Field(..., description="ID of candidate being swiped on")

    class Config:
        schema_extra = {
            "example": {
                "candidate_id": 333333333
            }
        }


class SwipeResponse(BaseModel):
    success: bool
    is_match: bool = False
    match_user_id: Optional[int] = None

class FeedRequest(BaseModel):
    filters: Optional[dict] = None  # age_min, age_max, gender, etc.
    limit: int = 1  # Show 1 card at a time