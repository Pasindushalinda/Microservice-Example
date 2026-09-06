/**
 * Permission strings the gateway authorizes against (see each module's
 * Permissions.cs). They arrive on the access token in a `permissions` claim.
 */
export const Permission = {
  // events
  EventsRead: 'events:read',
  EventsSearch: 'events:search',
  EventsUpdate: 'events:update',
  TicketTypesRead: 'ticket-types:read',
  TicketTypesUpdate: 'ticket-types:update',
  CategoriesRead: 'categories:read',
  CategoriesUpdate: 'categories:update',
  // ticketing
  CartRead: 'carts:read',
  CartModify: 'carts:update',
  OrdersRead: 'orders:read',
  OrdersCreate: 'orders:create',
  TicketsRead: 'tickets:read',
  // attendance
  CheckIn: 'attendees:checkin',
  EventStatisticsRead: 'event-statistics:read',
} as const;

export type PermissionValue = (typeof Permission)[keyof typeof Permission];

interface JwtPayload {
  permissions?: string[] | string;
  realm_access?: { roles?: string[] };
  preferred_username?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  sub?: string;
  exp?: number;
}

export function decodeJwt(token: string | undefined): JwtPayload | null {
  if (!token) return null;
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json))) as JwtPayload;
  } catch {
    try {
      return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as JwtPayload;
    } catch {
      return null;
    }
  }
}

export function permissionsFromToken(token: string | undefined): Set<string> {
  const payload = decodeJwt(token);
  if (!payload?.permissions) return new Set();
  const list = Array.isArray(payload.permissions)
    ? payload.permissions
    : payload.permissions.split(/[\s,]+/).filter(Boolean);
  return new Set(list);
}

/** A loose role read used only for coarse nav gating (organizer / door / attendee). */
export function rolesFromToken(token: string | undefined): Set<string> {
  const payload = decodeJwt(token);
  return new Set(payload?.realm_access?.roles ?? []);
}
