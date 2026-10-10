import { ChevronDown, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Me } from '../../lib/auth';
import { Avatar } from '../Avatar';

export function UserMenu({ me, onSignOut }: { me: Me; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={container} className="relative">
      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls="user-menu"
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex min-h-11 items-center gap-3 rounded-control px-2 hover:bg-bg"
      >
        <Avatar initials={me.initials} />
        <span className="font-semibold">{me.name}</span>
        <ChevronDown aria-hidden className="size-4 text-text-muted" />
      </button>
      {open && (
        <div
          id="user-menu"
          className="absolute top-full right-0 z-10 mt-2 w-48 rounded-control border border-border bg-surface p-1 shadow-lg"
        >
          <button
            type="button"
            onClick={onSignOut}
            className="flex min-h-11 w-full items-center gap-2 rounded-control px-3 font-semibold hover:bg-bg"
          >
            <LogOut aria-hidden className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
