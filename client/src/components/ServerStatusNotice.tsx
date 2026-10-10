import { CircleAlert, LoaderCircle } from 'lucide-react';
import { useServerHealth } from '../lib/server-health';

export function ServerStatusNotice() {
  const { status, retry } = useServerHealth();

  if (status === 'waking') {
    return (
      <div role="status" className="flex gap-3 rounded-card bg-primary-tint p-4 text-primary-ink">
        <LoaderCircle aria-hidden className="mt-0.5 size-5 shrink-0 motion-safe:animate-spin" />
        <div>
          <p className="font-semibold">Waking up the server…</p>
          <p className="mt-1 text-[15px]">
            This demo runs on free hosting that sleeps when nobody has visited for a while. It can take up
            to a minute to start, and the page will load on its own.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'unreachable') {
    return (
      <div role="alert" className="flex gap-3 rounded-card border border-error-border bg-surface p-4">
        <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-error-text" />
        <div>
          <p className="font-semibold text-error-text">We couldn't reach the server.</p>
          <p className="mt-1 text-[15px] text-text-muted">
            It may still be starting up, or your connection may be offline.
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 inline-flex min-h-11 items-center rounded-control border border-input-border bg-surface px-4 font-semibold"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
