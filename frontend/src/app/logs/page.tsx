'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/app-shell';
import { LogsTable } from '@/components/logs-table';
import { SectionCard } from '@/components/section-card';
import { getLogs, getServices } from '@/lib/api';
import type { LogEntry, Service } from '@/lib/types';

export default function LogsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    getServices().then(setServices);
    getLogs().then(setLogs);
  }, []);

  return (
    <AppShell>
      <SectionCard title="Logs viewer" subtitle="Searchable structured logs with service and trace correlation.">
        <LogsTable logs={logs} services={services} />
      </SectionCard>
    </AppShell>
  );
}
