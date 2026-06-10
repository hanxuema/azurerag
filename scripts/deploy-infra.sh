#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="${SCRIPT_DIR%/scripts}/infra/terraform"

if [[ ! -f "${TF_DIR}/terraform.tfvars" ]]; then
  echo "Missing ${TF_DIR}/terraform.tfvars"
  echo "Copy terraform.tfvars.example and fill in your values first."
  exit 1
fi

terraform -chdir="${TF_DIR}" init
terraform -chdir="${TF_DIR}" apply -var-file=terraform.tfvars "$@"
