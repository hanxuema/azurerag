# Cost Conscious Architecture

For a prototype, the most important cost decision is avoiding always-on compute. Static hosting and serverless functions help keep idle cost low.

Some managed services still have baseline cost. Azure AI Search usually dominates the recurring cost for a small RAG prototype because it stays provisioned even when the app is idle. Storage and monitoring are typically smaller contributors.

The best way to control cost is to keep the corpus small, use lower-cost model deployments when possible, and avoid extra infrastructure layers that do not improve the demonstration.
