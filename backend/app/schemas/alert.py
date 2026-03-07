import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AlertRuleCreate(BaseModel):
    service_id: uuid.UUID
    name: str
    metric_name: str
    comparison: str = 'gt'
    threshold: float
    window_seconds: int = 300
    severity: str = 'warning'
    channels: list[str] = ['email']
    is_active: bool = True


class AlertRuleRead(AlertRuleCreate):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime


class AlertEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    rule_id: uuid.UUID
    service_id: uuid.UUID
    metric_name: str
    current_value: float
    status: str
    message: str
    delivered_channels: list[str]
    triggered_at: datetime
    resolved_at: datetime | None = None
