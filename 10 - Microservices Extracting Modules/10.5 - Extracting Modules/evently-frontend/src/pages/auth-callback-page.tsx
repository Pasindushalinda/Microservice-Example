import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from 'react-oidc-context';
import { PageLoader } from '@/components/feedback';
import { ErrorState } from '@/components/feedback';

/**
 * react-oidc-context processes the ?code&state automatically; this route just
 * shows progress and bounces home (or to the saved returnTo) once done.
 */
export function AuthCallbackPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isLoading || auth.activeNavigator) return;
    if (auth.isAuthenticated) {
      const returnTo = (auth.user?.state as { returnTo?: string } | undefined)?.returnTo;
      navigate({ to: returnTo ?? '/', replace: true });
    } else if (!auth.error) {
      navigate({ to: '/', replace: true });
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.activeNavigator, auth.error, auth.user, navigate]);

  if (auth.error) {
    return (
      <div className="container py-16">
        <ErrorState error={auth.error} title="Sign-in failed" />
      </div>
    );
  }

  return <PageLoader label="Completing sign in…" />;
}
