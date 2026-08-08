@description('Name of the Container Apps managed environment (shared by all 7 container apps)')
param name string

param location string = resourceGroup().location

param logAnalyticsCustomerId string

@secure()
param logAnalyticsSharedKey string

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: name
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalyticsCustomerId
        sharedKey: logAnalyticsSharedKey
      }
    }
  }
}

output id string = environment.id
output name string = environment.name

@description('The environment default domain, e.g. "<unique-id>.centralindia.azurecontainerapps.io" — every container app with external ingress gets a URL of the form "<app-name>.<this-domain>"')
output defaultDomain string = environment.properties.defaultDomain
