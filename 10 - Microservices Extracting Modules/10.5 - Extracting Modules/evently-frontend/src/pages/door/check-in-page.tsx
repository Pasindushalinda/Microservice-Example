import { useState, type ReactNode } from 'react';
import { getRouteApi, Link } from '@tanstack/react-router';
import { CameraOff, CheckCircle2, ScanLine, XCircle } from 'lucide-react';
import { useCheckIn, useEventStatistics, useLookupTicket } from '@/features/attendance/queries';
import { ApiError } from '@/lib/api/client';
import { Api } from '@/components/api-annotation';
import { BackButton } from '@/components/back-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Ticket } from '@/lib/api/types';

const routeApi = getRouteApi('/app/door/$eventId');

type Outcome =
  | { kind: 'idle' }
  | { kind: 'valid'; ticket: Ticket }
  | { kind: 'checked-in'; ticket: Ticket }
  | { kind: 'already'; ticket: Ticket; message: string }
  | { kind: 'invalid'; code: string; message: string };

export function CheckInPage() {
  const { eventId } = routeApi.useParams();
  const statsQuery = useEventStatistics(eventId, { refetchInterval: 15_000 });
  const lookup = useLookupTicket();
  const checkIn = useCheckIn(eventId);

  const [code, setCode] = useState('');
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' });

  const doLookup = () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    lookup.mutate(trimmed, {
      onSuccess: (result) => {
        if (result.outcome === 'valid' && result.ticket) {
          if (result.ticket.eventId !== eventId) {
            setOutcome({
              kind: 'invalid',
              code: trimmed,
              message: 'This ticket is for a different event.',
            });
          } else {
            setOutcome({ kind: 'valid', ticket: result.ticket });
          }
        } else {
          setOutcome({
            kind: 'invalid',
            code: trimmed,
            message: result.message ?? 'Unknown code.',
          });
        }
      },
      onError: () =>
        setOutcome({ kind: 'invalid', code: trimmed, message: 'Lookup failed. Try again.' }),
    });
  };

  const doCheckIn = (ticket: Ticket) => {
    checkIn.mutate(ticket.id, {
      onSuccess: () => {
        setOutcome({ kind: 'checked-in', ticket });
        statsQuery.refetch();
      },
      onError: (err) => {
        const status = err instanceof ApiError ? err.status : 0;
        if (status === 409 || status === 400) {
          setOutcome({
            kind: 'already',
            ticket,
            message: err instanceof ApiError ? err.message : 'This ticket was already checked in.',
          });
        } else {
          setOutcome({
            kind: 'invalid',
            code: ticket.code,
            message: err instanceof Error ? err.message : 'Check-in failed.',
          });
        }
      },
    });
  };

  const reset = () => {
    setCode('');
    setOutcome({ kind: 'idle' });
  };

  const stats = statsQuery.data;

  return (
    <div className="space-y-4">
      <BackButton fallbackTo="/door" label="Door home" />
      <header className="bg-foreground text-background flex flex-wrap items-center justify-between gap-3 rounded-lg px-5 py-3">
        <div>
          <p className="text-lg font-semibold">{stats?.title ?? 'Event'} · door</p>
          <p className="text-sm opacity-70">{stats?.location}</p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-2xl font-semibold">{stats?.ticketsSold ?? '—'}</p>
            <p className="text-xs opacity-70">sold</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{stats?.attendeesCheckedIn ?? '—'}</p>
            <p className="text-xs opacity-70">checked in</p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="space-y-3 p-5">
          <div className="bg-muted/40 text-muted-foreground grid h-40 place-items-center rounded-md border text-center text-sm">
            <span className="flex flex-col items-center gap-1">
              <CameraOff className="size-5" />
              camera scanning not wired up
            </span>
          </div>
          <label className="text-muted-foreground text-sm" htmlFor="code">
            …type or scan the code
          </label>
          <Input
            id="code"
            className="font-mono"
            placeholder="TKT-____-____"
            value={code}
            autoFocus
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && doLookup()}
          />
          <Button className="w-full" onClick={doLookup} loading={lookup.isPending}>
            <ScanLine className="size-4" />
            Look up
          </Button>
          <div className="flex flex-col gap-1">
            <Api>GET tickets/code/{'{code}'}</Api>
            <Api>PUT attendees/check-in {'{ ticketId }'}</Api>
          </div>
        </Card>

        <div className="space-y-4">
          <ScanResultPanel
            outcome={outcome}
            onCheckIn={doCheckIn}
            checkingIn={checkIn.isPending}
            onReset={reset}
          />
          <p className="text-muted-foreground text-xs leading-relaxed">
            Attendance keeps its own copy of tickets, fed by the ticket-issued event — so a
            just-bought ticket can 404 for a second. Retry after a moment.
          </p>
        </div>
      </div>

      <p className="text-muted-foreground text-center text-xs">
        <Link to="/door/$eventId/stats" params={{ eventId }} className="hover:text-foreground">
          View live event statistics →
        </Link>
      </p>
    </div>
  );
}

