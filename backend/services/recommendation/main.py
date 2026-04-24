from fastapi import FastAPI, Depends
from math import radians,sin,cos,sqrt,atan2
from services.db import init_db, get_conn

app = FastAPI()

@app.on_event("startup")
async def startup():
    await init_db()


def dist(a,b,c,d):
    R=6371
    dlat=radians(c-a)
    dlon=radians(d-b)
    x=sin(dlat/2)**2+cos(radians(a))*cos(radians(c))*sin(dlon/2)**2
    return 2*R*atan2(sqrt(x),sqrt(1-x))


@app.post("/feed")
async def feed(user_id:int, conn=Depends(get_conn)):
    u = await conn.fetchrow("SELECT * FROM users WHERE id=$1", user_id)

    users = await conn.fetch("""
        SELECT * FROM users u
        WHERE u.id != $1
        AND NOT EXISTS (
            SELECT 1 FROM matches m
            WHERE (m.user1_id=$1 AND m.user2_id=u.id)
               OR (m.user2_id=$1 AND m.user1_id=u.id)
        )
        LIMIT 200
    """, user_id)

    ranked = sorted(users, key=lambda x: dist(
        u["latitude"],u["longitude"],x["latitude"],x["longitude"]
    ))

    ids=[x["id"] for x in ranked[:50]]

    await conn.execute("""
        INSERT INTO feed (user_id,candidates)
        VALUES ($1,$2)
        ON CONFLICT (user_id)
        DO UPDATE SET candidates=$2
    """, user_id, ids)

    return {"feed":ids}