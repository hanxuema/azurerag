#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <resource-group> <openai-account-name> <location>"
  echo "Then deploy chat and embedding models manually or extend this script for your approved model names."
  exit 1
fi

RESOURCE_GROUP="$1"
OPENAI_ACCOUNT="$2"
LOCATION="$3"

cat <<EOF
Bootstrap reminder:
- Resource group: ${RESOURCE_GROUP}
- OpenAI account: ${OPENAI_ACCOUNT}
- Location: ${LOCATION}

Next step:
1. Confirm model availability and quota in ${LOCATION}
2. Deploy one chat model, for example gpt-4o-mini
3. Deploy one embedding model, for example text-embedding-3-small
4. Update backend app settings if deployment names differ

This script is intentionally conservative because model deployment support and quotas vary by region and subscription.
EOF
