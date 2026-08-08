// Phase 2 of 2: run after bootstrap.bicep and after the appsettings.json edits
// (which bake in bootstrap's containerAppsDefaultDomain) have been committed and
// the 3 API images + the custom Keycloak image have been pushed to ACR.
targetScope = 'resourceGroup'

param location string = resourceGroup().location

@description('Name prefix for all resources, e.g. "evently" — must match what was used in bootstrap.bicep')
param namePrefix string = 'evently'

@description('Name of the ACR created by bootstrap.bicep')
param acrName string

@description('Name of the Container Apps environment created by bootstrap.bicep')
param containerEnvName string

@secure()
param postgresAdminPassword string

@secure()
param keycloakAdminPassword string

param postgresAdminLogin string = 'evently_admin'

@description('Image tags to deploy — bump these (e.g. to a commit SHA) to roll out a new build without re-running the whole GitHub Actions matrix logic by hand')
param apiImageTag string = 'latest'
param ticketingImageTag string = 'latest'
param gatewayImageTag string = 'latest'
param keycloakImageTag string = 'latest'

var uniqueSuffix = uniqueString(resourceGroup().id)
var postgresServerName = '${namePrefix}-pg-${uniqueSuffix}'
var redisName = '${namePrefix}-redis-${uniqueSuffix}'

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: acrName
}

resource containerEnv 'Microsoft.App/managedEnvironments@2024-03-01' existing = {
  name: containerEnvName
}

module postgres 'modules/postgres.bicep' = {
  name: 'postgres-deploy'
  params: {
    name: postgresServerName
    location: location
    administratorLogin: postgresAdminLogin
    administratorLoginPassword: postgresAdminPassword
  }
}

module redis 'modules/redis.bicep' = {
  name: 'redis-deploy'
  params: {
    name: redisName
    location: location
  }
}

var dbConnectionString = 'Host=${postgres.outputs.fqdn};Port=5432;Database=evently;Username=${postgresAdminLogin};Password=${postgresAdminPassword};Include Error Detail=true;Ssl Mode=Require'
var cacheConnectionString = '${redis.outputs.hostName}:${redis.outputs.sslPort},password=${redis.outputs.primaryKey},ssl=True,abortConnect=False'
var queueConnectionString = 'amqp://evently-rabbitmq:5672'

var dbAndCacheAndQueueSecrets = {
  'db-connection-string': dbConnectionString
  'cache-connection-string': cacheConnectionString
  'queue-connection-string': queueConnectionString
}
var dbAndCacheAndQueueRefs = [
  { name: 'ConnectionStrings__Database', secretName: 'db-connection-string' }
  { name: 'ConnectionStrings__Cache', secretName: 'cache-connection-string' }
  { name: 'ConnectionStrings__Queue', secretName: 'queue-connection-string' }
]

// --- Supporting containers (RabbitMQ, Keycloak, Seq, Jaeger) ---
// Deliberately guest/guest on RabbitMQ + its management UI made public: accepted
// risk, decided explicitly — see plan file for the reasoning.

module rabbitmq 'modules/container-app.bicep' = {
  name: 'rabbitmq-deploy'
  params: {
    name: 'evently-rabbitmq'
    location: location
    environmentId: containerEnv.id
    image: 'rabbitmq:management-alpine'
    targetPort: 15672
    external: true
    additionalPortMappings: [
      { external: false, targetPort: 5672, exposedPort: 5672 }
    ]
    envVars: [
      { name: 'RABBITMQ_DEFAULT_USER', value: 'guest' }
      { name: 'RABBITMQ_DEFAULT_PASS', value: 'guest' }
    ]
  }
}

module keycloak 'modules/container-app.bicep' = {
  name: 'keycloak-deploy'
  params: {
    name: 'evently-keycloak'
    location: location
    environmentId: containerEnv.id
    image: '${acr.properties.loginServer}/evently-keycloak:${keycloakImageTag}'
    targetPort: 8080
    external: true
    useManagedIdentityForAcr: true
    registryServer: acr.properties.loginServer
    args: [ 'start-dev', '--import-realm' ]
    envVars: [
      { name: 'KEYCLOAK_ADMIN', value: 'admin' }
      { name: 'KC_HEALTH_ENABLED', value: 'true' }
      { name: 'KC_HTTP_ENABLED', value: 'true' }
      // Container Apps terminates TLS at its edge and forwards plain HTTP —
      // without these two, Keycloak's OIDC discovery doc advertises internal
      // http:// URLs and every login redirect breaks.
      { name: 'KC_HOSTNAME', value: 'https://evently-keycloak.${containerEnv.properties.defaultDomain}' }
      { name: 'KC_PROXY_HEADERS', value: 'xforwarded' }
    ]
    secrets: {
      'keycloak-admin-password': keycloakAdminPassword
    }
    secretEnvRefs: [
      { name: 'KEYCLOAK_ADMIN_PASSWORD', secretName: 'keycloak-admin-password' }
    ]
  }
}

