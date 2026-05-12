from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from backend.database import get_db
from backend.services.recommendation_service import RecommendationService
from backend.services.swipe_service import SwipeService
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/feed", tags=["feed"])


# ============================================
# EXISTING ENDPOINTS (Keep as is)
# ============================================

@router.get("/next-candidate")
async def get_next_candidate(
        user_id: int = Query(...),
        radius_km: float = Query(50.0),
        age_min: Optional[int] = Query(None),
        age_max: Optional[int] = Query(None),
        gender: Optional[str] = Query(None),
        db: Client = Depends(get_db)
):
    """
    Get next candidate from feed.

    Recalculates compatibility based on CURRENT tags.
    """
    try:
        service = RecommendationService(db)

        # Get candidates sorted by compatibility
        candidates = await service.get_candidates(
            user_id,
            radius_km=radius_km,
            age_min=age_min,
            age_max=age_max,
            gender_filter=gender
        )

        if not candidates:
            return {
                "success": True,
                "candidate": None,
                "message": "No more candidates available"
            }

        # Get top candidate
        top_candidate = candidates[0]

        # ✅ RECALCULATE compatibility with current tags
        current_compatibility = await service.calculate_compatibility(
            user_id,
            top_candidate['user_id']
        )

        # Fetch full profile
        candidate_response = db.table('users').select(
            'id, first_name, last_name, age, gender, city, bio, latitude, longitude'
        ).eq('id', top_candidate['user_id']).execute()

        # Get photos
        photos_response = db.table('photos').select('url').eq(
            'user_id', top_candidate['user_id']
        ).eq('moderation_status', 'approved').order('order_index').execute()

        if candidate_response.data:
            candidate = candidate_response.data[0]
            candidate['photos'] = [p['url'] for p in photos_response.data] if photos_response.data else []
            candidate['compatibility_percentage'] = current_compatibility  # ✅ Use fresh calculation
            candidate['distance_km'] = top_candidate['distance']

            return {
                "success": True,
                "candidate": candidate
            }

        return {
            "success": False,
            "message": "Failed to fetch candidate details"
        }

    except Exception as e:
        logger.error(f"Error fetching feed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch feed"
        )


# ============================================
# NEW ENDPOINTS (Add these)
# ============================================

@router.get("/who-liked-me")
async def who_liked_me(
        user_id: int = Query(..., description="Your user ID"),
        db: Client = Depends(get_db)
):
    """
    Get list of users who liked you.

    ⚡ FAST: Uses JSONB liked_by column directly!

    Returns:
    - List of user profiles who liked you
    - Each includes: id, first_name, last_name, age, gender, city, photos
    """
    try:
        swipe_service = SwipeService(db)
        users = await swipe_service.get_likes_received(user_id)

        return {
            "success": True,
            "count": len(users),
            "users": users
        }

    except Exception as e:
        logger.error(f"Error fetching who liked me: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch likes"
        )


@router.get("/check-liked")
async def check_if_liked(
        user_id: int = Query(..., description="User to check if they liked you"),
        my_user_id: int = Query(..., description="Your user ID"),
        db: Client = Depends(get_db)
):
    """
    Check if a specific user has liked you.

    ⚡ VERY FAST: Simple JSONB array lookup!

    Returns:
    - has_liked: boolean
    """
    try:
        swipe_service = SwipeService(db)
        has_liked = await swipe_service.is_user_in_liked_by(my_user_id, user_id)

        return {
            "success": True,
            "has_liked": has_liked
        }

    except Exception as e:
        logger.error(f"Error checking if liked: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to check like status"
        )