# GitHub Secrets And Azure OIDC Setup

This project uses two GitHub Actions workflows:

- `Infra`: provisions Azure resources with Terraform
- `Deploy App`: deploys the Function App and Static Web App

## Required GitHub Secrets

Add these repository secrets in GitHub:

### Azure OIDC authentication

- `AZURE_CLIENT_ID`: client ID of the Azure AD application or user-assigned identity used by GitHub Actions
- `AZURE_TENANT_ID`: Azure tenant ID
- `AZURE_SUBSCRIPTION_ID`: Azure subscription ID

### App deployment

- `AZURE_FUNCTIONAPP_NAME`: name of the deployed Function App
- `AZURE_STATIC_WEB_APPS_API_TOKEN`: deployment token for the Static Web App
- `RAG_API_BASE_URL`: public API base URL, for example `https://<function-app>.azurewebsites.net/api`

## Required Repository Variables Or Files

The `Infra` workflow expects a valid `infra/terraform/terraform.tfvars` file in the repository workspace. Do not commit real subscription-specific values unless that is intentional.

Recommended approach:

- keep `terraform.tfvars.example` in git
- create `terraform.tfvars` only in CI or locally
- if you want full CI apply, add a pre-step that writes `terraform.tfvars` from secrets or variables

## Azure OIDC Setup

OIDC avoids storing a long-lived Azure client secret in GitHub.

### 1. Create or choose an Azure AD application

Create an Azure AD app registration that GitHub Actions will use to sign in to Azure.

### 2. Add a federated credential

In Azure:

- Go to the app registration
- Open `Certificates & secrets`
- Open `Federated credentials`
- Add a new credential

Recommended values:

- Federated credential scenario: `GitHub Actions deploying Azure resources`
- Organization: `hanxuema`
- Repository: `azurerag`
- Entity type: `Branch`
- Branch name: `main`

This allows workflows from `main` to exchange GitHub's OIDC token for Azure access.

### 3. Grant Azure permissions

Assign the app registration enough Azure RBAC to deploy this stack.

Minimum practical scope is usually the target resource group or subscription, depending on whether the resource group already exists.

Typical roles:

- `Contributor`
- `User Access Administrator` only if your Terraform run must create role assignments

Because this project creates RBAC assignments for the Function App identity, plain `Contributor` may not be enough in some subscriptions. If Terraform fails on role assignment creation, add `User Access Administrator` at the same scope.

### 4. Set repository secrets

Populate:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

### 5. Static Web App deployment token

After creating the Static Web App:

- Open the Static Web App in Azure Portal
- Find the deployment token
- Save it as `AZURE_STATIC_WEB_APPS_API_TOKEN`

### 6. Function API URL secret

After deploying the Function App, set:

- `RAG_API_BASE_URL=https://<function-app-name>.azurewebsites.net/api`

### 7. Terraform input handling

Choose one of these approaches:

1. Commit a non-sensitive `terraform.tfvars` if the values are safe for source control.
2. Store each Terraform input as a GitHub secret or variable and generate `terraform.tfvars` during the workflow.

Recommended for this repo: generate `terraform.tfvars` in CI, because names and regions are fine to expose, but keeping the workflow explicit is cleaner and avoids accidental environment coupling.

## Recommended Next Improvement

If you want fully hands-off CI, update `Infra` to generate `infra/terraform/terraform.tfvars` from repository variables before `terraform plan` and `terraform apply`.
