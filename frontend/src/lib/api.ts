import { alertEvents, alertRules, currentUser, latestMetrics, logs, metricAggregate, services, simulationRun, simulationScenarios, traceTree, traces } from '@/lib/mock-data';
import type {
  AlertEvent,
  AlertRule,
  LogEntry,
  MetricAggregateResponse,
  MetricPoint,
  Service,
  ServiceCreatePayload,
  SimulationRun,
  SimulationScenario,
  TraceSpan,
  TraceTree,
  User,
} from '@/lib/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'pulseboard-token';
const USER_KEY = 'pulseboard-user';

type AuthResponse = {
  access_token: string;
  user: User;
};

type RegisterPayload = {
  email: string;
  full_name: string;
  password: string;
  role?: 'viewer' | 'operator' | 'admin';
};

async function fetchJson<T>(path: string, init?: RequestInit, fallback?: T): Promise<T> {
  try {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;
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
      const detail = await response.text();
      throw new Error(detail || `Request failed with ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}

function persistSession(accessToken: string, user: User) {
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function buildFallbackService(payload: ServiceCreatePayload): Service {
  return {
    id: `local-${crypto.randomUUID()}`,
    created_at: new Date().toISOString(),
    ...payload,
  };
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export async function login(payload: { email: string; password: string }) {
  try {
    const response = await fetchJson<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    persistSession(response.access_token, response.user);
    return response;
  } catch {
    if (payload.email === 'admin@pulseboard.dev' && payload.password === 'admin123') {
      persistSession('demo-token', currentUser);
      return { access_token: 'demo-token', user: currentUser };
    }
    throw new Error('Invalid credentials');
  }
}

export async function register(payload: RegisterPayload) {
  await fetchJson<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ...payload, role: payload.role ?? 'operator' }),
  });
  return login({ email: payload.email, password: payload.password });
}

export const getMe = () => fetchJson<User>('/auth/me', undefined, getStoredUser() ?? currentUser);
export const getServices = () => fetchJson<Service[]>('/services', undefined, services);
export const createService = (payload: ServiceCreatePayload) => fetchJson<Service>('/services', { method: 'POST', body: JSON.stringify(payload) }, buildFallbackService(payload));
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
