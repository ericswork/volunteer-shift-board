import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { ServerStatusNotice } from '../ServerStatusNotice';
import { Toaster } from '../ui/sonner';
import { Footer } from './Footer';
import { Header } from './Header';
import { PageContainer } from './PageContainer';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-page px-4 pt-6 empty:hidden sm:px-6">
          <ServerStatusNotice />
        </div>
        {/* Shown only on a first visit straight to a lazy page; in-app navigation keeps the old
            page on screen until the new one has loaded */}
        <Suspense
          fallback={
            <PageContainer>
              <p role="status" className="text-lg text-text-muted">
                Loading…
              </p>
            </PageContainer>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <Toaster />
      <ScrollRestoration />
    </div>
  );
}
