using '../main.bicep'

param environmentName = 'test'
param applicationName = 'claims'
param location = 'eastus'
param tags = {
  workload: 'claims-solution'
  managedBy: 'bicep'
  environment: 'test'
}
