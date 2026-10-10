import { useQuery } from '@tanstack/react-query';
import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { apiFetch } from './api';

const SHOW_NOTICE_AFTER_MS = 3_000;
const GIVE_UP_AFTER_MS = 90_000;
const RETRY_EVERY_MS = 3_000;
const ATTEMPT_TIMEOUT_MS = 10_000;

export type ServerStatus = 'checking' | 'waking' | 'ready' | 'unreachable';

const ServerHealthContext = createContext<{ status: ServerStatus; retry: () => void } | null>(null);

export function ServerHealthProvider({ children }: { children: ReactNode }) {
  const [round, setRound] = useState(0);
  const [slow, setSlow] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const roundStartedAt = useRef(Date.now());

  const health = useQuery({
    queryKey: ['health', round],
    queryFn: () => apiFetch('/api/health', { signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS) }),
    retry: () => Date.now() - roundStartedAt.current < GIVE_UP_AFTER_MS,
    retryDelay: RETRY_EVERY_MS,
    staleTime: Infinity,
  });
  const ready = health.isSuccess;

  useEffect(() => {
    if (ready) return;
    const noticeTimer = setTimeout(() => setSlow(true), SHOW_NOTICE_AFTER_MS);
    const giveUpTimer = setTimeout(() => setGaveUp(true), GIVE_UP_AFTER_MS);
    return () => {
      clearTimeout(noticeTimer);
      clearTimeout(giveUpTimer);
    };
  }, [round, ready]);

  const retry = useCallback(() => {
    roundStartedAt.current = Date.now();
    setSlow(false);
    setGaveUp(false);
    setRound((r) => r + 1);
  }, []);

  const status: ServerStatus = ready ? 'ready' : gaveUp ? 'unreachable' : slow ? 'waking' : 'checking';

  return <ServerHealthContext value={{ status, retry }}>{children}</ServerHealthContext>;
}

export function useServerHealth() {
  const value = use(ServerHealthContext);
  if (!value) throw new Error('useServerHealth must be used inside ServerHealthProvider');
  return value;
}

// Data queries pass this as `enabled` so they wait for the server instead of timing out one by one
export function useServerReady() {
  return useServerHealth().status === 'ready';
}
