'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { login, register } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
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
            Sign in with the seeded admin account or create your own operator account. New accounts can add URLs, view dashboards, and explore alerts and traces.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-surface rounded-3xl p-5">
              <p className="text-xs uppercase tracking-[0.26em] text-subtle">Monitor</p>
              <p className="mt-4 font-mono text-3xl">URLs</p>
            </div>
            <div className="card-surface rounded-3xl p-5">
              <p className="text-xs uppercase tracking-[0.26em] text-subtle">Investigate</p>
              <p className="mt-4 font-mono text-3xl">Logs</p>
            </div>
            <div className="card-surface rounded-3xl p-5">
              <p className="text-xs uppercase tracking-[0.26em] text-subtle">Trace</p>
              <p className="mt-4 font-mono text-3xl">Latency</p>
            </div>
          </div>
        </section>
        <section className="card-surface rounded-[32px] p-8 shadow-glow">
          <div className="flex rounded-full border border-white/10 bg-white/[0.03] p-1">
            {[
              { id: 'signin', label: 'Sign in' },
              { id: 'signup', label: 'Sign up' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setMode(item.id as 'signin' | 'signup');
                  setError(null);
                }}
                className={`flex-1 rounded-full px-4 py-2 text-sm transition ${mode === item.id ? 'bg-signal text-ink' : 'text-subtle hover:text-white'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <form
            className="mt-6 space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              setLoading(true);
              setError(null);
              try {
                if (mode === 'signup') {
                  await register({ full_name: fullName, email, password, role: 'operator' });
                } else {
                  await login({ email, password });
                }
                router.push('/dashboard');
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : `Unable to ${mode === 'signup' ? 'sign up' : 'sign in'}`);
              } finally {
                setLoading(false);
              }
            }}
          >
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-subtle">JWT access</p>
              <h2 className="mt-2 text-3xl font-semibold">{mode === 'signup' ? 'Create an operator account' : 'Operator access'}</h2>
            </div>
            {mode === 'signup' ? (
              <label className="block space-y-2">
                <span className="text-sm text-subtle">Full name</span>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none ring-0 transition focus:border-signal/50" />
              </label>
            ) : null}
            <label className="block space-y-2">
              <span className="text-sm text-subtle">Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none ring-0 transition focus:border-signal/50" />
            </label>
            <label className="block space-y-2">
              <span className="text-sm text-subtle">Password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-signal/50" />
            </label>
            {mode === 'signup' ? <p className="text-xs text-subtle">New accounts are created as operator users so you can add URLs and test the monitoring flow immediately.</p> : null}
            {error ? <p className="rounded-2xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
            <button type="submit" disabled={loading} className="w-full rounded-full bg-signal px-5 py-3 font-medium text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? (mode === 'signup' ? 'Creating account...' : 'Signing in...') : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
