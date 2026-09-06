import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, ticketsApi } from '@/lib/api/endpoints';
import { qk } from '@/lib/query';

export function useEventStatistics(
  eventId: string | undefined,
  options?: { refetchInterval?: number },
) {
  return useQuery({
    queryKey: qk.eventStatistics.detail(eventId ?? ''),
    queryFn: () => attendanceApi.eventStatistics(eventId as string),
    enabled: !!eventId,
    refetchInterval: options?.refetchInterval,
  });
}

export interface ScanResult {
  outcome: 'valid' | 'not-found';
  code: string;
  ticket?: Awaited<ReturnType<typeof ticketsApi.byCode>>;
  message?: string;
}

/** Look a ticket up by scanned/typed code. A 404 is an expected outcome, not an error. */
export function useLookupTicket() {
  return useMutation<ScanResult, Error, string>({
    mutationFn: async (code: string) => {
      try {
        const ticket = await ticketsApi.byCode(code.trim());
        return { outcome: 'valid', code, ticket };
      } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 404) {
          return {
            outcome: 'not-found',
            code,
            message: 'Unknown code, or a ticket for a different event.',
          };
        }
        throw err;
      }
    },
  });
}

export function useCheckIn(eventId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) => attendanceApi.checkIn(ticketId),
    onSuccess: () => {
      if (eventId) {
        qc.invalidateQueries({ queryKey: qk.eventStatistics.detail(eventId) });
      }
    },
  });
}
