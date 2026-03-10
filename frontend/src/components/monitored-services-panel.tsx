import clsx from 'clsx';

import type { Service } from '@/lib/types';

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export function MonitoredServicesPanel({ services }: { services: Service[] }) {
  return (
    <div className="space-y-3">
      {services.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-subtle">
          No monitored URLs yet. Add one from the Services page and it will appear here.
        </div>
      ) : null}
      {services.map((service) => (
        <article key={service.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">{service.name}</p>
              <p className="mt-1 font-mono text-xs text-subtle break-all">{service.base_url}</p>
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
          <div className="mt-4 grid gap-2 text-xs text-subtle sm:grid-cols-2">
            <p>Type: <span className="text-white">{service.service_type}</span></p>
            <p>Environment: <span className="text-white">{service.environment}</span></p>
            <p>Monitor mode: <span className="text-white">{isExternalUrl(service.base_url) ? 'External health check' : 'Internal service probe'}</span></p>
            <p>Shows up in: <span className="text-white">Dashboard, Metrics, Alerts</span></p>
          </div>
        </article>
      ))}
    </div>
  );
}
