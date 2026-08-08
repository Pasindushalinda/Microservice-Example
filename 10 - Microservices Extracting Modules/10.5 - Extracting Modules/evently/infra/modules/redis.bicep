@description('Name of the Azure Cache for Redis instance (must be globally unique)')
param name string

param location string = resourceGroup().location

resource redis 'Microsoft.Cache/redis@2023-08-01' = {
  name: name
  location: location
  properties: {
    sku: {
      name: 'Basic'
      family: 'C'
      capacity: 0
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
  }
}

output hostName string = redis.properties.hostName
output sslPort int = redis.properties.sslPort

@secure()
output primaryKey string = redis.listKeys().primaryKey
