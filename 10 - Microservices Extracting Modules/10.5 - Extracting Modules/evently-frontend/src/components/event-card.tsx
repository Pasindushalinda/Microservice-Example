import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  ChevronRight,
  CircleCheck,
  CircleDashed,
  CircleX,
  MapPin,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { formatLongDateTimeUtc } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { EventListItem } from '@/lib/api/types';

export type EventCardStatus = 'draft' | 'published' | 'canceled';

const STATUS: Record<
  EventCardStatus,
  { label: string; variant: BadgeProps['variant']; icon: LucideIcon }
> = {
  draft: { label: 'Draft', variant: 'neutral', icon: CircleDashed },
  published: { label: 'Published', variant: 'success', icon: CircleCheck },
  canceled: { label: 'Canceled', variant: 'destructive', icon: CircleX },
};

export function EventCard({
  event,
  categoryName,
  status,
  onCancel,
  cancelPending = false,
  detailsLabel = 'Details & Tickets',
  className,
}: {
  event: EventListItem;
  /** Resolved category name — GET events only returns `categoryId`. */
  categoryName?: string;
  /** Lifecycle badge. 10.5's list endpoint doesn't project this, so it's caller-supplied. */
  status?: EventCardStatus;
  /** Show a Cancel action when provided (admin surfaces only). */
  onCancel?: () => void;
  cancelPending?: boolean;
  detailsLabel?: string;
  className?: string;
}) {
  const statusMeta = status ? STATUS[status] : null;

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      whileHover={{ y: -3 }}
    >
      <Card
        className={cn(
          'flex h-full flex-col p-5 transition-shadow hover:shadow-md sm:p-6',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          {categoryName ? <Badge variant="neutral">{categoryName}</Badge> : <span aria-hidden />}
          {statusMeta && (
            <Badge variant={statusMeta.variant} className="gap-1">
              <statusMeta.icon className="size-3.5" />
              {statusMeta.label}
            </Badge>
          )}
        </div>

        <div className="mt-4 space-y-1.5">
          <h3 className="text-xl leading-snug font-semibold tracking-tight">{event.title}</h3>
          {event.description && (
            <p className="text-muted-foreground line-clamp-2 text-sm">{event.description}</p>
          )}
        </div>

        <div className="mt-4 space-y-2 border-t pt-4 text-sm">
          <div className="text-muted-foreground flex items-center gap-2.5">
            <CalendarDays className="size-4 shrink-0" />
            <span className="text-foreground">{formatLongDateTimeUtc(event.startsAtUtc)}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2.5">
            <MapPin className="size-4 shrink-0" />
            <span className="text-foreground">{event.location}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
          <Link
            to="/events/$eventId"
            params={{ eventId: event.id }}
            className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline"
          >
            {detailsLabel}
            <ChevronRight className="size-4" />
          </Link>
          {onCancel && (
            <Button
              variant="outline"
              size="sm"
              loading={cancelPending}
              onClick={onCancel}
              className="border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive"
            >
              Cancel
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
