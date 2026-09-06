import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ticketsApi } from '@/lib/api/endpoints';
import { qk } from '@/lib/query';
import { useEventsList } from '@/features/events/queries';
import { useOrders } from './queries';
import type { OrderListItem, Ticket } from '@/lib/api/types';

export interface TicketWithContext extends Ticket {
  eventTitle: string;
  eventLocation: string;
  eventStartsAtUtc?: string;
  order?: OrderListItem;
}

/** Fans GET orders → GET tickets/order/{id} out and joins in event metadata. */
export function useOrderHistory() {
  const ordersQuery = useOrders();
  const eventsQuery = useEventsList();

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

  const ticketQueries = useQueries({
    queries: orders.map((order) => ({
      queryKey: qk.tickets.forOrder(order.id),
      queryFn: () => ticketsApi.forOrder(order.id),
      enabled: orders.length > 0,
    })),
  });

  const eventsById = useMemo(
    () => new Map((eventsQuery.data ?? []).map((e) => [e.id, e])),
    [eventsQuery.data],
  );

  const tickets = useMemo<TicketWithContext[]>(() => {
    return ticketQueries.flatMap((q, i) => {
      const order = orders[i];
      return (q.data ?? []).map((ticket) => {
        const event = eventsById.get(ticket.eventId);
        return {
          ...ticket,
          order,
          eventTitle: event?.title ?? 'Event',
          eventLocation: event?.location ?? '',
          eventStartsAtUtc: event?.startsAtUtc,
        };
      });
    });
  }, [ticketQueries, orders, eventsById]);

  return {
    orders,
    tickets,
    isLoading: ordersQuery.isLoading || ticketQueries.some((q) => q.isLoading),
    isError: ordersQuery.isError,
    error: ordersQuery.error,
    refetch: () => {
      ordersQuery.refetch();
      ticketQueries.forEach((q) => q.refetch());
    },
  };
}
