export function getConfig() {
  const required = [
    "AZURE_OPENAI_ENDPOINT",
    "AZURE_OPENAI_CHAT_DEPLOYMENT",
    "AZURE_OPENAI_EMBEDDING_DEPLOYMENT",
    "AZURE_SEARCH_ENDPOINT",
    "AZURE_SEARCH_INDEX_NAME",
    "AZURE_STORAGE_ACCOUNT_URL",
    "AZURE_STORAGE_CONTAINER_NAME"
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(", ")}`);
  }

  return {
    openAiEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    openAiApiVersion: process.env.AZURE_OPENAI_API_VERSION || "2024-10-21",
    chatDeployment: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT,
    embeddingDeployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
    searchEndpoint: process.env.AZURE_SEARCH_ENDPOINT,
    searchIndexName: process.env.AZURE_SEARCH_INDEX_NAME,
    storageAccountUrl: process.env.AZURE_STORAGE_ACCOUNT_URL,
    storageContainerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
    systemPrompt:
      process.env.RAG_SYSTEM_PROMPT ||
      "Answer only from the provided sources. If the answer is not supported by the sources, say that clearly."
  };
}
