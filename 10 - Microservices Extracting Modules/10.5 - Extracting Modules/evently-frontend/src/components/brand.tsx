import { Link } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

export function Brand({ suffix, className }: { suffix?: string; className?: string }) {
  return (
    <Link to="/" className={cn('flex items-baseline gap-1.5', className)}>
      <span className="text-xl font-bold tracking-tight text-primary">evently</span>
      {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
    </Link>
  );
}
