import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MetricPointCreate(BaseModel):
    service_id: uuid.UUID
    metric_name: str
    metric_type: str = 'gauge'
    value: float
    labels: dict[str, str] = {}
    recorded_at: datetime | None = None


class MetricIngestBatch(BaseModel):
    points: list[MetricPointCreate]


class MetricPointRead(MetricPointCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    recorded_at: datetime


class MetricAggregateBucket(BaseModel):
    timestamp: datetime
    avg: float
    p95: float
    min: float
    max: float
    samples: int


class MetricAggregateResponse(BaseModel):
    service_id: uuid.UUID | None = None
    metric_name: str
    interval: str
    buckets: list[MetricAggregateBucket]
