import { Link } from '@tanstack/react-router';
import { TicketX } from 'lucide-react';
import { useOrderHistory, type TicketWithContext } from '@/features/ticketing/use-order-history';
import { formatDateTimeUtc } from '@/lib/format';
import { Api } from '@/components/api-annotation';
import { EmptyState, ErrorState, PageLoader } from '@/components/feedback';
import { OrdersTable } from '@/components/orders-table';
import { QrGlyph } from '@/components/qr-glyph';
import { Card } from '@/components/ui/card';

export function MyTicketsPage() {
  const { orders, tickets, isLoading, isError, error, refetch } = useOrderHistory();

  if (isLoading) return <PageLoader label="Loading your tickets…" />;
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">My tickets</h1>
          <Api>GET orders → GET tickets/order/{'{orderId}'}</Api>
        </div>

        {tickets.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={<TicketX className="size-6 text-muted-foreground" />}
              title="No tickets yet"
              description="Once an order's tickets are issued they'll show up here."
              action={
                <Link to="/events" className="text-sm text-primary hover:underline">
                  Browse events →
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Orders</h2>
        <OrdersTable orders={orders} />
      </section>
    </div>
  );
}

function TicketCard({ ticket }: { ticket: TicketWithContext }) {
  return (
    <Card className="flex overflow-hidden">
      <div className="flex-1 space-y-1 p-4">
        {ticket.eventStartsAtUtc && (
          <p className="text-xs text-muted-foreground">
            {formatDateTimeUtc(ticket.eventStartsAtUtc)}
          </p>
        )}
        <p className="text-lg font-semibold leading-tight">{ticket.eventTitle}</p>
        {ticket.eventLocation && (
          <p className="text-sm text-muted-foreground">{ticket.eventLocation}</p>
        )}
        <p className="pt-2 font-mono text-xs">Code · {ticket.code}</p>
      </div>
      <div className="grid w-24 place-items-center border-l border-dashed bg-muted/40 p-3">
        <QrGlyph seed={ticket.code} className="w-full" />
      </div>
    </Card>
  );
}
