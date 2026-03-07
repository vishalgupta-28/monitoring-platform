import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TraceSpanCreate(BaseModel):
    trace_id: uuid.UUID
    span_id: str
    parent_span_id: str | None = None
    service_id: uuid.UUID
    operation: str
    status_code: int = 200
    duration_ms: float
    attributes: dict[str, str] = {}
    start_time: datetime
    end_time: datetime


class TraceBatch(BaseModel):
    spans: list[TraceSpanCreate]


class TraceRead(TraceSpanCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID


class TraceNode(BaseModel):
    span_id: str
    parent_span_id: str | None = None
    service_id: uuid.UUID
    operation: str
    duration_ms: float
    status_code: int
    children: list['TraceNode'] = []


class TraceTreeResponse(BaseModel):
    trace_id: uuid.UUID
    bottleneck_span_id: str
    total_duration_ms: float
    roots: list[TraceNode]


TraceNode.model_rebuild()