module seq 'modules/container-app.bicep' = {
  name: 'seq-deploy'
  params: {
    name: 'evently-seq'
    location: location
    environmentId: containerEnv.id
    image: 'datalust/seq:latest'
    targetPort: 80
    external: true
    envVars: [
      { name: 'ACCEPT_EULA', value: 'Y' }
    ]
  }
}

module jaeger 'modules/container-app.bicep' = {
  name: 'jaeger-deploy'
  params: {
    name: 'evently-jaeger'
    location: location
    environmentId: containerEnv.id
    image: 'jaegertracing/all-in-one:latest'
    targetPort: 16686
    external: true
    additionalPortMappings: [
      { external: false, targetPort: 4317, exposedPort: 4317 }
    ]
  }
}

// --- The 3 built services ---

module api 'modules/container-app.bicep' = {
  name: 'api-deploy'
  params: {
    name: 'evently-api'
    location: location
    environmentId: containerEnv.id
    image: '${acr.properties.loginServer}/evently-api:${apiImageTag}'
    targetPort: 8080
    external: false
    useManagedIdentityForAcr: true
    registryServer: acr.properties.loginServer
    secrets: dbAndCacheAndQueueSecrets
    secretEnvRefs: dbAndCacheAndQueueRefs
  }
}

module ticketingApi 'modules/container-app.bicep' = {
  name: 'ticketing-api-deploy'
  params: {
    name: 'evently-ticketing-api'
    location: location
    environmentId: containerEnv.id
    image: '${acr.properties.loginServer}/evently-ticketing-api:${ticketingImageTag}'
    targetPort: 8080
    external: false
    useManagedIdentityForAcr: true
    registryServer: acr.properties.loginServer
    secrets: dbAndCacheAndQueueSecrets
    secretEnvRefs: dbAndCacheAndQueueRefs
  }
}

module gateway 'modules/container-app.bicep' = {
  name: 'gateway-deploy'
  params: {
    name: 'evently-gateway'
    location: location
    environmentId: containerEnv.id
    image: '${acr.properties.loginServer}/evently-gateway:${gatewayImageTag}'
    targetPort: 8080
    external: true
    useManagedIdentityForAcr: true
    registryServer: acr.properties.loginServer
  }
  // Not a functional dependency (Gateway's routing config points at evently-api /
  // evently-ticketing-api by their fixed, predictable names, not a Bicep output) —
  // ordering only, so the Gateway doesn't come up routing to apps that don't exist yet.
  dependsOn: [
    api
    ticketingApi
  ]
}

// --- Grant each ACR-backed app's managed identity pull access, instead of a stored registry password ---

var acrPullRoleDefinitionId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d')

resource apiAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, 'evently-api', 'AcrPull')
  scope: acr
  properties: {
    roleDefinitionId: acrPullRoleDefinitionId
    principalId: api.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

resource ticketingApiAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, 'evently-ticketing-api', 'AcrPull')
  scope: acr
  properties: {
    roleDefinitionId: acrPullRoleDefinitionId
    principalId: ticketingApi.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

resource gatewayAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, 'evently-gateway', 'AcrPull')
  scope: acr
  properties: {
    roleDefinitionId: acrPullRoleDefinitionId
    principalId: gateway.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

resource keycloakAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, 'evently-keycloak', 'AcrPull')
  scope: acr
  properties: {
    roleDefinitionId: acrPullRoleDefinitionId
    principalId: keycloak.outputs.principalId
    principalType: 'ServicePrincipal'
  }
}

output gatewayUrl string = 'https://${gateway.outputs.fqdn}'
output keycloakUrl string = 'https://${keycloak.outputs.fqdn}'
output seqUrl string = 'https://${seq.outputs.fqdn}'
output jaegerUrl string = 'https://${jaeger.outputs.fqdn}'
output rabbitmqManagementUrl string = 'https://${rabbitmq.outputs.fqdn}'
