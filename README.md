# Graduate Software Architect

This repository contains the static web application and its supporting infrastructure-as-code assets.

## Infrastructure

The Bicep deployment entry point lives in [infrastructure/main.bicep](infrastructure/main.bicep) and provisions a resource group, storage account, App Service plan and web app, Key Vault, Application Insights, and Log Analytics.

### Deploying locally

Use the Azure CLI with a parameter file, for example:

```bash
az deployment sub create \
  --location eastus \
  --template-file infrastructure/main.bicep \
  --parameters infrastructure/parameters/dev.bicepparam
```

After the deployment completes, upload the site content to the static website container:

```bash
./infrastructure/scripts/deploy-site.sh <storageAccountName> <resourceGroupName> .
```

On Windows PowerShell, use:

```powershell
./infrastructure/scripts/deploy-site.ps1 -StorageAccountName <storageAccountName> -ResourceGroupName <resourceGroupName> -SourceFolder .
```

### Environment parameter files

- [infrastructure/parameters/dev.bicepparam](infrastructure/parameters/dev.bicepparam)
- [infrastructure/parameters/test.bicepparam](infrastructure/parameters/test.bicepparam)
- [infrastructure/parameters/prod.bicepparam](infrastructure/parameters/prod.bicepparam)
