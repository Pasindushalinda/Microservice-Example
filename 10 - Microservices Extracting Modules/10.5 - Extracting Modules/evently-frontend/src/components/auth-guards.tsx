import type { ReactNode } from 'react';
import { Navigate } from '@tanstack/react-router';
import { Lock } from 'lucide-react';
import { useSession } from '@/lib/auth/useSession';
import type { PermissionValue } from '@/lib/auth/permissions';
import { EmptyState, PageLoader } from '@/components/feedback';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useSession();

  if (isLoading) return <PageLoader label="Checking your session…" />;
  // Send anonymous visitors to the landing page to register or sign in.
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function RequirePermission({
  anyOf,
  children,
}: {
  anyOf: PermissionValue[];
  children: ReactNode;
}) {
  const { isLoading, isAuthenticated, canAny } = useSession();

  if (isLoading) return <PageLoader label="Checking your access…" />;

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (!canAny(...anyOf)) {
    return (
      <EmptyState
        icon={<Lock className="text-muted-foreground size-6" />}
        title="You don't have access to this area"
        description={`Requires one of: ${anyOf.join(', ')}. Permissions come from the Users module.`}
      />
    );
  }

  return <>{children}</>;
}
