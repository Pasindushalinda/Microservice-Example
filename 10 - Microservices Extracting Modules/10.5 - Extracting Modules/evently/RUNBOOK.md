# Evently — Deployment Runbook

How to deploy Evently to Azure Container Apps from scratch on any machine. See
`DEPLOYMENT.md` for the history of what broke and why while this was first built.

## Prerequisites

- Azure CLI (`az`), logged into the right account: `az login`
- .NET 10 SDK
- `dotnet-ef` tool: `dotnet tool install --global dotnet-ef`
- Git, with the repo cloned
- Docker is **not** required — images are built remotely via `az acr build`

```bash
az login
az account set --subscription "<subscription-id-or-name>"
```

All commands below are run from inside `evently/` (this directory).

## Step 1 — Bootstrap (ACR, Log Analytics, Container Apps environment)

```bash
az group create --name rg-evently --location centralindia

az deployment group create -g rg-evently -n bootstrap \
  --template-file infra/bootstrap.bicep \
  --parameters infra/bootstrap.parameters.json

az deployment group show -g rg-evently -n bootstrap --query properties.outputs
```

Note the `acrName` and `containerAppsDefaultDomain` outputs — the domain is a
fresh random string assigned by Azure every time the resource group is
recreated, and the ACR name is deterministic from subscription + resource
group name (so it comes back identical on a rebuild in the same subscription).

## Step 2 — Bake the new domain into the 3 services

**Do you actually need to do this step?**

- **Fresh deploy** (new resource group, or `rg-evently` was deleted and
  recreated) — **yes**. Azure assigns a new random Container Apps domain
  every time the environment is created, so the values baked into the repo
  are stale and must be updated.
- **Redeploying to an existing, still-running `rg-evently`** — **no**, skip
  this step. The domain hasn't changed, so the committed values are already
  correct — just use the code-only redeploy path
  (`gh workflow run ...`, see the bottom of this runbook) instead of running
  through the whole runbook again.

Replace the previous domain with the new `containerAppsDefaultDomain` in:

| File | Fields that reference the domain |
|---|---|
| `src/API/Evently.Api/appsettings.json` | `ValidIssuers`, `MetadataAddress`, `HealthUrl` |
| `src/API/Evently.Ticketing.Api/appsettings.json` | `ValidIssuers`, `MetadataAddress`, `HealthUrl` |
| `src/API/Evently.Gateway/appsettings.json` | `ValidIssuers`, `MetadataAddress` |

All of them point at `https://evently-keycloak.<domain>/...` — that's the
only thing that changes. Everything else in these files (DB/cache/queue
connection strings) is injected at runtime via Container Apps secrets, not
read from appsettings.json, so nothing else needs touching.

`src/API/Evently.Api/appsettings.json` and
`src/API/Evently.Ticketing.Api/appsettings.json` (identical shape, only
`Serilog:Properties:Application` differs):

```json
{
  "Authentication": {
    "TokenValidationParameters": {
      "ValidIssuers": [ "https://evently-keycloak.<domain>/realms/evently" ]
    },
    "MetadataAddress": "https://evently-keycloak.<domain>/realms/evently/.well-known/openid-configuration"
  },
  "KeyCloak": {
    "HealthUrl": "https://evently-keycloak.<domain>/health/"
  }
}
```

`src/API/Evently.Gateway/appsettings.json`:

```json
{
  "Authentication": {
    "TokenValidationParameters": {
      "ValidIssuers": [ "https://evently-keycloak.<domain>/realms/evently" ]
    },
    "MetadataAddress": "https://evently-keycloak.<domain>/realms/evently/.well-known/openid-configuration"
  }
}
```

(Trimmed to the fields that change — each file has other unrelated settings
around these: `ConnectionStrings`, `Serilog`, `OTEL_EXPORTER_OTLP_ENDPOINT`,
and, for the Gateway, `ReverseProxy` routing to `evently-api` /
`evently-ticketing-api` over the internal Container Apps DNS, which never
needs to change.)

