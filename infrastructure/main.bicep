targetScope = 'subscription'

@description('Environment name for the deployment. Use dev, test, or prod.')
@allowed([
  'dev'
  'test'
  'prod'
])
param environmentName string

@description('Short name for the solution workload. Example: claims')
@minLength(2)
param applicationName string

@description('Azure region for all resources.')
param location string = deployment().location

@description('Common tags applied to every deployed resource.')
param tags object = {
  workload: 'claims-solution'
  managedBy: 'bicep'
}

var normalizedAppName = toLower(replace(applicationName, '-', ''))
var deploymentSuffix = toLower(uniqueString(subscription().subscriptionId, applicationName, environmentName))
var resourceGroupName = 'rg-${normalizedAppName}-${environmentName}-${deploymentSuffix}'
var storageAccountName = take('st${normalizedAppName}${environmentName}${deploymentSuffix}', 24)
var appServicePlanName = take('asp-${normalizedAppName}-${environmentName}-${deploymentSuffix}', 40)
var webAppName = take('app-${normalizedAppName}-${environmentName}-${deploymentSuffix}', 60)
var appInsightsName = take('appi-${normalizedAppName}-${environmentName}-${deploymentSuffix}', 260)
var workspaceName = take('log-${normalizedAppName}-${environmentName}-${deploymentSuffix}', 63)
var keyVaultName = take('kv-${normalizedAppName}-${environmentName}-${deploymentSuffix}', 24)

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: union(tags, {
    environment: environmentName
  })
}

module monitoring './modules/monitoring.bicep' = {
  name: 'monitoringDeployment'
  scope: rg
  params: {
    location: location
    appInsightsName: appInsightsName
    workspaceName: workspaceName
    tags: union(tags, {
      environment: environmentName
    })
  }
}

module storage './modules/storage.bicep' = {
  name: 'storageDeployment'
  scope: rg
  params: {
    location: location
    storageAccountName: storageAccountName
    tags: union(tags, {
      environment: environmentName
    })
  }
}

module keyVault './modules/keyVault.bicep' = {
  name: 'keyVaultDeployment'
  scope: rg
  params: {
    location: location
    keyVaultName: keyVaultName
    tags: union(tags, {
      environment: environmentName
    })
  }
}

module appService './modules/appService.bicep' = {
  name: 'appServiceDeployment'
  scope: rg
  params: {
    location: location
    appServicePlanName: appServicePlanName
    webAppName: webAppName
    appInsightsConnectionString: monitoring.outputs.applicationInsightsConnectionString
    appInsightsInstrumentationKey: monitoring.outputs.applicationInsightsInstrumentationKey
    tags: union(tags, {
      environment: environmentName
    })
  }
}

module keyVaultSecretsUserAssignment './modules/roleAssignment.bicep' = {
  name: 'keyVaultSecretsUserAssignment'
  scope: rg
  params: {
    principalId: appService.outputs.principalId
    roleDefinitionId: '4633458b-17de-408a-b874-0445c86b69e6'
  }
}

output resourceGroupName string = rg.name
output storageAccountName string = storage.outputs.storageAccountName
output storageAccountId string = storage.outputs.storageAccountId
output storageStaticWebsiteUrl string = storage.outputs.staticWebsiteUrl
output webAppName string = appService.outputs.webAppName
output webAppUrl string = appService.outputs.webAppUrl
output keyVaultName string = keyVault.outputs.keyVaultName
output keyVaultId string = keyVault.outputs.keyVaultId
output applicationInsightsName string = monitoring.outputs.applicationInsightsName
output applicationInsightsConnectionString string = monitoring.outputs.applicationInsightsConnectionString
