import { useEffect, useState, type ReactNode } from 'react';
import { getRouteApi, Link } from '@tanstack/react-router';
import { CheckCircle2, Circle, Loader2, RefreshCw } from 'lucide-react';
import { useOrder, useOrderTickets } from '@/features/ticketing/queries';
import { OrderStatus } from '@/lib/api/types';
import { orderStatusLabel } from '@/components/order-status-badge';
import { formatMoney, formatShortDateTime } from '@/lib/format';
import { Api } from '@/components/api-annotation';
import { BackButton } from '@/components/back-button';
import { ErrorState, PageLoader } from '@/components/feedback';
import { QrGlyph } from '@/components/qr-glyph';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const routeApi = getRouteApi('/app/orders/$orderId');

export function OrderDetailPage() {
  const { orderId } = routeApi.useParams();
  const [elapsed, setElapsed] = useState(0);

  const orderQuery = useOrder(orderId, { refetchInterval: 4000 });
  const expected =
    orderQuery.data?.orderItems.reduce((n, i) => n + Number(i.quantity), 0) ?? undefined;

  const ticketsQuery = useOrderTickets(orderId, { expected });
  const tickets = ticketsQuery.data ?? [];
  const issued = expected != null && tickets.length >= expected;

  useEffect(() => {
    if (issued) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [issued]);

  if (orderQuery.isLoading) return <PageLoader label="Loading your order…" />;
  if (orderQuery.isError)
    return <ErrorState error={orderQuery.error} onRetry={() => orderQuery.refetch()} />;

  const order = orderQuery.data!;
  const takingLong = !issued && elapsed > 30;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton fallbackTo="/orders" label="Back to orders" />
      {issued ? (
        <Card className="border-success/40 bg-success/5 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-success size-6" />
            <div>
              <p className="text-success text-lg font-semibold">Tickets issued</p>
              <p className="text-muted-foreground text-sm">
                All {expected} tickets are ready. They're also on your{' '}
                <Link to="/tickets" className="underline">
                  My tickets
                </Link>{' '}
                page.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-warning/40 bg-warning/5 p-5">
          <div className="flex items-center gap-3">
            <Loader2 className="text-warning size-6 animate-spin" />
            <div>
              <p className="text-warning text-lg font-semibold">
                Order placed — issuing your tickets
              </p>
              <p className="text-muted-foreground text-sm">
                Payment captured. Tickets are created by the Ticketing service once the order event
                is consumed — usually a few seconds. This page refreshes itself.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Api>GET orders/{'{id}'} → Status</Api>
            <Api>GET tickets/order/{'{orderId}'} → poll until non-empty</Api>
          </div>
          {takingLong && (
            <p className="bg-warning/10 text-warning mt-3 rounded-md px-3 py-2 text-sm">
              This is taking longer than usual. The order is safe — tickets will appear here as soon
              as the Ticketing service catches up.
            </p>
          )}
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Order</h2>
          <span className="text-muted-foreground font-mono text-xs">{order.id}</span>
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Status">
            {orderStatusLabel(order.status)}
            {order.status === OrderStatus.Pending && ' → Confirmed'}
          </Row>
          <Row label="Total">{formatMoney(order.totalPrice)}</Row>
          <Row label="Placed">{formatShortDateTime(order.createdAtUtc)} UTC</Row>
        </dl>

        <ol className="mt-5 space-y-0">
          <TimelineStep
            done
            label="Order created"
            detail={`Status ${orderStatusLabel(order.status)} · ${formatMoney(order.totalPrice)}`}
          />
          <TimelineConnector done />
          <TimelineStep done label="Order confirmed event published" detail="outbox → RabbitMQ" />
          <TimelineConnector done={issued} />
          <TimelineStep
            done={issued}
            label="Tickets issued"
            detail={
              expected == null
                ? 'waiting…'
                : issued
                  ? `${tickets.length} of ${expected} ready`
                  : `waiting — ${tickets.length} of ${expected} issued`
            }
          />
        </ol>
      </Card>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Tickets</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              orderQuery.refetch();
              ticketsQuery.refetch();
            }}
          >
            <RefreshCw className="size-4" />
            Refresh now
          </Button>
        </div>

        <div className="mt-3 space-y-2">
          {expected != null &&
            Array.from({ length: expected }).map((_, i) => {
              const ticket = tickets[i];
              return (
                <div
                  key={ticket?.id ?? `pending-${i}`}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-lg border p-3',
                    !ticket && 'text-muted-foreground border-dashed',
                  )}
                >
                  <div>
                    <p className="font-medium">Ticket {i + 1}</p>
                    <p className="font-mono text-xs">{ticket ? ticket.code : 'code pending…'}</p>
                  </div>
                  {ticket ? (
                    <QrGlyph seed={ticket.code} className="size-14" />
                  ) : (
                    <div className="size-14 rounded-sm border border-dashed" />
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function TimelineStep({ done, label, detail }: { done?: boolean; label: string; detail: string }) {
  return (
    <li className="flex items-start gap-3">
      {done ? (
        <CheckCircle2 className="text-foreground mt-0.5 size-4 shrink-0" />
      ) : (
        <Circle className="text-warning mt-0.5 size-4 shrink-0" />
      )}
      <div>
        <p className={cn('text-sm font-medium', !done && 'text-warning')}>{label}</p>
        <p className="text-muted-foreground text-xs">{detail}</p>
      </div>
    </li>
  );
}

function TimelineConnector({ done }: { done?: boolean }) {
  return <li className={cn('ml-2 h-4 w-px', done ? 'bg-foreground' : 'bg-warning')} aria-hidden />;
}
