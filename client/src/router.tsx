import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { RequireAdmin, RequireAuth } from './components/RouteGuards';
import { CrashFallback } from './pages/CrashFallback';
import { EventDetailPage } from './pages/EventDetailPage';
import { EventsPage } from './pages/EventsPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Visitors land on the events pages, so everything behind sign-in (and the sign-in forms, with
// their form and validation libraries) downloads only when first opened
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const MyShiftsPage = lazy(() => import('./pages/MyShiftsPage').then((m) => ({ default: m.MyShiftsPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));

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
