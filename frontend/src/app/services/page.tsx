'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/app-shell';
import { SectionCard } from '@/components/section-card';
import { ServiceTable } from '@/components/service-table';
import { getServices, getTraceTree } from '@/lib/api';
import type { Service, TraceTree } from '@/lib/types';
import { TraceTreeView } from '@/components/trace-tree';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [trace, setTrace] = useState<TraceTree | null>(null);

  useEffect(() => {
    getServices().then(setServices);
    getTraceTree('b01c0fda-3fa6-4fd0-8d14-b4b1b4d60001').then(setTrace);
  }, []);

  return (
    <AppShell>
      <div className="space-y-4">
        <SectionCard title="Service inventory" subtitle="Registered APIs, databases, and microservices with environment and health metadata.">
          <ServiceTable services={services} />
        </SectionCard>
        <SectionCard title="Trace bottleneck explorer" subtitle="Inspect a cross-service request path to identify hot spans.">
          {trace ? <TraceTreeView roots={trace.roots} services={services} bottleneck={trace.bottleneck_span_id} /> : null}
        </SectionCard>
      </div>
    </AppShell>
  );
}
