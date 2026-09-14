import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ShoppingCart } from 'lucide-react';
import { useSession } from '@/lib/auth/useSession';
import { Permission } from '@/lib/auth/permissions';
import { useCartCount } from '@/features/ticketing/queries';
import { Brand } from '@/components/brand';
import { ChatWidget } from '@/components/chat-widget';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/layout/user-menu';
import { useApiAnnotations } from '@/components/api-annotation';
import { cn } from '@/lib/utils';

const navLinkClass =
  'text-sm text-muted-foreground transition-colors hover:text-foreground data-[status=active]:font-medium data-[status=active]:text-foreground';

function CartLink() {
  const count = useCartCount();
  return (
    <Link
      to="/checkout"
      className="hover:bg-accent inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors"
    >
      <ShoppingCart className="size-4" />
      Cart
      {count > 0 && (
        <span className="bg-primary text-primary-foreground grid min-w-5 place-items-center rounded-full px-1 text-xs font-semibold">
          {count}
        </span>
      )}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, canAny } = useSession();
  const { show, toggle } = useApiAnnotations();
  const showAdmin = canAny(
    Permission.EventsUpdate,
    Permission.CategoriesUpdate,
    Permission.TicketTypesUpdate,
  );
  const showDoor = canAny(Permission.CheckIn, Permission.EventStatisticsRead);

  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
        <div className="container flex h-14 items-center gap-6">
          <Brand />
          <nav className="hidden items-center gap-5 md:flex">
            <Link to="/events" className={navLinkClass}>
              Browse
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/tickets" className={navLinkClass}>
                  My tickets
                </Link>
                <Link to="/orders" className={navLinkClass}>
                  Orders
                </Link>
              </>
            )}
            {showAdmin && (
              <Link to="/admin/events" className={navLinkClass}>
                Organizer
              </Link>
            )}
            {showDoor && (
              <Link to="/door" className={navLinkClass}>
                Door
              </Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className={cn(
                'hidden rounded-md border px-2 py-1 font-mono text-[11px] transition-colors sm:block',
                show ? 'border-primary/50 bg-primary/5 text-primary' : 'text-muted-foreground',
              )}
              title="Toggle API annotations"
            >
              API
            </button>
            {isAuthenticated && <CartLink />}
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="container flex-1 py-8">{children}</main>
      <footer className="border-t py-6">
        <div className="text-muted-foreground container flex flex-wrap items-center justify-between gap-2 text-xs">
          <span>Evently — modular monolith demo frontend</span>
          <span className="font-mono">gateway · YARP · :3000</span>
        </div>
      </footer>
      {isAuthenticated && <ChatWidget />}
    </div>
  );
}
