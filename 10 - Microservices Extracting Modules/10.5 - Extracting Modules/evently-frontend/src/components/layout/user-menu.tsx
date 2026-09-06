import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { AnimatePresence, motion } from 'motion/react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useSession } from '@/lib/auth/useSession';
import { Button } from '@/components/ui/button';

export function UserMenu() {
  const { isAuthenticated, displayName, email, signIn, signOut } = useSession();
  const [open, setOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <Button size="sm" onClick={signIn}>
        Sign in
      </Button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="bg-card text-muted-foreground hover:bg-accent grid size-9 place-items-center rounded-full border text-sm font-semibold uppercase transition-colors"
        aria-label="Account menu"
      >
        {displayName.slice(0, 1)}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="bg-popover text-popover-foreground absolute right-0 z-40 mt-2 w-56 origin-top-right rounded-lg border p-1 shadow-lg"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
          >
            <div className="px-3 py-2">
              <p className="truncate text-sm font-medium">{displayName}</p>
              {email && <p className="text-muted-foreground truncate text-xs">{email}</p>}
            </div>
            <div className="bg-border my-1 h-px" />
            <Link
              to="/profile"
              className="hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2 text-sm"
            >
              <UserIcon className="size-4" />
              Profile
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="text-destructive hover:bg-destructive/10 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
