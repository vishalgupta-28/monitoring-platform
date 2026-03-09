'use client';

import { useMemo, useState } from 'react';

import type { Service, ServiceCreatePayload } from '@/lib/types';

function normalizeUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return '';
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function buildServiceDraft(inputUrl: string): ServiceCreatePayload {
  const normalized = normalizeUrl(inputUrl);
  const parsed = new URL(normalized);
  const hostname = parsed.hostname.replace(/^www\./, '');
  const baseName = hostname.split('.')[0] || 'website';
  const name = baseName
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    name: `${name || 'Website'} Monitor`,
    slug: hostname.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase(),
    service_type: 'api',
    base_url: normalized,
    environment: 'production',
    status: 'healthy',
    tags: {
      source: 'quick-add',
      host: hostname,
    },
  };
}

export function UrlMonitorForm({
  services,
  onCreated,
}: {
  services: Service[];
  onCreated: (payload: ServiceCreatePayload) => Promise<void>;
}) {
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const preview = useMemo(() => {
    try {
      return url.trim() ? buildServiceDraft(url) : null;
    } catch {
      return null;
    }
  }, [url]);

  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <form
        className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          setSuccess(null);

          let payload: ServiceCreatePayload;
          try {
            payload = buildServiceDraft(url);
          } catch {
            setError('Please enter a valid website URL like instagram.com or https://example.com.');
            return;
          }

          if (services.some((service) => service.slug === payload.slug || service.base_url === payload.base_url)) {
            setError('This URL is already being monitored.');
            return;
          }

          setSubmitting(true);
          try {
            await onCreated(payload);
            setSuccess('URL added. The collector will start checking it automatically every few seconds.');
            setUrl('');
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : 'Could not add this URL right now.');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <p className="text-xs uppercase tracking-[0.28em] text-subtle">Quick monitor</p>
        <h3 className="mt-2 text-2xl font-semibold">Paste a URL to start monitoring</h3>
        <p className="mt-2 text-sm text-subtle">
          You only enter the URL. We generate the service name and monitoring target for you.
        </p>

        <label className="mt-5 block space-y-2">
          <span className="text-sm text-subtle">Website URL</span>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="instagram.com"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none transition focus:border-signal/50"
          />
        </label>

        {error ? <p className="mt-4 rounded-2xl border border-ember/30 bg-ember/10 px-4 py-3 text-sm text-ember">{error}</p> : null}
        {success ? <p className="mt-4 rounded-2xl border border-lime/30 bg-lime/10 px-4 py-3 text-sm text-lime">{success}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 rounded-full bg-signal px-5 py-3 font-medium text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? 'Adding URL...' : 'Start monitoring'}
        </button>
      </form>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-subtle">What happens next</p>
        <div className="mt-4 space-y-4 text-sm text-subtle">
          <p>1. The URL is saved as a monitored service.</p>
          <p>2. The collector pings it and records latency, CPU, memory, error rate, and throughput metrics.</p>
          <p>3. The Dashboard, Metrics, and Alerts pages update from those metrics.</p>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-[#08111f]/70 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-subtle">Preview</p>
          {preview ? (
            <div className="mt-3 space-y-2 text-sm">
              <p><span className="text-subtle">Name:</span> {preview.name}</p>
              <p><span className="text-subtle">Slug:</span> <span className="font-mono">{preview.slug}</span></p>
              <p><span className="text-subtle">URL:</span> <span className="font-mono">{preview.base_url}</span></p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-subtle">Type a URL and we will show what will be created.</p>
          )}
        </div>
      </div>
    </div>
  );
}
