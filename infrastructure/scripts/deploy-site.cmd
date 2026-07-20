@echo off
setlocal
if "%~3"=="" (
  echo Usage: %~nx0 ^<storageAccountName^> ^<resourceGroupName^> ^<sourceFolder^>
  exit /b 1
)

az storage blob upload-batch --account-name %1 --auth-mode login --destination $web --source %3 --overwrite
az storage blob service-properties update --account-name %1 --static-website --index-document index.html --404-document 404.html --auth-mode login
endlocal
