from pydantic import BaseModel, Field, validator
from typing import List, Dict
from datetime import datetime


class TestQuestion(BaseModel):
    """Single test question"""
    id: int
    question_text: str
    dimension: str  # O, C, E, A, N


class TestQuestionsResponse(BaseModel):
    """Response for GET /test/questions"""
    success: bool
    total_questions: int
    questions: List[TestQuestion]

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "total_questions": 15,
                "questions": [
                    {
                        "id": 1,
                        "question_text": "I like to try new ideas and unusual activities",
                        "dimension": "O"
                    }
                ]
            }
        }


class TestAnswer(BaseModel):
    """Single answer (not used in request, but for documentation)"""
    question_id: int
    answer: int = Field(..., ge=1, le=5)

    @validator('answer')
    def validate_answer(cls, v):
        if not (1 <= v <= 5):
            raise ValueError('Answer must be between 1 and 5')
        return v


class TestAnswersRequest(BaseModel):
    """Request body for POST /test/submit or POST /test/retake"""
    user_id: int
    answers: Dict[int, int]  # {question_id: answer_score}

    @validator('answers')
    def validate_answers(cls, v):
        # Check we have exactly 15 answers
        if len(v) != 15:
            raise ValueError(f'Must answer all 15 questions (got {len(v)})')

        # Check all answer values are 1-5
        for question_id, answer in v.items():
            if not isinstance(question_id, int):
                try:
                    int(question_id)
                except:
                    raise ValueError(f'Question ID must be integer, got {type(question_id)}')

            if not (1 <= answer <= 5):
                raise ValueError(f'Answer for question {question_id} must be 1-5, got {answer}')

        return v

    class Config:
        schema_extra = {
            "example": {
                "user_id": 111223,
                "answers": {
                    "1": 5, "2": 4, "3": 5, "4": 4, "5": 3,
                    "6": 4, "7": 5, "8": 2, "9": 5, "10": 4,
                    "11": 2, "12": 5, "13": 3, "14": 1, "15": 4
                }
            }
        }


class TestResults(BaseModel):
    """OCEAN test results"""
    openness: int = Field(..., ge=1, le=10)
    conscientiousness: int = Field(..., ge=1, le=10)
    extraversion: int = Field(..., ge=1, le=10)
    agreeableness: int = Field(..., ge=1, le=10)
    neuroticism: int = Field(..., ge=1, le=10)

    class Config:
        schema_extra = {
            "example": {
                "openness": 8,
                "conscientiousness": 7,
                "extraversion": 6,
                "agreeableness": 8,
                "neuroticism": 4
            }
        }


class TestResultsResponse(BaseModel):
    """Response for POST /test/submit"""
    success: bool
    test_id: int
    results: TestResults

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "test_id": 1,
                "results": {
                    "openness": 8,
                    "conscientiousness": 7,
                    "extraversion": 6,
                    "agreeableness": 8,
                    "neuroticism": 4
                }
            }
        }


class TestStatusResponse(BaseModel):
    """Response for GET /test/status/{user_id}"""
    success: bool
    completed: bool
    user_id: int


class TestResultsFullResponse(BaseModel):
    """Full test results with timestamps"""
    id: int
    user_id: int
    openness: int
    conscientiousness: int
    extraversion: int
    agreeableness: int
    neuroticism: int