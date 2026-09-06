import { useEffect, type ReactNode } from 'react';
import { useAuth } from 'react-oidc-context';
import { configureApiAuth } from '@/lib/api/client';
import { PageLoader } from '@/components/feedback';

/**
 * Bridges react-oidc-context into the framework-agnostic axios client:
 * the interceptor asks these callbacks for the current token / a refresh.
 *
 * Also holds the app until the OIDC session has finished restoring from
 * storage — otherwise the first render fires data queries while `auth.user`
 * is still undefined, so they go out tokenless and 401 before the silent
 * retry kicks in.
 */
export function AuthBridge({ children }: { children: ReactNode }) {
  const auth = useAuth();

  useEffect(() => {
    configureApiAuth({
      getToken: () => auth.user?.access_token,
      refreshToken: async () => {
        try {
          const user = await auth.signinSilent();
          return user?.access_token;
        } catch {
          return undefined;
        }
      },
      onAuthLost: () => {
        void auth.signinRedirect({ state: { returnTo: window.location.pathname } });
      },
    });
  }, [auth]);

  if (auth.isLoading) {
    return <PageLoader label="Loading…" />;
  }

  return <>{children}</>;
}
