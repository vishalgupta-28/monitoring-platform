import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-20 lg:px-12">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <section className="space-y-8">
          <span className="inline-flex rounded-full border border-signal/30 bg-signal/10 px-4 py-2 text-xs uppercase tracking-[0.32em] text-signal">
            FAANG-grade observability
          </span>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
              Monitor distributed systems, trace bottlenecks, and simulate scale in one control plane.
            </h1>
            <p className="max-w-2xl text-lg text-subtle">
              PulseBoard combines service health, metrics, tracing, logs, alerting, and system design simulations for interview prep and real workloads.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/dashboard" className="rounded-full bg-ember px-6 py-3 font-medium text-ink transition hover:brightness-110">
              Open dashboard
            </Link>
            <Link href="/login" className="rounded-full border border-white/10 bg-white/5 px-6 py-3 font-medium text-white transition hover:border-signal/40">
              Login flow
            </Link>
          </div>
        </section>
        <section className="card-surface rounded-[32px] p-8 shadow-glow animate-rise">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm uppercase tracking-[0.28em] text-subtle">Live signal</span>
              <span className="rounded-full bg-lime/15 px-3 py-1 text-xs font-medium text-lime">Healthy</span>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-subtle">Global ingest</p>
              <p className="font-mono text-4xl">10.2M metrics/min</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-subtle">P95 latency</p>
                <p className="mt-2 font-mono text-2xl text-signal">186ms</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-subtle">Alerts firing</p>
                <p className="mt-2 font-mono text-2xl text-ember">12</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
