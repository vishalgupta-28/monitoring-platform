'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/app-shell';
import { SectionCard } from '@/components/section-card';
import { SimulatorPanel } from '@/components/simulator-panel';
import { getSimulationScenarios, runSimulation } from '@/lib/api';
import type { SimulationRun, SimulationScenario } from '@/lib/types';

export default function SimulatorPage() {
  const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
  const [run, setRun] = useState<SimulationRun | null>(null);

  useEffect(() => {
    getSimulationScenarios().then(setScenarios);
  }, []);

  return (
    <AppShell>
      <SectionCard title="System design playground" subtitle="Simulate classic interview systems under varying regional load and scaling pressure.">
        <SimulatorPanel
          scenarios={scenarios}
          run={run}
          onRun={async (scenarioId, inputs) => {
            const response = await runSimulation(scenarioId, inputs);
            setRun(response);
          }}
        />
      </SectionCard>
    </AppShell>
  );
}
