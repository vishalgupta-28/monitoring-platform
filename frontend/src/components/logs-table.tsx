import type { LogEntry, Service } from '@/lib/types';

export function LogsTable({ logs, services }: { logs: LogEntry[]; services: Service[] }) {
  const serviceFor = (serviceId: string) => services.find((item) => item.id === serviceId);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.22em] text-subtle">
          <tr>
            <th className="pb-4">Time</th>
            <th className="pb-4">Service</th>
            <th className="pb-4">URL</th>
            <th className="pb-4">Level</th>
            <th className="pb-4">Message</th>
            <th className="pb-4">Trace</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((entry) => {
            const service = serviceFor(entry.service_id);
            const targetUrl = entry.attributes?.target_url ?? service?.base_url ?? 'n/a';
            return (
              <tr key={entry.id} className="border-t border-white/8 align-top">
                <td className="py-4 font-mono text-xs text-subtle">{new Date(entry.recorded_at).toLocaleString()}</td>
                <td className="py-4 text-white">{service?.name ?? entry.service_id}</td>
                <td className="py-4 break-all font-mono text-xs text-subtle">{targetUrl}</td>
                <td className="py-4">
                  <span className="rounded-full bg-white/5 px-3 py-1 font-mono text-xs">{entry.level}</span>
                </td>
                <td className="py-4 text-subtle">{entry.message}</td>
                <td className="py-4 font-mono text-xs text-signal">{entry.trace_id ?? 'n/a'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
