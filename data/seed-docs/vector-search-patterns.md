# Vector Search Patterns

Vector search converts text into numeric embeddings and finds semantically similar chunks. This helps when the user question does not exactly match the wording of the source documents.

Keyword search and vector search are often strongest together. Keyword matching helps preserve exact terminology while vector search captures conceptual similarity. A hybrid retrieval approach is usually a sensible default for a demo system.

Chunking matters because search works on indexed fragments rather than full files. If chunks are too small, the answer loses context. If chunks are too large, retrieval precision drops and prompt cost rises.
