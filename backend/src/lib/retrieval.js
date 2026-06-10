import { getClients } from "./clients.js";

export async function retrieveSources(question, topK = 4) {
  const { searchClient } = getClients();
  const vector = await createEmbedding(question);
  const searchResults = await searchClient.search(question, {
    top: topK,
    vectorSearchOptions: {
      queries: [
        {
          kind: "vector",
          vector,
          fields: ["embedding"],
          kNearestNeighborsCount: topK
        }
      ]
    },
    select: ["chunkId", "title", "documentPath", "content", "chunkIndex"]
  });

  const matches = [];
  for await (const result of searchResults.results) {
    matches.push({
      id: result.document.chunkId,
      title: result.document.title,
      documentPath: result.document.documentPath,
      content: result.document.content,
      chunkIndex: result.document.chunkIndex,
      score: result.score ?? 0
    });
  }

  return matches;
}

export async function createEmbedding(input) {
  const { config, credential, openAiApiKey } = getClients();
  const url = `${config.openAiEndpoint}openai/deployments/${config.embeddingDeployment}/embeddings?api-version=${config.openAiApiVersion}`;
  const headers = {
    "Content-Type": "application/json"
  };

  if (openAiApiKey) {
    headers["api-key"] = openAiApiKey;
  } else {
    const token = await credential.getToken("https://cognitiveservices.azure.com/.default");
    headers.Authorization = `Bearer ${token.token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ input })
  });

  if (!response.ok) {
    throw new Error(`Embedding request failed: ${response.status} ${await response.text()}`);
  }

  const payload = await response.json();
  return payload.data[0].embedding;
}
