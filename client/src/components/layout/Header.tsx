import { CalendarCheck, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth, useMe, useSignOut } from '../../lib/auth';
import { Avatar } from '../Avatar';
import { UserMenu } from './UserMenu';

const NAV_ITEMS = [
  { to: '/', label: 'Events', isActive: (path: string) => path === '/' || path.startsWith('/events') },
  { to: '/my-shifts', label: 'My shifts', isActive: (path: string) => path.startsWith('/my-shifts') },
];
const ADMIN_ITEM = { to: '/admin', label: 'Admin', isActive: (path: string) => path.startsWith('/admin') };

const NAV_LINK = 'inline-flex min-h-11 items-center rounded-control px-4 text-[15px] font-semibold';

export function Header() {
  const { pathname, search } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const authState = useAuth();
  const me = useMe();
  const signOut = useSignOut();

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

  // The Admin link is only a convenience; the server refuses admin requests from anyone else
  const navItems = me.data?.role === 'admin' ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;
  const loginHref =
    pathname === '/login' ? '/login' : `/login?next=${encodeURIComponent(pathname + search)}`;
  const signedOut = authState.status === 'signed-out';

  const handleSignOut = () => {
    setMenuOpen(false);
    void signOut();
  };

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
          {navItems.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={`${NAV_LINK} ${
                  active ? 'bg-primary-tint text-primary-ink' : 'text-text-muted hover:text-text'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {(signedOut || me.data) && (
            <div className="mt-2 border-t border-divider pt-3 sm:hidden">
              {signedOut && (
                <Link to={loginHref} className={`${NAV_LINK} text-text`}>
                  Log in
                </Link>
              )}
              {me.data && (
                <>
                  <div className="flex items-center gap-3 px-4 py-2">
                    <Avatar initials={me.data.initials} />
                    <span className="font-semibold">{me.data.name}</span>
                  </div>
                  <button type="button" onClick={handleSignOut} className={`${NAV_LINK} w-full gap-2`}>
                    <LogOut aria-hidden className="size-4" />
                    Sign out
                  </button>
                </>
              )}
            </div>
          )}
        </nav>

        <div className="hidden flex-1 justify-end sm:flex">
          {signedOut && (
            <Link
              to={loginHref}
              className="inline-flex min-h-11 items-center rounded-control border border-input-border px-4 font-semibold hover:bg-bg"
            >
              Log in
            </Link>
          )}
          {me.data && <UserMenu me={me.data} onSignOut={handleSignOut} />}
        </div>
      </div>
    </header>
  );
}