function ScanResultPanel({
  outcome,
  onCheckIn,
  checkingIn,
  onReset,
}: {
  outcome: Outcome;
  onCheckIn: (ticket: Ticket) => void;
  checkingIn: boolean;
  onReset: () => void;
}) {
  if (outcome.kind === 'idle') {
    return (
      <Card className="text-muted-foreground grid h-40 place-items-center text-sm">
        Scan a ticket to see the result here.
      </Card>
    );
  }

  if (outcome.kind === 'valid') {
    return (
      <Card className="border-success/40 bg-success/5 p-5">
        <PanelHead tone="success" title="Valid — let them in" code="200" icon={<CheckCircle2 />} />
        <p className="text-success mt-1 text-sm">
          {outcome.ticket.code} · ticket {outcome.ticket.id.slice(0, 8)}…
        </p>
        <div className="mt-3 flex gap-2">
          <Button variant="success" loading={checkingIn} onClick={() => onCheckIn(outcome.ticket)}>
            Check in
          </Button>
          <Button variant="outline" onClick={onReset}>
            Skip
          </Button>
        </div>
      </Card>
    );
  }

  if (outcome.kind === 'checked-in') {
    return (
      <Card className="border-success/40 bg-success/5 p-5">
        <PanelHead tone="success" title="Checked in" code="204" icon={<CheckCircle2 />} />
        <p className="text-success mt-1 text-sm">{outcome.ticket.code} is now admitted.</p>
        <Button className="mt-3" variant="outline" onClick={onReset}>
          Next scan
        </Button>
      </Card>
    );
  }

  if (outcome.kind === 'already') {
    return (
      <Card className="border-warning/40 bg-warning/5 p-5">
        <PanelHead tone="warning" title="Already checked in" code="409" icon={<CheckCircle2 />} />
        <p className="text-warning mt-1 text-sm">
          {outcome.message} Counted once, recorded as a duplicate scan.
        </p>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" onClick={onReset}>
            Refuse
          </Button>
          <Button variant="outline" onClick={onReset}>
            Override &amp; admit
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/40 bg-destructive/5 p-5">
      <PanelHead tone="destructive" title="Not a valid ticket" code="404" icon={<XCircle />} />
      <p className="text-destructive mt-1 text-sm">
        {outcome.message} Logged to invalid check-in tickets.
      </p>
      <div className="mt-3 flex gap-2">
        <Button variant="outline" onClick={onReset}>
          Scan again
        </Button>
      </div>
    </Card>
  );
}

function PanelHead({
  tone,
  title,
  code,
  icon,
}: {
  tone: 'success' | 'warning' | 'destructive';
  title: string;
  code: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div
        className={cn(
          'flex items-center gap-2 text-xl font-semibold [&_svg]:size-5',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
          tone === 'destructive' && 'text-destructive',
        )}
      >
        {icon}
        {title}
      </div>
      <span className="text-muted-foreground font-mono text-xs">{code}</span>
    </div>
  );
}
