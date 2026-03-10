import { alertEvents, alertRules, latestMetrics, logs, metricAggregate, services, simulationRun, simulationScenarios, traceTree, traces } from '@/lib/mock-data';
import type {
  AlertEvent,
  AlertRule,
  AlertRulePayload,
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

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/v1').replace(/\/$/, '');
const TOKEN_KEY = 'pulseboard-token';
const USER_KEY = 'pulseboard-user';
const LOCAL_SERVICES_KEY = 'pulseboard-local-services';

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

function toAppError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error;
  }
  return new Error('Something went wrong while talking to the monitoring API.');
}

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

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }
    if (error instanceof TypeError) {
      throw new Error(`Failed to reach the monitoring API at ${API_BASE_URL}. Check that the backend URL is correct and running.`);
    }
    throw toAppError(error);
  }
}

function persistSession(accessToken: string, user: User) {
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function buildFallbackService(payload: ServiceCreatePayload): Service {
  const user = getStoredUser();
  return {
    id: `local-${crypto.randomUUID()}`,
    created_at: new Date().toISOString(),
    created_by: user?.id,
    ...payload,
  };
}

function getLocalServices(): Service[] {
  if (typeof window === 'undefined') {
    return [];
  }
  const raw = window.localStorage.getItem(LOCAL_SERVICES_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as Service[];
  } catch {
    return [];
  }
}

function setLocalServices(items: Service[]) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(LOCAL_SERVICES_KEY, JSON.stringify(items));
}

function mergeServices(primary: Service[], secondary: Service[]): Service[] {
  const map = new Map<string, Service>();
  [...secondary, ...primary].forEach((service) => {
    map.set(service.id, service);
  });
  return Array.from(map.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
  const response = await fetchJson<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  persistSession(response.access_token, response.user);
  return response;
}

export async function register(payload: RegisterPayload) {
  const user = await fetchJson<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ...payload, role: payload.role ?? 'operator' }),
  });
  return login({ email: user.email, password: payload.password });
}

export const getMe = () => fetchJson<User | null>('/auth/me', undefined, getStoredUser());
export const getServices = async () => {
  const fallback = mergeServices(getLocalServices(), services);
  const fetched = await fetchJson<Service[]>('/services', undefined, fallback);
  const merged = mergeServices(fetched, getLocalServices());
  setLocalServices(merged.filter((service) => service.id.startsWith('local-')));
  return merged;
};
export const getService = async (serviceId: string) => {
  const local = getLocalServices().find((service) => service.id === serviceId);
  return fetchJson<Service | undefined>(`/services/${serviceId}`, undefined, local);
};
export const createService = async (payload: ServiceCreatePayload) => {
  const fallback = buildFallbackService(payload);
  const created = await fetchJson<Service>('/services', { method: 'POST', body: JSON.stringify(payload) }, fallback);
  const local = getLocalServices();
  if (created.id.startsWith('local-')) {
    setLocalServices(mergeServices([created], local));
  }
  return created;
};
export const deleteService = async (serviceId: string) => {
  const local = getLocalServices();
  const next = local.filter((service) => service.id !== serviceId);
  if (serviceId.startsWith('local-')) {
    setLocalServices(next);
    return;
  }
  await fetchJson<void>(`/services/${serviceId}`, { method: 'DELETE' });
  setLocalServices(next);
};
export const getMetricAggregate = (serviceId?: string) => {
  const base = `/metrics?metric_name=latency_ms&interval=5%20minutes${serviceId ? `&service_id=${serviceId}` : ''}`;
  return fetchJson<MetricAggregateResponse>(base, undefined, metricAggregate);
};
export const getLatestMetrics = (serviceId?: string) => fetchJson<MetricPoint[]>(`/metrics/latest${serviceId ? `?service_id=${serviceId}` : ''}`, undefined, latestMetrics);
export const getAlertRules = () => fetchJson<AlertRule[]>('/alerts', undefined, alertRules);
export const createAlertRule = (payload: AlertRulePayload) => fetchJson<AlertRule>('/alerts', { method: 'POST', body: JSON.stringify(payload) });
export const updateAlertRule = (ruleId: string, payload: Partial<AlertRulePayload>) => fetchJson<AlertRule>(`/alerts/${ruleId}`, { method: 'PATCH', body: JSON.stringify(payload) });
export const deleteAlertRule = (ruleId: string) => fetchJson<void>(`/alerts/${ruleId}`, { method: 'DELETE' });
export const getAlertEvents = () => fetchJson<AlertEvent[]>('/alerts/events', undefined, alertEvents);
export const resolveAlertEvent = (ruleId: string) => fetchJson<AlertEvent>(`/alerts/${ruleId}/resolve`, { method: 'POST' });
export const getLogs = () => fetchJson<LogEntry[]>('/logs', undefined, logs);
export const getTraces = () => fetchJson<TraceSpan[]>('/traces', undefined, traces);
export const getTraceTree = (traceId: string) => fetchJson<TraceTree>(`/traces/${traceId}`, undefined, traceTree);
export const getSimulationScenarios = () => fetchJson<SimulationScenario[]>('/simulator/scenarios', undefined, simulationScenarios);
export const runSimulation = (scenarioId: string, inputs: Record<string, number>) =>
  fetchJson<SimulationRun>('/simulator/runs', { method: 'POST', body: JSON.stringify({ scenario_id: scenarioId, inputs }) }, simulationRun);
