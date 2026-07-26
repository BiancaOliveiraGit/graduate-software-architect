using '../main.bicep'

param environmentName = 'test'
param applicationName = 'sa-graduate'
param location = 'australiaeast'
param tags = {
  workload: 'graduate-solution'
  managedBy: 'bicep'
  environment: 'test'
}
