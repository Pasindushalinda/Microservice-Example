# Evently — Azure Container Apps Deployment Log

A record of shipping Evently to Azure Container Apps: what was already in place, what broke, and what fixed it. Kept as a reference for the next time this resource group gets rebuilt.

## Current state

| Service | URL | Login |
|---|---|---|
| Gateway | `https://evently-gateway.yellowrock-bd0a222d.centralindia.azurecontainerapps.io` | Bearer token from Keycloak |
| Keycloak | `https://evently-keycloak.yellowrock-bd0a222d.centralindia.azurecontainerapps.io/admin/` | `admin` / `Ev3ntly!KcAdmin2026` |
| Seq | `https://evently-seq.yellowrock-bd0a222d.centralindia.azurecontainerapps.io` | `admin` / `Ev3ntly!SeqAdmin2026` |
| Jaeger | `https://evently-jaeger.yellowrock-bd0a222d.centralindia.azurecontainerapps.io` | none |
| RabbitMQ management | `https://evently-rabbitmq.yellowrock-bd0a222d.centralindia.azurecontainerapps.io` | `guest` / `guest` |

- Resource group: `rg-evently`, region `centralindia`
- ACR: `eventlyacrhc5ho5pny2iys.azurecr.io`
- Postgres: `evently-pg-hc5ho5pny2iys.postgres.database.azure.com` (`evently_admin` / `Ev3ntlyPg!Adm1n2026`, firewall allows Azure services only)

The public Container Apps domain (currently `yellowrock-bd0a222d.centralindia.azurecontainerapps.io`) is reassigned by Azure every time the resource group is deleted and recreated — see the last entry in the log for what that requires.

## What was already there

Before this session, `feature/azure-deploy` already had a full first pass at Azure Container Apps deployment: Bicep split into `bootstrap.bicep` (ACR, Log Analytics, Container Apps environment) and `main.bicep` (Postgres, Redis, and 7 container apps — the 3 built services plus RabbitMQ/Keycloak/Seq/Jaeger), plus a manually-triggered GitHub Actions workflow. None of it had actually been run against a real subscription yet.

## Log

### 1. Exposing the supporting services + secrets

Keycloak, Seq, Jaeger, and RabbitMQ were already configured with public ingress (`external: true`) in `main.bicep` — no change needed there. Added the secrets the running services needed:

- RabbitMQ credentials made explicit in the queue connection string (`amqp://guest:guest@evently-rabbitmq:5672`)
- Keycloak admin login added to `appsettings.json` and `main.parameters.json`
- A placeholder slot for a Seq ingestion API key (a real key can only be generated from Seq's own UI after it's running)

Wrote `README.md` documenting the two-phase deploy process and where to find each service's URL and login.

### 2. Bootstrap + first image builds

Confirmed `az` was logged into the right subscription, created `rg-evently`, and ran `bootstrap.bicep`. It returned a fresh ACR (`eventlyacrhc5ho5pny2iys`) and a Container Apps default domain (`orangepond-cb215fd6...`). Baked that domain into the three services' `appsettings.json`, then built and pushed all four images (Api, Ticketing.Api, Gateway, the custom Keycloak image) with `az acr build` — Docker Desktop wasn't running locally, and ACR Tasks builds remotely without needing a local daemon.

### 3. `main.bicep`, attempt 1 — Redis is retired

**Broke:** `redis-deploy` failed —

> Azure Cache for Redis is retiring, create Azure Managed Redis instance instead.

Microsoft blocks new `Microsoft.Cache/redis` resources now. Azure Managed Redis is a heavier, pricier resource than a lab needs.

**Fixed:** Redis now runs as a plain `redis:7-alpine` container app, internal-only, matching the RabbitMQ pattern already used for the other supporting services. Deleted `infra/modules/redis.bicep`.

### 4. `main.bicep`, attempt 2 — the ACR-pull deadlock

**Broke:** `keycloak-deploy` failed with `Operation expired` on the container app's image pull.

Root cause: the original template granted each app's own **system-assigned** managed identity the `AcrPull` role only *after* that app's module finished deploying — but the app can't finish deploying until it can pull its image, and it can't pull its image until the role assignment exists. A guaranteed circular deadlock for every app using `useManagedIdentityForAcr: true` (Api, Ticketing.Api, Gateway, Keycloak) — this run just happened to reach Keycloak first.

**Fixed:** Replaced per-app system-assigned identities with a single **user-assigned** identity (`evently-acrpull-identity`), created and granted `AcrPull` up front, independent of any container app. All four ACR-backed apps now reference it via a new `acrPullIdentityId` parameter on the `container-app.bicep` module.

### 5. `main.bicep`, attempt 3 — succeeds, but Seq won't start

Deployment as a whole succeeded. Spot-checking the 5 public URLs, four responded correctly — Gateway (`401`, auth required, correct), Keycloak (`200`, realm discovery document live), Jaeger (`200`), RabbitMQ (`200`). Seq hung with no response.

**Broke:** the Seq replica was `Unhealthy` / `Failed`. Its logs:

> No default admin password was supplied; set `firstRun.adminPassword` or `SEQ_FIRSTRUN_ADMINPASSWORD`, or opt out of authentication using `firstRun.noAuthentication`/`SEQ_FIRSTRUN_NOAUTHENTICATION`.

Newer Seq images refuse to start without one or the other; the template only set `ACCEPT_EULA`.

