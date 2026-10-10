import type { ReactNode } from 'react';

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-page px-4 py-8 sm:px-6 sm:py-12">{children}</div>;
}
