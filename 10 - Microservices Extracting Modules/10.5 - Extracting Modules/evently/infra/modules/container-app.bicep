@description('Container app name — this is also its internal DNS name inside the environment (http://<name>) and, if externally exposed, the subdomain of its public URL')
param name string

param location string = resourceGroup().location

@description('Resource ID of the shared Microsoft.App/managedEnvironments this app runs in')
param environmentId string

@description('Full image reference, e.g. "myacr.azurecr.io/evently-api:abc123" or a public image like "datalust/seq:latest"')
param image string

@description('Port the container listens on for its main ingress')
param targetPort int

@description('Whether the main ingress gets a public https:// URL (true) or is only reachable from other apps in the environment (false)')
param external bool = false

@description('"http" for a web app/API, "tcp" for a raw protocol port')
param transport string = 'http'

@description('Extra ports beyond the main one, e.g. RabbitMQ AMQP (5672) alongside its management UI, or Jaeger OTLP (4317) alongside its UI (16686). Each item: { external: bool, targetPort: int, exposedPort: int }')
param additionalPortMappings array = []

param cpu string = '0.5'
param memory string = '1Gi'
param minReplicas int = 1
param maxReplicas int = 1

@description('Container entrypoint args, e.g. ["start-dev", "--import-realm"] for Keycloak')
param args array = []

@description('Plain (non-secret) environment variables: [{ name, value }]')
param envVars array = []

@description('Secret values for this app, keyed by secret name — pass real values only from a secure parameter at the top level, never hardcode a real secret here')
@secure()
param secrets object = {}

@description('Environment variables whose value comes from one of the secrets above: [{ name: envVarName, secretName: keyInSecretsObject }]')
param secretEnvRefs array = []

@description('Set true to pull the image from Azure Container Registry using this app\'s own system-assigned managed identity (no stored registry password). Requires an AcrPull role assignment on the registry, granted separately in main.bicep once this app\'s principal ID is known.')
param useManagedIdentityForAcr bool = false

@description('ACR login server, required when useManagedIdentityForAcr is true')
param registryServer string = ''

var secretsArray = [for key in items(secrets): {
  name: key.key
  value: key.value
}]

var secretEnvVarsArray = [for ref in secretEnvRefs: {
  name: ref.name
  secretRef: ref.secretName
}]

var registries = useManagedIdentityForAcr ? [
  {
    server: registryServer
    identity: 'system'
  }
] : []

resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: name
  location: location
  identity: useManagedIdentityForAcr ? {
    type: 'SystemAssigned'
  } : null
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      ingress: {
        external: external
        targetPort: targetPort
        transport: transport
        additionalPortMappings: additionalPortMappings
      }
      secrets: secretsArray
      registries: registries
    }
    template: {
      containers: [
        {
          name: name
          image: image
          args: args
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: concat(envVars, secretEnvVarsArray)
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
      }
    }
  }
}

output name string = containerApp.name
output fqdn string = external ? containerApp.properties.configuration.ingress.fqdn : ''
output principalId string = useManagedIdentityForAcr ? containerApp.identity.principalId : ''
