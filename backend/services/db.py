import os
import asyncpg

DB_URL = os.getenv("DATABASE_URL")

async def init_db():
    global pool
    pool = await asyncpg.create_pool(
        DB_URL,
        ssl="require",
        min_size=1,
        max_size=3
    )

async def get_conn():
    async with pool.acquire() as conn:
        yield conn