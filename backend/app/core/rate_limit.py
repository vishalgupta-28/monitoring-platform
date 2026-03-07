import time
from collections import defaultdict, deque

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._buckets: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        key = f'{request.client.host}:{request.url.path}'
        now = time.time()
        is_ingest = request.url.path.endswith('/ingest')
        limit = settings.ingest_rate_limit_per_minute if is_ingest else settings.api_rate_limit_per_minute
        bucket = self._buckets[key]

        while bucket and bucket[0] < now - 60:
            bucket.popleft()

        if len(bucket) >= limit:
            return JSONResponse(status_code=429, content={'detail': 'Rate limit exceeded'})

        bucket.append(now)
        return await call_next(request)
