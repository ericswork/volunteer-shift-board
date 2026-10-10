import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { AddShiftForm } from '../components/admin/AddShiftForm';
import { EventsTable } from '../components/admin/EventsTable';
import { RosterPanel } from '../components/admin/RosterPanel';
import { ErrorState } from '../components/ErrorState';
import { PageContainer } from '../components/layout/PageContainer';
import { fetchAdminEvents } from '../lib/admin';
import { useServerReady } from '../lib/server-health';

const CARD = 'rounded-card border border-border bg-surface';

export function AdminPage() {
  const [chosenEventId, setChosenEventId] = useState<string>();
  const events = useQuery({
    queryKey: ['admin-events'],
    queryFn: fetchAdminEvents,
    enabled: useServerReady(),
  });

  // Until someone picks a row, the first event is selected
  const list = events.data?.events ?? [];
  const selectedEventId = list.some((e) => e.id === chosenEventId) ? chosenEventId : list[0]?.id;

  let table;
  if (events.isError) {
    table = <ErrorState message="We couldn't load events." onRetry={() => events.refetch()} />;
  } else if (!events.data) {
    table = (
      <p role="status" className="px-5 pb-5 text-text-muted">
        Loading events…
      </p>
    );
  } else if (list.length === 0) {
    table = <p className="px-5 pb-5 text-text-muted">No upcoming events yet.</p>;
  } else {
    table = <EventsTable events={list} selectedId={selectedEventId} onSelect={setChosenEventId} />;
  }

  return (
    <PageContainer>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] leading-[1.15] font-bold tracking-[-0.01em] sm:text-[34px]">
            Manage events
          </h1>
          <p className="mt-2 text-lg text-text-muted">
            Create events and shifts, and see who has signed up.
          </p>
        </div>
      </div>

      {/* Phones stack table, roster, form. From lg the roster spans both rows, and the 1fr second
          row absorbs its extra height, so the form sits right under the table. */}
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] lg:grid-rows-[auto_1fr]">
        <section aria-labelledby="events-heading" className={`${CARD} min-w-0 overflow-hidden`}>
          <h2 id="events-heading" className="p-5 text-[22px] font-bold">
            Events
          </h2>
          {table}
        </section>

        {selectedEventId && (
          <>
            <section
              aria-labelledby="roster-heading"
              className={`${CARD} p-5 lg:col-start-2 lg:row-span-2 lg:row-start-1`}
            >
              <h2 id="roster-heading" className="text-[22px] font-bold">
                Roster
              </h2>
              <RosterPanel key={selectedEventId} eventId={selectedEventId} />
            </section>

            <section aria-labelledby="add-shift-heading" className={`${CARD} min-w-0 p-5 lg:col-start-1`}>
              <h2 id="add-shift-heading" className="mb-4 text-[22px] font-bold">
                Add a shift
              </h2>
              <AddShiftForm events={list} eventId={selectedEventId} onEventChange={setChosenEventId} />
            </section>
          </>
        )}
      </div>
    </PageContainer>
  );
}
