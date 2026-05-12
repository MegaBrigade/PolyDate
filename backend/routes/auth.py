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
        # Check if user already exists
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
            detail="Registration failed"
        )


@router.get("/login")
async def login(
        telegram_id: int,
        db: Client = Depends(get_db)
):
    """
    Login user by Telegram ID.

    Checks if user exists and returns their info.

    Query Parameters:
    - telegram_id: User's Telegram ID

    Response:
    {
        "success": true,
        "user_id": 222222222,
        "user": {
            "id": 222222222,
            "username": "john_doe",
            "first_name": "John",
            ...
        }
    }
    """
    try:
        logger.info(f"Login attempt for user {telegram_id}")

        # Check if user exists
        response = db.table('users').select('*').eq('id', telegram_id).execute()

        if not response.data:
            logger.warning(f"User {telegram_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found. Please register first."
            )

        user = response.data[0]

        logger.info(f"✅ User {telegram_id} logged in successfully")

        return {
            "success": True,
            "user_id": user['id'],
            "user": {
                "id": user['id'],
                "username": user['username'],
                "first_name": user['first_name'],
                "last_name": user['last_name'],
                "age": user.get('age'),
                "gender": user.get('gender'),
                "city": user.get('city'),
                "country": user.get('country')
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


# ============================================
# CHECK USER EXISTS
# ============================================

@router.get("/exists/{telegram_id}")
async def check_user_exists(
        telegram_id: int,
        db: Client = Depends(get_db)
):
    """
    Check if user exists (useful before showing register/login).

    Response:
    {
        "success": true,
        "exists": true,
        "user_id": 222222222
    }
    """
    try:
        response = db.table('users').select('id').eq('id', telegram_id).execute()

        exists = bool(response.data)

        return {
            "success": True,
            "exists": exists,
            "user_id": telegram_id if exists else None
        }

    except Exception as e:
        logger.error(f"Error checking user existence: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check user"
        )