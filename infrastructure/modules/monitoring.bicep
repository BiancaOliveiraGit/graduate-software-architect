@description('Name of the Application Insights resource.')
param appInsightsName string

@description('Name of the Log Analytics workspace.')
param workspaceName string

@description('Azure region for the monitoring resources.')
param location string

@description('Tags to apply to monitoring resources.')
param tags object = {}

resource workspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: workspaceName
  location: location
  tags: tags
  properties: {
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: workspace.id
    Flow_Type: 'Bluefield'
    Request_Source: 'rest'
  }
}

output workspaceId string = workspace.id
output applicationInsightsName string = appInsights.name
output applicationInsightsId string = appInsights.id
output applicationInsightsConnectionString string = appInsights.properties.ConnectionString
output applicationInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
