#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <function-app-name> <resource-group>"
  exit 1
fi

FUNCTION_APP_NAME="$1"
RESOURCE_GROUP="$2"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR%/scripts}/backend"

pushd "${BACKEND_DIR}" >/dev/null
npm install
npm run test
zip -qr functionapp.zip .
az functionapp deployment source config-zip \
  --name "${FUNCTION_APP_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --src functionapp.zip
rm -f functionapp.zip
popd >/dev/null

echo "Function App deployed: ${FUNCTION_APP_NAME}"
