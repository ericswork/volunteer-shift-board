import { CalendarCheck, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';

const NAV_ITEMS = [
  { to: '/', label: 'Events', isActive: (path: string) => path === '/' || path.startsWith('/events') },
  { to: '/my-shifts', label: 'My shifts', isActive: (path: string) => path.startsWith('/my-shifts') },
];

export function Header() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuButton.current?.focus();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-page flex-wrap items-center gap-x-6 px-4 sm:px-6">
        <Link to="/" className="flex min-h-[72px] flex-1 items-center gap-3 text-lg font-bold">
          <span className="grid size-10 place-items-center rounded-control bg-primary text-white">
            <CalendarCheck aria-hidden className="size-[22px]" strokeWidth={2} />
          </span>
          <span className="hidden sm:inline">Volunteer Shift Board</span>
          <span className="sm:hidden">Shift Board</span>
        </Link>

        <button
          ref={menuButton}
          type="button"
          className="grid size-11 place-items-center rounded-control border border-input-border sm:hidden"
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
        </button>

        <nav
          id="primary-navigation"
          aria-label="Main"
          className={`${menuOpen ? 'flex' : 'hidden'} w-full flex-col gap-1 pb-4 sm:flex sm:w-auto sm:flex-row sm:pb-0`}
        >
          {NAV_ITEMS.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-11 items-center rounded-control px-4 text-[15px] font-semibold ${
                  active ? 'bg-primary-tint text-primary-ink' : 'text-text-muted hover:text-text'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Balances the wordmark so the nav sits centered; the user chip goes here in auth-and-roles */}
        <div className="hidden flex-1 sm:block" />
      </div>
    </header>
  );
}
