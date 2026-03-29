import asyncio
import json
import math
import os
import time
from collections import defaultdict, deque
import httpx
import numpy as np
import uvicorn
import websockets
from fastapi import FastAPI



BROKER_WS = os.getenv("BROKER_WS", "ws://ingestion:8000/ws")
SIMULATOR_HTTP = os.getenv("SIMULATOR_HTTP", "http://simulator:8080")
GATEWAY_HTTP = os.getenv("GATEWAY_HTTP", "http://gateway:8200")
SERVICE_ID = os.getenv("SERVICE_ID")

PORT = 8100

WINDOW_SIZE = 128          # sliding window samples per sensor
MIN_SAMPLES = 64           # minimum samples before FFT

SPECTRUM_THRESHOLD = 5.0
AMPLITUDE_THRESHOLD = 0.5  # avoid classifying tiny noise
COOLDOWN_SECONDS = 15       # avoid repeated detections every frame
analysis_counter = defaultdict(int)


app = FastAPI()
sensor_meta = {}                    # sensor_id -> metadata
buffers = defaultdict(lambda: deque(maxlen=WINDOW_SIZE))
last_detection_time = {}            # sensor_id -> unix time

# =========================================================
# METADATA
# =========================================================

async def wait_for_service(url):
    while True:
        try:
            async with httpx.AsyncClient() as c:
                r = await c.get(url)
                if r.status_code == 200:
                    return
        except:
            pass
        await asyncio.sleep(2)


async def load_sensor_metadata():
    async with httpx.AsyncClient() as c:
        r = await c.get(f"{SIMULATOR_HTTP}/api/devices/")
        r.raise_for_status()
        data = r.json()

    for s in data:
        sensor_meta[s["id"]] = s

    print("Loaded metadata for sensors:", list(sensor_meta.keys()), flush=True)

# =========================================================
# FFT / CLASSIFICATION
# =========================================================

def classify_frequency(freq_hz):
    if 0.5 <= freq_hz < 3.0:
        return "earthquake"
    if 3.0 <= freq_hz < 8.0:
        return "conventional_explosion"
    if freq_hz >= 8.0:
        return "nuclear_like"
    return None

def analyze_sensor(sensor_id):
    samples = list(buffers[sensor_id])

    if len(samples) < MIN_SAMPLES:
        return None

    # optional: analyze less often
    analysis_counter[sensor_id] += 1
    if analysis_counter[sensor_id] % 10 != 0:
        return None

    values = np.array([x["value"] for x in samples], dtype=float)

    # time-domain amplitude check
    peak_amplitude = float(np.max(np.abs(values)))
    if peak_amplitude < AMPLITUDE_THRESHOLD:
        return None

    # remove DC and reduce spectral leakage
    values = values - np.mean(values)
    values = values * np.hanning(len(values))

    sampling_rate = sensor_meta.get(sensor_id, {}).get("sampling_rate_hz", 20.0)

    fft_vals = np.fft.rfft(values)
    freqs = np.fft.rfftfreq(len(values), d=1.0 / sampling_rate)
    magnitudes = np.abs(fft_vals)

    if len(magnitudes) <= 1:
        return None

    # ignore 0 Hz
    magnitudes[0] = 0.0

    # only consider frequencies in the valid range
    valid = freqs >= 0.5
    if not np.any(valid):
        return None

    valid_freqs = freqs[valid]
    valid_magnitudes = magnitudes[valid]

    idx = int(np.argmax(valid_magnitudes))
    dominant_freq = float(valid_freqs[idx])
    peak_spectrum = float(valid_magnitudes[idx])

    event_type = classify_frequency(dominant_freq)
    if event_type is None:
        return None

    
    if peak_spectrum < SPECTRUM_THRESHOLD:
        return None

    now = time.time()
    last = last_detection_time.get(sensor_id, 0)
    if now - last < COOLDOWN_SECONDS:
        return None

    last_detection_time[sensor_id] = now

    meta = sensor_meta.get(sensor_id, {})

    detection = {
        "sensor_id": sensor_id,
        "sensor_name": meta.get("name"),
        "category": meta.get("category"),
        "region": meta.get("region"),
        "coordinates": meta.get("coordinates"),
        "timestamp": samples[-1]["timestamp"],
        "dominant_frequency_hz": round(dominant_freq, 3),
        "peak_amplitude": round(peak_amplitude, 3),
        "peak_spectrum": round(peak_spectrum, 3),
        "event_type": event_type,
        "window_size": len(samples),
    }

    print("\n==============================", flush=True)
    print(f"[EVENT DETECTED] sensor={sensor_id}", flush=True)
    print(json.dumps(detection, indent=2), flush=True)
    print("==============================\n", flush=True)

    return detection

