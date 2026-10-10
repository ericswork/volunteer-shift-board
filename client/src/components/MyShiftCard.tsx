import { Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import { dateBlock, formatDate, formatTimeRange } from '../lib/format';
import type { MySignup } from '../lib/signups';
import { CancelSignupDialog } from './CancelSignupDialog';

export function MyShiftCard({ signup, upcoming }: { signup: MySignup; upcoming: boolean }) {
  const { shift, event } = signup;
  const { weekday, day } = dateBlock(shift.startsAt);

  return (
    <article className="rounded-card border border-border bg-surface p-4 sm:p-5">
      <div className="flex gap-4">
        <div
          aria-hidden
          className="grid size-[72px] shrink-0 place-content-center rounded-card bg-primary-tint text-center text-primary-ink"
        >
          <span className="text-[13px] font-bold tracking-wide">{weekday}</span>
          <span className="text-[28px] leading-none font-bold">{day}</span>
        </div>
        <div className="min-w-0">
          <h3 className="text-xl leading-[1.3] font-bold">
            {shift.name}
            <span className="sr-only">, {formatDate(shift.startsAt)}</span>
          </h3>
          <Link
            to={`/events/${event.id}`}
            className="mt-1 inline-block text-[17px] text-text-muted underline decoration-divider underline-offset-4 hover:decoration-current"
          >
            {event.title}
          </Link>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-[17px] text-text-muted">
        <p className="flex items-start gap-3">
          <Clock aria-hidden className="mt-0.5 size-5 shrink-0" />
          {formatTimeRange(shift.startsAt, shift.endsAt)}
        </p>
        <p className="flex items-start gap-3">
          <MapPin aria-hidden className="mt-0.5 size-5 shrink-0" />
          {event.location}
        </p>
      </div>

      {upcoming &&
        (signup.canCancel ? (
          <CancelSignupDialog
            signupId={signup.signupId}
            shiftName={shift.name}
            startsAt={shift.startsAt}
            className="mt-4 w-full"
          />
        ) : (
          <p className="mt-4 text-[15px] text-text-muted">
            Cancellation closed (less than 24 hours to go)
          </p>
        ))}
    </article>
  );
}
