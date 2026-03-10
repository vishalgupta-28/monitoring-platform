'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, BellRing, Boxes, ChevronRight, LayoutDashboard, LineChart, LogOut, Logs, Sparkles } from 'lucide-react';
import clsx from 'clsx';

import { ThemeToggle } from '@/components/theme-provider';
import { getMe, getStoredUser, logout } from '@/lib/api';
import type { User } from '@/lib/types';

const navigation = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/services', label: 'Services', icon: Boxes },
  { href: '/metrics', label: 'Metrics', icon: LineChart },
  { href: '/logs', label: 'Logs', icon: Logs },
  { href: '/alerts', label: 'Alerts', icon: BellRing },
  { href: '/simulator', label: 'Simulator', icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(getStoredUser());

  useEffect(() => {
    getMe().then(setUser).catch(() => setUser(getStoredUser()));
  }, []);

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
      <div className="grid min-h-[calc(100vh-2rem)] gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="card-surface rounded-[28px] p-5 shadow-glow">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-signal/15 p-3 text-signal">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-subtle">PulseBoard</p>
              <p className="text-lg font-semibold">Observability fabric</p>
            </div>
          </div>
          <nav className="mt-8 space-y-2">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href as any}
                className={clsx(
                  'flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition',
                  pathname === href
                    ? 'bg-signal/15 text-white ring-1 ring-signal/30'
                    : 'text-subtle hover:bg-white/5 hover:text-white',
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon size={17} />
                  {label}
                </span>
                <ChevronRight size={14} className={pathname === href ? 'text-signal' : 'text-white/20'} />
              </Link>
            ))}
          </nav>
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.26em] text-subtle">Capacity</p>
            <p className="mt-4 font-mono text-3xl">10M/min</p>
            <p className="mt-2 text-sm text-subtle">Streamed metrics with Kafka fan-out and Redis hot cache.</p>
          </div>
        </aside>
        <div className="space-y-4">
          <header className="card-surface flex flex-col gap-4 rounded-[28px] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-subtle">Control plane</p>
              <h1 className="mt-1 text-2xl font-semibold">Distributed systems monitoring</h1>
              <p className="mt-2 text-sm text-subtle">
                {user ? `${user.full_name} (${user.role}) signed in` : 'Use the sign in or sign up flow to monitor your own URLs.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ThemeToggle />
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setUser(null);
                    router.push('/login');
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-subtle transition hover:border-ember/40 hover:text-white"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              ) : (
                <Link href="/login" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-subtle transition hover:border-signal/50 hover:text-white">
                  Sign in / Sign up
                </Link>
              )}
            </div>
          </header>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
