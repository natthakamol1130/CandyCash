#!/usr/bin/env bash
# ==============================================================================
# CandyCash — Cleanup / Teardown Script for GCP Resources
# ==============================================================================
# Usage:
#   ./deploy/teardown.sh [PROJECT_ID] [REGION]
#
# Deletes Cloud Run service, Cloud Run job, Cloud SQL instance, Artifact
# Registry repository, Secret Manager secrets, and runner service account.
# ==============================================================================
set -euo pipefail

PROJECT_ID="${1:-${PROJECT_ID:-}}"
REGION="${2:-${REGION:-asia-southeast1}}"
DRY_RUN="${DRY_RUN:-0}"

if [ -z "$PROJECT_ID" ]; then
  PROJECT_ID="$(gcloud config get-value project 2>/dev/null || true)"
fi
if [ -z "$PROJECT_ID" ]; then
  echo "ERROR: PROJECT_ID is required. Usage: $0 <PROJECT_ID> [REGION]" >&2
  exit 1
fi

REPO_NAME="${REPO_NAME:-candycash}"
SQL_INSTANCE="${SQL_INSTANCE:-candycash-pg}"
SERVICE_NAME="${SERVICE_NAME:-candycash}"
MIGRATE_JOB_NAME="${MIGRATE_JOB_NAME:-candycash-migrate}"
SA_NAME="${SA_NAME:-candycash-runner}"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

SECRETS=(
  "candycash-database-url"
  "candycash-admin-password"
  "candycash-demo-password"
)

run_cmd() {
  if [ "$DRY_RUN" = "1" ]; then
    echo "[DRY-RUN] $*"
    return 0
  fi
  "$@" || true
}

echo "=================================================================="
echo "CandyCash GCP Teardown"
echo "Project : ${PROJECT_ID}"
echo "Region  : ${REGION}"
echo "Dry Run : ${DRY_RUN}"
echo "=================================================================="

run_cmd gcloud run services delete "$SERVICE_NAME" --region "$REGION" --project "$PROJECT_ID" --quiet
run_cmd gcloud run jobs delete "$MIGRATE_JOB_NAME" --region "$REGION" --project "$PROJECT_ID" --quiet
run_cmd gcloud sql instances delete "$SQL_INSTANCE" --project "$PROJECT_ID" --quiet
run_cmd gcloud artifacts repositories delete "$REPO_NAME" --location "$REGION" --project "$PROJECT_ID" --quiet

for secret in "${SECRETS[@]}"; do
  run_cmd gcloud secrets delete "$secret" --project "$PROJECT_ID" --quiet
done

run_cmd gcloud iam service-accounts delete "$SA_EMAIL" --project "$PROJECT_ID" --quiet

echo "Teardown completed."
