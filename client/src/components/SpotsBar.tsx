import type { Availability, AvailabilityStatus } from '../lib/events';
import { spotsLabel } from '../lib/format';

const BAR_COLORS: Record<AvailabilityStatus, string> = {
  open: 'bg-status-open-bar',
  filling: 'bg-status-filling-bar',
  full: 'bg-status-full-bar',
};

export function SpotsBar({ availability }: { availability: Availability }) {
  const { capacity, signedUpCount, status } = availability;
  // An event with no shifts yet has capacity 0
  const bookedPercent = capacity > 0 ? (signedUpCount / capacity) * 100 : 0;

  return (
    <div>
      <p className="text-[15px] font-semibold">{spotsLabel(availability)}</p>
      {/* Hidden from screen readers because the text above already says the same thing */}
      <div aria-hidden className="mt-2 h-2 rounded-full bg-divider">
        <div className={`h-full rounded-full ${BAR_COLORS[status]}`} style={{ width: `${bookedPercent}%` }} />
      </div>
    </div>
  );
}
