import { Badge, type BadgeProps } from '@/components/ui/badge';
import { OrderStatus } from '@/lib/api/types';

const MAP: Record<OrderStatus, { label: string; variant: BadgeProps['variant'] }> = {
  [OrderStatus.Pending]: { label: 'Pending', variant: 'warning' },
  [OrderStatus.Paid]: { label: 'Confirmed', variant: 'success' },
  [OrderStatus.Refunded]: { label: 'Refunded', variant: 'neutral' },
  [OrderStatus.Canceled]: { label: 'Cancelled', variant: 'neutral' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const entry = MAP[status] ?? { label: `Status ${status}`, variant: 'neutral' as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export function orderStatusLabel(status: OrderStatus): string {
  return MAP[status]?.label ?? `Status ${status}`;
}
