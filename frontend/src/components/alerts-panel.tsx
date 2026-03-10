'use client';

import { useEffect, useState } from 'react';
import { Pencil, Trash2, CheckCircle2 } from 'lucide-react';

import type { AlertEvent, AlertRule, AlertRulePayload, Service } from '@/lib/types';

const metricOptions = [
  { value: 'latency_ms', label: 'Latency (ms)' },
  { value: 'error_rate', label: 'Error rate (%)' },
  { value: 'cpu_usage', label: 'CPU usage (%)' },
  { value: 'memory_usage', label: 'Memory usage (%)' },
  { value: 'rps', label: 'Requests per second' },
];

const comparisonOptions = [
  { value: 'gt', label: 'Greater than' },
  { value: 'gte', label: 'Greater than or equal' },
  { value: 'lt', label: 'Less than' },
  { value: 'lte', label: 'Less than or equal' },
];

const severityOptions = ['warning', 'critical'];
const channelOptions = ['email', 'slack', 'webhook'];

function defaultPayload(serviceId: string): AlertRulePayload {
  return {
    service_id: serviceId,
    name: '',
    metric_name: 'latency_ms',
    comparison: 'gt',
    threshold: 500,
    window_seconds: 300,
    severity: 'warning',
    channels: ['email'],
    is_active: true,
  };
}

