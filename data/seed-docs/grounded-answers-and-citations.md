# Grounded Answers And Citations

A grounded answer is an answer supported by retrieved evidence. The system should expose which passages were used so the user can inspect them. This makes the prototype easier to trust and easier to explain during a demo.

Citations can be lightweight. A title, source filename, snippet, and relevance score are enough for a first prototype. The important part is that the UI clearly distinguishes the model answer from the retrieved evidence.

When no relevant evidence is found, the application should say that directly instead of inventing an answer. This is one of the most visible signs that the application is doing retrieval rather than pretending to know everything.
