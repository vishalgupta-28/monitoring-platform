import clsx from 'clsx';

export function StatCard({ title, value, delta, tone = 'signal' }: { title: string; value: string; delta: string; tone?: 'signal' | 'ember' | 'lime' }) {
  return (
    <article className="card-surface group relative flex flex-col justify-between rounded-[28px] p-5 transition hover:-translate-y-0.5 hover:border-white/20">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-subtle/80">{title}</p>
        <p className="mt-2.5 whitespace-nowrap font-mono text-lg leading-none tracking-tight sm:text-xl lg:text-2xl">{value}</p>
      </div>
      <div className="mt-5">
        <span
          className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold sm:text-xs', {
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
