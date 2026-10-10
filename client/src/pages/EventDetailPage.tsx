import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { CauseChip } from '../components/CauseChip';
import { ErrorState } from '../components/ErrorState';
import { EventSidePanels } from '../components/EventSidePanels';
import { PageContainer } from '../components/layout/PageContainer';
import { ShiftAction } from '../components/ShiftAction';
import { ShiftRow } from '../components/ShiftRow';
import { SignedUpBanner } from '../components/SignedUpBanner';
import { StatusPill } from '../components/StatusPill';
import { ApiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { fetchEvent, type EventDetail } from '../lib/events';
import { formatDate, formatTimeRange, spotsLabel } from '../lib/format';
import { useServerReady } from '../lib/server-health';

const H1 = 'text-[30px] leading-[1.15] font-bold tracking-[-0.01em] sm:text-[38px]';

export function EventDetailPage() {
  const { eventId = '' } = useParams();
  const authState = useAuth();
  const serverReady = useServerReady();
  const uid = authState.status === 'signed-in' ? authState.user.uid : null;
  // The answer depends on who asks (viewer state), so the user is part of the key, and the
  // request waits until the sign-in state is known instead of fetching twice
  const event = useQuery({
    queryKey: ['event', eventId, uid],
    queryFn: () => fetchEvent(eventId),
    enabled: serverReady && authState.status !== 'loading',
  });

  let content;
  if (event.error instanceof ApiError && event.error.status === 404) {
    content = (
      <>
        <h1 className={H1}>We couldn't find that event.</h1>
        <p className="mt-3 text-lg text-text-muted">It may have been removed, or the link may be mistyped.</p>
      </>
    );
  } else if (event.isError) {
    content = <ErrorState message="We couldn't load this event." onRetry={() => event.refetch()} />;
  } else if (!event.data) {
    content = <p role="status" className="text-lg text-text-muted">Loading event…</p>;
  } else {
    content = <EventDetails event={event.data} />;
  }

  return (
    <PageContainer>
      <Link
        to="/"
        className="-ml-1 inline-flex min-h-11 items-center gap-2 px-1 font-semibold text-primary-ink"
      >
        <ArrowLeft aria-hidden className="size-5" />
        All events
      </Link>
      <div className="mt-4">{content}</div>
    </PageContainer>
  );
}

function EventDetails({ event }: { event: EventDetail }) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <CauseChip cause={event.cause} />
        <StatusPill status={event.status} spotsText={spotsLabel(event)} />
      </div>

      <h1 className={`mt-3 ${H1}`}>{event.title}</h1>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[17px] text-text-muted">
        <p className="flex items-start gap-2">
          <Calendar aria-hidden className="mt-1 size-5 shrink-0" />
          {formatDate(event.date)}
          {event.startsAt && event.endsAt && ` · ${formatTimeRange(event.startsAt, event.endsAt)}`}
        </p>
        <p className="flex items-start gap-2">
          <MapPin aria-hidden className="mt-1 size-5 shrink-0" />
          {event.location}
        </p>
      </div>

      <p className="mt-3 max-w-3xl text-[17px] leading-[1.6]">{event.description}</p>

      <div className="mt-6 empty:hidden">
        <SignedUpBanner shifts={event.shifts} />
      </div>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="choose-a-shift">
          <h2 id="choose-a-shift" className="text-[22px] font-bold">
            Choose a shift
          </h2>
          {event.shifts.length === 0 ? (
            <p className="mt-4 text-text-muted">No shifts have been added to this event yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {event.shifts.map((shift) => (
                <li key={shift.id}>
                  <ShiftRow shift={shift} action={<ShiftAction shift={shift} />} />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-[15px] text-text-muted">
            You can only sign up for one shift at a time. Shifts that overlap one you've already
            joined are unavailable.
          </p>
        </section>

        <EventSidePanels />
      </div>
    </>
  );
}