export function AlertsPanel({
  rules,
  events,
  services,
  onCreate,
  onUpdate,
  onDelete,
  onResolve,
}: {
  rules: AlertRule[];
  events: AlertEvent[];
  services: Service[];
  onCreate: (payload: AlertRulePayload) => Promise<void>;
  onUpdate: (ruleId: string, payload: Partial<AlertRulePayload>) => Promise<void>;
  onDelete: (ruleId: string) => Promise<void>;
  onResolve: (ruleId: string) => Promise<void>;
}) {
  const firstServiceId = services[0]?.id ?? '';
  const [draft, setDraft] = useState<AlertRulePayload>(() => defaultPayload(firstServiceId));
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft.service_id && firstServiceId) {
      setDraft((current) => ({ ...current, service_id: firstServiceId }));
    }
  }, [draft.service_id, firstServiceId]);

  const serviceFor = (serviceId: string) => services.find((service) => service.id === serviceId);

  function applyRuleToDraft(rule: AlertRule) {
    setDraft({
      service_id: rule.service_id,
      name: rule.name,
      metric_name: rule.metric_name,
      comparison: rule.comparison,
      threshold: rule.threshold,
      window_seconds: rule.window_seconds ?? 300,
      severity: rule.severity,
      channels: rule.channels,
      is_active: rule.is_active ?? true,
    });
    setEditingRuleId(rule.id);
    setError(null);
  }

  function resetDraft() {
    setDraft(defaultPayload(firstServiceId));
    setEditingRuleId(null);
    setError(null);
  }

  async function submitRule() {
    if (!draft.service_id || !draft.name.trim()) {
      setError('Choose a service and enter a rule name.');
      return;
    }

    if (draft.channels.length === 0) {
      setError('Select at least one delivery channel.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (editingRuleId) {
        await onUpdate(editingRuleId, draft);
      } else {
        await onCreate(draft);
      }
      resetDraft();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save this alert rule.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-subtle">Rule builder</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">Create or edit an alert without Postman</h3>
        <p className="mt-2 text-sm text-subtle">Pick the monitored URL, decide which metric matters, and choose when the platform should warn you.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm text-subtle">Service / URL</span>
            <select value={draft.service_id} onChange={(event) => setDraft((current) => ({ ...current, service_id: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3 outline-none">
              {services.map((service) => (
                <option key={service.id} value={service.id}>{service.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-subtle">Rule name</span>
            <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" placeholder="Instagram latency above 500ms" />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-subtle">Metric</span>
            <select value={draft.metric_name} onChange={(event) => setDraft((current) => ({ ...current, metric_name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3 outline-none">
              {metricOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-subtle">Comparison</span>
            <select value={draft.comparison} onChange={(event) => setDraft((current) => ({ ...current, comparison: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3 outline-none">
              {comparisonOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-subtle">Threshold</span>
            <input type="number" value={draft.threshold} onChange={(event) => setDraft((current) => ({ ...current, threshold: Number(event.target.value) }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-subtle">Window seconds</span>
            <input type="number" value={draft.window_seconds} onChange={(event) => setDraft((current) => ({ ...current, window_seconds: Number(event.target.value) }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-subtle">Severity</span>
            <select value={draft.severity} onChange={(event) => setDraft((current) => ({ ...current, severity: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3 outline-none">
              {severityOptions.map((severity) => (
                <option key={severity} value={severity}>{severity}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-subtle">Channels</span>
            <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
              {channelOptions.map((channel) => {
                const active = draft.channels.includes(channel);
                return (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => {
                      setDraft((current) => ({
                        ...current,
                        channels: active ? current.channels.filter((item) => item !== channel) : [...current.channels, channel],
                      }));
                    }}
                    className={`rounded-full px-3 py-2 text-xs transition ${active ? 'bg-signal text-ink' : 'bg-white/5 text-subtle hover:text-white'}`}
                  >
                    {channel}
                  </button>
                );
              })}
            </div>
          </label>
        </div>
        {error ? <p className="mt-4 rounded-2xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={() => void submitRule()} disabled={busy} className="rounded-full bg-signal px-5 py-3 font-medium text-ink transition hover:brightness-110 disabled:opacity-70">
            {busy ? 'Saving...' : editingRuleId ? 'Update rule' : 'Create rule'}
          </button>
          {editingRuleId ? (
            <button type="button" onClick={resetDraft} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-subtle transition hover:text-white">
              Cancel edit
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-4">
          {rules.map((rule) => {
            const service = serviceFor(rule.service_id);
            return (
              <article key={rule.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{rule.name}</p>
                    <p className="mt-1 text-sm text-subtle">{service?.name ?? rule.service_id}</p>
                    <p className="mt-1 break-all font-mono text-xs text-subtle">{service?.base_url ?? 'No URL available'}</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-subtle">{rule.severity}</span>
                </div>
                <p className="mt-3 font-mono text-sm text-signal">
                  {rule.metric_name} {rule.comparison} {rule.threshold}
                </p>
                <p className="mt-2 text-xs text-subtle">Window: {rule.window_seconds ?? 300}s | Channels: {rule.channels.join(', ')}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => applyRuleToDraft(rule)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-subtle transition hover:text-white">
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button type="button" onClick={() => void onDelete(rule.id)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-subtle transition hover:border-ember/40 hover:text-white">
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <div className="space-y-4">
          {events.map((event) => {
            const service = serviceFor(event.service_id);
            return (
              <article key={event.id} className="rounded-3xl border border-ember/20 bg-ember/8 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{service?.name ?? event.service_id}</p>
                    <p className="mt-1 break-all font-mono text-xs text-subtle">{service?.base_url ?? 'No URL available'}</p>
                  </div>
                  <span className="rounded-full bg-ember/15 px-3 py-1 text-xs font-medium text-ember">{event.status}</span>
                </div>
                <p className="mt-3 text-sm text-white">{event.message}</p>
                <p className="mt-2 text-xs text-subtle">Metric: {event.metric_name} | Current value: {event.current_value}</p>
                <p className="mt-2 font-mono text-xs text-subtle">{new Date(event.triggered_at).toLocaleString()}</p>
                {event.status === 'open' ? (
                  <button type="button" onClick={() => void onResolve(event.rule_id)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-lime/15 px-3 py-2 text-xs font-medium text-lime transition hover:bg-lime/20">
                    <CheckCircle2 size={14} />
                    Mark resolved
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
