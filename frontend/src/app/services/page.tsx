'use client';

import { useCallback, useEffect, useState } from 'react';

import { AppShell } from '@/components/app-shell';
import { SectionCard } from '@/components/section-card';
import { ServiceTable } from '@/components/service-table';
import { TraceTreeView } from '@/components/trace-tree';
import { UrlMonitorForm } from '@/components/url-monitor-form';
import { createService, deleteService, getLatestMetrics, getServices, getTraceTree } from '@/lib/api';
import type { MetricPoint, Service, ServiceCreatePayload, TraceTree } from '@/lib/types';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<MetricPoint[]>([]);
  const [trace, setTrace] = useState<TraceTree | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    try {
      const [servicesResponse, latestResponse] = await Promise.all([getServices(), getLatestMetrics()]);
      setServices(servicesResponse);
      setLatestMetrics(latestResponse);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load monitored services right now.');
    }
  }, []);

  useEffect(() => {
    void loadServices();
    getTraceTree('b01c0fda-3fa6-4fd0-8d14-b4b1b4d60001').then(setTrace).catch(() => setTrace(null));

    const interval = window.setInterval(() => {
      void loadServices();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loadServices]);

  async function handleServiceCreate(payload: ServiceCreatePayload) {
    try {
      const created = await createService(payload);
      setServices((current) => [created, ...current.filter((item) => item.id !== created.id)]);
      setError(null);
      await loadServices();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create monitor right now.');
      throw caught;
    }
  }

  async function handleServiceDelete(service: Service) {
    if (!window.confirm(`Stop monitoring ${service.name}?`)) {
      return;
    }

    try {
      await deleteService(service.id);
      setServices((current) => current.filter((item) => item.id !== service.id));
      setLatestMetrics((current) => current.filter((item) => item.service_id !== service.id));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not delete this monitor right now.');
    }
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <SectionCard
          title="Add a website to monitor"
          subtitle="Paste any public URL. The platform will register it as a service and the collector will start probing it automatically."
        >
          <UrlMonitorForm services={services} onCreated={handleServiceCreate} />
        </SectionCard>
        <SectionCard
          title="Service inventory"
          subtitle="Registered APIs, databases, and microservices with environment, health, and last-check metadata."
        >
          {error ? <p className="mb-4 rounded-2xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
          <ServiceTable services={services} latestMetrics={latestMetrics} onDelete={handleServiceDelete} />
        </SectionCard>
        <SectionCard title="Trace bottleneck explorer" subtitle="Inspect a cross-service request path to identify hot spans.">
          {trace ? <TraceTreeView roots={trace.roots} services={services} bottleneck={trace.bottleneck_span_id} /> : null}
        </SectionCard>
      </div>
    </AppShell>
  );
}
