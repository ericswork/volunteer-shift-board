import { Outlet, ScrollRestoration } from 'react-router';
import { ServerStatusNotice } from '../ServerStatusNotice';
import { Footer } from './Footer';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-page px-4 pt-6 empty:hidden sm:px-6">
          <ServerStatusNotice />
        </div>
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
