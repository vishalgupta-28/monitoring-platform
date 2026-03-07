'use client';

import { useEffect, useState } from 'react';

import { AlertsPanel } from '@/components/alerts-panel';
import { AppShell } from '@/components/app-shell';
import { SectionCard } from '@/components/section-card';
import { getAlertEvents, getAlertRules, getServices } from '@/lib/api';
import type { AlertEvent, AlertRule, Service } from '@/lib/types';

export default function AlertsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([]);

  useEffect(() => {
    getServices().then(setServices);
    getAlertRules().then(setRules);
    getAlertEvents().then(setEvents);
  }, []);

  return (
    <AppShell>
      <SectionCard title="Alerts manager" subtitle="Threshold policies, escalation channels, and active incidents.">
        <AlertsPanel rules={rules} events={events} services={services} />
      </SectionCard>
    </AppShell>
  );
}
