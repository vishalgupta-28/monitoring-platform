from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, require_api_key_or_user
from app.db.models import User
from app.schemas.metric import MetricAggregateResponse, MetricIngestBatch, MetricPointRead
from app.services.metric_service import metric_service

router = APIRouter()


@router.post('/ingest', status_code=status.HTTP_202_ACCEPTED)
async def ingest_metrics(
    payload: MetricIngestBatch,
    db: AsyncSession = Depends(get_db),
    _: User | None = Depends(require_api_key_or_user),
) -> dict[str, int]:
    count = await metric_service.ingest_batch(db, payload)
    return {'accepted': count}


@router.get('', response_model=MetricAggregateResponse)
async def query_metrics(
    service_id: str | None = Query(default=None),
    metric_name: str = Query(default='latency_ms'),
    interval: str = Query(default='5 minutes'),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> MetricAggregateResponse:
    return await metric_service.aggregate_metrics(db, service_id=service_id, metric_name=metric_name, interval=interval)


@router.get('/latest', response_model=list[MetricPointRead])
async def latest_metrics(
    service_id: str | None = Query(default=None),
    limit: int = Query(default=50, le=500),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[MetricPointRead]:
    return await metric_service.latest_metrics(db, service_id=service_id, limit=limit)
