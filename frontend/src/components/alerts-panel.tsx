import type { AlertEvent, AlertRule, Service } from '@/lib/types';

export function AlertsPanel({ rules, events, services }: { rules: AlertRule[]; events: AlertEvent[]; services: Service[] }) {
  const serviceName = (serviceId: string) => services.find((service) => service.id === serviceId)?.name ?? serviceId;

  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        {rules.map((rule) => (
          <article key={rule.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-medium text-white">{rule.name}</p>
            <p className="mt-1 text-sm text-subtle">{serviceName(rule.service_id)}</p>
            <p className="mt-3 font-mono text-sm text-signal">
              {rule.metric_name} {rule.comparison} {rule.threshold}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-subtle">{rule.channels.join(' • ')}</p>
          </article>
        ))}
      </div>
      <div className="space-y-4">
        {events.map((event) => (
          <article key={event.id} className="rounded-3xl border border-ember/20 bg-ember/8 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-white">{serviceName(event.service_id)}</p>
              <span className="rounded-full bg-ember/15 px-3 py-1 text-xs font-medium text-ember">{event.status}</span>
            </div>
            <p className="mt-3 text-sm text-white">{event.message}</p>
            <p className="mt-2 font-mono text-xs text-subtle">{new Date(event.triggered_at).toLocaleString()}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
