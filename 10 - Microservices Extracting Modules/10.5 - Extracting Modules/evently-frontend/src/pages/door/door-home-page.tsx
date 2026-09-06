import { Link } from '@tanstack/react-router';
import { BarChart3, DoorOpen } from 'lucide-react';
import { useEventsList } from '@/features/events/queries';
import { formatDateTimeUtc } from '@/lib/format';
import { Api } from '@/components/api-annotation';
import { EmptyState, ErrorState, PageLoader } from '@/components/feedback';
import { Card } from '@/components/ui/card';

export function DoorHomePage() {
  const eventsQuery = useEventsList();

  if (eventsQuery.isLoading) return <PageLoader label="Loading events…" />;
  if (eventsQuery.isError)
    return <ErrorState error={eventsQuery.error} onRetry={() => eventsQuery.refetch()} />;

  const events = eventsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Door &amp; attendance</h1>
        <Api>GET events</Api>
      </div>
      <p className="text-sm text-muted-foreground">
        Pick an event to open its check-in console or watch live statistics.
      </p>

      {events.length === 0 ? (
        <EmptyState title="No events to staff yet" />
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateTimeUtc(event.startsAtUtc)} · {event.location}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/door/$eventId"
                  params={{ eventId: event.id }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <DoorOpen className="size-4" />
                  Check-in
                </Link>
                <Link
                  to="/door/$eventId/stats"
                  params={{ eventId: event.id }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium hover:bg-accent"
                >
                  <BarChart3 className="size-4" />
                  Stats
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
