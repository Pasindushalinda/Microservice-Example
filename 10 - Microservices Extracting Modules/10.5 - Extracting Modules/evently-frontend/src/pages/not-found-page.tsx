import { Link } from '@tanstack/react-router';
import { buttonVariants } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">This page doesn't exist</h1>
      <Link to="/events" className={buttonVariants({ variant: 'outline' })}>
        Go to Browse
      </Link>
    </div>
  );
}
