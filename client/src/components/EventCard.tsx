import { Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import type { EventSummary } from '../lib/events';
import { formatDate, formatTimeRange } from '../lib/format';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from './buttons';
import { CauseChip } from './CauseChip';
import { SpotsBar } from './SpotsBar';
import { StatusPill } from './StatusPill';

export function EventCard({ event }: { event: EventSummary }) {
  const full = event.status === 'full';

  return (
    <article className="flex h-full flex-col rounded-card border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <CauseChip cause={event.cause} />
        <StatusPill status={event.status} />
      </div>

      <h3 className="mt-3 text-xl leading-[1.3] font-bold">{event.title}</h3>

      <div className="mt-3 space-y-1.5 text-[15px] text-text-muted">
        <p className="flex items-start gap-2">
          <Calendar aria-hidden className="mt-0.5 size-[18px] shrink-0" />
          {formatDate(event.date)} · {formatTimeRange(event.startsAt, event.endsAt)}
        </p>
        <p className="flex items-start gap-2">
          <MapPin aria-hidden className="mt-0.5 size-[18px] shrink-0" />
          {event.location}
        </p>
      </div>

      <div className="mt-4">
        <SpotsBar availability={event} />
      </div>

      <div className="mt-auto pt-5">
        <Link
          to={`/events/${event.id}`}
          className={`${full ? SECONDARY_BUTTON : PRIMARY_BUTTON} w-full`}
        >
          {full ? 'View details' : 'View shifts'}
          <span className="sr-only"> for {event.title}</span>
        </Link>
      </div>
    </article>
  );
}