async def send_detection_to_gateway(detection: dict):
    payload = {
        **detection,
        "service_id": SERVICE_ID,
    }

    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{GATEWAY_HTTP}/api/detections",
                json=payload,
                timeout=5.0,
            )
            r.raise_for_status()

            result = r.json()
            print(
                f"Detection sent to gateway | stored={result.get('stored')} "
                f"| dedup_key={result.get('dedup_key')}",
                flush=True,
            )

    except Exception as e:
        print(f"Failed to send detection to gateway: {e}", flush=True)



async def broker_loop():
    while True:
        try:
            print(f"Connecting to broker: {BROKER_WS}", flush=True)

            async with websockets.connect(BROKER_WS) as ws:
                print("Connected to broker", flush=True)
                counter = 0

                async for msg in ws:
                    try:
                        event = json.loads(msg)
                    except:
                        print("Invalid JSON from broker")
                        continue

                    sensor_id = event.get("sensor_id")
                    timestamp = event.get("timestamp")
                    
                    value = event.get("value")
                    counter += 1
                   

                    if sensor_id is None or timestamp is None or value is None:
                        print("Invalid broker message:", event)
                        continue

                    buffers[sensor_id].append({
                        "timestamp": timestamp,
                        "value": float(value),
                    })

                    detection = analyze_sensor(sensor_id)
                    if detection is not None:
                        await send_detection_to_gateway(detection)

        except Exception as e:
            print("Broker error:", e)
            await asyncio.sleep(2)

# =========================================================
# CONTROL STREAM (SSE)
# =========================================================

async def control_loop():
    url = f"{SIMULATOR_HTTP}/api/control"

    while True:
        event_type = "message"
        data_lines = []

        try:
            print("Connecting to control stream:", url, flush=True)

            async with httpx.AsyncClient(timeout=None) as c:
                async with c.stream("GET", url) as r:
                    r.raise_for_status()
                    print("Connected to control stream", flush=True)

                    async for line in r.aiter_lines():
                        if line == "":
                            if data_lines:
                                raw = "\n".join(data_lines)

                                try:
                                    payload = json.loads(raw)
                                except:
                                    payload = None

                                if event_type == "command" and payload == {"command": "SHUTDOWN"}:
                                    print("SHUTDOWN command received. Terminating replica.", flush=True)
                                    os._exit(0)

                            event_type = "message"
                            data_lines = []
                            continue

                        if not line:
                            continue

                        if line.startswith(":"):
                            continue

                        if line.startswith("event:"):
                            event_type = line[len("event:"):].strip()
                            continue

                        if line.startswith("data:"):
                            data_lines.append(line[len("data:"):].strip())
                            continue

        except Exception as e:
            print("Control stream error:", e)
            await asyncio.sleep(2)

# =========================================================
# HEALTH
# =========================================================

@app.get("/health")
async def health():
    return {
        "service_id": SERVICE_ID,
        "status": "ok",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

# =========================================================
# STARTUP
# =========================================================

@app.on_event("startup")
async def startup():
    await wait_for_service(f"{SIMULATOR_HTTP}/health")
    #await wait_for_service(f"{GATEWAY_HTTP}/health")
    await load_sensor_metadata()
    asyncio.create_task(broker_loop())
    asyncio.create_task(control_loop())

# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
