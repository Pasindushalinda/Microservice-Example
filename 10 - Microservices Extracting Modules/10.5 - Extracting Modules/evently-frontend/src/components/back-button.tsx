import { ArrowLeft } from 'lucide-react';
import { useCanGoBack, useRouter } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

/**
 * Goes back in history when there's somewhere to go back to, otherwise routes
 * to `fallbackTo` (for when a detail page was opened directly / via a shared link).
 */
export function BackButton({
  fallbackTo = '/events',
  label = 'Back',
  className,
}: {
  fallbackTo?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  return (
    <button
      type="button"
      onClick={() => (canGoBack ? router.history.back() : router.navigate({ to: fallbackTo }))}
      className={cn(
        'text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors',
        className,
      )}
    >
      <ArrowLeft className="size-4" />
      {label}
    </button>
  );
}
