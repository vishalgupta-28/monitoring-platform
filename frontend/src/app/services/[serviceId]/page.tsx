'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Trash2 } from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { MetricChart } from '@/components/metric-chart';
import { SectionCard } from '@/components/section-card';
import { deleteService, getLatestMetrics, getMetricAggregate, getService } from '@/lib/api';
import type { MetricAggregateResponse, MetricPoint, Service } from '@/lib/types';

export default function ServiceDetailsPage() {
  const params = useParams<{ serviceId: string }>();
  const router = useRouter();
  const serviceId = params.serviceId;
  const [service, setService] = useState<Service | null>(null);
  const [metrics, setMetrics] = useState<MetricAggregateResponse | null>(null);
  const [latest, setLatest] = useState<MetricPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [serviceResponse, metricsResponse, latestResponse] = await Promise.all([
        getService(serviceId),
        getMetricAggregate(serviceId),
        getLatestMetrics(serviceId),
      ]);

      if (!serviceResponse) {
        setError('This monitored URL could not be found. It may have been deleted.');
        return;
      }

      setService(serviceResponse);
      setMetrics(metricsResponse);
      setLatest(latestResponse);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load service results right now.');
    }
  }, [serviceId]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [load]);

  async function handleDelete() {
    if (!service || !window.confirm(`Stop monitoring ${service.name}?`)) {
      return;
    }

    await deleteService(service.id);
    router.push('/services');
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <SectionCard
          title={service ? service.name : 'Service results'}
          subtitle={service ? `Monitoring output for ${service.base_url}` : 'Loading monitored URL details...'}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-subtle transition hover:border-signal/50 hover:text-white"
              >
                <ArrowLeft size={16} />
                Back to services
              </Link>
              {service ? (
                <a
                  href={service.base_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-subtle transition hover:border-signal/50 hover:text-white"
                >
                  <ExternalLink size={16} />
                  Open URL
                </a>
              ) : null}
              {service ? (
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-subtle transition hover:border-ember/40 hover:text-white"
                >
                  <Trash2 size={16} />
                  Delete monitor
                </button>
              ) : null}
            </div>
          }
        >
          {error ? <p className="rounded-2xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
          {service ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-subtle">Status</p>
                <p className="mt-4 text-2xl font-semibold text-white">{service.status}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-subtle">Type</p>
                <p className="mt-4 text-2xl font-semibold text-white">{service.service_type}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-subtle">Environment</p>
                <p className="mt-4 text-2xl font-semibold text-white">{service.environment}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-subtle">Last checked</p>
                <p className="mt-4 text-sm font-medium text-white">{latest[0] ? new Date(latest[0].recorded_at).toLocaleString() : 'Waiting for first probe'}</p>
              </div>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard title="Latency result" subtitle="This is where the output for a pasted URL shows up after the collector probes it.">
          {metrics ? <MetricChart data={metrics.buckets} /> : <p className="text-sm text-subtle">Waiting for metrics...</p>}
        </SectionCard>

        <SectionCard
          title="Latest checks"
          subtitle="Each row is a recent probe or metric sample for this monitored URL. External public URLs usually show reachability and latency, not private internal logs."
        >
          <div className="space-y-3">
            {latest.length === 0 ? <p className="text-sm text-subtle">No checks recorded yet. The collector should add the first sample shortly.</p> : null}
            {latest.map((point) => (
              <div key={point.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{point.metric_name}</p>
                    <p className="mt-1 text-xs text-subtle">{new Date(point.recorded_at).toLocaleString()}</p>
                  </div>
                  <p className="font-mono text-signal">{Math.round(point.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

