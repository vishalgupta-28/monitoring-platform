import clsx from 'clsx';

export function StatCard({ title, value, delta, tone = 'signal' }: { title: string; value: string; delta: string; tone?: 'signal' | 'ember' | 'lime' }) {
  return (
    <article className="card-surface rounded-[28px] p-5 transition hover:-translate-y-0.5 hover:border-white/20">
      <p className="text-xs uppercase tracking-[0.28em] text-subtle">{title}</p>
      <div className="mt-5 flex items-end justify-between">
        <p className="font-mono text-3xl">{value}</p>
        <span
          className={clsx('rounded-full px-3 py-1 text-xs font-medium', {
            'bg-signal/15 text-signal': tone === 'signal',
            'bg-ember/15 text-ember': tone === 'ember',
            'bg-lime/15 text-lime': tone === 'lime',
          })}
        >
          {delta}
        </span>
      </div>
    </article>
  );
}
