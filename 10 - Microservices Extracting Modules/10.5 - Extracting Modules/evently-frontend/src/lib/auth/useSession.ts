import { useMemo } from 'react';
import { useAuth } from 'react-oidc-context';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/endpoints';
import { qk } from '@/lib/query';
import {
  Permission,
  permissionsFromToken,
  rolesFromToken,
  type PermissionValue,
} from './permissions';

export interface Session {
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken?: string;
  userId?: string;
  displayName: string;
  email?: string;
  permissions: Set<string>;
  roles: Set<string>;
  can: (perm: PermissionValue) => boolean;
  canAny: (...perms: PermissionValue[]) => boolean;
  signIn: () => void;
  signOut: () => void;
}

export function useSession(): Session {
  const auth = useAuth();
  const token = auth.user?.access_token;
  const isAuthenticated = auth.isAuthenticated;

  // Keycloak access tokens carry no `permissions` claim — the Users module
  // resolves them from the database, so fetch them once the user is signed in.
  const permissionsQuery = useQuery({
    queryKey: qk.permissions.me,
    queryFn: usersApi.permissions,
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });
  const fetchedPermissions = permissionsQuery.data;

  return useMemo(() => {
    const permissions = new Set<string>([
      ...permissionsFromToken(token),
      ...(fetchedPermissions ?? []),
    ]);
    const roles = rolesFromToken(token);
    const profile = auth.user?.profile;
    const displayName =
      [profile?.given_name, profile?.family_name].filter(Boolean).join(' ') ||
      (profile?.preferred_username as string | undefined) ||
      (profile?.email as string | undefined) ||
      'Account';

    const can = (perm: PermissionValue) => permissions.has(perm);

    return {
      isLoading: auth.isLoading || (isAuthenticated && permissionsQuery.isLoading),
      isAuthenticated,
      accessToken: token,
      userId: profile?.sub,
      displayName,
      email: profile?.email as string | undefined,
      permissions,
      roles,
      can,
      canAny: (...perms: PermissionValue[]) => perms.some((p) => permissions.has(p)),
      signIn: () => void auth.signinRedirect(),
      signOut: () => void auth.signoutRedirect(),
    };
  }, [auth, token, isAuthenticated, fetchedPermissions, permissionsQuery.isLoading]);
}

export { Permission };
