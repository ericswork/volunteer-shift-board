import { CircleCheck } from 'lucide-react';
import { Link } from 'react-router';
import type { Shift } from '../lib/events';
import { formatTimeRange } from '../lib/format';

export function SignedUpBanner({ shifts }: { shifts: Shift[] }) {
  const held = shifts.filter((shift) => shift.viewer?.state === 'signed_up');
  if (held.length === 0) return null;

  return (
    <div
      role="status"
      className="flex flex-wrap items-start gap-x-6 gap-y-2 rounded-card border border-success-border bg-success-bg p-4 text-success-text sm:p-5"
    >
      <div className="flex flex-1 gap-3">
        <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0" />
        <div className="space-y-1 font-semibold">
          {held.map((shift) => (
            <p key={shift.id}>
              You're signed up for {shift.name}, {formatTimeRange(shift.startsAt, shift.endsAt)}.
            </p>
          ))}
        </div>
      </div>
      <Link to="/my-shifts" className="ml-8 font-semibold underline underline-offset-2 sm:ml-0">
        View my shifts
      </Link>
    </div>
  );
}
