from datetime import datetime, timezone

from sqlalchemy import desc, text, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.models import MetricPoint
from app.schemas.metric import MetricAggregateBucket, MetricAggregateResponse, MetricIngestBatch
from app.services.alert_service import alert_service
from app.services.kafka_service import kafka_service
from app.services.redis_cache import redis_cache
from app.websocket.manager import websocket_manager


class MetricService:
    async def ingest_batch(self, db: AsyncSession, payload: MetricIngestBatch) -> int:
        points = [
            MetricPoint(
                service_id=point.service_id,
                metric_name=point.metric_name,
                metric_type=point.metric_type,
                value=point.value,
                labels=point.labels,
                recorded_at=point.recorded_at or datetime.now(timezone.utc),
            )
            for point in payload.points
        ]
        db.add_all(points)
        await db.commit()

        for point in points:
            await kafka_service.publish(
                settings.kafka_metrics_topic,
                {
                    'service_id': str(point.service_id),
                    'metric_name': point.metric_name,
                    'value': point.value,
                    'metric_type': point.metric_type,
                    'recorded_at': point.recorded_at.isoformat(),
                },
            )
            await alert_service.evaluate_metric(db, point)
            await websocket_manager.broadcast(
                {
                    'type': 'metric',
                    'payload': {
                        'service_id': str(point.service_id),
                        'metric_name': point.metric_name,
                        'value': point.value,
                        'recorded_at': point.recorded_at.isoformat(),
                    },
                }
            )
        return len(points)

    async def aggregate_metrics(self, db: AsyncSession, service_id: str | None, metric_name: str, interval: str) -> MetricAggregateResponse:
        cache_key = f'metric-aggregate:{service_id}:{metric_name}:{interval}'
        cached = await redis_cache.get_json(cache_key)
        if cached:
            return MetricAggregateResponse.model_validate(cached)

        stmt = text(
            """
            SELECT date_trunc('minute', recorded_at) AS bucket,
                   AVG(value) AS avg_value,
                   percentile_cont(0.95) WITHIN GROUP (ORDER BY value) AS p95_value,
                   MIN(value) AS min_value,
                   MAX(value) AS max_value,
                   COUNT(*) AS samples
            FROM metric_points
            WHERE metric_name = :metric_name
              AND recorded_at >= now() - CAST(:interval AS interval)
              AND (:service_id IS NULL OR service_id = CAST(:service_id AS uuid))
            GROUP BY bucket
            ORDER BY bucket ASC
            """
        )
        result = await db.execute(stmt, {'metric_name': metric_name, 'interval': interval, 'service_id': service_id})
        buckets = [
            MetricAggregateBucket(
                timestamp=row.bucket,
                avg=float(row.avg_value or 0),
                p95=float(row.p95_value or 0),
                min=float(row.min_value or 0),
                max=float(row.max_value or 0),
                samples=int(row.samples or 0),
            )
            for row in result
        ]
        response = MetricAggregateResponse(service_id=service_id, metric_name=metric_name, interval=interval, buckets=buckets)
        await redis_cache.set_json(cache_key, response.model_dump(mode='json'))
        return response

    async def latest_metrics(self, db: AsyncSession, service_id: str | None, limit: int) -> list[MetricPoint]:
        stmt = select(MetricPoint).order_by(desc(MetricPoint.recorded_at)).limit(limit)
        if service_id:
            stmt = stmt.where(MetricPoint.service_id == service_id)
        result = await db.scalars(stmt)
        return list(result)


metric_service = MetricService()
