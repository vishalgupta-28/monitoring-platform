import clsx from 'clsx';

import type { Service } from '@/lib/types';

export function ServiceTable({ services }: { services: Service[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.22em] text-subtle">
          <tr>
            <th className="pb-4">Service</th>
            <th className="pb-4">Type</th>
            <th className="pb-4">Environment</th>
            <th className="pb-4">Status</th>
            <th className="pb-4">Tags</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
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
              <td className="py-4 text-subtle">{Object.entries(service.tags).map(([key, value]) => `${key}:${value}`).join(' | ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
