using '../main.bicep'

param environmentName = 'dev'
param applicationName = 'sa-graduate'
param location = 'australiaeast'
param tags = {
  workload: 'graduate-solution'
  managedBy: 'bicep'
  environment: 'dev'
}
