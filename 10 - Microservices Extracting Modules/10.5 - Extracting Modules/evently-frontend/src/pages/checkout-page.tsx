import { useMemo } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';
import { useCart, useCreateOrder, useRemoveFromCart } from '@/features/ticketing/queries';
import { ordersApi } from '@/lib/api/endpoints';
import { formatMoney } from '@/lib/format';
import { Api } from '@/components/api-annotation';
import { BackButton } from '@/components/back-button';
import { EmptyState, ErrorState, PageLoader } from '@/components/feedback';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function CheckoutPage() {
  const navigate = useNavigate();
  const cartQuery = useCart();
  const removeItem = useRemoveFromCart();
  const createOrder = useCreateOrder();

  const items = useMemo(() => cartQuery.data?.items ?? [], [cartQuery.data]);
  const total = useMemo(
    () => items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0),
    [items],
  );
  const currency = items[0]?.currency ?? 'EUR';

  const placeOrder = () => {
    createOrder.mutate(undefined, {
      onError: (e) => toast.error(e.message),
      onSuccess: async () => {
        // POST orders returns no body — find the order we just created so we can
        // watch its tickets being issued.
        try {
          const orders = await ordersApi.list();
          const latest = [...orders].sort(
            (a, b) => +new Date(b.createdAtUtc) - +new Date(a.createdAtUtc),
          )[0];
          if (latest) {
            navigate({ to: '/orders/$orderId', params: { orderId: latest.id } });
            return;
          }
        } catch {
          /* fall through */
        }
        navigate({ to: '/orders' });
      },
    });
  };

  if (cartQuery.isLoading) return <PageLoader label="Loading your cart…" />;
  if (cartQuery.isError)
    return <ErrorState error={cartQuery.error} onRetry={() => cartQuery.refetch()} />;

  return (
    <div className="mx-auto max-w-2xl">
      <BackButton fallbackTo="/events" className="mb-4" />
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Review order</h1>
        <Api>GET carts</Api>
      </div>

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<ShoppingCart className="text-muted-foreground size-6" />}
            title="Your cart is empty"
            description="Add tickets from an event to check out."
            action={
              <Link to="/events" className={buttonVariants()}>
                Browse events
              </Link>
            }
          />
        </div>
      ) : (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item) => (
              <div key={item.ticketTypeId} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {Number(item.quantity)} × ticket type
                    <span className="text-muted-foreground ml-2 font-mono text-xs">
                      {item.ticketTypeId.slice(0, 8)}…
                    </span>
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {formatMoney(Number(item.price), item.currency)} each
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">
                    {formatMoney(Number(item.price) * Number(item.quantity), item.currency)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem.mutate(item.ticketTypeId)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}

            <Separator />

            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatMoney(total, currency)}</span>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Button size="lg" loading={createOrder.isPending} onClick={placeOrder}>
                Place order
              </Button>
              <Api>POST orders</Api>
            </div>

            <p className="text-muted-foreground text-xs leading-relaxed">
              Placing the order captures payment and clears the cart. Tickets are issued
              asynchronously by the Ticketing service once it consumes the order-confirmed event —
              the next screen watches that happen.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
