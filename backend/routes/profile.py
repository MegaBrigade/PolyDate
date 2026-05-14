from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from supabase import Client
from backend.database import get_db
from backend.services.profile_service import ProfileService
from backend.services.moderation_service import ModerationService
from backend.schemas.user import UserUpdateRequest, UserProfileResponse
from typing import Optional
import logging
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

# ✅ REMOVE /api prefix - it's already added in main.py
router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/{user_id}")
async def get_profile(
        user_id: int,
        db: Client = Depends(get_db)
) -> UserProfileResponse:
    """Get user profile"""
    try:
        service = ProfileService(db)
        profile = await service.get_profile(user_id)

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return UserProfileResponse(**profile)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch profile"
        )


@router.put("/{user_id}")
async def update_profile(
        user_id: int,
        update_data: UserUpdateRequest,
        db: Client = Depends(get_db)
):
    """Update user profile"""
    try:
        service = ProfileService(db)
        updated = await service.update_profile(user_id, update_data)

        return {
            "success": True,
            "profile": updated
        }

    except Exception as e:
        logger.error(f"Error updating profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )


@router.post("/{user_id}/tags")
async def update_tags(
        user_id: int,
        tags: list[str],
        db: Client = Depends(get_db)
):
    """Update user interest tags (max 5)"""
    if len(tags) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 tags allowed"
        )

    try:
        service = ProfileService(db)
        await service.add_tags(user_id, tags)

        return {"success": True, "tags": tags}

    except Exception as e:
        logger.error(f"Error updating tags: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update tags"
        )


@router.post("/{user_id}/photos")
async def upload_photo(
        user_id: int,
        file: UploadFile = File(...),
        db: Client = Depends(get_db)
):
    """Upload and moderate user photo"""
    try:
        # 1. Check if it's an image
        if not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image (jpg, png, etc.)"
            )

        # 2. Read file content
        file_content = await file.read()

        # ✅ 3. CHECK FILE SIZE (Limit to 5 MB)
        file_size_mb = len(file_content) / (1024 * 1024)
        if file_size_mb > 5.0:
            logger.warning(f"File too large: {file_size_mb:.2f} MB")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image is too large ({file_size_mb:.1f}MB). Maximum allowed size is 5MB."
            )

        # Generate unique filename
        file_ext = file.filename.split('.')[-1]
        unique_filename = f"{user_id}/{uuid.uuid4()}.{file_ext}"

        logger.info(f"Uploading photo: {unique_filename} ({file_size_mb:.2f} MB)")

        # Upload to Supabase Storage
        try:
            # ✅ ADD content-type so Supabase knows it's an image
            storage_response = db.storage.from_('profile-photos').upload(
                path=unique_filename,
                file=file_content,
                file_options={"content-type": file.content_type}
            )
            logger.info(f"✅ File uploaded: {unique_filename}")

        except Exception as upload_error:
            logger.error(f"❌ Supabase storage error: {upload_error}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to connect to storage server. Please try again."
            )

        # Get public URL
        try:
            image_url = db.storage.from_('profile-photos').get_public_url(unique_filename)
        except Exception as url_error:
            logger.error(f"❌ Error getting public URL: {url_error}")
            raise HTTPException(
                status_code=500,
                detail="Failed to generate public URL"
            )

        # Moderate image
        moderation_service = ModerationService()
        result = await moderation_service.moderate_and_save(
            db, user_id, image_url, order_index=0
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading photo: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload photo: {str(e)}"
        )


@router.delete("/{user_id}/photos/{photo_id}")
async def delete_photo(
        user_id: int,
        photo_id: int,
        db: Client = Depends(get_db)
):
    """Delete a photo from user profile"""
    try:
        # Verify photo belongs to this user
        photo_resp = db.table('photos').select('id, url, user_id').eq('id', photo_id).eq('user_id', user_id).execute()
        if not photo_resp.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not found or does not belong to this user"
            )

        photo = photo_resp.data[0]

        # Extract storage path from URL (everything after /profile-photos/)
        try:
            url = photo['url']
            storage_path_marker = '/profile-photos/'
            if storage_path_marker in url:
                storage_path = url.split(storage_path_marker, 1)[1].split('?')[0]
                db.storage.from_('profile-photos').remove([storage_path])
                logger.info(f"Deleted from storage: {storage_path}")
        except Exception as storage_err:
            logger.warning(f"Could not delete from storage: {storage_err}")
            # Continue — still remove the DB record

        # Delete from DB
        db.table('photos').delete().eq('id', photo_id).execute()
        logger.info(f"Photo {photo_id} deleted for user {user_id}")

        return {"success": True, "deleted_id": photo_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting photo: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete photo"
        )


@router.post("/{user_id}/test-results")
async def save_test_results(
        user_id: int,
        results: dict,
        db: Client = Depends(get_db)
):
    """Save personality test results"""
    try:
        # Validate that all OCEAN dimensions are present
        required_keys = {'openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'}
        if not required_keys.issubset(results.keys()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required test dimensions"
            )

        # Validate score ranges (1-10)
        for key in required_keys:
            if not (1 <= results[key] <= 10):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid score for {key}. Must be between 1 and 10."
                )

        service = ProfileService(db)
        test_result = await service.save_test_results(user_id, results)

        return {"success": True, "test_id": test_result['id']}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving test results: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save test results"
        )