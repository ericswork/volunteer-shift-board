import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { PageContainer } from '../components/layout/PageContainer';

export function CrashFallback() {
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer>
      <div role="alert">
        <h1 className="text-[30px] leading-[1.15] font-bold tracking-[-0.01em] sm:text-[40px]">
          Something went wrong
        </h1>
        <p className="mt-3 text-lg text-text-muted">
          This page ran into an unexpected problem. Reloading usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex min-h-11 items-center rounded-control bg-primary px-5 font-semibold text-white"
        >
          Reload page
        </button>
      </div>
    </PageContainer>
  );
}
