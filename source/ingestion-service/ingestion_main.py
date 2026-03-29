import asyncio
import json
import os
import httpx
import uvicorn
import websockets
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

SIMULATOR = os.getenv("SIMULATOR_URL", "http://simulator:8080")
PORT = int(os.getenv("PORT", "8000"))
app = FastAPI()
sensors = {}
subscribers = set()


def to_ws(url):
    return url.replace("http://", "ws://").replace("https://", "wss://")


async def wait_simulator():
    while True:
        try:
            async with httpx.AsyncClient() as c:
                r = await c.get(f"{SIMULATOR}/health")
                if r.status_code == 200:
                    print("Simulator ready", flush=True)
                    return
        except Exception:
            pass

        print("Waiting simulator...", flush=True)
        await asyncio.sleep(2)

#Sensor discovery util
async def discover():
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{SIMULATOR}/api/devices/")
        r.raise_for_status()
        data = r.json()

    for s in data:
        sensors[s["id"]] = s

    print("Discovered sensors:", list(sensors.keys()), flush=True)

#Sensor polling util
async def sensor_loop(sensor):
    sid = sensor["id"]
    url = to_ws(SIMULATOR) + sensor["websocket_url"]

    while True:
        try:
            print(f"[{sid}] connecting to {url}", flush=True)

            async with websockets.connect(url) as ws:
                print(f"[{sid}] connected", flush=True)

                async for msg in ws:
                    try:
                        data = json.loads(msg)
                    except Exception:
                        print(f"[{sid}] invalid JSON", flush=True)
                        continue

                    event = {
                        "sensor_id": sid,
                        "timestamp": data["timestamp"],
                        "value": data["value"]
                    }
                    #print(event, flush=True)
                    dead = []
                    for client in list(subscribers):
                        try:
                            await client.send_json(event)
                        except Exception:
                            dead.append(client)

                    for client in dead:
                        subscribers.discard(client)

        except Exception as e:
            print(f"[{sid}] error: {e}", flush=True)
            await asyncio.sleep(2)


# =========================================================
# STARTUP
# =========================================================

@app.on_event("startup")
async def start():
    await wait_simulator()
    await discover()

    for s in sensors.values():
        asyncio.create_task(sensor_loop(s))

#PU replicas connection point
@app.websocket("/ws")
async def ws_broker(ws: WebSocket):
    await ws.accept()
    subscribers.add(ws)

    print("Replica connected", flush=True)

    try:
        while True:
            await asyncio.sleep(60)
    except WebSocketDisconnect:
        pass
    finally:
        subscribers.discard(ws)
        print("Replica disconnected", flush=True)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
