import { alertEvents, alertRules, currentUser, latestMetrics, logs, metricAggregate, services, simulationRun, simulationScenarios, traceTree, traces } from '@/lib/mock-data';
import type { AlertEvent, AlertRule, LogEntry, MetricAggregateResponse, MetricPoint, Service, SimulationRun, SimulationScenario, TraceSpan, TraceTree, User } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';

async function fetchJson<T>(path: string, init?: RequestInit, fallback?: T): Promise<T> {
  try {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('pulseboard-token') : null;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}

export async function login(payload: { email: string; password: string }) {
  try {
    const response = await fetchJson<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    window.localStorage.setItem('pulseboard-token', response.access_token);
    return response;
  } catch {
    if (payload.email === 'admin@pulseboard.dev' && payload.password === 'admin123') {
      window.localStorage.setItem('pulseboard-token', 'demo-token');
      return { access_token: 'demo-token', user: currentUser };
    }
    throw new Error('Invalid credentials');
  }
}

export const getServices = () => fetchJson<Service[]>('/services', undefined, services);
export const getMetricAggregate = () => fetchJson<MetricAggregateResponse>('/metrics?metric_name=latency_ms&interval=5%20minutes', undefined, metricAggregate);
export const getLatestMetrics = () => fetchJson<MetricPoint[]>('/metrics/latest', undefined, latestMetrics);
export const getAlertRules = () => fetchJson<AlertRule[]>('/alerts', undefined, alertRules);
export const getAlertEvents = () => fetchJson<AlertEvent[]>('/alerts/events', undefined, alertEvents);
export const getLogs = () => fetchJson<LogEntry[]>('/logs', undefined, logs);
export const getTraces = () => fetchJson<TraceSpan[]>('/traces', undefined, traces);
export const getTraceTree = (traceId: string) => fetchJson<TraceTree>(`/traces/${traceId}`, undefined, traceTree);
export const getSimulationScenarios = () => fetchJson<SimulationScenario[]>('/simulator/scenarios', undefined, simulationScenarios);
export const runSimulation = (scenarioId: string, inputs: Record<string, number>) =>
  fetchJson<SimulationRun>('/simulator/runs', { method: 'POST', body: JSON.stringify({ scenario_id: scenarioId, inputs }) }, simulationRun);
