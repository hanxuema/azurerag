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

## Required Repository Variables

The `Infra` workflow now generates `infra/terraform/terraform.tfvars` from GitHub repository variables.

Add these repository variables in GitHub if you want to override defaults:

- `TF_PROJECT_NAME`
- `TF_RESOURCE_GROUP_NAME`
- `TF_LOCATION`
- `TF_STATIC_WEB_APP_LOCATION`
- `TF_SEARCH_SKU`
- `TF_OPENAI_SKU_NAME`

Default values if you do nothing:

- `TF_PROJECT_NAME=ragdemo`
- `TF_RESOURCE_GROUP_NAME=rg-rag-demo`
- `TF_LOCATION=australiaeast`
- `TF_STATIC_WEB_APP_LOCATION=eastasia`
- `TF_SEARCH_SKU=basic`
- `TF_OPENAI_SKU_NAME=S0`

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

This repo uses GitHub repository variables to generate `terraform.tfvars` during the workflow. You do not need to commit a live `terraform.tfvars` file for CI.

### 8. Resource provider registration

The `Infra` workflow explicitly registers and waits for these Azure resource providers before running Terraform:

- `Microsoft.Storage`
- `Microsoft.Web`
- `Microsoft.Search`
- `Microsoft.CognitiveServices`
- `Microsoft.Insights`
- `Microsoft.OperationalInsights`
- `Microsoft.KeyVault`

This avoids the subscription-level registration conflicts that can happen when Terraform tries to auto-register everything on first run.
