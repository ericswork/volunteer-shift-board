import { Link } from 'react-router';
import { PageContainer } from '../components/layout/PageContainer';

export function NotFoundPage() {
  return (
    <PageContainer>
      <h1 className="text-[30px] leading-[1.15] font-bold tracking-[-0.01em] sm:text-[40px]">
        Page not found
      </h1>
      <p className="mt-3 text-lg text-text-muted">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-11 items-center rounded-control bg-primary px-5 font-semibold text-white"
      >
        Back to all events
      </Link>
    </PageContainer>
  );
}
