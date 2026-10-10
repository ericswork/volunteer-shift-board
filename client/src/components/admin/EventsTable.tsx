import type { AdminEvent } from '../../lib/admin';
import { causeLabel } from '../../lib/events';
import { formatDate } from '../../lib/format';
import { StatusPill } from '../StatusPill';

type Props = {
  events: AdminEvent[];
  selectedId: string | undefined;
  onSelect: (eventId: string) => void;
};

const CELL = 'px-4 py-3 align-middle first:pl-5 last:pr-5';

export function EventsTable({ events, selectedId, onSelect }: Props) {
  return (
    // Only the table scrolls sideways on narrow screens, never the page. "relative" also keeps
    // the absolutely positioned screen-reader text inside this scroll box.
    <div className="relative overflow-x-auto">
      <table aria-labelledby="events-heading" className="w-full min-w-[640px] border-collapse text-left">
        <thead className="bg-bg text-[13px] font-semibold text-text-muted">
          <tr>
            <th scope="col" className={CELL}>Event</th>
            <th scope="col" className={CELL}>Date</th>
            <th scope="col" className={CELL}>Shifts</th>
            <th scope="col" className={CELL}>Signed up</th>
            <th scope="col" className={CELL}>Status</th>
            <th scope="col" className={CELL}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const selected = event.id === selectedId;
            return (
              <tr
                key={event.id}
                aria-current={selected ? 'true' : undefined}
                className={`border-t border-divider ${selected ? 'bg-row-selected' : ''}`}
              >
                <td className={CELL}>
                  <span className="block font-semibold">{event.title}</span>
                  <span className="text-[15px] text-text-muted">{causeLabel(event.cause)}</span>
                </td>
                <td className={`${CELL} whitespace-nowrap`}>{formatDate(event.date)}</td>
                <td className={CELL}>{event.shiftCount}</td>
                <td className={`${CELL} whitespace-nowrap`}>
                  {event.signedUpCount} / {event.capacity}
                </td>
                <td className={CELL}>
                  {event.status ? (
                    <StatusPill status={event.status} />
                  ) : (
                    <span className="text-[15px] text-text-muted">No shifts yet</span>
                  )}
                </td>
                <td className={CELL}>
                  <button
                    type="button"
                    onClick={() => onSelect(event.id)}
                    className="min-h-11 font-semibold text-primary-ink underline underline-offset-2"
                  >
                    Manage<span className="sr-only"> {event.title}</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
