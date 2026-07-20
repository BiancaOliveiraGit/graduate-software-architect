param(
  [Parameter(Mandatory = $true)]
  [string]$StorageAccountName,

  [Parameter(Mandatory = $true)]
  [string]$ResourceGroupName,

  [Parameter(Mandatory = $true)]
  [string]$SourceFolder
)

$ErrorActionPreference = 'Stop'

az storage blob upload-batch `
  --account-name $StorageAccountName `
  --auth-mode login `
  --destination '$web' `
  --source $SourceFolder `
  --overwrite

az storage blob service-properties update `
  --account-name $StorageAccountName `
  --static-website `
  --index-document index.html `
  --404-document 404.html `
  --auth-mode login
