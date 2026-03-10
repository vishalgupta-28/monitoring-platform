import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AlertRuleBase(BaseModel):
    service_id: uuid.UUID
    name: str
    metric_name: str
    comparison: str = 'gt'
    threshold: float
    window_seconds: int = 300
    severity: str = 'warning'
    channels: list[str] = ['email']
    is_active: bool = True


class AlertRuleCreate(AlertRuleBase):
    pass


class AlertRuleUpdate(BaseModel):
    service_id: uuid.UUID | None = None
    name: str | None = None
    metric_name: str | None = None
    comparison: str | None = None
    threshold: float | None = None
    window_seconds: int | None = None
    severity: str | None = None
    channels: list[str] | None = None
    is_active: bool | None = None


class AlertRuleRead(AlertRuleBase):
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
