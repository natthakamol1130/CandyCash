#!/usr/bin/env bash
# ==============================================================================
# CandyCash — Release Helper (Manual Rollout of an Already-Built Image Tag)
# ==============================================================================
# Usage:
#   ./deploy/release.sh <PROJECT_ID> <IMAGE_TAG> [REGION]
#
# Runs the migration + non-destructive seed Cloud Run Job BEFORE updating the
# Cloud Run service to the new image tag.
#
# Supports DRY_RUN=1 to print commands without executing them.
# ==============================================================================
set -euo pipefail

PROJECT_ID="${1:-${PROJECT_ID:-}}"
IMAGE_TAG="${2:-${IMAGE_TAG:-}}"
REGION="${3:-${REGION:-asia-southeast1}}"
DRY_RUN="${DRY_RUN:-0}"

if [ -z "$PROJECT_ID" ] || [ -z "$IMAGE_TAG" ]; then
  echo "Usage: $0 <PROJECT_ID> <IMAGE_TAG> [REGION]"
  echo "Example: $0 my-gcp-project-id \$(git rev-parse --short HEAD)"
  exit 1
fi

REPO_NAME="${REPO_NAME:-sb1c2a258}"
SERVICE_NAME="${SERVICE_NAME:-sb1c2a258}"
MIGRATE_JOB_NAME="${MIGRATE_JOB_NAME:-sb1c2a258-migrate}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:${IMAGE_TAG}"

run_cmd() {
  if [ "$DRY_RUN" = "1" ]; then
    echo "[DRY-RUN] $*"
    return 0
  fi
  "$@"
}

echo "=================================================================="
echo "CandyCash Release"
echo "Project : ${PROJECT_ID}"
echo "Region  : ${REGION}"
echo "Image   : ${IMAGE}"
echo "Dry Run : ${DRY_RUN}"
echo "=================================================================="

# 1. Update migration job to the new image and execute it BEFORE rolling out
run_cmd gcloud run jobs update "$MIGRATE_JOB_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --project "$PROJECT_ID"

if ! run_cmd gcloud run jobs execute "$MIGRATE_JOB_NAME" \
  --region "$REGION" \
  --wait \
  --project "$PROJECT_ID"; then
  echo "ERROR: Migration job '${MIGRATE_JOB_NAME}' failed. Service was NOT updated." >&2
  exit 1
fi

# 2. Roll out the new revision to Cloud Run
run_cmd gcloud run deploy "$SERVICE_NAME" \
  --image "$IMAGE" \
  --region "$REGION" \
  --project "$PROJECT_ID"

if [ "$DRY_RUN" = "1" ]; then
  SERVICE_URL="https://${SERVICE_NAME}-<hash>-as.a.run.app"
else
  SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --project "$PROJECT_ID" --format='value(status.url)')"
fi

echo "=================================================================="
echo "Release Completed!"
echo "Service URL: ${SERVICE_URL}"
echo "=================================================================="
