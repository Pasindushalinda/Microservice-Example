import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi, ordersApi, ticketsApi } from '@/lib/api/endpoints';
import { qk } from '@/lib/query';
import { useSession } from '@/lib/auth/useSession';

export function useCart() {
  const { isAuthenticated } = useSession();
  return useQuery({
    queryKey: qk.cart.all,
    queryFn: cartApi.get,
    enabled: isAuthenticated,
    staleTime: 0,
  });
}

export function useCartCount() {
  const { data } = useCart();
  return (data?.items ?? []).reduce((sum, item) => sum + Number(item.quantity), 0);
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketTypeId, quantity }: { ticketTypeId: string; quantity: number }) =>
      cartApi.add(ticketTypeId, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.cart.all }),
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ticketTypeId: string) => cartApi.remove(ticketTypeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.cart.all }),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.cart.all }),
  });
}

export function useOrders() {
  const { isAuthenticated } = useSession();
  return useQuery({
    queryKey: qk.orders.list(),
    queryFn: ordersApi.list,
    enabled: isAuthenticated,
  });
}

export function useOrder(id: string | undefined, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: qk.orders.detail(id ?? ''),
    queryFn: () => ordersApi.get(id as string),
    enabled: !!id,
    refetchInterval: options?.refetchInterval,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => ordersApi.create(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.cart.all });
      qc.invalidateQueries({ queryKey: qk.orders.all });
    },
  });
}

/**
 * Tickets for an order. Polls while the list is still empty — the Ticketing
 * service issues tickets asynchronously once it consumes the order-confirmed
 * event, so an order can briefly have zero tickets.
 */
export function useOrderTickets(
  orderId: string | undefined,
  { expected, poll = true }: { expected?: number; poll?: boolean } = {},
) {
  return useQuery({
    queryKey: qk.tickets.forOrder(orderId ?? ''),
    queryFn: () => ticketsApi.forOrder(orderId as string),
    enabled: !!orderId,
    refetchInterval: (query) => {
      if (!poll) return false;
      const data = query.state.data ?? [];
      if (expected != null) return data.length >= expected ? false : 2500;
      return data.length > 0 ? false : 2500;
    },
  });
}

export function useTicketByCode(code: string | undefined) {
  return useQuery({
    queryKey: qk.tickets.byCode(code ?? ''),
    queryFn: () => ticketsApi.byCode(code as string),
    enabled: !!code,
    retry: false,
  });
}
