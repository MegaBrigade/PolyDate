import os
import asyncpg

DB_URL = os.getenv("postgresql://postgres:[YOUR-PASSWORD]@db.xvuhqybarebbajkxavms.supabase.co:5432/postgres")

async def get_db():
    return await asyncpg.connect(DB_URL)

from fastapi import FastAPI
import httpx
import html

app = FastAPI()

BOT_TOKEN = os.getenv("BOT_TOKEN")
TG_URL = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"


async def get_user(user_id: int):
    conn = await get_db()
    row = await conn.fetchrow(
        "SELECT id, username, first_name FROM users WHERE id = $1",
        user_id
    )
    await conn.close()
    return row


def build_link(user):
    name = html.escape(user["first_name"] or "пользователь")

    if user["username"]:
        return f'<a href="https://t.me/{user["username"]}">{name}</a>'
    else:
        return f'<a href="tg://user?id={user["id"]}">{name}</a>'


async def send(chat_id, text):
    async with httpx.AsyncClient() as client:
        await client.post(TG_URL, json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML"
        })


@app.post("/notify_match")
async def notify(user1_id: int, user2_id: int):
    u1 = await get_user(user1_id)
    u2 = await get_user(user2_id)

    link1 = build_link(u1)
    link2 = build_link(u2)

    text1 = f"💘 У вас мэтч с {link2}!"
    text2 = f"💘 У вас мэтч с {link1}!"

    await send(u1["id"], text1)
    await send(u2["id"], text2)

    return {"ok": True}