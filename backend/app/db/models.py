import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = 'users'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default='viewer')
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Service(Base):
    __tablename__ = 'services'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), index=True)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    service_type: Mapped[str] = mapped_column(String(50))
    base_url: Mapped[str] = mapped_column(String(500))
    environment: Mapped[str] = mapped_column(String(50), default='production')
    status: Mapped[str] = mapped_column(String(20), default='healthy')
    tags: Mapped[dict] = mapped_column(JSONB().with_variant(JSON(), 'sqlite'), default=dict)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('users.id'))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MetricPoint(Base):
    __tablename__ = 'metric_points'

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    service_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('services.id'), index=True)
    metric_name: Mapped[str] = mapped_column(String(120), index=True)
    metric_type: Mapped[str] = mapped_column(String(32), default='gauge')
    value: Mapped[float] = mapped_column(Float)
    labels: Mapped[dict] = mapped_column(JSONB().with_variant(JSON(), 'sqlite'), default=dict)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, server_default=func.now())


class AlertRule(Base):
    __tablename__ = 'alert_rules'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('services.id'), index=True)
    name: Mapped[str] = mapped_column(String(200))
    metric_name: Mapped[str] = mapped_column(String(120), index=True)
    comparison: Mapped[str] = mapped_column(String(8), default='gt')
    threshold: Mapped[float] = mapped_column(Float)
    window_seconds: Mapped[int] = mapped_column(Integer, default=300)
    severity: Mapped[str] = mapped_column(String(20), default='warning')
    channels: Mapped[list] = mapped_column(JSONB().with_variant(JSON(), 'sqlite'), default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AlertEvent(Base):
    __tablename__ = 'alert_events'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('alert_rules.id'), index=True)
    service_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('services.id'), index=True)
    metric_name: Mapped[str] = mapped_column(String(120))
    current_value: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20), default='open')
    message: Mapped[str] = mapped_column(Text)
    delivered_channels: Mapped[list] = mapped_column(JSONB().with_variant(JSON(), 'sqlite'), default=list)
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class TraceSpan(Base):
    __tablename__ = 'trace_spans'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    span_id: Mapped[str] = mapped_column(String(64), index=True)
    parent_span_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    service_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('services.id'), index=True)
    operation: Mapped[str] = mapped_column(String(255))
    status_code: Mapped[int] = mapped_column(Integer, default=200)
    duration_ms: Mapped[float] = mapped_column(Float)
    attributes: Mapped[dict] = mapped_column(JSONB().with_variant(JSON(), 'sqlite'), default=dict)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class LogEntry(Base):
    __tablename__ = 'log_entries'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('services.id'), index=True)
    level: Mapped[str] = mapped_column(String(16), index=True)
    message: Mapped[str] = mapped_column(Text)
    trace_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    attributes: Mapped[dict] = mapped_column(JSONB().with_variant(JSON(), 'sqlite'), default=dict)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, server_default=func.now())


class SimulationScenario(Base):
    __tablename__ = 'simulation_scenarios'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    category: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(Text)
    config: Mapped[dict] = mapped_column(JSONB().with_variant(JSON(), 'sqlite'), default=dict)


class SimulationRun(Base):
    __tablename__ = 'simulation_runs'

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scenario_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey('simulation_scenarios.id'), index=True)
    requested_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default='queued')
    inputs: Mapped[dict] = mapped_column(JSONB().with_variant(JSON(), 'sqlite'), default=dict)
    results: Mapped[dict] = mapped_column(JSONB().with_variant(JSON(), 'sqlite'), default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
