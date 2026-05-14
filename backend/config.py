from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")
    SUPABASE_DB_PASSWORD: str = os.getenv("SUPABASE_DB_PASSWORD")

    SIGHTENGINE_API_KEY: str = os.getenv("SIGHTENGINE_API_KEY")
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN")
    WEBAPP_URL: str = os.getenv("WEBAPP_URL", "")

    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    LOCATION_RADIUS_KM: float = 50.0

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'


@lru_cache()
def get_settings():
    return Settings()