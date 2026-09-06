import {
  createRootRoute,
  createRoute,
  createRouter,
  Navigate,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { useAuth } from 'react-oidc-context';
import { z } from 'zod';

import { AppShell } from '@/components/layout/app-shell';
import { AdminShell } from '@/components/layout/admin-shell';
import { RequireAuth, RequirePermission } from '@/components/auth-guards';
import { PageLoader } from '@/components/feedback';
import { Permission } from '@/lib/auth/permissions';

import { WelcomePage } from '@/pages/welcome-page';
import { BrowsePage } from '@/pages/browse-page';
import { EventDetailPage } from '@/pages/event-detail-page';
import { CheckoutPage } from '@/pages/checkout-page';
import { OrdersPage } from '@/pages/orders-page';
import { OrderDetailPage } from '@/pages/order-detail-page';
import { MyTicketsPage } from '@/pages/my-tickets-page';
import { RegisterPage } from '@/pages/register-page';
import { ProfilePage } from '@/pages/profile-page';
import { AuthCallbackPage } from '@/pages/auth-callback-page';
import { NotFoundPage } from '@/pages/not-found-page';

import { AdminEventsPage } from '@/pages/admin/admin-events-page';
import { EventCreatePage, EventEditPage } from '@/pages/admin/event-form-page';
import { AdminEventStatsPage } from '@/pages/admin/admin-event-stats-page';
import { CategoriesPage } from '@/pages/admin/categories-page';
import { PlatformPage } from '@/pages/admin/platform-page';

import { DoorHomePage } from '@/pages/door/door-home-page';
import { CheckInPage } from '@/pages/door/check-in-page';
import { DoorEventStatsPage } from '@/pages/door/event-stats-page';

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFoundPage,
});

// --- landing ------------------------------------------------------------------

/** `/` — portal for signed-in users, register / sign-in choice for everyone else. */
// eslint-disable-next-line react-refresh/only-export-components
function IndexRoute() {
  const auth = useAuth();
  if (auth.isLoading) return <PageLoader label="Loading…" />;
  if (auth.isAuthenticated) return <Navigate to="/events" replace />;
  return <WelcomePage />;
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRoute,
});

// --- public / attendee shell ----------------------------------------------

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const eventsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/events',
  validateSearch: z.object({
    categoryId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.number().int().min(0).optional(),
  }),
  component: () => (
    <RequireAuth>
      <BrowsePage />
    </RequireAuth>
  ),
});

const eventDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/events/$eventId',
  component: () => (
    <RequireAuth>
      <EventDetailPage />
    </RequireAuth>
  ),
});

const checkoutRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/checkout',
  component: () => (
    <RequireAuth>
      <CheckoutPage />
    </RequireAuth>
  ),
});

const ordersRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/orders',
  component: () => (
    <RequireAuth>
      <OrdersPage />
    </RequireAuth>
  ),
});

const orderDetailRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/orders/$orderId',
  component: () => (
    <RequireAuth>
      <OrderDetailPage />
    </RequireAuth>
  ),
});

const ticketsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/tickets',
  component: () => (
    <RequireAuth>
      <MyTicketsPage />
    </RequireAuth>
  ),
});

const registerRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/register',
  component: RegisterPage,
});

const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile',
  component: () => (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  ),
});

const doorHomeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/door',
  component: () => (
    <RequirePermission
      anyOf={[Permission.CheckIn, Permission.EventStatisticsRead, Permission.EventsRead]}
    >
      <DoorHomePage />
    </RequirePermission>
  ),
});

const checkInRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/door/$eventId',
  component: () => (
    <RequirePermission anyOf={[Permission.CheckIn]}>
      <CheckInPage />
    </RequirePermission>
  ),
});

const doorStatsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/door/$eventId/stats',
  component: () => (
    <RequirePermission anyOf={[Permission.EventStatisticsRead]}>
      <DoorEventStatsPage />
    </RequirePermission>
  ),
});

// --- admin shell ---------------------------------------------------------

const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: () => (
    <AdminShell>
      <Outlet />
    </AdminShell>
  ),
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/admin/events' });
  },
});

const adminEventsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'events',
  component: () => (
    <RequirePermission anyOf={[Permission.EventsUpdate]}>
      <AdminEventsPage />
    </RequirePermission>
  ),
});

const adminEventNewRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'events/new',
  component: () => (
    <RequirePermission anyOf={[Permission.EventsUpdate]}>
      <EventCreatePage />
    </RequirePermission>
  ),
});

const adminEventEditRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'events/$eventId/edit',
  component: () => (
    <RequirePermission anyOf={[Permission.EventsUpdate]}>
      <EventEditPage />
    </RequirePermission>
  ),
});

const adminEventStatsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'events/$eventId/stats',
  component: () => (
    <RequirePermission anyOf={[Permission.EventStatisticsRead, Permission.EventsUpdate]}>
      <AdminEventStatsPage />
    </RequirePermission>
  ),
});

const adminCategoriesRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'categories',
  component: () => (
    <RequirePermission anyOf={[Permission.CategoriesUpdate]}>
      <CategoriesPage />
    </RequirePermission>
  ),
});

const adminPlatformRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: 'platform',
  component: () => (
    <RequirePermission anyOf={[Permission.EventsUpdate]}>
      <PlatformPage />
    </RequirePermission>
  ),
});

// --- standalone --------------------------------------------------------------

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: AuthCallbackPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  appLayoutRoute.addChildren([
    eventsRoute,
    eventDetailRoute,
    checkoutRoute,
    ordersRoute,
    orderDetailRoute,
    ticketsRoute,
    registerRoute,
    profileRoute,
    doorHomeRoute,
    checkInRoute,
    doorStatsRoute,
  ]),
  adminLayoutRoute.addChildren([
    adminIndexRoute,
    adminEventsRoute,
    adminEventNewRoute,
    adminEventEditRoute,
    adminEventStatsRoute,
    adminCategoriesRoute,
    adminPlatformRoute,
  ]),
  authCallbackRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultNotFoundComponent: NotFoundPage,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
