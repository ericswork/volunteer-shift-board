import { Link, Navigate, Outlet, useLocation } from 'react-router';
import { useAuth, useMe } from '../lib/auth';
import { PRIMARY_BUTTON } from './buttons';
import { ErrorState } from './ErrorState';
import { PageContainer } from './layout/PageContainer';

function Loading() {
  return (
    <PageContainer>
      <p role="status" className="text-lg text-text-muted">
        Loading…
      </p>
    </PageContainer>
  );
}

export function RequireAuth() {
  const authState = useAuth();
  const { pathname, search } = useLocation();

  if (authState.status === 'loading') return <Loading />;
  if (authState.status === 'signed-out') {
    return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />;
  }
  return <Outlet />;
}

// Only the server enforces roles; this keeps admin pages from even requesting data for volunteers
export function RequireAdmin() {
  const me = useMe();

  if (me.isError) {
    return (
      <PageContainer>
        <ErrorState message="We couldn't check your account." onRetry={() => me.refetch()} />
      </PageContainer>
    );
  }
  if (!me.data) return <Loading />;
  if (me.data.role !== 'admin') {
    return (
      <PageContainer>
        <h1 className="text-[30px] leading-[1.15] font-bold tracking-[-0.01em] sm:text-[40px]">
          You don't have access to this page.
        </h1>
        <p className="mt-3 text-lg text-text-muted">This page is for event organizers only.</p>
        <Link to="/" className={`${PRIMARY_BUTTON} mt-6`}>
          Back to all events
        </Link>
      </PageContainer>
    );
  }
  return <Outlet />;
}
