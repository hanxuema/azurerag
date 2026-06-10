# Deployment Checklist

1. Create `infra/terraform/terraform.tfvars` from the example file.
2. Apply Terraform in `infra/terraform` or run `scripts/deploy-infra.sh`.
3. Note the output values for the storage account, Function App, Static Web App, Search service, and OpenAI account.
4. Deploy a chat model and embedding model to the OpenAI account.
5. Publish the Functions app from `backend/` or let `Deploy App` GitHub Actions do it.
6. Generate frontend `config.js` with the Function App URL and upload the static site.
7. Run `scripts/upload-seed-docs.sh`.
8. Call `POST /api/index` once to create and populate the Search index.
9. Open the site and validate citation-backed answers.
