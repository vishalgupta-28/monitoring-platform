import json
import logging

import redis.asyncio as redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisCache:
    def __init__(self) -> None:
        self._client: redis.Redis | None = None

    async def client(self) -> redis.Redis | None:
        if self._client is None:
            try:
                self._client = redis.from_url(settings.redis_url, encoding='utf-8', decode_responses=True)
                await self._client.ping()
            except Exception as exc:  # noqa: BLE001
                logger.warning('Redis unavailable: %s', exc)
                self._client = None
        return self._client

    async def set_json(self, key: str, value: dict, ttl_seconds: int = 30) -> None:
        client = await self.client()
        if client:
            await client.set(key, json.dumps(value, default=str), ex=ttl_seconds)

    async def get_json(self, key: str) -> dict | None:
        client = await self.client()
        if not client:
            return None
        raw = await client.get(key)
        return json.loads(raw) if raw else None


redis_cache = RedisCache()
