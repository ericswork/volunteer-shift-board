import { causeLabel } from '../lib/events';

export function CauseChip({ cause }: { cause: string }) {
  return (
    <span className="inline-flex rounded-full bg-primary-tint px-2.5 py-0.5 text-[13px] leading-5 font-semibold text-primary-ink">
      {causeLabel(cause)}
    </span>
  );
}
