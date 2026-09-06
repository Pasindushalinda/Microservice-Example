import { useMemo, useState } from 'react';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { ArrowRight, Ticket as TicketIcon } from 'lucide-react';
import { useEvent, useTicketTypes } from '@/features/events/queries';
import { useAddToCart, useCart, useRemoveFromCart } from '@/features/ticketing/queries';
import { useSession } from '@/lib/auth/useSession';
import { formatEventWindow, formatMoney } from '@/lib/format';
import { Api } from '@/components/api-annotation';
import { BackButton } from '@/components/back-button';
import { EventImage } from '@/components/event-image';
import { ErrorState, PageLoader } from '@/components/feedback';
import { QuantityStepper } from '@/components/quantity-stepper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { TicketType } from '@/lib/api/types';

const routeApi = getRouteApi('/app/events/$eventId');

export function EventDetailPage() {
  const { eventId } = routeApi.useParams();
  const eventQuery = useEvent(eventId);
  const ticketTypesQuery = useTicketTypes(eventId);

  if (eventQuery.isLoading) return <PageLoader label="Loading event…" />;
  if (eventQuery.isError)
    return <ErrorState error={eventQuery.error} onRetry={() => eventQuery.refetch()} />;

  const event = eventQuery.data!;
  const ticketTypes =
    ticketTypesQuery.data ??
    event.ticketTypes.map((t) => ({
      id: t.ticketTypeId,
      eventId: event.id,
      name: t.name,
      price: t.price,
      currency: t.currency,
      quantity: t.quantity,
    }));

  return (
    <div className="space-y-6">
      <BackButton fallbackTo="/events" label="Back to events" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="space-y-6">
          <EventImage title={event.title} className="h-48 w-full" />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">Category</Badge>
              <span className="text-muted-foreground text-sm">
                {formatEventWindow(event.startsAtUtc, event.endsAtUtc)}
              </span>
            </div>
            <h1 className="text-3xl leading-tight font-semibold">{event.title}</h1>
            <p className="text-muted-foreground">{event.location}</p>
          </div>

          <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
            {event.description}
          </p>

          <section>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">Tickets</h2>
              <Api>GET ticket-types?eventId=</Api>
            </div>

            {ticketTypesQuery.isLoading ? (
              <PageLoader label="Loading ticket types…" />
            ) : ticketTypes.length === 0 ? (
              <p className="text-muted-foreground mt-3 text-sm">
                No ticket types have been published for this event yet.
              </p>
            ) : (
              <Card className="mt-3 divide-y divide-dashed">
                <div className="bg-muted/50 text-muted-foreground grid grid-cols-[minmax(0,1fr)_100px_90px_auto] gap-3 px-4 py-2 text-xs font-semibold tracking-wide uppercase">
                  <span>Name</span>
                  <span>Price</span>
                  <span>Capacity</span>
                  <span className="text-right">Add</span>
                </div>
                {ticketTypes.map((tt) => (
                  <TicketTypeRow key={tt.id} ticketType={tt} />
                ))}
              </Card>
            )}
          </section>
        </article>

        <OrderRail eventId={event.id} ticketTypes={ticketTypes} />
      </div>
    </div>
  );
}

function TicketTypeRow({ ticketType }: { ticketType: TicketType }) {
  const { isAuthenticated, signIn } = useSession();
  const [qty, setQty] = useState(1);
  const addToCart = useAddToCart();

  const soldOut = Number(ticketType.quantity) <= 0;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_100px_90px_auto] items-center gap-3 px-4 py-3">
      <span className="font-medium">{ticketType.name}</span>
      <span className="text-sm">{formatMoney(ticketType.price, ticketType.currency)}</span>
      <span className="text-muted-foreground text-sm">
        {soldOut ? 'sold out' : Number(ticketType.quantity)}
      </span>
      <div className="flex items-center justify-end gap-2">
        {soldOut ? (
          <span className="text-muted-foreground text-sm">—</span>
        ) : (
          <>
            <QuantityStepper value={qty} min={1} max={20} onChange={setQty} />
            <Button
              size="sm"
              loading={addToCart.isPending}
              onClick={() => {
                if (!isAuthenticated) return signIn();
                addToCart.mutate(
                  { ticketTypeId: ticketType.id, quantity: qty },
                  {
                    onSuccess: () => toast.success(`Added ${qty} × ${ticketType.name}`),
                    onError: (e) => toast.error(e.message),
                  },
                );
              }}
            >
              Add
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function OrderRail({ eventId, ticketTypes }: { eventId: string; ticketTypes: TicketType[] }) {
  const { isAuthenticated, signIn } = useSession();
  const navigate = useNavigate();
  const cartQuery = useCart();
  const removeFromCart = useRemoveFromCart();

  const nameById = useMemo(() => new Map(ticketTypes.map((t) => [t.id, t.name])), [ticketTypes]);

  const items = cartQuery.data?.items ?? [];
  const total = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);
  const currency = items[0]?.currency ?? 'EUR';

  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your cart</h2>
          <Api>GET carts</Api>
        </div>

        {!isAuthenticated ? (
          <div className="mt-4 space-y-3">
            <p className="text-muted-foreground text-sm">
              Sign in to add tickets — the cart lives in Redis, keyed to your account.
            </p>
            <Button className="w-full" onClick={signIn}>
              Sign in to buy
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-4 space-y-3">
              {items.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Your cart is empty. Add a ticket type to get started.
                </p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.ticketTypeId}
                    className="flex items-start justify-between gap-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {Number(item.quantity)} × {nameById.get(item.ticketTypeId) ?? 'Ticket'}
                      </p>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive text-xs underline-offset-2 hover:underline"
                        onClick={() => removeFromCart.mutate(item.ticketTypeId)}
                      >
                        Remove
                      </button>
                    </div>
                    <span>
                      {formatMoney(Number(item.price) * Number(item.quantity), item.currency)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatMoney(total, currency)}</span>
            </div>

            <Button
              className="mt-4 w-full"
              disabled={items.length === 0}
              onClick={() => navigate({ to: '/checkout' })}
            >
              Checkout
              <ArrowRight className="size-4" />
            </Button>
            <p className="mt-2 text-center">
              <Api>POST orders</Api>
            </p>
          </>
        )}

        <p className="text-muted-foreground mt-4 flex items-center gap-1.5 text-xs">
          <TicketIcon className="size-3.5" />
          Steppers write through <span className="font-mono">PUT carts/add</span>.
        </p>
      </Card>

      <span className="sr-only">{eventId}</span>
    </aside>
  );
}
