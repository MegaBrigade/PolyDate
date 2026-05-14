from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from backend.database import get_db
from backend.services.profile_service import ProfileService
from backend.schemas.user import UserRegisterRequest
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(
        user_data: UserRegisterRequest,
        db: Client = Depends(get_db)
):
    """Register new user"""
    try:
        existing = db.table('users').select('id').eq('id', user_data.telegram_id).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already registered"
            )

        service = ProfileService(db)
        new_user = await service.register_user(user_data)

        if not new_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to register user"
            )

        return {
            "success": True,
            "user_id": new_user['id'],
            "message": "Registration successful. Please complete your profile."
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.get("/login")
async def login(telegram_id: int, db: Client = Depends(get_db)):
    """Login user by Telegram ID"""
    try:
        response = db.table('users').select('*').eq('id', telegram_id).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found. Please register first."
            )

        user = response.data[0]
        return {
            "success": True,
            "user_id": user['id'],
            "user": {
                "id": user['id'],
                "username": user.get('username'),
                "first_name": user.get('first_name'),
                "age": user.get('age'),
                "city": user.get('city'),
                "country": user.get('country'),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


@router.get("/exists/{telegram_id}")
async def check_user_exists(telegram_id: int, db: Client = Depends(get_db)):
    """Check if user exists"""
    try:
        response = db.table('users').select('id').eq('id', telegram_id).execute()
        exists = bool(response.data)
        return {"success": True, "exists": exists, "user_id": telegram_id if exists else None}
    except Exception as e:
        logger.error(f"Error checking user: {e}")
        raise HTTPException(status_code=500, detail="Failed to check user")
