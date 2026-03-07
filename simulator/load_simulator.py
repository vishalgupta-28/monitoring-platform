import os
import random
import time
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import httpx

API_BASE = os.getenv('PULSEBOARD_API_BASE', 'http://localhost:8000/api/v1')
API_KEY = os.getenv('PULSEBOARD_API_KEY', 'local-agent-key')
SERVICE_ID = os.getenv('SERVICE_ID', '5fe401b8-f585-4f6c-9189-7d7e1a001001')
BATCH_SIZE = int(os.getenv('BATCH_SIZE', '25'))
ITERATIONS = int(os.getenv('ITERATIONS', '10'))


def metric_point(metric_name: str, value: float) -> dict:
    return {
        'service_id': SERVICE_ID,
        'metric_name': metric_name,
        'metric_type': 'gauge',
        'value': value,
        'labels': {'source': 'load-simulator'},
        'recorded_at': datetime.now(timezone.utc).isoformat(),
    }


def run() -> None:
    headers = {'X-API-Key': API_KEY}
    with httpx.Client(timeout=10.0) as client:
        for _ in range(ITERATIONS):
            metric_payload = {
                'points': [
                    metric_point('latency_ms', random.uniform(110, 720)) for _ in range(BATCH_SIZE)
                ] + [
                    metric_point('error_rate', random.uniform(0.1, 8.2)) for _ in range(BATCH_SIZE)
                ]
            }
            log_payload = {
                'entries': [
                    {
                        'service_id': SERVICE_ID,
                        'level': random.choice(['INFO', 'WARN', 'ERROR']),
                        'message': f'synthetic batch event {index}',
                        'trace_id': str(uuid4()),
                        'attributes': {'iteration': str(index)},
                        'recorded_at': datetime.now(timezone.utc).isoformat(),
                    }
                    for index in range(BATCH_SIZE)
                ]
            }
            trace_id = uuid4()
            now = datetime.now(timezone.utc)
            trace_payload = {
                'spans': [
                    {
                        'trace_id': str(trace_id),
                        'span_id': 'root',
                        'service_id': SERVICE_ID,
                        'operation': 'GET /checkout',
                        'duration_ms': 420,
                        'status_code': 200,
                        'attributes': {'synthetic': 'true'},
                        'start_time': now.isoformat(),
                        'end_time': (now + timedelta(milliseconds=420)).isoformat(),
                    },
                    {
                        'trace_id': str(trace_id),
                        'span_id': 'db',
                        'parent_span_id': 'root',
                        'service_id': SERVICE_ID,
                        'operation': 'SELECT orders',
                        'duration_ms': 210,
                        'status_code': 200,
                        'attributes': {'synthetic': 'true'},
                        'start_time': now.isoformat(),
                        'end_time': (now + timedelta(milliseconds=210)).isoformat(),
                    },
                ]
            }
            client.post(f'{API_BASE}/metrics/ingest', headers=headers, json=metric_payload)
            client.post(f'{API_BASE}/logs/ingest', headers=headers, json=log_payload)
            client.post(f'{API_BASE}/traces/ingest', headers=headers, json=trace_payload)
            time.sleep(1)


if __name__ == '__main__':
    run()
