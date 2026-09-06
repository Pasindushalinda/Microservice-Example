import { getRouteApi } from '@tanstack/react-router';
import { EventStatsView } from '@/pages/event-stats-view';

const routeApi = getRouteApi('/admin/events/$eventId/stats');

export function AdminEventStatsPage() {
  const { eventId } = routeApi.useParams();
  return <EventStatsView eventId={eventId} backTo="/admin/events" />;
}
