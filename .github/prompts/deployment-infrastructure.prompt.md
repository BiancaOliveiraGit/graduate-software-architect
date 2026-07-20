# Create Azure Deployment Infrastructure Using Bicep

## Summary

Create the Azure deployment infrastructure for the Claims Solution using **Bicep**. The implementation must follow all project standards, naming conventions, folder structure, and development guidelines defined in the repository's **`copilot-instructions.md`** file.

## Background

The solution requires Infrastructure as Code (IaC) to provision and manage Azure resources consistently across development, test, and production environments.

Bicep will be used to define reusable, modular infrastructure that can be deployed through the project's CI/CD pipeline.

## Objectives

* Create the initial Bicep infrastructure for the solution.
* Follow all architectural and coding standards documented in `copilot-instructions.md`.
* Ensure the infrastructure is modular, reusable, and environment-specific.
* Support automated deployments through GitHub Actions or the existing deployment pipeline.

## Scope

Implement the foundational infrastructure, including (where applicable):

* Resource Group
* Azure Storage Account with Blob Storage configured for Static Website Hosting
* Azure Key Vault
* Application Insights
* Log Analytics Workspace
* Managed Identity
* Networking components (if required)
* Configuration and parameter files for each environment
* Include deployment scripts and instructions for local and pipeline deployments.
* Include upload of all required files of the design-challenge website to Azure Storage Blob and enable static website hosting.

The solution should be structured using reusable Bicep modules where appropriate.

## Acceptance Criteria

* [ ] Infrastructure is implemented using Bicep.
* [ ] Repository structure follows `copilot-instructions.md`.
* [ ] Naming conventions comply with project standards.
* [ ] Parameters are separated from resource definitions.
* [ ] Environment-specific parameter files are provided.
* [ ] Resources support idempotent deployments.
* [ ] Secrets are not hardcoded.
* [ ] Outputs expose required resource identifiers for downstream deployments.
* [ ] Code includes appropriate comments where necessary.
* [ ] Bicep code passes validation.
* [ ] Deployment succeeds in a development environment.
* [ ] Documentation is updated where required.

## Technical Notes

* Use reusable Bicep modules wherever practical.
* Apply Azure naming and tagging standards.
* Minimise duplicated code.
* Follow least-privilege principles for identities and permissions.
* Design for future expansion as additional Azure services are introduced.
* Ensure the solution supports multiple environments (Development, Test, Production).

## Definition of Done

* Infrastructure successfully deploys using the project's deployment pipeline.
* All acceptance criteria are met.
* Code review completed.
* Documentation updated.
* No outstanding validation or linting issues.
