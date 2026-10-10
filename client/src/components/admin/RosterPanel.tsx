import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { fetchRoster } from '../../lib/admin';
import { useEvent } from '../../lib/events';
import { formatDate, formatMonthDay, formatTimeRange } from '../../lib/format';
import { useServerReady } from '../../lib/server-health';
import { Avatar } from '../Avatar';
import { ErrorState } from '../ErrorState';
import { SelectField } from '../SelectField';
import { StatusPill } from '../StatusPill';
import { RemoveSignupDialog } from './RemoveSignupDialog';

const MUTED = 'mt-4 text-text-muted';

// AdminPage remounts this with key={eventId}, so a newly selected event starts on its first shift
export function RosterPanel({ eventId }: { eventId: string }) {
  const event = useEvent(eventId);
  const [chosenShiftId, setChosenShiftId] = useState<string>();
  const shiftPicker = useRef<HTMLSelectElement>(null);

  // Remember the first shift as soon as the shifts arrive. Otherwise adding a shift that starts
  // earlier would make it the new first shift, and the roster would jump to it.
  const firstShiftId = event.data?.shifts[0]?.id;
  if (chosenShiftId === undefined && firstShiftId !== undefined) setChosenShiftId(firstShiftId);

  if (event.isError) {
    return (
      <ErrorState message="We couldn't load this event's shifts." onRetry={() => event.refetch()} />
    );
  }
  if (!event.data) {
    return (
      <p role="status" className={MUTED}>
        Loading roster…
      </p>
    );
  }

  const { shifts } = event.data;
  const shiftId = (shifts.find((s) => s.id === chosenShiftId) ?? shifts[0])?.id;
  if (!shiftId) return <p className={MUTED}>No shifts yet. Add one below.</p>;

  return (
    <>
      <div className="mt-4">
        <SelectField
          ref={shiftPicker}
          id="roster-shift"
          label="Shift"
          value={shiftId}
          onChange={(e) => setChosenShiftId(e.target.value)}
        >
          {shifts.map((shift) => (
            <option key={shift.id} value={shift.id}>
              {shift.name} · {formatTimeRange(shift.startsAt, shift.endsAt)}
            </option>
          ))}
        </SelectField>
      </div>
      <ShiftRoster shiftId={shiftId} focusAfterRemove={() => shiftPicker.current?.focus()} />
    </>
  );
}

type ShiftRosterProps = { shiftId: string; focusAfterRemove: () => void };

function ShiftRoster({ shiftId, focusAfterRemove }: ShiftRosterProps) {
  const roster = useQuery({
    queryKey: ['roster', shiftId],
    queryFn: () => fetchRoster(shiftId),
    enabled: useServerReady(),
  });

  if (roster.isError) {
    return (
      <div className="mt-4">
        <ErrorState message="We couldn't load this roster." onRetry={() => roster.refetch()} />
      </div>
    );
  }
  if (!roster.data) {
    return (
      <p role="status" className={MUTED}>
        Loading roster…
      </p>
    );
  }

  const { name, startsAt, endsAt, capacity, signedUpCount, spotsLeft, status, signups } = roster.data;

  return (
    <>
      <p className="mt-4 text-[15px] text-text-muted">
        {name} · {formatDate(startsAt)} ·{' '}
        <span className="whitespace-nowrap">{formatTimeRange(startsAt, endsAt)}</span>
      </p>
      <div className="mt-2">
        <StatusPill status={status} label={`${signedUpCount} of ${capacity} signed up`} />
      </div>

      {signups.length === 0 ? (
        <p className="mt-4 border-t border-divider pt-4 text-text-muted">
          No one has signed up yet.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-divider border-t border-divider">
          {signups.map((signup) => (
            <li key={signup.signupId} className="flex items-center gap-3 py-3">
              <Avatar initials={signup.initials} />
              <div className="min-w-0">
                <p className="font-semibold">{signup.name}</p>
                <p className="text-[15px] text-text-muted">
                  Signed up {formatMonthDay(signup.signedUpAt)}
                </p>
              </div>
              <RemoveSignupDialog
                signupId={signup.signupId}
                name={signup.name}
                shiftName={name}
                focusAfterRemove={focusAfterRemove}
              />
            </li>
          ))}
        </ul>
      )}

      {spotsLeft > 0 && (
        <p className="mt-4 rounded-control border-2 border-dashed border-(--color-dashed) py-4 text-center text-text-muted">
          {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} still open
        </p>
      )}
    </>
  );
}
