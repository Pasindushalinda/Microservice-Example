# Evently — web frontend

React + Vite + TypeScript SPA for the Evently modular monolith (module 10.5).
Lives beside the backend as a sibling folder: `../evently` (backend) · `./` (this).
It talks to the **gateway** (`Evently.Gateway`, YARP) — never to the module APIs
directly — and mirrors the backend's module boundaries under `src/features/`.

## Stack

| Concern        | Choice |
| -------------- | ------ |
| Build / dev    | Vite 6, React 19, TypeScript (strict) |
| Routing        | TanStack Router (code-based route tree in `src/router.tsx`) |
| Server state   | TanStack Query (`src/lib/query.ts`) |
| Auth           | `react-oidc-context` + `oidc-client-ts`, Keycloak realm `evently`, public client `evently-public-client`, Auth Code + PKCE |
| HTTP           | `axios` instance with a bearer-token interceptor + single-flight 401 refresh (`src/lib/api/client.ts`) |
| Forms          | `react-hook-form` + `zod` |
| UI             | Tailwind + a small hand-owned shadcn-style kit in `src/components/ui/` |
| Tests          | Vitest + Testing Library |

## Getting started

```bash
cp .env.example .env      # then adjust if your gateway / Keycloak differ
npm install
npm run dev               # http://localhost:5173
```

The dev server proxies `('/api')` → `VITE_GATEWAY_URL` (default `http://localhost:3000`)
and strips the `/api` prefix, so the app calls `/api/events/search` and the gateway
sees `events/search`. This also sidesteps the gateway's missing local CORS.

The backend lives in the sibling `../evently` folder — run it from there
(`docker-compose up`, or the three API projects: Gateway `:3000`,
`Evently.Api` `:5000`, `Evently.Ticketing.Api` `:5160`).

### Keycloak redirect URIs

`evently-public-client` must allow `http://localhost:5173/*` as a redirect URI and
web origin. The bundled realm export uses `/*`, which usually already covers this.

## Scripts

| Script | What |
| ------ | ---- |
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b` + `vite build` |
| `npm run typecheck` | types only |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run gen:api` | regenerate API types from `openapi/evently.json` + `openapi/ticketing.json` (see `openapi/README.md`) |

## Screen map (from `Evently Wireframes.dc.html`)

| Wireframe | Route | File |
| --------- | ----- | ---- |
| 1d Browse & search | `/events` | `pages/browse-page.tsx` |
| 1a Event detail + buy, sticky order rail | `/events/:eventId` | `pages/event-detail-page.tsx` |
| Cart review | `/checkout` | `pages/checkout-page.tsx` |
| 1e Order placed — tickets being issued (async) | `/orders/:orderId` | `pages/order-detail-page.tsx` |
| 1f My tickets & order history | `/tickets`, `/orders` | `pages/my-tickets-page.tsx`, `pages/orders-page.tsx` |
| 1m Register / Profile | `/register`, `/profile` | `pages/register-page.tsx`, `pages/profile-page.tsx` |
| 1g Organizer console | `/admin/events` | `pages/admin/admin-events-page.tsx` |
| 1h Create / edit event + ticket types | `/admin/events/new`, `/admin/events/:eventId/edit` | `pages/admin/event-form-page.tsx` |
| 1i Categories | `/admin/categories` | `pages/admin/categories-page.tsx` |
| 1j Door check-in console | `/door/:eventId` | `pages/door/check-in-page.tsx` |
| 1k Live event statistics | `/door/:eventId/stats`, `/admin/events/:eventId/stats` | `pages/event-stats-view.tsx` |
| 1l Platform ops | `/admin/platform` | `pages/admin/platform-page.tsx` |
| 1m (left) Keycloak login | hosted by Keycloak | — (redirect only) |

## Notes on the 10.5 API

A few wireframe details go beyond what the current endpoints return, and the UI is
honest about it:

- **Event lifecycle status** isn't projected by `GET events` / `GET events/{id}`, so
  the organizer console offers every action and doesn't render status pills.
- **Ticket type availability** — only `quantity` (capacity) is exposed, not a live
  "left" count.
- **`POST orders`** returns no body; after placing an order the app re-reads
  `GET orders` and navigates to the newest one.
- **Cart** — `PUT carts/add` *increments* a line and `PUT carts/remove` deletes the
  whole line, so quantities are changed by remove + re-add.
- **Categories** have no un-archive endpoint; **event statistics** return totals and
  two arrays of problem codes but no time-bucketed throughput series.
- The **Platform** page is a static map (routes come from the gateway's
  `ReverseProxy` config); health / lag / messaging counts aren't exposed to browsers.

The little dashed blue chips (e.g. `GET events/search`) mark which gateway call backs
each piece of UI. Toggle them with the **API** button in the header.
