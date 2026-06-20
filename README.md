# Azure AI Foundry RAG Prototype

This repository contains a low-cost, serverless-first RAG demo built for Azure AI Foundry. It includes:

- `infra/terraform`: Azure infrastructure
- `backend/`: Azure Functions API for chat and indexing
- `frontend/`: Static Web App frontend
- `data/seed-docs`: demo knowledge base
- `scripts/`: bootstrap helpers for deployment gaps Terraform cannot cover cleanly

## Architecture

- Azure Blob Storage stores source documents.
- Azure AI Search stores keyword and vector indexes.
- Azure Functions handles retrieval, prompt construction, and answer generation.
- Azure AI Foundry model deployments provide embeddings and chat completion.
- Azure Static Web Apps hosts the UI.

## API

### `POST /api/chat`

Request:

```json
{
  "question": "What is retrieval augmented generation?",
  "history": [],
  "settings": {
    "topK": 4,
    "temperature": 0.2
  }
}
```

Response:

```json
{
  "answer": "RAG grounds an LLM with retrieved source content.",
  "citations": [
    {
      "id": "1",
      "title": "RAG fundamentals",
      "documentPath": "azure-rag-fundamentals.md",
      "content": "RAG combines search retrieval with LLM generation...",
      "score": 0.82
    }
  ],
  "retrieval": {
    "topK": 4,
    "matches": []
  },
  "latencyMs": 820
}
```

### `POST /api/index`

Triggers indexing for the seed corpus or a supplied manifest.

## Local Development

1. Copy `backend/local.settings.example.json` to `backend/local.settings.json`.
2. Fill in Azure settings for Search, Storage, and Azure OpenAI / Foundry.
3. Install dependencies:

```bash
cd backend
npm install
```

4. Start the Functions host:

```bash
npm start
```

5. Open `frontend/index.html` directly for static preview, or host it with any static file server.
6. `frontend/config.js` defaults to `http://localhost:7071/api` for local API calls.

## Deployment Notes

Terraform provisions the durable infrastructure. Model deployment and initial content upload are kept as explicit scripts because provider coverage for Azure AI Foundry model lifecycle remains uneven. GitHub Actions deploy workflows in this repo are intentionally disabled; use local deployment steps instead.

Recommended flow:

1. `terraform apply`
2. Run `scripts/bootstrap-model.sh`
3. Run `scripts/upload-seed-docs.sh`
4. Deploy the Function App and Static Web App
5. Generate the production frontend config with the deployed Function App URL
6. Call `POST /api/index`

## Cost Posture

This prototype avoids always-on compute. Persistent costs primarily come from:

- Azure AI Search
- Storage account
- Application Insights
- Model deployment capacity depending on selected SKU
