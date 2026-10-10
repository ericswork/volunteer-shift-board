import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { shouldRetry } from './lib/api';
import { AuthProvider } from './lib/auth';
import { ServerHealthProvider } from './lib/server-health';
import { router } from './router';
import './styles.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: shouldRetry } } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ServerHealthProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ServerHealthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
