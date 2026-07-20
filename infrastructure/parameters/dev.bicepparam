using '../main.bicep'

param environmentName = 'dev'
param applicationName = 'claims'
param location = 'eastus'
param tags = {
  workload: 'claims-solution'
  managedBy: 'bicep'
  environment: 'dev'
}
