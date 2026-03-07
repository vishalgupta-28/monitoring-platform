import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class LogEntryCreate(BaseModel):
    service_id: uuid.UUID
    level: str
    message: str
    trace_id: str | None = None
    attributes: dict[str, str] = {}
    recorded_at: datetime | None = None


class LogEntryBatch(BaseModel):
    entries: list[LogEntryCreate]


class LogEntryRead(LogEntryCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    recorded_at: datetime