```bash
OLD_DOMAIN="<domain currently baked into appsettings.json>"
NEW_DOMAIN="<containerAppsDefaultDomain from step 1>"
find src/API -maxdepth 2 -name appsettings.json \
  -exec sed -i '' "s/${OLD_DOMAIN//./\\.}/${NEW_DOMAIN}/g" {} +
git add src/API && git commit -m "Point config at new Container Apps domain"
```

(`sed -i ''` is macOS syntax; drop the `''` on Linux.)

This has to happen **before** Step 3 (building images) — these files are
baked into the Docker image at build time, so editing them after the image
is built does nothing until you rebuild and redeploy.

If `acrName` from step 1 differs from `infra/main.parameters.json`, update it
there too.

## Step 3 — Build and push the 4 images to ACR

```bash
ACR=<acrName from step 1>

az acr build --registry $ACR --image evently-api:latest \
  -f src/API/Evently.Api/Dockerfile .
az acr build --registry $ACR --image evently-ticketing-api:latest \
  -f src/API/Evently.Ticketing.Api/Dockerfile .
az acr build --registry $ACR --image evently-gateway:latest \
  -f src/API/Evently.Gateway/Dockerfile .
az acr build --registry $ACR --image evently-keycloak:latest \
  -f infra/keycloak/Dockerfile infra/keycloak
```

## Step 4 — Deploy Postgres, Redis, and the 7 container apps

`postgresAdminPassword`, `keycloakAdminPassword`, and `seqAdminPassword` are
all `@secure()` and deliberately not committed in `infra/main.parameters.json`
— pass them on the command line:

```bash
az deployment group create -g rg-evently -n main \
  --template-file infra/main.bicep \
  --parameters infra/main.parameters.json \
  --parameters \
    postgresAdminPassword='<choose-a-strong-password>' \
    keycloakAdminPassword='<choose-a-strong-password>' \
    seqAdminPassword='<choose-a-strong-password>'

az deployment group show -g rg-evently -n main --query properties.outputs
```

The ACR-pull deadlock and the Redis-retirement issue from the original build
are already fixed in the bicep — nothing extra to do here.

## Step 5 — Apply database migrations

Schema creation is gated behind `IsDevelopment()` in `Program.cs` for both
APIs, so it never runs automatically in Container Apps (which defaults to
`Production`). Open a temporary firewall hole, migrate, close it again:

```bash
MY_IP=$(curl -s https://ifconfig.me)
PG_SERVER=$(az postgres flexible-server list -g rg-evently --query "[0].name" -o tsv)

az postgres flexible-server firewall-rule create -g rg-evently --name $PG_SERVER \
  --rule-name allow-my-ip --start-ip-address $MY_IP --end-ip-address $MY_IP

CONN="Host=${PG_SERVER}.postgres.database.azure.com;Database=evently;Username=evently_admin;Password=<password-from-step-4>;Ssl Mode=Require"

dotnet ef database update -c UsersDbContext -s src/API/Evently.Api -p src/Modules/Users/Evently.Modules.Users.Infrastructure --connection "$CONN"
dotnet ef database update -c EventsDbContext -s src/API/Evently.Api -p src/Modules/Events/Evently.Modules.Events.Infrastructure --connection "$CONN"
dotnet ef database update -c AttendanceDbContext -s src/API/Evently.Api -p src/Modules/Attendance/Evently.Modules.Attendance.Infrastructure --connection "$CONN"
dotnet ef database update -c TicketingDbContext -s src/API/Evently.Ticketing.Api -p src/Modules/Ticketing/Evently.Modules.Ticketing.Infrastructure --connection "$CONN"

az postgres flexible-server firewall-rule delete -g rg-evently --name $PG_SERVER \
  --rule-name allow-my-ip --yes
```

`-s` (startup project) matters: `Evently.Api` hosts Users/Events/Attendance,
`Evently.Ticketing.Api` hosts Ticketing — using the wrong one fails to
resolve the context.

