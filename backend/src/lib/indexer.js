import { getClients } from "./clients.js";
import { chunkDocument } from "./chunking.js";
import { createEmbedding } from "./retrieval.js";

export async function ensureIndex() {
  const { config, searchIndexClient } = getClients();

  const index = {
    name: config.searchIndexName,
    fields: [
      { name: "id", type: "Edm.String", key: true, filterable: true },
      { name: "chunkId", type: "Edm.String", filterable: true, sortable: true },
      { name: "title", type: "Edm.String", searchable: true, filterable: true, sortable: true },
      { name: "documentPath", type: "Edm.String", searchable: true, filterable: true, sortable: true },
      { name: "content", type: "Edm.String", searchable: true },
      { name: "chunkIndex", type: "Edm.Int32", filterable: true, sortable: true },
      {
        name: "embedding",
        type: "Collection(Edm.Single)",
        searchable: true,
        vectorSearchDimensions: 1536,
        vectorSearchProfileName: "default-vector-profile"
      }
    ],
    vectorSearch: {
      algorithms: [
        {
          name: "default-hnsw",
          kind: "hnsw"
        }
      ],
      profiles: [
        {
          name: "default-vector-profile",
          algorithmConfigurationName: "default-hnsw"
        }
      ]
    }
  };

  await searchIndexClient.createOrUpdateIndex(index);
}

export async function buildDocumentsFromBlobs(logger) {
  const { blobServiceClient, config } = getClients();
  const containerClient = blobServiceClient.getContainerClient(config.storageContainerName);
  const docs = [];

  for await (const blob of containerClient.listBlobsFlat()) {
    if (!blob.name.endsWith(".md") && !blob.name.endsWith(".txt")) {
      continue;
    }

    const blobClient = containerClient.getBlobClient(blob.name);
    const download = await blobClient.download();
    const content = await streamToString(download.readableStreamBody);
    const chunks = chunkDocument(content);

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const embedding = await createEmbedding(chunk);
      const chunkKey = buildChunkKey(blob.name, index);

      docs.push({
        id: chunkKey,
        chunkId: chunkKey,
        title: inferTitle(content, blob.name),
        documentPath: blob.name,
        content: chunk,
        chunkIndex: index,
        embedding
      });
    }

    logger?.info(`Prepared ${chunks.length} chunks from ${blob.name}`);
  }

  return docs;
}

export async function uploadDocuments(documents) {
  const { searchClient } = getClients();

  if (documents.length === 0) {
    return { uploaded: 0 };
  }

  const result = await searchClient.uploadDocuments(documents);
  return {
    uploaded: documents.length,
    successCount: result.results.filter((entry) => entry.succeeded).length
  };
}

function inferTitle(content, fallback) {
  const firstHeading = content.match(/^#\s+(.+)$/m);
  return firstHeading?.[1]?.trim() || fallback;
}

function buildChunkKey(blobName, chunkIndex) {
  return `${blobName.replace(/[^A-Za-z0-9_=-]/g, "-")}-${chunkIndex}`;
}

async function streamToString(stream) {
  if (!stream) {
    return "";
  }

  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}
