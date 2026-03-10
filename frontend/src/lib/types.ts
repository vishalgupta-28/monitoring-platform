export type User = {
  id: string;
  email: string;
  full_name: string;
  role: 'viewer' | 'operator' | 'admin';
  is_active?: boolean;
  created_at?: string;
};

export type Service = {
  id: string;
  name: string;
  slug: string;
  service_type: string;
  base_url: string;
  environment: string;
  status: string;
  tags: Record<string, string>;
  created_at: string;
  created_by?: string;
};

export type ServiceCreatePayload = {
  name: string;
  slug: string;
  service_type: string;
  base_url: string;
  environment: string;
  status: string;
  tags: Record<string, string>;
};

export type MetricBucket = {
  timestamp: string;
  avg: number;
  p95: number;
  min: number;
  max: number;
  samples: number;
};

export type MetricAggregateResponse = {
  metric_name: string;
  interval: string;
  buckets: MetricBucket[];
};

export type MetricPoint = {
  id: number;
  service_id: string;
  metric_name: string;
  metric_type: string;
  value: number;
  recorded_at: string;
};

export type AlertRule = {
  id: string;
  service_id: string;
  name: string;
  metric_name: string;
  comparison: string;
  threshold: number;
  window_seconds?: number;
  severity: string;
  channels: string[];
  is_active?: boolean;
  created_at: string;
};

export type AlertRulePayload = {
  service_id: string;
  name: string;
  metric_name: string;
  comparison: string;
  threshold: number;
  window_seconds: number;
  severity: string;
  channels: string[];
  is_active: boolean;
};

export type AlertEvent = {
  id: string;
  service_id: string;
  rule_id: string;
  metric_name: string;
  current_value: number;
  status: string;
  message: string;
  delivered_channels: string[];
  triggered_at: string;
};

export type LogEntry = {
  id: string;
  service_id: string;
  level: string;
  message: string;
  trace_id?: string;
  attributes?: Record<string, string>;
  recorded_at: string;
};

export type TraceSpan = {
  id: string;
  trace_id: string;
  span_id: string;
  parent_span_id?: string | null;
  service_id: string;
  operation: string;
  duration_ms: number;
  status_code: number;
  start_time: string;
  end_time: string;
};

export type TraceTreeNode = {
  span_id: string;
  parent_span_id?: string | null;
  service_id: string;
  operation: string;
  duration_ms: number;
  status_code: number;
  children: TraceTreeNode[];
};

export type TraceTree = {
  trace_id: string;
  bottleneck_span_id: string;
  total_duration_ms: number;
  roots: TraceTreeNode[];
};

export type SimulationScenario = {
  id: string;
  name: string;
  category: string;
  description: string;
  config: Record<string, number | string>;
};

export type SimulationRun = {
  id: string;
  scenario_id: string;
  status: string;
  inputs: Record<string, number>;
  results: Record<string, number>;
  created_at: string;
};
