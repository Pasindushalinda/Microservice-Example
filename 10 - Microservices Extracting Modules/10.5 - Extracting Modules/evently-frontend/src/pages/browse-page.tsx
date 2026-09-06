import { getRouteApi } from '@tanstack/react-router';
import { CalendarSearch } from 'lucide-react';
import { useCategories, useSearchEvents } from '@/features/events/queries';
import { Api } from '@/components/api-annotation';
import { EventCard } from '@/components/event-card';
import { EmptyState, ErrorState } from '@/components/feedback';
import { Pagination } from '@/components/pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const routeApi = getRouteApi('/app/events');
const PAGE_SIZE = 15;

export function BrowsePage() {
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const categoriesQuery = useCategories();
  const eventsQuery = useSearchEvents({
    categoryId: search.categoryId,
    startDate: search.startDate,
    endDate: search.endDate,
    page: search.page ?? 0,
    pageSize: PAGE_SIZE,
  });

  const setSearch = (patch: Partial<typeof search>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const categoryName = (id: string) =>
    categoriesQuery.data?.find((c) => c.id === id)?.name;

  const activeCategory = search.categoryId;
  const total = eventsQuery.data?.totalCount ?? 0;
  const page = eventsQuery.data?.page ?? search.page ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Filters</h2>
            <Api>GET categories</Api>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Only published events come back — the search projection is fed by the
            event-published integration event.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <div className="space-y-1.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={!activeCategory}
                onChange={() => setSearch({ categoryId: undefined, page: 0 })}
              />
              All categories
            </label>
            {categoriesQuery.data
              ?.filter((c) => !c.isArchived)
              .map((c) => (
                <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={activeCategory === c.id}
                    onChange={() =>
                      setSearch({
                        categoryId: activeCategory === c.id ? undefined : c.id,
                        page: 0,
                      })
                    }
                  />
                  {c.name}
                </label>
              ))}
            {categoriesQuery.isLoading &&
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-5 w-32" />)}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Date range</Label>
          <div className="space-y-2">
            <Input
              type="date"
              aria-label="Start date"
              value={search.startDate ?? ''}
              onChange={(e) => setSearch({ startDate: e.target.value || undefined, page: 0 })}
            />
            <Input
              type="date"
              aria-label="End date"
              value={search.endDate ?? ''}
              onChange={(e) => setSearch({ endDate: e.target.value || undefined, page: 0 })}
            />
          </div>
        </div>
      </aside>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">Upcoming events</h1>
            <Api>GET events/search</Api>
          </div>
          <p className="text-sm text-muted-foreground">
            {total} total · page {page + 1} of {pageCount}
          </p>
        </div>

        <div className="mt-5">
          {eventsQuery.isError ? (
            <ErrorState error={eventsQuery.error} onRetry={() => eventsQuery.refetch()} />
          ) : eventsQuery.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-56" />
              ))}
            </div>
          ) : eventsQuery.data && eventsQuery.data.events.length === 0 ? (
            <EmptyState
              icon={<CalendarSearch className="size-6 text-muted-foreground" />}
              title="No events match these filters"
              description="Try widening the date range or clearing the category."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {eventsQuery.data?.events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  categoryName={categoryName(event.categoryId)}
                  status="published"
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={(p) => setSearch({ page: p })}
          />
        </div>
      </section>
    </div>
  );
}

