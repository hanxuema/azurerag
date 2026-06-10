#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <storage-account-name> <resource-group>"
  exit 1
fi

STORAGE_ACCOUNT="$1"
RESOURCE_GROUP="$2"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOC_DIR="${SCRIPT_DIR%/scripts}/data/seed-docs"

az storage blob upload-batch \
  --account-name "${STORAGE_ACCOUNT}" \
  --auth-mode login \
  --destination knowledge-base \
  --source "${DOC_DIR}" \
  --overwrite

echo "Seed documents uploaded to knowledge-base in ${STORAGE_ACCOUNT}."
