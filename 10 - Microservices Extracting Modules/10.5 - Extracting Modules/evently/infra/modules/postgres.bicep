@description('Name of the Postgres Flexible Server (must be globally unique)')
param name string

param location string = resourceGroup().location

param administratorLogin string = 'evently_admin'

@secure()
param administratorLoginPassword string

param databaseName string = 'evently'

resource server 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: name
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: server
  name: databaseName
}

// Container Apps don't have a fixed outbound IP range on the Consumption plan, so
// "AllowAllAzureServicesAndResourcesWithinAzureIps" (start=end=0.0.0.0) is the
// documented way to let the environment reach this server without a VNet.
resource allowAzureServices 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: server
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

output fqdn string = server.properties.fullyQualifiedDomainName
output serverName string = server.name
