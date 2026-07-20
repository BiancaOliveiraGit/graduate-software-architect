@description('Name of the Key Vault instance.')
param keyVaultName string

@description('Azure region for the Key Vault.')
param location string

@description('Tags to apply to the Key Vault.')
param tags object = {}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    enabledForDeployment: true
    enabledForTemplateDeployment: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    publicNetworkAccess: 'Enabled'
  }
}

output keyVaultName string = keyVault.name
output keyVaultId string = keyVault.id
