import Link from 'next/link';
import clsx from 'clsx';

import type { MetricPoint, Service } from '@/lib/types';

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function buildLatestMetricMap(points: MetricPoint[]) {
  const map = new Map<string, MetricPoint>();
  points.forEach((point) => {
    const current = map.get(point.service_id);
    if (!current || new Date(current.recorded_at).getTime() < new Date(point.recorded_at).getTime()) {
      map.set(point.service_id, point);
    }
  });
  return map;
}

export function MonitoredServicesPanel({ services, latestMetrics }: { services: Service[]; latestMetrics: MetricPoint[] }) {
  const latestByService = buildLatestMetricMap(latestMetrics);

  return (
    <div className="space-y-3">
      {services.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-subtle">
          No monitored URLs yet. Add one from the Services page and it will appear here.
        </div>
      ) : null}
      {services.map((service) => {
        const latestPoint = latestByService.get(service.id);
        return (
          <article key={service.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">{service.name}</p>
                <p className="mt-1 break-all font-mono text-xs text-subtle">{service.base_url}</p>
              </div>
              <span
                className={clsx('rounded-full px-3 py-1 text-xs font-medium', {
                  'bg-lime/15 text-lime': service.status === 'healthy',
                  'bg-ember/15 text-ember': service.status !== 'healthy',
                })}
              >
                {service.status}
              </span>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-subtle sm:grid-cols-2 lg:grid-cols-3">
              <p>
                Type: <span className="text-white">{service.service_type}</span>
              </p>
              <p>
                Environment: <span className="text-white">{service.environment}</span>
              </p>
              <p>
                Monitor mode: <span className="text-white">{isExternalUrl(service.base_url) ? 'External health check' : 'Internal service probe'}</span>
              </p>
              <p>
                Last checked: <span className="text-white">{latestPoint ? new Date(latestPoint.recorded_at).toLocaleString() : 'Waiting for first probe'}</span>
              </p>
              <p>
                Latest sample: <span className="text-white">{latestPoint ? `${Math.round(latestPoint.value)} (${latestPoint.metric_name})` : 'Pending'}</span>
              </p>
              <p>
                Result view: <Link href={`/services/${service.id}`} className="text-signal hover:text-white">Open service details</Link>
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

