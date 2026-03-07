import os
import socket
import time
from datetime import datetime, timezone

import httpx
import psutil

API_BASE = os.getenv('PULSEBOARD_API_BASE', 'http://localhost:8000/api/v1')
API_KEY = os.getenv('PULSEBOARD_API_KEY', 'local-agent-key')
TARGET_URL = os.getenv('TARGET_URL', 'http://localhost:3000')
SERVICE_ID = os.getenv('SERVICE_ID', '5fe401b8-f585-4f6c-9189-7d7e1a001003')
INTERVAL_SECONDS = int(os.getenv('INTERVAL_SECONDS', '10'))
HOSTNAME = socket.gethostname()


def build_metric(name: str, value: float) -> dict:
    return {
        'service_id': SERVICE_ID,
        'metric_name': name,
        'metric_type': 'gauge',
        'value': value,
        'labels': {'host': HOSTNAME},
        'recorded_at': datetime.now(timezone.utc).isoformat(),
    }


def measure_latency() -> float:
    started = time.perf_counter()
    try:
        response = httpx.get(TARGET_URL, timeout=2.5)
        response.raise_for_status()
        return round((time.perf_counter() - started) * 1000, 2)
    except Exception:
        return 999.0


def emit_loop() -> None:
    headers = {'X-API-Key': API_KEY}
    with httpx.Client(timeout=5.0) as client:
        while True:
            cpu = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory().percent
            latency = measure_latency()
            error_rate = 0.0 if latency < 900 else 12.0
            payload = {
                'points': [
                    build_metric('cpu_usage', cpu),
                    build_metric('memory_usage', memory),
                    build_metric('latency_ms', latency),
                    build_metric('error_rate', error_rate),
                ]
            }
            client.post(f'{API_BASE}/metrics/ingest', headers=headers, json=payload)
            time.sleep(INTERVAL_SECONDS)


if __name__ == '__main__':
    emit_loop()
