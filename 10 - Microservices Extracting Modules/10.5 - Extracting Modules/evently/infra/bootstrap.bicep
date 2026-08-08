// Phase 1 of 2: the pieces that must exist BEFORE we know the Container Apps
// environment's public domain — which we need to bake real Keycloak/Seq/Jaeger
// URLs into appsettings.json before building the app images.
//
// Deploy this first, capture its `containerAppsDefaultDomain` output, commit the
// appsettings.json edits that use it, THEN build/push images and run main.bicep.
targetScope = 'resourceGroup'

param location string = resourceGroup().location

@description('Name prefix for all resources, e.g. "evently"')
param namePrefix string = 'evently'

var uniqueSuffix = uniqueString(resourceGroup().id)
var acrName = '${namePrefix}acr${uniqueSuffix}'
var logAnalyticsName = '${namePrefix}-logs'
var containerEnvName = '${namePrefix}-env'

module acr 'modules/acr.bicep' = {
  name: 'acr-deploy'
  params: {
    name: acrName
    location: location
  }
}

module logAnalytics 'modules/log-analytics.bicep' = {
  name: 'log-analytics-deploy'
  params: {
    name: logAnalyticsName
    location: location
  }
}

module containerEnv 'modules/container-env.bicep' = {
  name: 'container-env-deploy'
  params: {
    name: containerEnvName
    location: location
    logAnalyticsCustomerId: logAnalytics.outputs.customerId
    logAnalyticsSharedKey: logAnalytics.outputs.primarySharedKey
  }
}

output acrName string = acr.outputs.name
output acrLoginServer string = acr.outputs.loginServer
output containerEnvName string = containerEnv.outputs.name
output containerAppsDefaultDomain string = containerEnv.outputs.defaultDomain
