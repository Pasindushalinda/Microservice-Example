# Evently

Microservices sample (Api, Ticketing.Api, Gateway) deployed to Azure Container Apps.

## Infrastructure

Deployment is split into two Bicep phases, run in order, because the Container Apps
environment's public domain isn't known until after it's created — and the app
images need that domain baked into `appsettings.json` before they're built.

1. **`infra/bootstrap.bicep`** — ACR, Log Analytics, and the Container Apps environment.
   Capture its `containerAppsDefaultDomain` output.
2. Update `Authentication`/`KeyCloak`/`Serilog`/`OTEL_EXPORTER_OTLP_ENDPOINT` URLs in the
   three services' `appsettings.json` with that domain, commit, then build/push the
   service images (and the custom Keycloak image) to the ACR from step 1.
3. **`infra/main.bicep`** — Postgres Flexible Server, Redis, and the 7 container apps:
   the 3 built services plus RabbitMQ, Keycloak, Seq, and Jaeger as supporting containers.

## Supporting service URLs

RabbitMQ (management UI), Keycloak, Seq, and Jaeger are all deployed with public ingress
(`external: true` in `infra/main.bicep`) so they can be reached directly from a browser —
this is a lab/demo setup, not a production security posture. After `main.bicep` finishes,
get their URLs from the deployment outputs:

```bash
az deployment group show \
  --resource-group rg-evently \
  --name main \
  --query properties.outputs
```

This prints `gatewayUrl`, `keycloakUrl`, `seqUrl`, `jaegerUrl`, and `rabbitmqManagementUrl`.
Internally (service-to-service, e.g. Serilog → Seq or the OTLP exporter → Jaeger), traffic
uses the Container Apps environment's internal DNS names (`evently-seq`, `evently-jaeger`,
`evently-rabbitmq`) rather than the public URLs.

| Service | Purpose | Login |
|---|---|---|
| Keycloak | Identity provider / admin console | `admin` / see `KeyCloak.AdminPassword` in appsettings.json |
| Seq | Structured log viewer | `admin` / see `seqAdminPassword` in `infra/main.parameters.json` (required as of newer Seq images — first run fails without either an admin password or an explicit no-auth opt-out). Ingestion uses the API key in `Serilog:WriteTo:Seq:Args:apiKey` — generate a real key from Seq's UI (Settings → API Keys) after first deploy and replace the `REPLACE_WITH_SEQ_API_KEY` placeholder |
| Jaeger | Distributed tracing UI | No login |
| RabbitMQ management | Queue management UI | `guest` / `guest` |

## Secrets

For this lab project, non-production secrets (RabbitMQ `guest`/`guest`, the Keycloak admin
password) are committed directly in `appsettings.json` / `infra/main.parameters.json` rather
than pulled from a vault — an explicitly accepted tradeoff, not an oversight. Database and
cache connection strings are the exception: those are injected at runtime via Container Apps
secrets (see `dbAndCacheAndQueueSecrets` in `infra/main.bicep`), not stored in `appsettings.json`.