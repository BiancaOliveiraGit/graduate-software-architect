using '../main.bicep'

param environmentName = 'dev'
param applicationName = 'sa-graduate'
param location = 'eastus'
param tags = {
  workload: 'graduate-solution'
  managedBy: 'bicep'
  environment: 'dev'
}
