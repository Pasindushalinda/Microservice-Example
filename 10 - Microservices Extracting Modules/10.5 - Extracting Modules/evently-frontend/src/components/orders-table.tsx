import { Link } from '@tanstack/react-router';
import { formatShortDateTime, formatMoney } from '@/lib/format';
import { OrderStatusBadge } from '@/components/order-status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { OrderListItem } from '@/lib/api/types';

export function OrdersTable({ orders }: { orders: OrderListItem[] }) {
  if (orders.length === 0) {
    return <p className="text-sm text-muted-foreground">No orders yet.</p>;
  }
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Created</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right">&nbsp;</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="whitespace-nowrap text-sm">
                {formatShortDateTime(order.createdAtUtc)}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {order.id.slice(0, 8)}…
              </TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell>{formatMoney(order.totalPrice)}</TableCell>
              <TableCell className="text-right">
                <Link
                  to="/orders/$orderId"
                  params={{ orderId: order.id }}
                  className="text-sm text-primary hover:underline"
                >
                  view
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