**Fixed:** Added `SEQ_FIRSTRUN_ADMINPASSWORD` as a real Container Apps secret (`seqAdminPassword` parameter). Redeployed — Seq came up healthy, all 5 URLs verified `200`/expected.

### 6. Resource group deleted and rebuilt from scratch

The user deleted `rg-evently` outright. Redid the whole sequence: recreate the resource group, rerun `bootstrap.bicep` (ACR name came back identical — it's deterministic from subscription + RG name — but the public domain changed to `yellowrock-bd0a222d...`, which is assigned randomly by Azure each time), rebake the new domain into `appsettings.json`, rebuild and push all four images to the now-empty ACR, rerun `main.bicep`.

This time `main.bicep` succeeded cleanly on the **first** attempt — the Redis and ACR-pull fixes held. All 5 URLs verified healthy again.

### 7. Missing database schema

**Broke:** the app threw `Npgsql.PostgresException: 42P01: relation "attendance.inbox_messages" does not exist`.

Root cause: `ApplyMigrations()` in both `Evently.Api/Program.cs` and `Evently.Ticketing.Api/Program.cs` only runs inside `if (app.Environment.IsDevelopment())` — bundled with the Swagger setup. Container Apps defaults to `Production`, so the schema was never created on the fresh Postgres server.

**Fixed:** rather than flipping the app to Development (which would also have exposed Swagger publicly), opened a temporary Postgres firewall rule for the local machine's IP and ran `dotnet ef database update` directly against the four module schemas (`users`, `events`, `attendance`, `ticketing`), then removed the firewall rule again.

### 8. Keycloak lookup pointed at a dev-only hostname

**Broke:** registering a user threw `System.Net.Http.HttpRequestException: Name or service not known (evently.identity:8080)` — a Docker Compose network alias that doesn't exist in Azure.

Root cause, found via code search: `ConfigurationExtensions.AddModuleConfiguration` in `Evently.Api` loaded `modules.users.Development.json` **unconditionally**, with no environment check — so its `evently.identity` URLs always overrode the (empty) values in the production `modules.users.json`.

**Fixed:**
- Gated the `.Development.json` overlay behind `IsDevelopment()` in `ConfigurationExtensions.cs` / `Program.cs`, the same way the built-in `appsettings.{Environment}.json` mechanism already behaves.
- Filled in real production values in `modules.users.json`: Keycloak admin/token URLs pointed at the internal Container Apps DNS name (`http://evently-keycloak`, not the public URL — this is service-to-service traffic), plus the `evently-confidential-client` / `evently-public-client` IDs and secret pulled from the realm export.
- Rebuilt and pushed the `evently-api` image, rolled it out as a new revision (`az containerapp update --revision-suffix ...` — needed because the image tag string didn't change, so Container Apps wouldn't otherwise create a new revision).
- Verified by registering a real test user (`smoketest@example.com`) through the Gateway end-to-end: `200 OK`, user ID returned.

### 9. Committed and pushed

Staged only source and infra files (`infra/*`, the three services' `appsettings.json` / Dockerfiles, `ConfigurationExtensions.cs`, `Program.cs`, `modules.users.json`, `README.md`) — left `bin/`, `obj/`, `.containers/` untracked. Committed as `c8684b9` on `feature/azure-deploy` and pushed to `origin`.

## How config actually reaches the running containers

Worth being explicit about, since it caused two of the bugs above: `appsettings.json` / `modules.*.json` are copied into the Docker image at build time (`COPY . .` → `dotnet publish`) and become the baked-in defaults. At runtime, ASP.NET Core layers config in this order (later wins):

1. `appsettings.json` / `modules.*.json` — whatever was baked into the image
2. `appsettings.{ASPNETCORE_ENVIRONMENT}.json` — only loads if the environment matches; Container Apps defaults to `Production`
3. **Container Apps environment variables/secrets** — `ConnectionStrings__Database`, `ConnectionStrings__Cache`, `ConnectionStrings__Queue`, `KEYCLOAK_ADMIN_PASSWORD` (Keycloak container only)

Everything outside that env-var list — `Authentication:*`, `KeyCloak:*`, `Serilog:*` — comes purely from the file baked into the image. Editing these files does nothing to a running deployment until the image is rebuilt and rolled out as a new revision.

### 10. Full infra deploy automated via GitHub Actions

The manual sequence in `RUNBOOK.md` (bootstrap → bake domain → build 4
images → `main.bicep` → EF migrations) is now also a single
`workflow_dispatch` workflow, `evently-10.5-infra-deploy.yml`, at the repo
root — see "Doing all of the above via GitHub Actions" in `RUNBOOK.md`.

As part of this, `keycloakAdminPassword` and `seqAdminPassword` were removed
from `infra/main.parameters.json` (previously committed in plaintext) and
now must be passed as `--parameters` overrides, same as
`postgresAdminPassword` already was. The GitHub Actions workflow pulls all
three from repo secrets (`AZURE_POSTGRES_ADMIN_PASSWORD`,
`AZURE_KEYCLOAK_ADMIN_PASSWORD`, `AZURE_SEQ_ADMIN_PASSWORD`).

Seq, Keycloak, and Jaeger needed no infra changes to be public — `external:
true` was already set on all three (see entry 1 above); the new workflow
just automates the `main.bicep` run that applies it.

## Known gap

Database migrations do **not** run automatically on this deployment (gated behind `IsDevelopment()`, same root cause as the config bug above) — every time `rg-evently` is deleted and recreated, the manual `dotnet ef database update` step in the log above needs repeating before the app will work.