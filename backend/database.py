from supabase import create_client, Client
from backend.config import get_settings
import logging
import httpx

logger = logging.getLogger(__name__)

class SupabaseDB:
    def __init__(self):
        settings = get_settings()
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )


    def get_client(self) -> Client:
        return self.client

db = SupabaseDB()


async def get_db() -> Client:
    """Dependency for FastAPI"""
    return db.get_client()