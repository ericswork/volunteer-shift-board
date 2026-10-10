import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { PRIMARY_BUTTON } from '../components/buttons';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { PageContainer } from '../components/layout/PageContainer';
import { MyShiftCard } from '../components/MyShiftCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useServerReady } from '../lib/server-health';
import { fetchMySignups } from '../lib/signups';

type When = 'upcoming' | 'past';

function useMySignups(when: When, enabled: boolean) {
  const serverReady = useServerReady();
  return useQuery({
    queryKey: ['my-signups', when],
    queryFn: () => fetchMySignups(when),
    enabled: serverReady && enabled,
  });
}

export function MyShiftsPage() {
  const [tab, setTab] = useState<When>('upcoming');
  const upcoming = useMySignups('upcoming', true);
  // Past shifts load only once someone opens that tab
  const past = useMySignups('past', tab === 'past');

  const total = upcoming.data?.total;
  const summary =
    total === undefined
      ? 'Loading your shifts…'
      : `${total} upcoming ${total === 1 ? 'shift' : 'shifts'}. Thanks for showing up for your community.`;

  return (
    <PageContainer>
      <div className="mx-auto max-w-[640px]">
        <h1 className="text-[30px] leading-[1.15] font-bold tracking-[-0.01em]">My shifts</h1>
        <p aria-live="polite" className="mt-2 text-lg text-text-muted">
          {upcoming.isError ? '' : summary}
        </p>

        <Tabs value={tab} onValueChange={(value) => setTab(value as When)} className="mt-6">
          <TabsList aria-label="Which shifts to show">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <SignupList
              query={upcoming}
              upcoming
              empty={
                <EmptyState title="You haven't signed up for any upcoming shifts.">
                  <Link to="/" className={`${PRIMARY_BUTTON} mt-5`}>
                    Browse events
                  </Link>
                </EmptyState>
              }
            />
            <p className="mt-6 text-[17px] text-text-muted">
              You can cancel up to 24 hours before a shift so someone else can take your spot.
            </p>
          </TabsContent>

          <TabsContent value="past">
            <SignupList query={past} upcoming={false} empty={<EmptyState title="No past shifts yet." />} />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}

function SignupList({
  query,
  upcoming,
  empty,
}: {
  query: ReturnType<typeof useMySignups>;
  upcoming: boolean;
  empty: ReactNode;
}) {
  if (query.isError) {
    return <ErrorState message="We couldn't load your shifts." onRetry={() => query.refetch()} />;
  }
  if (!query.data) {
    return (
      <p role="status" className="text-text-muted">
        Loading…
      </p>
    );
  }
  if (query.data.total === 0) return empty;

  return (
    <ul className="space-y-4">
      {query.data.signups.map((signup) => (
        <li key={signup.signupId}>
          <MyShiftCard signup={signup} upcoming={upcoming} />
        </li>
      ))}
    </ul>
  );
}
