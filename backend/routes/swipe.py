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


# ============================================
# POST LIKE
# ============================================

@router.post("/like")
async def like_user(
        user_id: int = Query(..., description="User ID doing the liking"),
        swipe: SwipeRequest = None,
        db: Client = Depends(get_db)
):
    """
    Like another user.

    - Stores like in database
    - PostgreSQL trigger updates liked_by JSONB
    - Checks for mutual like (match)
    - Sends notifications if match

    Query Parameters:
    - user_id: Your user ID

    Request Body:
    - candidate_id: User ID to like
    - action: "like" (for compatibility)
    """
    try:
        if not swipe or not hasattr(swipe, 'candidate_id'):
            raise HTTPException(
                status_code=400,
                detail="Missing candidate_id in request body"
            )

        swipe_service = SwipeService(db)

        # Calculate compatibility score
        rec_service = RecommendationService(db)
        compatibility = await rec_service.calculate_compatibility(
            user_id,
            swipe.candidate_id
        )

        # Perform like
        result = await swipe_service.like_user(
            user_id,
            swipe.candidate_id,
            compatibility
        )

        # If match, send notifications
        if result['is_match']:
            notif_service = NotificationService()

            # Get both users' info for notification
            user1_response = db.table('users').select('first_name, username').eq(
                'id', user_id
            ).execute()

            user2_response = db.table('users').select('first_name, username').eq(
                'id', swipe.candidate_id
            ).execute()

            if user1_response.data and user2_response.data:
                user1_name = user1_response.data[0]['first_name']
                user2_name = user2_response.data[0]['first_name']
                user2_username = user2_response.data[0]['username']
                user1_username = user1_response.data[0]['username']

                # Send to both users
                await notif_service.send_match_notification(
                    user_id,
                    swipe.candidate_id,
                    user2_name,
                    user2_username
                )
                await notif_service.send_match_notification(
                    swipe.candidate_id,
                    user_id,
                    user1_name,
                    user1_username
                )

                logger.info(f"✅ Match notifications sent")

        return {
            "success": True,
            "is_match": result['is_match'],
            "match_user_id": result.get('match_user_id'),
            "compatibility_percentage": compatibility
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error liking user: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process like: {str(e)}"
        )


# ============================================
# POST DISLIKE
# ============================================

# @router.post("/dislike")
# async def dislike_user(
#         user_id: int = Query(..., description="User ID doing the disliking"),
#         swipe: SwipeRequest = None,
#         db: Client = Depends(get_db)
# ):
#     """
#     Dislike another user.
#
#     - Removes like from database
#     - PostgreSQL trigger removes from liked_by JSONB
#
#     Query Parameters:
#     - user_id: Your user ID
#
#     Request Body:
#     - candidate_id: User ID to dislike
#     """
#     try:
#         if not swipe or not hasattr(swipe, 'candidate_id'):
#             raise HTTPException(
#                 status_code=400,
#                 detail="Missing candidate_id in request body"
#             )
#
#         swipe_service = SwipeService(db)
#         result = await swipe_service.dislike_user(user_id, swipe.candidate_id)
#
#         return {
#             "success": result['success'],
#             "message": f"Disliked user {swipe.candidate_id}"
#         }
#
#     except HTTPException:
#         raise
#     except Exception as e:
#         logger.error(f"❌ Error disliking user: {e}")
#         raise HTTPException(
#             status_code=500,
#             detail=f"Failed to process dislike: {str(e)}"
#         )
@router.post("/dislike")
async def dislike_user(
        user_id: int = Query(..., description="User ID doing the disliking"),
        swipe: SwipeRequest = None,
        db: Client = Depends(get_db)
):
    """
    Dislike another user.
    """
    try:
        print(f"[DEBUG] Raw swipe object: {swipe}")
        print(f"[DEBUG] Swipe type: {type(swipe)}")
        print(f"[DEBUG] User ID: {user_id}")

        if swipe is None:
            print("[DEBUG] ERROR: swipe is None!")
            raise HTTPException(
                status_code=400,
                detail="Missing request body"
            )

        if not hasattr(swipe, 'candidate_id'):
            print("[DEBUG] ERROR: No candidate_id attribute!")
            raise HTTPException(
                status_code=400,
                detail="Missing candidate_id in request"
            )

        print(f"[DEBUG] Candidate ID: {swipe.candidate_id}")

        swipe_service = SwipeService(db)
        result = await swipe_service.dislike_user(user_id, swipe.candidate_id)

        return {
            "success": result['success'],
            "message": f"Passed on user {swipe.candidate_id}"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[DEBUG] Exception: {e}")
        logger.error(f"❌ Error disliking user: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process dislike: {str(e)}"
        )


# ============================================
# GET LIKE INFO
# ============================================

@router.get("/like-info")
async def get_like_info(
        user_id: int = Query(..., description="Who liked"),
        liked_user_id: int = Query(..., description="Who was liked"),
        db: Client = Depends(get_db)
):
    """
    Get information about a specific like.

    Returns:
    - compatibility_percentage: Match score (0-100)
    - created_at: When the like was made
    """
    try:
        swipe_service = SwipeService(db)
        like_info = await swipe_service.get_like_info(user_id, liked_user_id)

        if not like_info:
            raise HTTPException(
                status_code=404,
                detail="Like not found"
            )

        return {
            "success": True,
            "like": like_info
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting like info: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get like info"
        )


# ============================================
# GET MUTUAL LIKE STATUS
# ============================================

@router.get("/is-mutual")
async def is_mutual_like(
        user_id: int = Query(..., description="First user"),
        other_user_id: int = Query(..., description="Second user"),
        db: Client = Depends(get_db)
):
    """
    Check if two users have mutual like (match).
    """
    try:
        swipe_service = SwipeService(db)
        is_mutual = await swipe_service.is_mutual_like(user_id, other_user_id)

        return {
            "success": True,
            "is_mutual_like": is_mutual
        }

    except Exception as e:
        logger.error(f"❌ Error checking mutual like: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to check mutual like"
        )

# ============================================
# GET MY MATCHES
# ============================================

@router.get("/my-matches")
async def get_my_matches(
    user_id: int = Query(..., description="Your user ID"),
    db: Client = Depends(get_db)
):
    """
    Get all active matches for the current user.
    """
    try:
        swipe_service = SwipeService(db)
        matches = await swipe_service.get_matches(user_id)
        return {
            "success": True,
            "matches": matches
        }
    except Exception as e:
        logger.error(f"Error in /my-matches: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch matches"
        )
