import { ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const services = [
  { name: 'Evently.Gateway', port: ':3000', note: 'YARP reverse proxy' },
  { name: 'Evently.Api', port: ':5000', note: 'events · users · attendance' },
  { name: 'Evently.Ticketing.Api', port: ':5160', note: 'carts · orders · tickets' },
];

const routes = [
  { path: 'users/register', cluster: 'evently-api', policy: 'anonymous' },
  { path: 'orders/**', cluster: 'evently-ticketing-api', policy: 'default' },
  { path: 'carts/**', cluster: 'evently-ticketing-api', policy: 'default' },
  { path: 'tickets/**', cluster: 'evently-ticketing-api', policy: 'default' },
  { path: '{**catch-all}', cluster: 'evently-api', policy: 'default' },
];

const tools = [
  { name: 'RabbitMQ management', href: 'http://localhost:15672' },
  { name: 'Seq — logs', href: 'http://localhost:8081' },
  { name: 'Jaeger — traces', href: 'http://localhost:16686' },
  { name: 'Keycloak — identity', href: import.meta.env.VITE_OIDC_AUTHORITY },
];

export function PlatformPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Platform</h1>
        <p className="text-sm text-muted-foreground">
          3 services behind the gateway. Health, lag and messaging counts aren't exposed to
          the browser in 10.5 — this page is a map, not a live dashboard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {services.map((svc) => (
          <Card key={svc.name} className="p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{svc.name}</p>
              <span className="size-2.5 rounded-full bg-muted-foreground/40" title="status unknown" />
            </div>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{svc.port}</p>
            <p className="mt-1 text-xs text-muted-foreground">{svc.note}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-baseline justify-between border-b bg-muted/50 px-4 py-2">
          <p className="font-medium">Gateway routes</p>
          <span className="font-mono text-xs text-muted-foreground">ReverseProxy config</span>
        </div>
        <ul className="divide-y divide-dashed">
          {routes.map((route) => (
            <li
              key={route.path}
              className="grid grid-cols-[minmax(0,1fr)_180px_100px] items-center gap-3 px-4 py-2.5 font-mono text-xs"
            >
              <span>{route.path}</span>
              <span className="text-muted-foreground">{route.cluster}</span>
              <Badge variant={route.policy === 'anonymous' ? 'warning' : 'neutral'}>
                {route.policy}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b bg-muted/50 px-4 py-2">
          <p className="font-medium">Supporting infrastructure</p>
        </div>
        <ul className="divide-y divide-dashed">
          {tools.map((tool) => (
            <li key={tool.name} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span>{tool.name}</span>
              <a
                href={tool.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                open
                <ExternalLink className="size-3.5" />
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
