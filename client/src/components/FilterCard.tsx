import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CAUSE_LABELS, TIMEFRAME_LABELS, type Cause, type EventFilters, type Timeframe } from '../lib/events';
import { SECONDARY_BUTTON } from './buttons';

const SEARCH_DELAY_MS = 300;

const LABEL = 'block text-[13px] font-semibold';
const FIELD =
  'mt-1.5 block min-h-11 w-full rounded-control border border-input-border bg-surface px-3 text-base';

type Props = {
  filters: EventFilters;
  onChange: (changes: Partial<EventFilters>) => void;
  onClear: () => void;
};

export function FilterCard({ filters, onChange, onClear }: Props) {
  const [search, setSearch] = useState(filters.q);
  const lastSentSearch = useRef(filters.q);

  // The URL's q changes without typing when filters are cleared. Comparing with what this box last
  // sent tells that apart from our own update arriving, which must not undo letters typed since.
  useEffect(() => {
    if (filters.q === lastSentSearch.current) return;
    lastSentSearch.current = filters.q;
    setSearch(filters.q);
  }, [filters.q]);

  useEffect(() => {
    if (search === lastSentSearch.current) return;
    const timer = setTimeout(() => {
      lastSentSearch.current = search;
      onChange({ q: search });
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search, onChange]);

  const clear = () => {
    setSearch('');
    onClear();
  };

  return (
    <section
      aria-label="Filter events"
      className="rounded-card border border-border bg-surface p-4 sm:p-5"
    >
      <div className="grid items-end gap-4 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.3fr]">
        <div>
          <label htmlFor="event-search" className={LABEL}>
            Search events
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-text-muted"
            />
            <input
              id="event-search"
              type="search"
              maxLength={100}
              placeholder='Try "garden" or "library"'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`${FIELD} pl-10`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="event-cause" className={LABEL}>
            Cause
          </label>
          <select
            id="event-cause"
            value={filters.cause}
            onChange={(event) => onChange({ cause: event.target.value as Cause | '' })}
            className={FIELD}
          >
            <option value="">All causes</option>
            {Object.entries(CAUSE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="event-when" className={LABEL}>
            When
          </label>
          <select
            id="event-when"
            value={filters.when}
            onChange={(event) => onChange({ when: event.target.value as Timeframe })}
            className={FIELD}
          >
            {Object.entries(TIMEFRAME_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex min-h-11 items-center gap-3 text-[15px]">
          <input
            type="checkbox"
            checked={filters.openOnly}
            onChange={(event) => onChange({ openOnly: event.target.checked })}
            className="size-5 shrink-0 accent-primary"
          />
          Only show shifts with open spots
        </label>
      </div>

      <button type="button" onClick={clear} className={`${SECONDARY_BUTTON} mt-4`}>
        Clear filters
      </button>
    </section>
  );
}
