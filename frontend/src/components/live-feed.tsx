'use client';

import { useLiveStream } from '@/lib/websocket';

export function LiveFeed() {
  const messages = useLiveStream();

  return (
    <div className="space-y-3">
      {messages.length === 0 ? <p className="text-sm text-subtle">Waiting for WebSocket events...</p> : null}
      {messages.map((message, index) => (
        <article key={`${message.type}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.28em] text-subtle">{message.type}</span>
            <span className="font-mono text-xs text-subtle">{String(message.payload.recorded_at ?? new Date().toISOString())}</span>
          </div>
          <p className="mt-2 text-sm text-white">{String(message.payload.metric_name ?? message.payload.message ?? 'Event')}</p>
          <p className="mt-1 font-mono text-sm text-signal">{JSON.stringify(message.payload)}</p>
        </article>
      ))}
    </div>
  );
}
