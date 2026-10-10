import type { ReactNode } from 'react';

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-surface px-6 py-12 text-center">
      <p className="text-xl font-bold">{title}</p>
      {children}
    </div>
  );
}
