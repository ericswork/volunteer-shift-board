import type { AvailabilityStatus } from '../lib/events';

const PILLS: Record<AvailabilityStatus, { label: string; className: string }> = {
  open: { label: 'Spots open', className: 'bg-status-open-bg text-status-open-text' },
  filling: { label: 'Filling up', className: 'bg-status-filling-bg text-status-filling-text' },
  full: { label: 'Full', className: 'bg-status-full-bg text-status-full-text' },
};

export function StatusPill({ status }: { status: AvailabilityStatus }) {
  const pill = PILLS[status];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[13px] leading-5 font-semibold ${pill.className}`}
    >
      {pill.label}
    </span>
  );
}
