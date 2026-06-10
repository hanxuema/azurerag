import { DefaultAzureCredential } from "@azure/identity";
import { SearchClient, SearchIndexClient, AzureKeyCredential } from "@azure/search-documents";
import { BlobServiceClient } from "@azure/storage-blob";
import { getConfig } from "../config.js";

let cachedClients;

export function getClients() {
  if (cachedClients) {
    return cachedClients;
  }

  const config = getConfig();
  const credential = new DefaultAzureCredential();

  const searchCredential = process.env.AZURE_SEARCH_API_KEY
    ? new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY)
    : credential;

  const openAiCredential = process.env.AZURE_OPENAI_API_KEY
    ? process.env.AZURE_OPENAI_API_KEY
    : null;

  cachedClients = {
    config,
    credential,
    openAiApiKey: openAiCredential,
    searchClient: new SearchClient(config.searchEndpoint, config.searchIndexName, searchCredential),
    searchIndexClient: new SearchIndexClient(config.searchEndpoint, searchCredential),
    blobServiceClient: new BlobServiceClient(config.storageAccountUrl, credential)
  };

  return cachedClients;
}
