import { app } from "@azure/functions";
import { ensureIndex, buildDocumentsFromBlobs, uploadDocuments } from "../lib/indexer.js";

app.http("index", {
  route: "index",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const body = await request.json().catch(() => ({}));
      context.log(`Index request received`, body);

      await ensureIndex();
      const documents = await buildDocumentsFromBlobs(context);
      const result = await uploadDocuments(documents);

      return {
        status: 200,
        jsonBody: {
          message: "Indexing completed.",
          indexedDocuments: result.uploaded,
          successfulUploads: result.successCount ?? result.uploaded
        }
      };
    } catch (error) {
      context.error(error);
      return {
        status: 500,
        jsonBody: {
          error: "Indexing failed.",
          details: error.message
        }
      };
    }
  }
});
