# Terraform Notes

This Terraform stack provisions the durable Azure resources for the RAG demo:

- Resource group
- Storage account and container
- Azure AI Search
- Azure OpenAI / Foundry-compatible cognitive account
- Key Vault
- Consumption-plan Azure Functions app
- Static Web App
- Application Insights and Log Analytics
- Managed identity role assignments

## Known Gaps

- Model deployments are not fully managed here because Azure provider coverage is inconsistent for current Foundry/OpenAI deployment workflows.
- Initial content upload and index priming are handled by scripts in `/scripts`.
- Static Web App source deployment is expected to happen through the Azure portal, GitHub Actions, or `az staticwebapp` flow after provisioning.

## Apply

```bash
cd infra/terraform
terraform init
terraform apply -var-file=terraform.tfvars
```
