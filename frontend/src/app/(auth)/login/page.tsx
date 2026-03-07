'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { login } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@pulseboard.dev');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16 lg:px-12">
      <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-8">
          <p className="text-sm uppercase tracking-[0.28em] text-signal">Control plane access</p>
          <h1 className="max-w-2xl text-5xl font-semibold tracking-tight">Real-time infrastructure monitoring for interview prep and production systems.</h1>
          <p className="max-w-xl text-lg text-subtle">
            Use the seeded admin account or wire this form to the backend JWT endpoint. The UI persists the token locally for API calls.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-surface rounded-3xl p-5">
              <p className="text-xs uppercase tracking-[0.26em] text-subtle">APIs</p>
              <p className="mt-4 font-mono text-3xl">99.97%</p>
            </div>
            <div className="card-surface rounded-3xl p-5">
              <p className="text-xs uppercase tracking-[0.26em] text-subtle">Spans/min</p>
              <p className="mt-4 font-mono text-3xl">2.4M</p>
            </div>
            <div className="card-surface rounded-3xl p-5">
              <p className="text-xs uppercase tracking-[0.26em] text-subtle">Hot alerts</p>
              <p className="mt-4 font-mono text-3xl">12</p>
            </div>
          </div>
        </section>
        <section className="card-surface rounded-[32px] p-8 shadow-glow">
          <form
            className="space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              setLoading(true);
              setError(null);
              try {
                await login({ email, password });
                router.push('/dashboard');
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : 'Unable to sign in');
              } finally {
                setLoading(false);
              }
            }}
          >
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-subtle">JWT login</p>
              <h2 className="mt-2 text-3xl font-semibold">Operator access</h2>
            </div>
            <label className="block space-y-2">
              <span className="text-sm text-subtle">Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none ring-0 transition focus:border-signal/50" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-subtle">Password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-signal/50" />
            </label>
            {error ? <p className="rounded-2xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
            <button type="submit" disabled={loading} className="w-full rounded-full bg-signal px-5 py-3 font-medium text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
