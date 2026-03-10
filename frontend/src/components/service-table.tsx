import Link from 'next/link';
import clsx from 'clsx';
import { ExternalLink, Trash2 } from 'lucide-react';

import type { MetricPoint, Service } from '@/lib/types';

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

export function ServiceTable({
  services,
  latestMetrics,
  onDelete,
}: {
  services: Service[];
  latestMetrics: MetricPoint[];
  onDelete?: (service: Service) => Promise<void>;
}) {
  const latestByService = buildLatestMetricMap(latestMetrics);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.22em] text-subtle">
          <tr>
            <th className="pb-4">Service</th>
            <th className="pb-4">Type</th>
            <th className="pb-4">Environment</th>
            <th className="pb-4">Status</th>
            <th className="pb-4">Last checked</th>
            <th className="pb-4">Tags</th>
            <th className="pb-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => {
            const latestPoint = latestByService.get(service.id);
            return (
              <tr key={service.id} className="border-t border-white/8">
                <td className="py-4">
                  <p className="font-medium text-white">{service.name}</p>
                  <p className="font-mono text-xs text-subtle">{service.base_url}</p>
                </td>
                <td className="py-4 text-subtle">{service.service_type}</td>
                <td className="py-4 text-subtle">{service.environment}</td>
                <td className="py-4">
                  <span
                    className={clsx('rounded-full px-3 py-1 text-xs font-medium', {
                      'bg-lime/15 text-lime': service.status === 'healthy',
                      'bg-ember/15 text-ember': service.status !== 'healthy',
                    })}
                  >
                    {service.status}
                  </span>
                </td>
                <td className="py-4 text-subtle">
                  {latestPoint ? new Date(latestPoint.recorded_at).toLocaleString() : 'Waiting for first probe'}
                </td>
                <td className="py-4 text-subtle">{Object.entries(service.tags).map(([key, value]) => `${key}:${value}`).join(' | ')}</td>
                <td className="py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/services/${service.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-subtle transition hover:border-signal/50 hover:text-white"
                    >
                      <ExternalLink size={14} />
                      Results
                    </Link>
                    {onDelete ? (
                      <button
                        type="button"
                        onClick={() => void onDelete(service)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-subtle transition hover:border-ember/40 hover:text-white"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
