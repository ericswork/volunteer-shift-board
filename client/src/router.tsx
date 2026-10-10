import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { CrashFallback } from './pages/CrashFallback';
import { EventDetailPage } from './pages/EventDetailPage';
import { EventsPage } from './pages/EventsPage';
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
          { path: 'my-shifts', element: <PlaceholderPage title="My shifts" /> },
          { path: 'admin', element: <PlaceholderPage title="Manage events" /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