## Step 6 — Verify

```bash
GATEWAY_URL=$(az deployment group show -g rg-evently -n main --query properties.outputs.gatewayUrl.value -o tsv)
curl -i $GATEWAY_URL     # expect 401 = alive, auth required
```

Then register a test user through the Gateway to confirm the Keycloak wiring
end-to-end.

## Getting service URLs later

All outputs at once:

```bash
az deployment group show -g rg-evently -n main --query properties.outputs
```

Prints `gatewayUrl`, `keycloakUrl`, `seqUrl`, `jaegerUrl`, and
`rabbitmqManagementUrl`.

Or individually, by container app name:

```bash
az containerapp show -g rg-evently -n evently-keycloak --query properties.configuration.ingress.fqdn -o tsv
az containerapp show -g rg-evently -n evently-seq      --query properties.configuration.ingress.fqdn -o tsv
az containerapp show -g rg-evently -n evently-jaeger   --query properties.configuration.ingress.fqdn -o tsv
```

Prefix the result with `https://`.

**Redis has no public URL.** `infra/main.bicep` deploys it with
`external: false` — internal ingress only, reachable at `evently-redis:6379`
from inside the Container Apps environment (what `ConnectionStrings__Cache`
points to). To inspect it directly:

```bash
az containerapp exec -g rg-evently -n evently-redis --command sh
# then, inside the container:
redis-cli
```

Flipping `external: true` on the redis module and redeploying is possible but
not recommended to leave on — it has no auth configured.

## Logins

| Service | Login |
|---|---|
| Keycloak | `admin` / whatever `keycloakAdminPassword` was passed as in Step 4 |
| Seq | `admin` / whatever `seqAdminPassword` was passed as in Step 4 |
| RabbitMQ management | `guest` / `guest` |
| Jaeger | none |
| Gateway | Bearer token from Keycloak |

## Doing all of the above via GitHub Actions

Steps 1, 3, 4, and 5 above (bootstrap, image builds, `main.bicep`, EF
migrations) are also wired up as a single manually-triggered workflow —
useful after `rg-evently` has been deleted and needs rebuilding from
scratch, from any machine with `gh` installed and authenticated, no local
Azure CLI or .NET SDK required:

```bash
gh workflow run "Evently 10.5 - Full Infra Deploy to Azure Container Apps"
```

It reuses the same OIDC federated credential (`AZURE_CLIENT_ID` /
`AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID` secrets) as the code-only
workflow below, plus three more repo secrets for the passwords that used to
be hardcoded in `infra/main.parameters.json`:

```bash
gh secret set AZURE_POSTGRES_ADMIN_PASSWORD
gh secret set AZURE_KEYCLOAK_ADMIN_PASSWORD
gh secret set AZURE_SEQ_ADMIN_PASSWORD
```

It also detects when the Container Apps public domain changed (i.e. the
resource group was recreated), bakes the new domain into the 3 services'
`appsettings.json`, and commits that change back to the branch — the same
edit Step 2 above describes doing by hand.

Seq, Keycloak, and Jaeger come out of this with public ingress automatically
— `infra/main.bicep` already sets `external: true` on all three, so no
extra exposure step is needed either way.

Skip EF migrations on a given run (e.g. re-running after a transient
failure, once the schema is already current) by passing
`run_migrations=false`:

```bash
gh workflow run "Evently 10.5 - Full Infra Deploy to Azure Container Apps" -f run_migrations=false
```

## Redeploying code only (infra already exists)

Once the steps above have run once, don't repeat them for ordinary code
changes — push to the branch and trigger the existing GitHub Actions
workflow from any machine with `gh` installed and authenticated:

```bash
gh workflow run "Evently 10.5 - Deploy to Azure Container Apps"
```

That workflow rebuilds and rolls out the 3 app images (Api, Ticketing.Api,
Gateway) via OIDC login — no local Azure CLI setup needed.