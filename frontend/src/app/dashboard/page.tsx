'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/app-shell';
import { LiveFeed } from '@/components/live-feed';
import { MetricChart } from '@/components/metric-chart';
import { MonitoredServicesPanel } from '@/components/monitored-services-panel';
import { SectionCard } from '@/components/section-card';
import { StatCard } from '@/components/stat-card';
import { TraceTreeView } from '@/components/trace-tree';
import { getAlertEvents, getLatestMetrics, getMetricAggregate, getServices, getTraceTree } from '@/lib/api';
import type { AlertEvent, MetricAggregateResponse, MetricPoint, Service, TraceTree } from '@/lib/types';

export default function DashboardPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [metrics, setMetrics] = useState<MetricAggregateResponse | null>(null);
  const [latest, setLatest] = useState<MetricPoint[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [trace, setTrace] = useState<TraceTree | null>(null);

  useEffect(() => {
    Promise.all([getServices(), getMetricAggregate(), getLatestMetrics(), getAlertEvents(), getTraceTree('b01c0fda-3fa6-4fd0-8d14-b4b1b4d60001')]).then(
      ([servicesResponse, metricsResponse, latestResponse, eventsResponse, traceResponse]) => {
        setServices(servicesResponse);
        setMetrics(metricsResponse);
        setLatest(latestResponse);
        setEvents(eventsResponse);
        setTrace(traceResponse);
      },
    );
  }, []);

  return (
    <AppShell>
      <div className="grid gap-4 xl:grid-cols-[1.6fr_0.4fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Services monitored" value={`${services.length || 18}`} delta="+3 this week" tone="signal" />
            <StatCard title="P95 latency" value="186ms" delta="-12ms" tone="lime" />
            <StatCard title="Error budget burn" value="2.4%" delta="spike" tone="ember" />
            <StatCard title="Uptime" value="99.97%" delta="30d" tone="signal" />
          </div>
          <SectionCard
            title="Monitored URLs"
            subtitle="When you add a public URL like instagram.com, the collector probes it and the health result appears here first. External URLs give reachability and latency, not private internal logs or traces."
          >
            <MonitoredServicesPanel services={services} />
          </SectionCard>
          <SectionCard title="Latency overview" subtitle="Kafka-streamed service latency aggregated by minute.">
            {metrics ? <MetricChart data={metrics.buckets} /> : <p className="text-sm text-subtle">Loading chart...</p>}
          </SectionCard>
          <SectionCard title="Distributed trace" subtitle="Cross-service request breakdown with bottleneck highlighting.">
            {trace ? <TraceTreeView roots={trace.roots} services={services} bottleneck={trace.bottleneck_span_id} /> : null}
          </SectionCard>
        </div>
        <div className="space-y-4">
          <SectionCard title="Live stream" subtitle="WebSocket feed for metric, alert, and log events.">
            <LiveFeed />
          </SectionCard>
          <SectionCard title="Latest metrics" subtitle="Freshly ingested metric points from the hot path.">
            <div className="space-y-3">
              {latest.map((point) => (
                <div key={point.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-white">{point.metric_name}</p>
                    <p className="font-mono text-signal">{point.value}</p>
                  </div>
                  <p className="mt-2 text-xs text-subtle">{point.service_id}</p>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Alert pressure" subtitle="Open incidents that need operator attention.">
            <div className="space-y-3">
              {events.map((event) => (
                <article key={event.id} className="rounded-2xl border border-ember/20 bg-ember/8 p-4">
                  <p className="text-sm text-white">{event.message}</p>
                  <p className="mt-2 text-xs text-subtle">{new Date(event.triggered_at).toLocaleString()}</p>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
