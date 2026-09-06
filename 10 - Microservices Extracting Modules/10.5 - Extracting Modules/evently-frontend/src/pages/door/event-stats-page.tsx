import { getRouteApi } from '@tanstack/react-router';
import { EventStatsView } from '@/pages/event-stats-view';

const routeApi = getRouteApi('/app/door/$eventId/stats');

export function DoorEventStatsPage() {
  const { eventId } = routeApi.useParams();
  return <EventStatsView eventId={eventId} backTo="/door" />;
}
