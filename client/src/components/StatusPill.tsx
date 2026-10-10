import type { AvailabilityStatus } from '../lib/events';

const PILLS: Record<AvailabilityStatus, { label: string; className: string }> = {
  open: { label: 'Spots open', className: 'bg-status-open-bg text-status-open-text' },
  filling: { label: 'Filling up', className: 'bg-status-filling-bg text-status-filling-text' },
  full: { label: 'Full', className: 'bg-status-full-bg text-status-full-text' },
};

type Props = { status: AvailabilityStatus; spotsText?: string; label?: string };

// label replaces the whole text. spotsText comes from spotsLabel, which already starts with "Full"
// when nothing is left
export function StatusPill({ status, spotsText, label }: Props) {
  const pill = PILLS[status];
  let text = pill.label;
  if (label) text = label;
  else if (spotsText) text = status === 'full' ? spotsText : `${pill.label} · ${spotsText}`;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[13px] leading-5 font-semibold ${pill.className}`}
    >
      {text}
    </span>
  );
}
