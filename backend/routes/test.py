from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from backend.database import get_db
from backend.services.test_service import TestService
from backend.schemas.test import (
    TestQuestionsResponse,
    TestAnswersRequest,
    TestResultsResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/test", tags=["test"])


# ============================================
# GET ALL TEST QUESTIONS
# ============================================

@router.get("/questions")
async def get_test_questions(
        db: Client = Depends(get_db)
) -> TestQuestionsResponse:
    """
    Get all 15 personality test questions.

    Use this endpoint to display all questions to the user.

    Response structure:
    {
        "success": true,
        "total_questions": 15,
        "questions": [
            {
                "id": 1,
                "question_text": "I like to try new ideas and unusual activities",
                "dimension": "O"
            },
            ...
        ]
    }
    """
    try:
        logger.info("Fetching test questions...")
        service = TestService(db)
        questions = await service.get_all_questions()

        if not questions:
            logger.warning("No test questions found")
            raise HTTPException(
                status_code=500,
                detail="Test questions not found in database"
            )

        logger.info(f"✅ Returning {len(questions)} test questions")

        return TestQuestionsResponse(
            success=True,
            total_questions=len(questions),
            questions=questions
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching test questions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch test questions: {str(e)}"
        )


# ============================================
# SUBMIT TEST ANSWERS
# ============================================

@router.post("/submit")
async def submit_test_answers(
        answers_request: TestAnswersRequest,
        db: Client = Depends(get_db)
) -> TestResultsResponse:
    """
    Submit answers for the entire personality test.

    User must answer all 15 questions with a score from 1-5.

    Request body:
    {
        "user_id": 111223,
        "answers": {
            "1": 5,
            "2": 4,
            "3": 5,
            "4": 4,
            "5": 3,
            "6": 4,
            "7": 5,
            "8": 2,
            "9": 5,
            "10": 4,
            "11": 2,
            "12": 5,
            "13": 3,
            "14": 1,
            "15": 4
        }
    }

    Response:
    {
        "success": true,
        "test_id": 1,
        "results": {
            "openness": 8,
            "conscientiousness": 7,
            "extraversion": 6,
            "agreeableness": 8,
            "neuroticism": 4
        }
    }
    """
    try:
        logger.info(f"Submitting test for user {answers_request.user_id}...")
        service = TestService(db)

        # ⚡ Calculate results (using cached questions)
        logger.info("Calculating test results...")
        results = await service.calculate_results(
            answers_request.user_id,
            answers_request.answers
        )

        # Save to database
        logger.info("Saving test results to database...")
        saved = await service.save_test_results(
            answers_request.user_id,
            results
        )

        logger.info(f"✅ Test submitted successfully for user {answers_request.user_id}")

        return TestResultsResponse(
            success=True,
            test_id=saved.get('id', 0),
            results=results
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error submitting test: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit test: {str(e)}"
        )


# ============================================
# GET USER'S TEST RESULTS
# ============================================

@router.get("/results/{user_id}")
async def get_user_test_results(
        user_id: int,
        db: Client = Depends(get_db)
):
    """
    Get user's test results (if completed).

    Returns all OCEAN scores and timestamps.

    Response if completed:
    {
        "success": true,
        "results": {
            "id": 1,
            "user_id": 111223,
            "openness": 8,
            "conscientiousness": 7,
            "extraversion": 6,
            "agreeableness": 8,
            "neuroticism": 4,
            "created_at": "2024-01-01T10:00:00",
            "updated_at": "2024-01-01T10:00:00"
        }
    }

    Response if not completed:
    {
        "success": false,
        "message": "User has not completed the test yet"
    }
    """
    try:
        logger.info(f"Fetching test results for user {user_id}...")
        service = TestService(db)
        results = await service.get_test_results(user_id)

        if not results:
            logger.info(f"No test results found for user {user_id}")
            return {
                "success": False,
                "message": "User has not completed the test yet",
                "user_id": user_id
            }

        logger.info(f"✅ Found test results for user {user_id}")

        return {
            "success": True,
            "results": results
        }

    except Exception as e:
        logger.error(f"❌ Error fetching test results: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch test results: {str(e)}"
        )


# ============================================
# CHECK IF USER COMPLETED TEST
# ============================================

@router.get("/status/{user_id}")
async def check_test_completion(
        user_id: int,
        db: Client = Depends(get_db)
):
    """
    Check if user has completed the test.

    Useful to determine if user should be prompted to complete test during registration.

    Response:
    {
        "success": true,
        "completed": true,
        "user_id": 111223
    }
    """
    try:
        logger.info(f"Checking test completion status for user {user_id}...")
        service = TestService(db)
        completed = await service.user_completed_test(user_id)

        logger.info(f"Test completed for user {user_id}: {completed}")

        return {
            "success": True,
            "completed": completed,
            "user_id": user_id
        }

    except Exception as e:
        logger.error(f"❌ Error checking test status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check test status: {str(e)}"
        )


# ============================================
# RETAKE TEST
# ============================================

@router.post("/retake")
async def retake_test(
        answers_request: TestAnswersRequest,
        db: Client = Depends(get_db)
):
    """
    Retake the test (updates previous results).

    Same request format as /submit endpoint.
    User can retake test anytime - results will be updated.

    Response:
    {
        "success": true,
        "message": "Test results updated",
        "results": {
            "openness": 8,
            ...
        }
    }
    """
    try:
        logger.info(f"Retaking test for user {answers_request.user_id}...")
        service = TestService(db)

        # Calculate results
        results = await service.calculate_results(
            answers_request.user_id,
            answers_request.answers
        )

        # Save (will update if exists)
        saved = await service.save_test_results(
            answers_request.user_id,
            results
        )

        logger.info(f"✅ Test retaken for user {answers_request.user_id}")

        return {
            "success": True,
            "message": "Test results updated",
            "results": results
        }

    except Exception as e:
        logger.error(f"❌ Error retaking test: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retake test: {str(e)}"
        )


# ============================================
# CACHE STATISTICS (Debug endpoint)
# ============================================

@router.get("/debug/cache-stats")
async def get_cache_stats(
        db: Client = Depends(get_db)
):
    """
    Get cache statistics (for debugging/monitoring).

    Useful to verify cache is working properly.

    Response:
    {
        "success": true,
        "cache_stats": {
            "cached": true,
            "cache_size": 15,
            "cache_valid": true,
            "cache_age_seconds": 123.45,
            "cache_ttl": 3600
        }
    }
    """
    try:
        service = TestService(db)
        stats = await service.get_cache_stats()

        logger.info(f"Cache stats: {stats}")

        return {
            "success": True,
            "cache_stats": stats
        }

    except Exception as e:
        logger.error(f"Error getting cache stats: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get cache stats"
        )


# ============================================
# CLEAR CACHE (Admin endpoint)
# ============================================

@router.post("/debug/clear-cache")
async def clear_cache(
        db: Client = Depends(get_db)
):
    """
    Clear the questions cache (for testing).

    Use this if test questions change in the database and you want
    immediate effect without waiting for cache TTL.

    Response:
    {
        "success": true,
        "message": "Cache cleared"
    }
    """
    try:
        service = TestService(db)
        service.clear_cache()

        logger.info("Cache cleared")

        return {
            "success": True,
            "message": "Cache cleared successfully"
        }

    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to clear cache"
        )