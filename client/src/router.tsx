import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { RequireAdmin, RequireAuth } from './components/RouteGuards';
import { CrashFallback } from './pages/CrashFallback';
import { EventDetailPage } from './pages/EventDetailPage';
import { EventsPage } from './pages/EventsPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

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
          {
            element: <RequireAuth />,
            children: [
              { path: 'my-shifts', element: <PlaceholderPage title="My shifts" /> },
              {
                element: <RequireAdmin />,
                children: [{ path: 'admin', element: <PlaceholderPage title="Manage events" /> }],
              },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
