import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't hammer the gateway on auth / client errors.
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

/** Query key factory — keeps invalidation call-sites honest. */
export const qk = {
  events: {
    all: ['events'] as const,
    list: () => [...qk.events.all, 'list'] as const,
    search: (params: unknown) => [...qk.events.all, 'search', params] as const,
    detail: (id: string) => [...qk.events.all, 'detail', id] as const,
  },
  ticketTypes: {
    all: ['ticket-types'] as const,
    forEvent: (eventId: string) => [...qk.ticketTypes.all, 'event', eventId] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: () => [...qk.categories.all, 'list'] as const,
  },
  cart: {
    all: ['cart'] as const,
  },
  orders: {
    all: ['orders'] as const,
    list: () => [...qk.orders.all, 'list'] as const,
    detail: (id: string) => [...qk.orders.all, 'detail', id] as const,
  },
  tickets: {
    all: ['tickets'] as const,
    forOrder: (orderId: string) => [...qk.tickets.all, 'order', orderId] as const,
    byCode: (code: string) => [...qk.tickets.all, 'code', code] as const,
  },
  eventStatistics: {
    detail: (eventId: string) => ['event-statistics', eventId] as const,
  },
  profile: {
    me: ['profile', 'me'] as const,
  },
  permissions: {
    me: ['permissions', 'me'] as const,
  },
};
