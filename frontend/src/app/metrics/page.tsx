'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/app-shell';
import { MetricChart } from '@/components/metric-chart';
import { SectionCard } from '@/components/section-card';
import { getLatestMetrics, getMetricAggregate } from '@/lib/api';
import type { MetricAggregateResponse, MetricPoint } from '@/lib/types';

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricAggregateResponse | null>(null);
  const [latest, setLatest] = useState<MetricPoint[]>([]);

  useEffect(() => {
    getMetricAggregate().then(setMetrics);
    getLatestMetrics().then(setLatest);
  }, []);

  return (
    <AppShell>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Metrics explorer" subtitle="Analyze latency distributions, throughput, and recent spikes with time-series rollups.">
          {metrics ? <MetricChart data={metrics.buckets} dataKey="p95" color="#f97316" /> : null}
        </SectionCard>
        <SectionCard title="Latest samples" subtitle="Newest points in the time-series ingest path.">
          <div className="space-y-3">
            {latest.map((point) => (
              <article key={point.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white">{point.metric_name}</p>
                  <p className="font-mono text-signal">{point.value}</p>
                </div>
                <p className="mt-2 text-xs text-subtle">{new Date(point.recorded_at).toLocaleString()}</p>
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
