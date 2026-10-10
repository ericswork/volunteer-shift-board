import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { CAUSE_LABELS, TIMEFRAME_LABELS, type Cause, type EventFilters, type Timeframe } from './events';

export const DEFAULT_FILTERS: EventFilters = { q: '', cause: '', when: 'next30', openOnly: false };

export function useEventFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // replace, not push: Back should leave the page instead of stepping through every filter change
  const setFilters = useCallback(
    (changes: Partial<EventFilters>) => {
      setSearchParams((current) => toSearchParams({ ...parseFilters(current), ...changes }), {
        replace: true,
      });
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return { filters: parseFilters(searchParams), setFilters, clearFilters };
}

// Unknown values from a hand-edited link fall back to the defaults instead of failing validation
function parseFilters(params: URLSearchParams): EventFilters {
  const cause = params.get('cause') ?? '';
  const when = params.get('when') ?? '';
  return {
    q: params.get('q') ?? '',
    cause: Object.hasOwn(CAUSE_LABELS, cause) ? (cause as Cause) : DEFAULT_FILTERS.cause,
    when: Object.hasOwn(TIMEFRAME_LABELS, when) ? (when as Timeframe) : DEFAULT_FILTERS.when,
    openOnly: params.get('open') === 'true',
  };
}

// Only values that differ from the defaults are written, so the unfiltered page stays at "/"
function toSearchParams(filters: EventFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.cause) params.set('cause', filters.cause);
  if (filters.when !== DEFAULT_FILTERS.when) params.set('when', filters.when);
  if (filters.openOnly) params.set('open', 'true');
  return params;
}
