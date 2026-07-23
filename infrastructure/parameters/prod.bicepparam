using '../main.bicep'

param environmentName = 'prod'
param applicationName = 'sa-graduate'
param location = 'eastus'
param tags = {
  workload: 'graduate-solution'
  managedBy: 'bicep'
  environment: 'prod'
}
