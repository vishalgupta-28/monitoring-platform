import type {
  AlertEvent,
  AlertRule,
  LogEntry,
  MetricAggregateResponse,
  MetricPoint,
  Service,
  SimulationRun,
  SimulationScenario,
  TraceSpan,
  TraceTree,
  User,
} from '@/lib/types';

const now = new Date();
const bucket = (offset: number, avg: number, p95: number) => ({
  timestamp: new Date(now.getTime() - offset * 60_000).toISOString(),
  avg,
  p95,
  min: Math.max(20, avg - 40),
  max: p95 + 35,
  samples: 1280 - offset * 24,
});

export const currentUser: User = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@pulseboard.dev',
  full_name: 'PulseBoard Admin',
  role: 'admin',
};

export const services: Service[] = [
  {
    id: '5fe401b8-f585-4f6c-9189-7d7e1a001001',
    name: 'Edge API Gateway',
    slug: 'edge-api-gateway',
    service_type: 'api',
    base_url: 'https://api.pulseboard.dev',
    environment: 'production',
    status: 'healthy',
    tags: { team: 'platform', tier: 'edge' },
    created_at: now.toISOString(),
  },
  {
    id: '5fe401b8-f585-4f6c-9189-7d7e1a001002',
    name: 'Orders PostgreSQL',
    slug: 'orders-postgres',
    service_type: 'database',
    base_url: 'postgres://orders-db:5432/orders',
    environment: 'production',
    status: 'degraded',
    tags: { team: 'payments', tier: 'stateful' },
    created_at: now.toISOString(),
  },
  {
    id: '5fe401b8-f585-4f6c-9189-7d7e1a001003',
    name: 'Dispatch Worker',
    slug: 'dispatch-worker',
    service_type: 'microservice',
    base_url: 'http://dispatch-worker:8080',
    environment: 'staging',
    status: 'healthy',
    tags: { team: 'mobility', tier: 'worker' },
    created_at: now.toISOString(),
  },
];

export const metricAggregate: MetricAggregateResponse = {
  metric_name: 'latency_ms',
  interval: '5 minutes',
  buckets: [bucket(5, 182, 304), bucket(4, 194, 338), bucket(3, 176, 298), bucket(2, 248, 422), bucket(1, 209, 355), bucket(0, 186, 312)],
};

export const latestMetrics: MetricPoint[] = [
  { id: 1, service_id: services[0].id, metric_name: 'latency_ms', metric_type: 'gauge', value: 186, recorded_at: now.toISOString() },
  { id: 2, service_id: services[0].id, metric_name: 'error_rate', metric_type: 'gauge', value: 2.1, recorded_at: now.toISOString() },
  { id: 3, service_id: services[1].id, metric_name: 'cpu_usage', metric_type: 'gauge', value: 84.4, recorded_at: now.toISOString() },
  { id: 4, service_id: services[2].id, metric_name: 'rps', metric_type: 'counter', value: 1940, recorded_at: now.toISOString() },
];

export const alertRules: AlertRule[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    service_id: services[0].id,
    name: 'Edge latency high',
    metric_name: 'latency_ms',
    comparison: 'gt',
    threshold: 500,
    severity: 'critical',
    channels: ['email', 'slack', 'webhook'],
    created_at: now.toISOString(),
  },
  {
    id: 'a1111111-1111-1111-1111-111111111112',
    service_id: services[1].id,
    name: 'DB CPU saturation',
    metric_name: 'cpu_usage',
    comparison: 'gt',
    threshold: 80,
    severity: 'warning',
    channels: ['email'],
    created_at: now.toISOString(),
  },
];

export const alertEvents: AlertEvent[] = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    service_id: services[1].id,
    rule_id: alertRules[1].id,
    metric_name: 'cpu_usage',
    current_value: 84.4,
    status: 'open',
    message: 'DB CPU saturation: cpu_usage is 84.40, threshold gt 80.00',
    delivered_channels: ['email'],
    triggered_at: now.toISOString(),
  },
];

export const logs: LogEntry[] = [
  { id: 'l1', service_id: services[0].id, level: 'INFO', message: 'Gateway request fan-out completed in 182ms', recorded_at: now.toISOString(), trace_id: 't-1001' },
  { id: 'l2', service_id: services[1].id, level: 'ERROR', message: 'Replication lag exceeded 3 seconds', recorded_at: now.toISOString(), trace_id: 't-1002' },
  { id: 'l3', service_id: services[2].id, level: 'WARN', message: 'Dispatch worker retrying Kafka commit', recorded_at: now.toISOString(), trace_id: 't-1003' },
];

export const traces: TraceSpan[] = [
  { id: 's1', trace_id: 'b01c0fda-3fa6-4fd0-8d14-b4b1b4d60001', span_id: 'root', service_id: services[0].id, operation: 'GET /checkout', duration_ms: 410, status_code: 200, start_time: now.toISOString(), end_time: now.toISOString() },
  { id: 's2', trace_id: 'b01c0fda-3fa6-4fd0-8d14-b4b1b4d60001', span_id: 'db', parent_span_id: 'root', service_id: services[1].id, operation: 'SELECT orders', duration_ms: 240, status_code: 200, start_time: now.toISOString(), end_time: now.toISOString() },
  { id: 's3', trace_id: 'b01c0fda-3fa6-4fd0-8d14-b4b1b4d60001', span_id: 'worker', parent_span_id: 'root', service_id: services[2].id, operation: 'publish dispatch', duration_ms: 120, status_code: 202, start_time: now.toISOString(), end_time: now.toISOString() },
];

export const traceTree: TraceTree = {
  trace_id: traces[0].trace_id,
  bottleneck_span_id: 'db',
  total_duration_ms: 410,
  roots: [
    {
      span_id: 'root',
      service_id: services[0].id,
      operation: 'GET /checkout',
      duration_ms: 410,
      status_code: 200,
      children: [
        {
          span_id: 'db',
          parent_span_id: 'root',
          service_id: services[1].id,
          operation: 'SELECT orders',
          duration_ms: 240,
          status_code: 200,
          children: [],
        },
        {
          span_id: 'worker',
          parent_span_id: 'root',
          service_id: services[2].id,
          operation: 'publish dispatch',
          duration_ms: 120,
          status_code: 202,
          children: [],
        },
      ],
    },
  ],
};

export const simulationScenarios: SimulationScenario[] = [
  { id: 'sim-1', name: 'URL Shortener', category: 'read-heavy', description: 'Cache hit ratios, redirect throughput, and hot-key imbalance.', config: { qps: 45000, regions: 3 } },
  { id: 'sim-2', name: 'YouTube', category: 'media', description: 'Upload bursts, transcoding queues, and playback load.', config: { stream_start_qps: 150000, regions: 8 } },
  { id: 'sim-3', name: 'Uber', category: 'geo', description: 'Dispatch latency, geo writes, and surge events.', config: { rides_per_min: 120000, regions: 5 } },
  { id: 'sim-4', name: 'Twitter', category: 'feed', description: 'Fan-out, home timeline reads, and cache churn.', config: { qps: 900000, regions: 6 } },
];

export const simulationRun: SimulationRun = {
  id: 'run-1',
  scenario_id: 'sim-3',
  status: 'completed',
  inputs: { load_multiplier: 1.6, regions: 5 },
  results: { effective_qps: 192000, autoscaled_replicas: 29, queue_lag_seconds: 2.4, estimated_error_rate: 2.6, regional_capacity_headroom: 10.8 },
  created_at: now.toISOString(),
};
