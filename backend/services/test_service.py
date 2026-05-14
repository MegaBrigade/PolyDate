from supabase import Client
from datetime import datetime
import logging
from typing import Dict, List
import asyncio
import time

logger = logging.getLogger(__name__)


class TestService:
    """Handle personality test logic with caching and retry logic"""

    def __init__(self, db: Client):
        self.db = db
        self._questions_cache = None
        self._cache_timestamp = None
        self.cache_ttl = 3600  # 1 hour cache

    # ============================================
    # CACHE MANAGEMENT
    # ============================================

    def _is_cache_valid(self) -> bool:
        """Check if cache is still valid"""
        if not self._questions_cache or not self._cache_timestamp:
            return False

        current_time = time.time()
        return (current_time - self._cache_timestamp) < self.cache_ttl

    async def _get_questions_cache(self) -> Dict[int, Dict]:
        """
        Get questions from cache or fetch from database.

        Returns dict: {question_id: {id, dimension, is_reverse}}
        """
        # Check if cache is valid
        if self._is_cache_valid():
            logger.info("✅ Using cached questions")
            return self._questions_cache

        logger.info("📥 Cache expired or empty. Fetching from database...")

        # Fetch with retry logic
        max_retries = 3
        retry_delay = 0.2

        for attempt in range(max_retries):
            try:
                logger.info(f"Fetching questions (attempt {attempt + 1}/{max_retries})...")

                response = self.db.table('test_questions').select(
                    'id, dimension, is_reverse'
                ).execute()

                if not response.data:
                    raise ValueError("No questions found in database")

                # Build cache
                self._questions_cache = {q['id']: q for q in response.data}
                self._cache_timestamp = time.time()

                logger.info(f"✅ Successfully fetched and cached {len(self._questions_cache)} questions")
                return self._questions_cache

            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning(f"Attempt {attempt + 1} failed: {e}")
                    logger.info(f"Retrying in {retry_delay:.2f}s...")
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 1.5
                else:
                    logger.error(f"❌ Failed to fetch questions after {max_retries} attempts: {e}")
                    raise

    def clear_cache(self):
        """Manually clear cache (useful for testing)"""
        self._questions_cache = None
        self._cache_timestamp = None
        logger.info("✅ Cache cleared")

    # ============================================
    # GET QUESTIONS
    # ============================================

    async def get_all_questions(self) -> List[Dict]:
        """
        Get all 15 test questions for display.

        Returns:
            List of questions with id, question_text, dimension
        """
        try:
            # Note: We fetch without caching for get_all_questions
            # because it needs question_text which cache doesn't have
            response = self.db.table('test_questions').select(
                'id, question_text, dimension'
            ).order('id').execute()

            if not response.data:
                logger.warning("No test questions found in database")
                return []

            logger.info(f"✅ Fetched {len(response.data)} test questions for display")
            return response.data

        except Exception as e:
            logger.error(f"❌ Error fetching test questions: {e}")
            raise

    async def get_question_details(self, question_id: int) -> Dict:
        """Get single question details including reverse flag"""
        try:
            response = self.db.table('test_questions').select(
                '*'
            ).eq('id', question_id).execute()

            if not response.data:
                logger.warning(f"Question {question_id} not found")
                return None

            return response.data[0]

        except Exception as e:
            logger.error(f"Error getting question {question_id}: {e}")
            raise

    # ============================================
    # CALCULATE RESULTS
    # ============================================

    # Статический маппинг вопросов → (измерение OCEAN, обратная шкала)
    # Соответствует порядку вопросов в Test.jsx и test.html
    QUESTION_MAP: Dict[int, tuple] = {
        1:  ('A', False),   # Я склонен сочувствовать другим людям
        2:  ('O', False),   # У меня полно разных идей
        3:  ('E', False),   # Я интересуюсь делами друзей и коллег
        4:  ('N', False),   # Я часто чувствую себя поглощенным разными проблемами
        5:  ('E', False),   # Я легко справляюсь с взаимодействованием с людьми
        6:  ('E', True),    # Я довольно скрытный человек (обратная)
        7:  ('A', True),    # Я избегаю общения со сложными людьми (обратная)
        8:  ('O', False),   # Мне нравится разбираться со сложностями
        9:  ('C', True),    # Я часто попусту трачу время (обратная)
        10: ('N', True),    # Меня нелегко заставить беспокоиться (обратная)
        11: ('C', False),   # Я планирую и придерживаюсь своих планов
        12: ('N', False),   # Меня довольно легко задеть
        13: ('C', False),   # Как правило, я работаю по расписанию
        14: ('A', False),   # Я умею успокаивать людей
        15: ('C', False),   # Я люблю заранее планировать свой день
    }

    async def calculate_results(self, user_id: int, answers: Dict[int, int]) -> Dict[str, int]:
        """
        Рассчитывает OCEAN-результаты из ответов пользователя.

        Маппинг вопросов → измерениям жёстко задан в QUESTION_MAP и
        не зависит от таблицы test_questions в БД.

        Args:
            user_id: ID пользователя (для логирования)
            answers: {question_id: score (1-5)}

        Returns:
            {'openness': 1-10, 'conscientiousness': 1-10, ...}
        """
        try:
            if len(answers) != 15:
                raise ValueError(f"Ожидалось 15 ответов, получено {len(answers)}")

            logger.info(f"Расчёт результатов теста для пользователя {user_id}")

            dimension_scores: Dict[str, list] = {'O': [], 'C': [], 'E': [], 'A': [], 'N': []}

            for question_id, answer in answers.items():
                qid = int(question_id)  # JSON-ключи могут прийти строкой

                if not (1 <= int(answer) <= 5):
                    raise ValueError(f"Недопустимый ответ на вопрос {qid}: {answer} (должно быть 1-5)")

                if qid not in self.QUESTION_MAP:
                    logger.warning(f"Вопрос {qid} не найден в маппинге, пропускаем")
                    continue

                dimension, is_reverse = self.QUESTION_MAP[qid]
                score = (6 - int(answer)) if is_reverse else int(answer)
                dimension_scores[dimension].append(score)

            logger.info(f"Сырые баллы по измерениям: {dimension_scores}")

            dim_to_name = {
                'O': 'openness',
                'C': 'conscientiousness',
                'E': 'extraversion',
                'A': 'agreeableness',
                'N': 'neuroticism',
            }

            final_results = {}
            for dim, name in dim_to_name.items():
                scores = dimension_scores[dim]
                if scores:
                    avg = sum(scores) / len(scores)          # шкала 1-5
                    score_10 = (avg - 1) * 2.25 + 1         # перевод в 1-10
                    final_results[name] = max(1, min(10, round(score_10)))
                else:
                    final_results[name] = 5                  # нейтральное значение

            logger.info(f"✅ Результаты теста пользователя {user_id}: {final_results}")
            return final_results

        except Exception as e:
            logger.error(f"❌ Ошибка расчёта результатов: {e}")
            raise

    # ============================================
    # SAVE RESULTS
    # ============================================

    async def save_test_results(self, user_id: int, results: Dict[str, int]) -> Dict:
        """
        Save test results to database.

        If user already has results, updates them.
        Otherwise, creates new record.

        Args:
            user_id: User ID
            results: {
                'openness': 1-10,
                'conscientiousness': 1-10,
                'extraversion': 1-10,
                'agreeableness': 1-10,
                'neuroticism': 1-10
            }

        Returns:
            Saved record dict
        """
        max_retries = 2
        retry_delay = 0.2

        for attempt in range(max_retries):
            try:
                logger.info(f"Checking existing test results for user {user_id}...")

                # Check if user already has results
                existing = self.db.table('test_results').select('id').eq(
                    'user_id', user_id
                ).execute()

                # Prepare record
                test_record = {
                    'user_id': user_id,
                    'openness': results['openness'],
                    'conscientiousness': results['conscientiousness'],
                    'extraversion': results['extraversion'],
                    'agreeableness': results['agreeableness'],
                    'neuroticism': results['neuroticism'],
                    'updated_at': datetime.utcnow().isoformat()
                }

                if existing.data:
                    # Update existing
                    logger.info(f"Updating existing test results for user {user_id}...")
                    response = self.db.table('test_results').update(test_record).eq(
                        'user_id', user_id
                    ).execute()
                    logger.info(f"✅ Updated test results for user {user_id}")
                else:
                    # Insert new
                    logger.info(f"Creating new test results for user {user_id}...")
                    test_record['created_at'] = datetime.utcnow().isoformat()
                    response = self.db.table('test_results').insert(test_record).execute()
                    logger.info(f"✅ Saved test results for user {user_id}")

                if response.data:
                    return response.data[0]
                return test_record

            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning(f"Save attempt {attempt + 1} failed: {e}")
                    logger.info(f"Retrying in {retry_delay:.2f}s...")
                    await asyncio.sleep(retry_delay)
                    retry_delay *= 1.5
                else:
                    logger.error(f"❌ Failed to save results after {max_retries} attempts: {e}")
                    raise

    # ============================================
    # GET RESULTS
    # ============================================

    async def get_test_results(self, user_id: int) -> Dict:
        """
        Get user's test results.

        Returns:
            Full test_results record or None if not found
        """
        try:
            logger.info(f"Fetching test results for user {user_id}...")

            response = self.db.table('test_results').select('*').eq(
                'user_id', user_id
            ).execute()

            if response.data:
                logger.info(f"✅ Found test results for user {user_id}")
                return response.data[0]

            logger.info(f"No test results found for user {user_id}")
            return None

        except Exception as e:
            logger.error(f"Error fetching test results for user {user_id}: {e}")
            raise

    # ============================================
    # CHECK COMPLETION
    # ============================================

    async def user_completed_test(self, user_id: int) -> bool:
        """
        Check if user has completed the test.

        Returns:
            True if completed, False otherwise
        """
        try:
            logger.info(f"Checking test completion for user {user_id}...")

            response = self.db.table('test_results').select('id').eq(
                'user_id', user_id
            ).execute()

            completed = bool(response.data)
            logger.info(f"User {user_id} test completed: {completed}")
            return completed

        except Exception as e:
            logger.error(f"Error checking test completion for user {user_id}: {e}")
            return False

    # ============================================
    # STATISTICS
    # ============================================

    async def get_cache_stats(self) -> Dict:
        """Get cache statistics (for debugging)"""
        return {
            "cached": self._questions_cache is not None,
            "cache_size": len(self._questions_cache) if self._questions_cache else 0,
            "cache_valid": self._is_cache_valid(),
            "cache_age_seconds": (
                time.time() - self._cache_timestamp
                if self._cache_timestamp else None
            ),
            "cache_ttl": self.cache_ttl
        }