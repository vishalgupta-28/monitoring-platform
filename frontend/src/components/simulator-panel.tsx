'use client';

import { useState } from 'react';

import type { SimulationRun, SimulationScenario } from '@/lib/types';

export function SimulatorPanel({ scenarios, onRun, run }: { scenarios: SimulationScenario[]; onRun: (scenarioId: string, inputs: Record<string, number>) => Promise<void>; run: SimulationRun | null }) {
  const [selectedScenarioId, setSelectedScenarioId] = useState(scenarios[0]?.id ?? '');
  const [loadMultiplier, setLoadMultiplier] = useState(1.4);
  const [regions, setRegions] = useState(4);
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
      <form
        className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          await onRun(selectedScenarioId, { load_multiplier: loadMultiplier, regions });
          setBusy(false);
        }}
      >
        <label className="block space-y-2">
          <span className="text-sm text-subtle">Scenario</span>
          <select value={selectedScenarioId} onChange={(event) => setSelectedScenarioId(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3 outline-none">
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-subtle">Load multiplier</span>
          <input type="range" min="1" max="3" step="0.1" value={loadMultiplier} onChange={(event) => setLoadMultiplier(Number(event.target.value))} className="w-full" />
          <p className="font-mono text-sm text-white">{loadMultiplier.toFixed(1)}x</p>
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-subtle">Regions</span>
          <input type="number" min="1" max="12" value={regions} onChange={(event) => setRegions(Number(event.target.value))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" />
        </label>
        <button type="submit" disabled={busy} className="rounded-full bg-ember px-5 py-3 font-medium text-ink transition hover:brightness-110 disabled:opacity-70">
          {busy ? 'Running...' : 'Run simulation'}
        </button>
      </form>
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm uppercase tracking-[0.28em] text-subtle">Scaling output</p>
        {run ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {Object.entries(run.results).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-subtle">{key.replaceAll('_', ' ')}</p>
                <p className="mt-3 font-mono text-2xl text-white">{value}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-subtle">Trigger a scenario to estimate effective QPS, autoscaling, queue lag, and error rates.</p>
        )}
      </div>
    </div>
  );
}
