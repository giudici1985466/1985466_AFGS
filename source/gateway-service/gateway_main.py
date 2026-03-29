import asyncio
import json
import os
from datetime import datetime, timezone
from typing import Optional

import asyncpg
import httpx
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

PORT = int(os.getenv("PORT", "8200"))
POSTGRES_DSN = os.getenv(
    "POSTGRES_DSN",
    "postgresql://postgres:postgres@postgres:5432/seismic_data"
)

PROCESSING_UNITS = [
    url.strip()
    for url in os.getenv("PROCESSING_UNITS", "").split(",")
    if url.strip()
]

HEARTBEAT_INTERVAL = 5
HEARTBEAT_TIMEOUT = 2.0
OFFLINE_AFTER_FAILURES = 3
LIVE_LIMIT = 5

app = FastAPI(title="Gateway Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:8000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db_pool: Optional[asyncpg.Pool] = None
pu_status = {}

class EventIn(BaseModel):
    sensor_id: str
    sensor_name: Optional[str] = None
    category: Optional[str] = None
    region: Optional[str] = None
    coordinates: Optional[dict] = None
    timestamp: str
    dominant_frequency_hz: float
    peak_amplitude: float
    peak_spectrum: float
    event_type: str
    window_size: int
    service_id: Optional[str] = None

CREATE_EVENTS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    sensor_id TEXT NOT NULL,
    sensor_name TEXT,
    category TEXT,
    region TEXT,
    coordinates JSONB,
    event_type TEXT NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL,
    time_bucket TIMESTAMPTZ NOT NULL,
    dominant_frequency_hz DOUBLE PRECISION NOT NULL,
    peak_amplitude DOUBLE PRECISION NOT NULL,
    peak_spectrum DOUBLE PRECISION NOT NULL,
    window_size INTEGER NOT NULL,
    reported_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sensor_id, event_type, time_bucket)
);
"""

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def parse_ts(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))

def second_bucket(ts: str) -> datetime:
    dt = parse_ts(ts).astimezone(timezone.utc).replace(microsecond=0)
    bucket_second = dt.second - (dt.second % 3)  # 3-second window
    return dt.replace(second=bucket_second)

def serialize(row):
    item = dict(row)
    for k, v in item.items():
        if isinstance(v, datetime):
            item[k] = v.isoformat()
    return item

async def init_db():
    global db_pool
    db_pool = await asyncpg.create_pool(POSTGRES_DSN)

    async with db_pool.acquire() as conn:
        await conn.execute(CREATE_EVENTS_TABLE_SQL)

async def store_event(event: EventIn):
    if db_pool is None:
        raise RuntimeError("DB not initialized")

    event_ts = parse_ts(event.timestamp)
    bucket = second_bucket(event.timestamp)

    print(
        f"[STORE] sensor={event.sensor_id} "
        f"type={event.event_type} "
        f"time_bucket={bucket.isoformat()}",
        flush=True
    )

    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO events (
                sensor_id, sensor_name, category, region, coordinates,
                event_type, event_timestamp, time_bucket,
                dominant_frequency_hz, peak_amplitude, peak_spectrum,
                window_size, reported_by
            )
            VALUES (
                $1, $2, $3, $4, $5::jsonb,
                $6, $7, $8, $9, $10, $11, $12, $13
            )
            ON CONFLICT (sensor_id, event_type, time_bucket) DO NOTHING
            RETURNING id
            """,
            event.sensor_id,
            event.sensor_name,
            event.category,
            event.region,
            json.dumps(event.coordinates) if event.coordinates is not None else None,
            event.event_type,
            event_ts,
            bucket,
            event.dominant_frequency_hz,
            event.peak_amplitude,
            event.peak_spectrum,
            event.window_size,
            event.service_id,
        )

    if row is not None:
        print("[DB] Event inserted", flush=True)
    else:
        print("[DB] Duplicate ignored", flush=True)

    return {
        "stored": row is not None,
        "dedup_key": {
            "sensor_id": event.sensor_id,
            "event_type": event.event_type,
            "time_bucket": bucket.isoformat(),
        },
    }

async def poll_pu(client: httpx.AsyncClient, url: str):
    state = pu_status.setdefault(url, {
        "url": url,
        "service_id": None,
        "status": "unknown",
        "failures": 0,
        "last_ok_at": None,
        "last_error": None,
    })

    try:
        r = await client.get(url, timeout=HEARTBEAT_TIMEOUT)
        r.raise_for_status()
        data = r.json()

        state["service_id"] = data.get("service_id")
        state["status"] = "online"
        state["failures"] = 0
        state["last_ok_at"] = now_iso()
        state["last_error"] = None

    except Exception as e:
        state["failures"] += 1
        state["last_error"] = str(e)
        state["status"] = "offline" if state["failures"] >= OFFLINE_AFTER_FAILURES else "suspect"

async def heartbeat_loop():
    if not PROCESSING_UNITS:
        print("No processing units configured", flush=True)
        return

    async with httpx.AsyncClient() as client:
        while True:
            await asyncio.gather(
                *(poll_pu(client, url) for url in PROCESSING_UNITS),
                return_exceptions=True
            )
            await asyncio.sleep(HEARTBEAT_INTERVAL)
async def wait_for_postgres():
    while True:
        try:
            conn = await asyncpg.connect(POSTGRES_DSN)
            await conn.close()
            print("PostgreSQL is ready", flush=True)
            return
        except Exception as e:
            print(f"Waiting for PostgreSQL: {e}", flush=True)
            await asyncio.sleep(2)

@app.get("/health")
async def health():
    return {
        "service_id": "gateway",
        "status": "ok",
        "timestamp": now_iso(),
    }

@app.post("/api/detections")
async def ingest_event(event: EventIn):
    try:
        print("\n--- Incoming event ---", flush=True)
        print(json.dumps(event.model_dump(), indent=2), flush=True)
        result = await store_event(event)
        return {
            "status": "ok",
            **result,
            "timestamp": now_iso(),
        }
    except Exception as e:
        print(f"Error storing event: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to store event")

@app.get("/api/live")
async def get_live_events():
    if db_pool is None:
        raise HTTPException(status_code=500, detail="DB not ready")

    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT *
            FROM events
            ORDER BY created_at DESC
            LIMIT $1
            """,
            LIVE_LIMIT,
        )

    return {
        "status": "ok",
        "timestamp": now_iso(),
        "count": len(rows),
        "items": [serialize(r) for r in rows],
    }

@app.get("/api/events")
async def get_all_events():
    if db_pool is None:
        raise HTTPException(status_code=500, detail="DB not ready")

    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT *
            FROM events
            ORDER BY created_at DESC
            """
        )

    return {
        "status": "ok",
        "timestamp": now_iso(),
        "count": len(rows),
        "items": [serialize(r) for r in rows],
    }

@app.get("/api/processing-status")
async def get_processing_status():
    return {
        "status": "ok",
        "timestamp": now_iso(),
        "count": len(pu_status),
        "units": list(pu_status.values()),
    }

@app.on_event("startup")
async def startup():
    await wait_for_postgres()
    await init_db()
    asyncio.create_task(heartbeat_loop())
    print("Gateway started", flush=True)
    print(f"Listening on port {PORT}", flush=True)
    print(f"Configured processing units: {PROCESSING_UNITS}", flush=True)

@app.on_event("shutdown")
async def shutdown():
    global db_pool
    if db_pool is not None:
        await db_pool.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)