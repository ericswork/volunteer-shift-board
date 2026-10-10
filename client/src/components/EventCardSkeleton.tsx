export function EventCardSkeleton() {
  return (
    <div
      aria-hidden
      className="rounded-card border border-border bg-surface p-4 motion-safe:animate-pulse sm:p-5"
    >
      <div className="flex justify-between">
        <div className="h-6 w-20 rounded-full bg-divider" />
        <div className="h-6 w-24 rounded-full bg-divider" />
      </div>
      <div className="mt-4 h-6 w-3/4 rounded bg-divider" />
      <div className="mt-4 h-4 w-2/3 rounded bg-divider" />
      <div className="mt-3 h-4 w-1/2 rounded bg-divider" />
      <div className="mt-6 h-4 w-1/3 rounded bg-divider" />
      <div className="mt-3 h-2 rounded-full bg-divider" />
      <div className="mt-6 h-11 rounded-control bg-divider" />
    </div>
  );
}
