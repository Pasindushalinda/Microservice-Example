import { useOrders } from '@/features/ticketing/queries';
import { Api } from '@/components/api-annotation';
import { ErrorState, PageLoader } from '@/components/feedback';
import { OrdersTable } from '@/components/orders-table';

export function OrdersPage() {
  const ordersQuery = useOrders();

  if (ordersQuery.isLoading) return <PageLoader label="Loading orders…" />;
  if (ordersQuery.isError)
    return <ErrorState error={ordersQuery.error} onRetry={() => ordersQuery.refetch()} />;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <Api>GET orders</Api>
      </div>
      <OrdersTable orders={ordersQuery.data ?? []} />
    </div>
  );
}
