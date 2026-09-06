import { Link } from '@tanstack/react-router';
import { useAuth } from 'react-oidc-context';
import { motion } from 'motion/react';
import { ArrowRight, CalendarCheck, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';

/**
 * Pre-auth landing. Signed-in visitors are redirected to the portal by the
 * index route; everyone else picks register (our POST users/register) or
 * sign in (Keycloak).
 */
export function WelcomePage() {
  const auth = useAuth();

  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="bg-card w-full max-w-md rounded-2xl border p-8 shadow-sm"
      >
        <div className="text-primary flex items-center gap-2">
          <CalendarCheck className="size-6" />
          <span className="text-xl font-bold tracking-tight">evently</span>
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Welcome to Evently</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Browse events, buy tickets, and track your orders. Create an account or sign in to
          continue.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link to="/register" className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
            <UserPlus className="size-4" />
            Create an account
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => void auth.signinRedirect()}
          >
            Sign in
            <ArrowRight className="size-4" />
          </Button>
        </div>

        <p className="text-muted-foreground mt-6 text-xs">
          Registration creates your Keycloak account and Evently profile, then you sign in through
          Keycloak.
        </p>
      </motion.div>
    </div>
  );
}
