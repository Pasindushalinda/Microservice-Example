@description('Name of the Azure Container Registry (must be globally unique, alphanumeric only)')
param name string

param location string = resourceGroup().location

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: name
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    // No admin username/password — the API/Ticketing.Api/Gateway container apps pull
    // images using their own managed identity (granted the AcrPull role in main.bicep)
    // instead of a stored registry password.
    adminUserEnabled: false
  }
}

output id string = acr.id
output name string = acr.name
output loginServer string = acr.properties.loginServer
