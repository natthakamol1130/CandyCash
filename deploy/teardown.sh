#!/usr/bin/env bash
# ==============================================================================
# CandyCash — Cleanup / Teardown Script for GCP Resources
# ==============================================================================
# ⚠️ WARNING: DO NOT RUN THIS SCRIPT ON THE SHARED COURSE PROJECT (cpe-se-course-2026)!
# This script permanently deletes Cloud Run services, jobs, Cloud SQL instances,
# Artifact Registry repositories, and Secret Manager secrets. It is strictly intended
# for personal sandbox GCP projects or end-of-semester course cleanup.
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

if [[ "$PROJECT_ID" == *"cpe-se-course-2026"* ]]; then
  echo "ERROR: Refusing to run teardown on shared course project: $PROJECT_ID" >&2
  exit 1
fi

REPO_NAME="${REPO_NAME:-sb1c2a258}"
SQL_INSTANCE="${SQL_INSTANCE:-sb1c2a258-pg}"
SERVICE_NAME="${SERVICE_NAME:-sb1c2a258}"
MIGRATE_JOB_NAME="${MIGRATE_JOB_NAME:-sb1c2a258-migrate}"
SA_NAME="${SA_NAME:-sb1c2a258-runner}"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

SECRETS=(
  "sb1c2a258-database-url"
  "sb1c2a258-admin-password"
  "sb1c2a258-demo-password"
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
