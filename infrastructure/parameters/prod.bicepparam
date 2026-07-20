using '../main.bicep'

param environmentName = 'prod'
param applicationName = 'claims'
param location = 'eastus'
param tags = {
  workload: 'claims-solution'
  managedBy: 'bicep'
  environment: 'prod'
}
