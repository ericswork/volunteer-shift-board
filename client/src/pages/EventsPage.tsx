import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SECONDARY_BUTTON } from '../components/buttons';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { EventCard } from '../components/EventCard';
import { EventCardSkeleton } from '../components/EventCardSkeleton';
import { FilterCard } from '../components/FilterCard';
import { PageContainer } from '../components/layout/PageContainer';
import { useEventFilters } from '../lib/event-filters';
import { fetchEvents } from '../lib/events';
import { useServerReady } from '../lib/server-health';

// min() keeps a single column from overflowing on phones narrower than 320px plus padding
const GRID = 'grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-6';
const SKELETON_COUNT = 6;

export function EventsPage() {
  const { filters, setFilters, clearFilters } = useEventFilters();
  const events = useQuery({
    queryKey: ['events', filters],
    queryFn: () => fetchEvents(filters),
    enabled: useServerReady(),
    // Keeps the current cards on screen while a filter change loads, instead of flashing skeletons
    placeholderData: keepPreviousData,
  });

  let results;
  if (events.isError) {
    results = <ErrorState message="We couldn't load events." onRetry={() => events.refetch()} />;
  } else if (!events.data) {
    results = (
      <ul className={GRID}>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <li key={index}>
            <EventCardSkeleton />
          </li>
        ))}
      </ul>
    );
  } else if (events.data.total === 0) {
    results = (
      <EmptyState title="No shifts match your filters">
        <p className="mt-2 text-text-muted">Try another search, cause or time range.</p>
        <button type="button" onClick={clearFilters} className={`${SECONDARY_BUTTON} mt-5`}>
          Clear filters
        </button>
      </EmptyState>
    );
  } else {
    results = (
      <ul className={GRID}>
        {events.data.events.map((event) => (
          <li key={event.id}>
            <EventCard event={event} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <PageContainer>
      <h1 className="text-[30px] leading-[1.15] font-bold tracking-[-0.01em] sm:text-[40px]">
        Find a shift that fits your week
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-text-muted">
        Browse upcoming volunteer events, pick a shift, and sign up in a few taps. Spots are limited,
        so grab yours early.
      </p>

      <div className="mt-8">
        <FilterCard filters={filters} onChange={setFilters} onClear={clearFilters} />
      </div>

      {!events.isError && (
        <div className="mt-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 aria-live="polite" className="text-[22px] font-bold">
            {events.data ? resultCount(events.data.total) : 'Loading events…'}
          </h2>
          <p className="text-[15px] text-text-muted">Sorted by date, soonest first</p>
        </div>
      )}

      <div className="mt-6">{results}</div>
    </PageContainer>
  );
}

function resultCount(total: number) {
  return `${total} upcoming ${total === 1 ? 'event' : 'events'}`;
}
