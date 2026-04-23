import os
import asyncpg

DB_URL = os.getenv("postgresql://postgres:[YOUR-PASSWORD]@db.xvuhqybarebbajkxavms.supabase.co:5432/postgres")

async def get_db():
    return await asyncpg.connect(DB_URL)

from fastapi import FastAPI, HTTPException
import httpx

app = FastAPI()

SIGHTENGINE_USER = os.getenv("SIGHTENGINE_USER")
SIGHTENGINE_SECRET = os.getenv("SIGHTENGINE_SECRET")

async def get_photo(photo_id: int):
    conn = await get_db()
    row = await conn.fetchrow(
        "SELECT url FROM photos WHERE id = $1",
        photo_id
    )
    await conn.close()
    return row


async def update_status(photo_id: int, status: str):
    conn = await get_db()
    await conn.execute(
        """
        UPDATE photos
        SET moderation_status = $1, moderated_at = now()
        WHERE id = $2
        """,
        status, photo_id
    )
    await conn.close()


async def check_image(url: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.sightengine.com/1.0/check.json",
            params={
                "models": "nudity-2.1, gore-2.0, violence, genai",
                "api_user": SIGHTENGINE_USER,
                "api_secret": SIGHTENGINE_SECRET,
                "url": url
            }
        )
        return resp.json()


def is_valid(r):
    return (
        r["nudity"]["sexual_activity"] < 0.2 and
        r["gore"]["prob"] < 0.2 and
        r["violence"]["prob"] < 0.3 and
        r["type"]["ai_generated"] < 0.5
    )


@app.post("/moderate")
async def moderate(photo_id: int):
    photo = await get_photo(photo_id)
    if not photo:
        raise HTTPException(404, "Photo not found")

    result = await check_image(photo["url"])

    status = "approved" if is_valid(result) else "rejected"
    await update_status(photo_id, status)

    return {"status": status}