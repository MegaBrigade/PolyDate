from fastapi import FastAPI, Depends
import httpx, html
from services.db import init_db, get_conn
from services.config import BOT_TOKEN

app = FastAPI()
TG_URL = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"

@app.on_event("startup")
async def startup():
    await init_db()


def link(user):
    name = html.escape(user["first_name"] or "user")
    if user["username"]:
        return f'<a href="https://t.me/{user["username"]}">{name}</a>'
    return f'<a href="tg://user?id={user["id"]}">{name}</a>'


@app.post("/match")
async def notify(u1:int, u2:int, conn=Depends(get_conn)):
    a = await conn.fetchrow("SELECT * FROM users WHERE id=$1", u1)
    b = await conn.fetchrow("SELECT * FROM users WHERE id=$1", u2)

    text1 = f"💘 мэтч с {link(b)}!"
    text2 = f"💘 мэтч с {link(a)}!"

    async with httpx.AsyncClient() as c:
        await c.post(TG_URL, json={"chat_id":a["id"],"text":text1,"parse_mode":"HTML"})
        await c.post(TG_URL, json={"chat_id":b["id"],"text":text2,"parse_mode":"HTML"})

    return {"ok":True}