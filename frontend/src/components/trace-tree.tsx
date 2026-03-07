import type { Service, TraceTreeNode } from '@/lib/types';

function TraceNodeItem({ node, services, bottleneck }: { node: TraceTreeNode; services: Service[]; bottleneck: string }) {
  const serviceName = services.find((service) => service.id === node.service_id)?.name ?? node.service_id;

  return (
    <div className="ml-4 border-l border-white/10 pl-4 first:ml-0 first:border-l-0 first:pl-0">
      <div className={`rounded-2xl border p-4 ${node.span_id === bottleneck ? 'border-ember/30 bg-ember/10' : 'border-white/10 bg-white/[0.03]'}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-white">{node.operation}</p>
            <p className="mt-1 text-sm text-subtle">{serviceName}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg text-signal">{node.duration_ms}ms</p>
            <p className="text-xs text-subtle">HTTP {node.status_code}</p>
          </div>
        </div>
      </div>
      {node.children.length ? (
        <div className="mt-4 space-y-4">
          {node.children.map((child) => (
            <TraceNodeItem key={child.span_id} node={child} services={services} bottleneck={bottleneck} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function TraceTreeView({ roots, services, bottleneck }: { roots: TraceTreeNode[]; services: Service[]; bottleneck: string }) {
  return (
    <div className="space-y-4">
      {roots.map((root) => (
        <TraceNodeItem key={root.span_id} node={root} services={services} bottleneck={bottleneck} />
      ))}
    </div>
  );
}
