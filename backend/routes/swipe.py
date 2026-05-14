from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from backend.database import get_db
from backend.services.swipe_service import SwipeService
from backend.services.recommendation_service import RecommendationService
from backend.services.notification_service import NotificationService
from backend.schemas.swipe import SwipeRequest
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/swipe", tags=["swipe"])


@router.post("/like")
async def like_user(
        user_id: int = Query(...),
        swipe: SwipeRequest = None,
        db: Client = Depends(get_db)
):
    """Like another user"""
    try:
        if not swipe or not swipe.candidate_id:
            raise HTTPException(status_code=400, detail="Missing candidate_id")

        swipe_service = SwipeService(db)
        rec_service = RecommendationService(db)

        compatibility = await rec_service.calculate_compatibility(user_id, swipe.candidate_id)
        result = await swipe_service.like_user(user_id, swipe.candidate_id, compatibility)

        # Уведомления при матче
        if result['is_match']:
            try:
                notif_service = NotificationService()
                u1 = db.table('users').select('first_name, username').eq('id', user_id).execute()
                u2 = db.table('users').select('first_name, username').eq('id', swipe.candidate_id).execute()
                if u1.data and u2.data:
                    await notif_service.send_match_notification(
                        user_id, swipe.candidate_id,
                        u2.data[0]['first_name'], u2.data[0].get('username', '')
                    )
                    await notif_service.send_match_notification(
                        swipe.candidate_id, user_id,
                        u1.data[0]['first_name'], u1.data[0].get('username', '')
                    )
            except Exception as notif_err:
                logger.warning(f"Notification failed (non-critical): {notif_err}")

        return {
            "success": True,
            "is_match": result['is_match'],
            "match_user_id": result.get('match_user_id'),
            "compatibility_percentage": compatibility,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error liking: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process like: {str(e)}")


@router.post("/dislike")
async def dislike_user(
        user_id: int = Query(...),
        swipe: SwipeRequest = None,
        db: Client = Depends(get_db)
):
    """Dislike / skip another user"""
    try:
        if not swipe or not swipe.candidate_id:
            raise HTTPException(status_code=400, detail="Missing candidate_id")

        swipe_service = SwipeService(db)
        result = await swipe_service.dislike_user(user_id, swipe.candidate_id)

        return {"success": result['success'], "message": f"Passed on user {swipe.candidate_id}"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error disliking: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process dislike: {str(e)}")


@router.get("/my-matches")
async def get_my_matches(user_id: int = Query(...), db: Client = Depends(get_db)):
    """Get all active matches"""
    try:
        swipe_service = SwipeService(db)
        matches = await swipe_service.get_matches(user_id)
        return {"success": True, "matches": matches}
    except Exception as e:
        logger.error(f"Error in /my-matches: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch matches")


@router.get("/is-mutual")
async def is_mutual_like(
        user_id: int = Query(...),
        other_user_id: int = Query(...),
        db: Client = Depends(get_db)
):
    try:
        swipe_service = SwipeService(db)
        is_mutual = await swipe_service.is_mutual_like(user_id, other_user_id)
        return {"success": True, "is_mutual_like": is_mutual}
    except Exception as e:
        logger.error(f"❌ Error checking mutual: {e}")
        raise HTTPException(status_code=500, detail="Failed to check mutual like")
