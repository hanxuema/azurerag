#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <static-web-app-name> <api-base-url>"
  exit 1
fi

STATIC_WEB_APP_NAME="$1"
API_BASE_URL="$2"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${SCRIPT_DIR%/scripts}/frontend"
TMP_DIR="$(mktemp -d)"

cp -R "${FRONTEND_DIR}/." "${TMP_DIR}/"
sed "s|__API_BASE_URL__|${API_BASE_URL}|g" "${FRONTEND_DIR}/config.production.js.template" > "${TMP_DIR}/config.js"

az staticwebapp upload \
  --name "${STATIC_WEB_APP_NAME}" \
  --source "${TMP_DIR}" \
  --location CentralUS

rm -rf "${TMP_DIR}"

echo "Static Web App deployed: ${STATIC_WEB_APP_NAME}"
