# Azure RAG Fundamentals

Retrieval augmented generation, usually shortened to RAG, adds a retrieval step before a language model answers a question. Instead of relying only on model memory, the application searches a knowledge base for relevant passages and injects those passages into the prompt.

RAG improves answer grounding. When implemented well, the model can point back to the passages that informed the answer. This is useful when the user wants evidence, not just fluent text.

In Azure, a simple RAG stack often combines Blob Storage for source files, Azure AI Search for indexing and retrieval, and Azure OpenAI for embeddings and answer generation. A lightweight API can orchestrate those steps and return both the answer and the citations.

Good RAG systems also admit when the answer is not in the sources. That behavior is often more valuable than a confident but unsupported answer.
