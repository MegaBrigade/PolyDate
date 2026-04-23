import os
import asyncpg

DB_URL = os.getenv("postgresql://postgres:[YOUR-PASSWORD]@db.xvuhqybarebbajkxavms.supabase.co:5432/postgres")

async def get_db():
    return await asyncpg.connect(DB_URL)

from fastapi import FastAPI
from math import radians, sin, cos, sqrt, atan2

app = FastAPI()


def distance(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))


async def get_user(user_id):
    conn = await get_db()
    row = await conn.fetchrow(
        "SELECT * FROM users WHERE id = $1",
        user_id
    )
    await conn.close()
    return row


async def get_candidates(user):
    conn = await get_db()

    rows = await conn.fetch(
        """
        SELECT *
        FROM users u
        WHERE u.id != $1
        AND u.is_visible = true
        AND u.age BETWEEN $2 AND $3
        AND NOT EXISTS (
            SELECT 1 FROM matches m
            WHERE (m.user1_id = $1 AND m.user2_id = u.id)
               OR (m.user2_id = $1 AND m.user1_id = u.id)
        )
        AND NOT EXISTS (
            SELECT 1 FROM blocked_users b
            WHERE b.user_id = $1 AND b.blocked_user_id = u.id
        )
        LIMIT 200
        """,
        user["id"], user["age"] - 5, user["age"] + 5
    )

    await conn.close()
    return rows


@app.post("/generate_feed")
async def generate_feed(user_id: int):
    user = await get_user(user_id)
    candidates = await get_candidates(user)

    ranked = sorted(
        candidates,
        key=lambda c: distance(
            user["latitude"], user["longitude"],
            c["latitude"], c["longitude"]
        )
    )

    ids = [c["id"] for c in ranked[:50]]

    conn = await get_db()
    await conn.execute(
        """
        INSERT INTO feed (user_id, candidates)
        VALUES ($1, $2)
        ON CONFLICT (user_id)
        DO UPDATE SET candidates = $2, updated_at = now()
        """,
        user_id, ids
    )
    await conn.close()

    return {"feed": ids}