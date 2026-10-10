import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { CrashFallback } from './pages/CrashFallback';
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
          { index: true, element: <PlaceholderPage title="Find a shift that fits your week" /> },
          { path: 'events/:eventId', element: <PlaceholderPage title="Event details" /> },
          { path: 'my-shifts', element: <PlaceholderPage title="My shifts" /> },
          { path: 'admin', element: <PlaceholderPage title="Manage events" /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
