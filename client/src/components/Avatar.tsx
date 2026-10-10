// Decorative: the person's name is always shown next to it
export function Avatar({ initials }: { initials: string }) {
  return (
    <span
      aria-hidden
      className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-tint text-[15px] font-bold text-primary-ink"
    >
      {initials}
    </span>
  );
}
