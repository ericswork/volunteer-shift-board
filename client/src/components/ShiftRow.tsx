import type { ReactNode } from 'react';
import type { Shift } from '../lib/events';
import { formatTimeRange } from '../lib/format';
import { SpotsBar } from './SpotsBar';

export function ShiftRow({ shift, action }: { shift: Shift; action?: ReactNode }) {
  return (
    <div className="grid items-center gap-4 rounded-card border border-border bg-surface p-4 sm:p-5 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,200px)] md:gap-6">
      <div>
        <h3 className="text-lg leading-[1.3] font-bold">{shift.name}</h3>
        <p className="mt-0.5 text-[15px] text-text-muted">
          {formatTimeRange(shift.startsAt, shift.endsAt)}
        </p>
      </div>
      <SpotsBar availability={shift} />
      {action && <div>{action}</div>}
    </div>
  );
}
