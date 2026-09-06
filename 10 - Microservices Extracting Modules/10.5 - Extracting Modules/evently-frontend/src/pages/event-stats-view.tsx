import { useEventStatistics } from '@/features/attendance/queries';
import { formatEventWindow } from '@/lib/format';
import { Api } from '@/components/api-annotation';
import { BackButton } from '@/components/back-button';
import { ErrorState, PageLoader } from '@/components/feedback';
import { Card } from '@/components/ui/card';

export function EventStatsView({ eventId, backTo }: { eventId: string; backTo?: string }) {
  const statsQuery = useEventStatistics(eventId, { refetchInterval: 10_000 });

  if (statsQuery.isLoading) return <PageLoader label="Loading statistics…" />;
  if (statsQuery.isError)
    return <ErrorState error={statsQuery.error} onRetry={() => statsQuery.refetch()} />;

  const s = statsQuery.data!;
  const stillExpected = Math.max(0, s.ticketsSold - s.attendeesCheckedIn);
  const pct = s.ticketsSold > 0 ? Math.round((s.attendeesCheckedIn / s.ticketsSold) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {backTo && <BackButton fallbackTo={backTo} />}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{s.title}</h1>
          <p className="text-muted-foreground text-sm">
            {formatEventWindow(s.startsAtUtc, s.endsAtUtc)} · {s.location}
          </p>
        </div>
        <Api>GET event-statistics/{'{id}'}</Api>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Tickets sold" value={s.ticketsSold} />
        <Stat label="Checked in" value={s.attendeesCheckedIn} sub={`${pct}% of sold`} />
        <Stat label="Still expected" value={stillExpected} />
      </div>

      <Card className="p-4">
        <div className="text-muted-foreground flex items-center justify-between text-sm">
          <span>Check-in progress</span>
          <span>
            {s.attendeesCheckedIn} / {s.ticketsSold}
          </span>
        </div>
        <div className="bg-muted mt-2 h-3 overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <CodeList title="Duplicate scans" tone="warning" codes={s.duplicateCheckInTickets} />
        <CodeList title="Invalid scans" tone="destructive" codes={s.invalidCheckInTickets} />
      </div>

      <p className="text-muted-foreground text-xs leading-relaxed">
        Everything here comes from one response — sold, checked in, and the two arrays of problem
        codes. A door-throughput chart would need time-bucketed data the endpoint doesn't return
        today.
      </p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-3xl leading-tight font-semibold">{value}</p>
      {sub && <p className="text-muted-foreground text-xs">{sub}</p>}
    </Card>
  );
}

function CodeList({
  title,
  tone,
  codes,
}: {
  title: string;
  tone: 'warning' | 'destructive';
  codes: string[];
}) {
  const toneClass =
    tone === 'warning'
      ? 'border-warning/40 bg-warning/5 text-warning'
      : 'border-destructive/40 bg-destructive/5 text-destructive';
  return (
    <Card className={`p-4 ${toneClass}`}>
      <div className="flex items-baseline justify-between">
        <p className="text-base font-semibold">{title}</p>
        <p className="text-2xl font-semibold">{codes.length}</p>
      </div>
      {codes.length > 0 && (
        <ul className="mt-2 grid gap-1 font-mono text-xs">
          {codes.map((c, i) => (
            <li key={`${c}-${i}`}>{c}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
