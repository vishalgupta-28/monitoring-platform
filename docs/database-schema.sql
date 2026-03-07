-- Production-oriented PostgreSQL schema for PulseBoard.

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    service_type VARCHAR(50) NOT NULL,
    base_url VARCHAR(500) NOT NULL,
    environment VARCHAR(50) NOT NULL DEFAULT 'production',
    status VARCHAR(20) NOT NULL DEFAULT 'healthy',
    tags JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE metric_points (
    id BIGSERIAL PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES services(id),
    metric_name VARCHAR(120) NOT NULL,
    metric_type VARCHAR(32) NOT NULL DEFAULT 'gauge',
    value DOUBLE PRECISION NOT NULL,
    labels JSONB NOT NULL DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (recorded_at);

CREATE TABLE metric_points_2026_03_07 PARTITION OF metric_points
FOR VALUES FROM ('2026-03-07 00:00:00+00') TO ('2026-03-08 00:00:00+00');

CREATE INDEX idx_metric_points_service_metric_time ON metric_points (service_id, metric_name, recorded_at DESC);
CREATE INDEX idx_metric_points_time ON metric_points (recorded_at DESC);

CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id),
    name VARCHAR(200) NOT NULL,
    metric_name VARCHAR(120) NOT NULL,
    comparison VARCHAR(8) NOT NULL DEFAULT 'gt',
    threshold DOUBLE PRECISION NOT NULL,
    window_seconds INTEGER NOT NULL DEFAULT 300,
    severity VARCHAR(20) NOT NULL DEFAULT 'warning',
    channels JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE alert_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES alert_rules(id),
    service_id UUID NOT NULL REFERENCES services(id),
    metric_name VARCHAR(120) NOT NULL,
    current_value DOUBLE PRECISION NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    message TEXT NOT NULL,
    delivered_channels JSONB NOT NULL DEFAULT '[]'::jsonb,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ NULL
);

CREATE TABLE trace_spans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trace_id UUID NOT NULL,
    span_id VARCHAR(64) NOT NULL,
    parent_span_id VARCHAR(64) NULL,
    service_id UUID NOT NULL REFERENCES services(id),
    operation VARCHAR(255) NOT NULL,
    status_code INTEGER NOT NULL DEFAULT 200,
    duration_ms DOUBLE PRECISION NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_trace_spans_trace ON trace_spans (trace_id, start_time);

CREATE TABLE log_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id),
    level VARCHAR(16) NOT NULL,
    message TEXT NOT NULL,
    trace_id VARCHAR(64) NULL,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (recorded_at);

CREATE TABLE log_entries_2026_03_07 PARTITION OF log_entries
FOR VALUES FROM ('2026-03-07 00:00:00+00') TO ('2026-03-08 00:00:00+00');

CREATE INDEX idx_log_entries_service_time ON log_entries (service_id, recorded_at DESC);
CREATE INDEX idx_log_entries_level_time ON log_entries (level, recorded_at DESC);

CREATE TABLE simulation_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL UNIQUE,
    category VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE simulation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES simulation_scenarios(id),
    requested_by UUID NULL REFERENCES users(id),
    status VARCHAR(32) NOT NULL DEFAULT 'queued',
    inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
    results JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
