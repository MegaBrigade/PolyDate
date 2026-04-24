from fastapi import FastAPI, Depends, HTTPException
import httpx
from services.db import init_db, get_conn
from services.config import SIGHTENGINE_USER, SIGHTENGINE_SECRET

app = FastAPI()

@app.on_event("startup")
async def startup():
    await init_db()


def is_valid(r):
    try:
        return (
            r["nudity"]["sexual_activity"] < 0.2 and
            r["gore"]["prob"] < 0.2 and
            r["violence"]["prob"] < 0.3 and
            r["type"]["ai_generated"] < 0.5
        )
    except:
        return False


@app.post("/moderate")
async def moderate(photo_id:int, conn=Depends(get_conn)):
    photo = await conn.fetchrow("SELECT url FROM photos WHERE id=$1", photo_id)
    if not photo:
        raise HTTPException(404)

    async with httpx.AsyncClient() as client:
        r = await client.get("https://api.sightengine.com/1.0/check.json", params={
            "models":"nudity-2.1,gore-2.0,violence,genai",
            "api_user":SIGHTENGINE_USER,
            "api_secret":SIGHTENGINE_SECRET,
            "url":photo["url"]
        })
        result = r.json()

    status = "approved" if is_valid(result) else "rejected"

    await conn.execute("""
        UPDATE photos SET moderation_status=$1 WHERE id=$2
    """, status, photo_id)

    return {"status":status}