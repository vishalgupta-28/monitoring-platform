'use client';

import { useCallback, useEffect, useState } from 'react';

import { AlertsPanel } from '@/components/alerts-panel';
import { AppShell } from '@/components/app-shell';
import { SectionCard } from '@/components/section-card';
import { createAlertRule, deleteAlertRule, getAlertEvents, getAlertRules, getServices, resolveAlertEvent, updateAlertRule } from '@/lib/api';
import type { AlertEvent, AlertRule, AlertRulePayload, Service } from '@/lib/types';

export default function AlertsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [servicesResponse, rulesResponse, eventsResponse] = await Promise.all([getServices(), getAlertRules(), getAlertEvents()]);
      setServices(servicesResponse);
      setRules(rulesResponse);
      setEvents(eventsResponse);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load alerts right now.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(payload: AlertRulePayload) {
    const rule = await createAlertRule(payload);
    setRules((current) => [rule, ...current.filter((item) => item.id !== rule.id)]);
  }

  async function handleUpdate(ruleId: string, payload: Partial<AlertRulePayload>) {
    const rule = await updateAlertRule(ruleId, payload);
    setRules((current) => current.map((item) => (item.id === rule.id ? rule : item)));
  }

  async function handleDelete(ruleId: string) {
    if (!window.confirm('Delete this alert rule?')) {
      return;
    }
    try {
      await deleteAlertRule(ruleId);
      setRules((current) => current.filter((item) => item.id !== ruleId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete this alert rule.');
    }
  }

  async function handleResolve(ruleId: string) {
    try {
      const resolved = await resolveAlertEvent(ruleId);
      setEvents((current) => current.map((item) => (item.id === resolved.id ? resolved : item)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not resolve this alert event.');
    }
  }

  return (
    <AppShell>
      <SectionCard title="Alerts manager" subtitle="Threshold policies, escalation channels, and active incidents for each monitored URL.">
        {error ? <p className="mb-4 rounded-2xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
        <AlertsPanel
          rules={rules}
          events={events}
          services={services}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onResolve={handleResolve}
        />
      </SectionCard>
    </AppShell>
  );
}
