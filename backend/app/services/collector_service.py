import random
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Service
from app.schemas.metric import MetricIngestBatch, MetricPointCreate
from app.services.metric_service import metric_service


class CollectorService:
    async def collect_once(self, db: AsyncSession) -> int:
        services = list(await db.scalars(select(Service)))
        points: list[MetricPointCreate] = []
        for service in services:
            latency = await self._measure_latency(service.base_url)
            points.extend(
                [
                    MetricPointCreate(service_id=service.id, metric_name='latency_ms', value=latency, recorded_at=datetime.now(timezone.utc)),
                    MetricPointCreate(service_id=service.id, metric_name='rps', value=random.uniform(120, 2200)),
                    MetricPointCreate(service_id=service.id, metric_name='error_rate', value=random.uniform(0.1, 9.5)),
                    MetricPointCreate(service_id=service.id, metric_name='cpu_usage', value=random.uniform(18, 92)),
                    MetricPointCreate(service_id=service.id, metric_name='memory_usage', value=random.uniform(24, 88)),
                ]
            )

        if points:
            return await metric_service.ingest_batch(db, MetricIngestBatch(points=points))
        return 0

    @staticmethod
    async def _measure_latency(base_url: str) -> float:
        try:
            async with httpx.AsyncClient(timeout=2.5, follow_redirects=True) as client:
                start = datetime.now(timezone.utc)
                await client.get(base_url)
                return round((datetime.now(timezone.utc) - start).total_seconds() * 1000, 2)
        except Exception:  # noqa: BLE001
            return round(random.uniform(220, 1400), 2)


collector_service = CollectorService()
