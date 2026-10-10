import { lazy, type ComponentType } from 'react';
import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { RequireAdmin, RequireAuth } from './components/RouteGuards';
import { CrashFallback } from './pages/CrashFallback';
import { EventDetailPage } from './pages/EventDetailPage';
import { EventsPage } from './pages/EventsPage';
import { NotFoundPage } from './pages/NotFoundPage';

const RELOADED_KEY = 'reloaded-for-missing-page-file';

// A tab opened before a deploy asks for page files the deploy removed, and Vercel answers with
// index.html, so the import fails. One reload fetches the new version; the flag stops a reload loop
// when the file is missing for any other reason.
function lazyPage(load: () => Promise<ComponentType>) {
  return lazy(async () => {
    try {
      const Page = await load();
      sessionStorage.removeItem(RELOADED_KEY);
      return { default: Page };
    } catch (error) {
      if (sessionStorage.getItem(RELOADED_KEY)) throw error;
      sessionStorage.setItem(RELOADED_KEY, 'yes');
      location.reload();
      return new Promise<never>(() => {});
    }
  });
}

// Visitors land on the events pages, so everything behind sign-in (and the sign-in forms, with
// their form and validation libraries) downloads only when first opened
const LoginPage = lazyPage(() => import('./pages/LoginPage').then((m) => m.LoginPage));
const RegisterPage = lazyPage(() => import('./pages/RegisterPage').then((m) => m.RegisterPage));
const MyShiftsPage = lazyPage(() => import('./pages/MyShiftsPage').then((m) => m.MyShiftsPage));
const AdminPage = lazyPage(() => import('./pages/AdminPage').then((m) => m.AdminPage));

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <CrashFallback />,
    children: [
      {
        // Catches page errors inside the layout, so the header and footer stay visible
        errorElement: <CrashFallback />,
        children: [
          { index: true, element: <EventsPage /> },
          { path: 'events/:eventId', element: <EventDetailPage /> },
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          {
            element: <RequireAuth />,
            children: [
              { path: 'my-shifts', element: <MyShiftsPage /> },
              {
                element: <RequireAdmin />,
                children: [{ path: 'admin', element: <AdminPage /> }],
              },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
