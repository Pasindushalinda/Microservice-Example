import type { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ApiError, problemErrors } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-14 text-center">
      {icon}
      <p className="text-base font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = 'Something went wrong',
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const details = error instanceof ApiError ? problemErrors(error.problem) : [];
  // When there are field-level validation messages, list those and keep the
  // headline generic instead of repeating the joined string from `error.message`.
  const message = details.length
    ? 'Please fix the following and try again:'
    : error instanceof Error
      ? error.message
      : 'The request failed. Please try again.';

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <AlertTriangle className="size-6 text-destructive" />
      <p className="text-base font-medium">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {details.length > 0 && (
        <ul className="max-w-md list-inside list-disc text-left text-xs text-muted-foreground">
          {details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
