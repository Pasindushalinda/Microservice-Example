import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { categoriesApi, eventsApi, ticketTypesApi } from '@/lib/api/endpoints';
import { qk } from '@/lib/query';
import type {
  CreateEventRequest,
  CreateTicketTypeRequest,
  RescheduleEventRequest,
  SearchEventsParams,
} from '@/lib/api/types';

export function useEventsList() {
  return useQuery({ queryKey: qk.events.list(), queryFn: eventsApi.list });
}

export function useSearchEvents(params: SearchEventsParams) {
  return useQuery({
    queryKey: qk.events.search(params),
    queryFn: () => eventsApi.search(params),
    placeholderData: keepPreviousData,
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: qk.events.detail(id ?? ''),
    queryFn: () => eventsApi.get(id as string),
    enabled: !!id,
  });
}

export function useTicketTypes(eventId: string | undefined) {
  return useQuery({
    queryKey: qk.ticketTypes.forEvent(eventId ?? ''),
    queryFn: () => ticketTypesApi.listForEvent(eventId as string),
    enabled: !!eventId,
  });
}

export function useCategories() {
  return useQuery({ queryKey: qk.categories.list(), queryFn: categoriesApi.list });
}

// --- mutations ---------------------------------------------------------------

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateEventRequest) => eventsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.events.all }),
  });
}

export function usePublishEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsApi.publish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.events.all }),
  });
}

export function useRescheduleEvent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RescheduleEventRequest) => eventsApi.reschedule(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.events.all }),
  });
}

export function useCancelEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.events.all }),
  });
}

export function useCreateTicketType(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTicketTypeRequest) => ticketTypesApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.ticketTypes.forEvent(eventId) });
      qc.invalidateQueries({ queryKey: qk.events.detail(eventId) });
    },
  });
}

export function useChangeTicketTypePrice(eventId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) =>
      ticketTypesApi.changePrice(id, price),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.ticketTypes.forEvent(eventId) });
      qc.invalidateQueries({ queryKey: qk.events.detail(eventId) });
    },
  });
}

// --- categories mutations --------------------------------------------------

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => categoriesApi.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories.all }),
  });
}

export function useRenameCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      categoriesApi.rename(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories.all }),
  });
}

export function useArchiveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories.all }),
  });
}
