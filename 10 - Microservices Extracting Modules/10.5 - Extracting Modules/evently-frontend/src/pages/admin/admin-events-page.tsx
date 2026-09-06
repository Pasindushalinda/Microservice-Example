import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { BarChart3, CalendarClock, Plus, Send, X } from 'lucide-react';
import {
  useCancelEvent,
  useCategories,
  useEventsList,
  usePublishEvent,
  useRescheduleEvent,
} from '@/features/events/queries';
import { toLocalInputValue, fromLocalInputValue } from '@/lib/datetime-input';
import { formatDateTimeUtc } from '@/lib/format';
import { Api } from '@/components/api-annotation';
import { ErrorState, PageLoader } from '@/components/feedback';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/form-field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EventListItem } from '@/lib/api/types';

export function AdminEventsPage() {
  const eventsQuery = useEventsList();
  const categoriesQuery = useCategories();
  const publish = usePublishEvent();
  const cancel = useCancelEvent();

  const [rescheduleTarget, setRescheduleTarget] = useState<EventListItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<EventListItem | null>(null);

  const categoryName = (id: string) =>
    categoriesQuery.data?.find((c) => c.id === id)?.name ?? '—';

  if (eventsQuery.isLoading) return <PageLoader label="Loading events…" />;
  if (eventsQuery.isError)
    return <ErrorState error={eventsQuery.error} onRetry={() => eventsQuery.refetch()} />;

  const events = eventsQuery.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Events</h1>
            <Api>GET events</Api>
          </div>
          <p className="text-sm text-muted-foreground">
            10.5's <span className="font-mono">GET events</span> doesn't project lifecycle
            status, so every action is always offered. Cancel runs the cancel-event saga.
          </p>
        </div>
        <Link
          to="/admin/events/new"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          New event
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title / category</TableHead>
              <TableHead>Starts (UTC)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                  No events yet. Create one to get started.
                </TableCell>
              </TableRow>
            )}
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="font-medium">{event.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {categoryName(event.categoryId)}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDateTimeUtc(event.startsAtUtc)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="default"
                      loading={publish.isPending && publish.variables === event.id}
                      onClick={() =>
                        publish.mutate(event.id, {
                          onSuccess: () => toast.success('Publish requested'),
                          onError: (e) => toast.error((e as Error).message),
                        })
                      }
                    >
                      <Send className="size-3.5" />
                      Publish
                    </Button>
                    <Link
                      to="/admin/events/$eventId/edit"
                      params={{ eventId: event.id }}
                      className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-accent"
                    >
                      Edit
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => setRescheduleTarget(event)}>
                      <CalendarClock className="size-3.5" />
                      Reschedule
                    </Button>
                    <Link
                      to="/admin/events/$eventId/stats"
                      params={{ eventId: event.id }}
                      className="inline-flex h-8 items-center gap-1 rounded-md border px-3 text-xs font-medium hover:bg-accent"
                    >
                      <BarChart3 className="size-3.5" />
                      Stats
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setCancelTarget(event)}
                    >
                      <X className="size-3.5" />
                      Cancel
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Api>PUT events/{'{id}'}/publish</Api>
        <Api>PUT events/{'{id}'}/reschedule</Api>
        <Api>DELETE events/{'{id}'}/cancel</Api>
      </div>

      {rescheduleTarget && (
        <RescheduleDialog
          event={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
        />
      )}

      <Dialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
        <DialogHeader>
          <DialogTitle>Cancel “{cancelTarget?.title}”?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This starts the cancel-event saga: attendees are refunded and tickets voided
          asynchronously. It can't be undone.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCancelTarget(null)}>
            Keep event
          </Button>
          <Button
            variant="destructive"
            loading={cancel.isPending}
            onClick={() => {
              if (!cancelTarget) return;
              cancel.mutate(cancelTarget.id, {
                onSuccess: () => {
                  toast.success('Cancel-event saga started');
                  setCancelTarget(null);
                },
                onError: (e) => toast.error((e as Error).message),
              });
            }}
          >
            Start cancellation
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

function RescheduleDialog({
  event,
  onClose,
}: {
  event: EventListItem;
  onClose: () => void;
}) {
  const reschedule = useRescheduleEvent(event.id);
  const [startsAt, setStartsAt] = useState(toLocalInputValue(event.startsAtUtc));
  const [endsAt, setEndsAt] = useState(
    event.endsAtUtc ? toLocalInputValue(event.endsAtUtc) : '',
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogHeader>
        <DialogTitle>Reschedule “{event.title}”</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <Field label="Starts (UTC)" htmlFor="rs-start">
          <Input
            id="rs-start"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </Field>
        <Field label="Ends (UTC) — optional" htmlFor="rs-end">
          <Input
            id="rs-end"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </Field>
        <p className="text-xs text-muted-foreground">
          Publishing a reschedule fans an event-rescheduled integration event out to
          Ticketing and Attendance.
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          loading={reschedule.isPending}
          onClick={() =>
            reschedule.mutate(
              {
                startsAtUtc: fromLocalInputValue(startsAt),
                endsAtUtc: endsAt ? fromLocalInputValue(endsAt) : null,
              },
              {
                onSuccess: () => {
                  toast.success('Reschedule requested');
                  onClose();
                },
                onError: (e) => toast.error((e as Error).message),
              },
            )
          }
        >
          Save new time
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
