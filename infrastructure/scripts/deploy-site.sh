#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 3 ]; then
  echo "Usage: $0 <storageAccountName> <resourceGroupName> <sourceFolder>" >&2
  exit 1
fi

STORAGE_ACCOUNT_NAME="$1"
RESOURCE_GROUP_NAME="$2"
SOURCE_FOLDER="$3"

az storage blob upload-batch \
  --account-name "$STORAGE_ACCOUNT_NAME" \
  --auth-mode login \
  --destination '$web' \
  --source "$SOURCE_FOLDER" \
  --overwrite

az storage blob service-properties update \
  --account-name "$STORAGE_ACCOUNT_NAME" \
  --static-website \
  --index-document index.html \
  --404-document 404.html \
  --auth-mode login

az group show --name "$RESOURCE_GROUP_NAME" >/dev/null
