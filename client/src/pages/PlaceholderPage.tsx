import { PageContainer } from '../components/layout/PageContainer';

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <PageContainer>
      <h1 className="text-[30px] leading-[1.15] font-bold tracking-[-0.01em] sm:text-[40px]">{title}</h1>
      <p className="mt-3 text-lg text-text-muted">This page arrives in a later change.</p>
    </PageContainer>
  );
}
