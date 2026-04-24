import json, hmac, hashlib
from fastapi import FastAPI, Depends, HTTPException
from services.db import init_db, get_conn
from services.config import BOT_TOKEN

app = FastAPI()

@app.on_event("startup")
async def startup():
    await init_db()


def validate(init_data: str):
    parsed = dict(x.split("=") for x in init_data.split("&"))
    hash_ = parsed.pop("hash")

    data_check = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
    secret = hashlib.sha256(BOT_TOKEN.encode()).digest()

    if hmac.new(secret, data_check.encode(), hashlib.sha256).hexdigest() != hash_:
        raise HTTPException(403)

    return json.loads(parsed["user"])


@app.post("/profile/init")
async def init_profile(initData: str, conn=Depends(get_conn)):
    user = validate(initData)

    await conn.execute("""
        INSERT INTO users (id, username, first_name)
        VALUES ($1,$2,$3)
        ON CONFLICT (id) DO UPDATE SET
        username=EXCLUDED.username,
        first_name=EXCLUDED.first_name
    """, user["id"], user.get("username"), user.get("first_name"))

    return {"user_id": user["id"]}


@app.post("/profile/update")
async def update_profile(user_id:int, age:int, bio:str, latitude:float, longitude:float, conn=Depends(get_conn)):
    await conn.execute("""
        UPDATE users
        SET age=$1,bio=$2,latitude=$3,longitude=$4
        WHERE id=$5
    """, age,bio,latitude,longitude,user_id)

    return {"ok": True}