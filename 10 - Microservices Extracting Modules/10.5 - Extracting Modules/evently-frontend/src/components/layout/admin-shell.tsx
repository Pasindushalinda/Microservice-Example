import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { BarChart3, CalendarDays, LayoutGrid, Server, Tags } from 'lucide-react';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/layout/user-menu';
import { cn } from '@/lib/utils';

const items = [
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/door', label: 'Attendance', icon: BarChart3 },
  { to: '/admin/platform', label: 'Platform', icon: Server },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full">
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-card/50 p-4 md:flex">
        <Brand suffix="admin" className="px-2" />
        <nav className="mt-6 flex flex-col gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                'data-[status=active]:bg-primary data-[status=active]:font-medium data-[status=active]:text-primary-foreground',
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto px-2 text-xs leading-relaxed text-muted-foreground">
          Every action here needs a matching <code className="font-mono">*:update</code>{' '}
          permission from the Users module.
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b px-6">
          <div className="flex items-center gap-2 md:hidden">
            <LayoutGrid className="size-4" />
            <span className="font-semibold">Admin</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/events" className="text-sm text-muted-foreground hover:text-foreground">
              View site
            </Link>
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
