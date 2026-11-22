#!/usr/bin/env bash
# ==============================================================================
# CandyCash — Release & Rollback Helper (used by .github/workflows/deploy.yml)
# ==============================================================================
# Usage:
#   PROJECT_ID=... REGION=... IMAGE_TAG=<40-char-sha> bash deploy/release.sh
#   or: ./deploy/release.sh <PROJECT_ID> <IMAGE_TAG> [REGION]
#
# Behavior:
#   - Normal release (ROLLBACK=false):
#       1) Resolves image tag to an immutable @sha256 digest in Artifact Registry
#       2) Updates & executes the Cloud Run migration + seed job (`sb1c2a258-migrate`)
#          BEFORE updating the Cloud Run service (aborts rollout if migration fails)
#       3) Updates Cloud Run service (`sb1c2a258`) to the digest and routes 100% traffic
#   - Rollback (ROLLBACK=true):
#       1) Resolves existing image tag to its immutable @sha256 digest
#       2) Skips migration & seed job
#       3) Points Cloud Run service (`sb1c2a258`) back to that digest with 100% traffic
#   - Exports SERVICE_URL and DEPLOYED_IMAGE to $GITHUB_ENV when running in GitHub Actions.
#   - Supports DRY_RUN=1 to print commands without contacting GCP.
# ==============================================================================
set -euo pipefail

PROJECT_ID="${1:-${PROJECT_ID:-}}"
IMAGE_TAG="${2:-${IMAGE_TAG:-}}"
REGION="${3:-${REGION:-asia-southeast1}}"
DRY_RUN="${DRY_RUN:-0}"

if [ -z "$PROJECT_ID" ] || [ -z "$IMAGE_TAG" ]; then
  echo "Usage: $0 <PROJECT_ID> <IMAGE_TAG> [REGION]" >&2
  exit 1
fi

REPO_NAME="${REPO_NAME:-sb1c2a258}"
SERVICE_NAME="${SERVICE_NAME:-sb1c2a258}"
MIGRATE_JOB_NAME="${MIGRATE_JOB_NAME:-sb1c2a258-migrate}"
ROLLBACK="${ROLLBACK:-false}"

if [[ "$ROLLBACK" != "true" && "$ROLLBACK" != "false" ]]; then
  echo "ERROR: Invalid ROLLBACK value '$ROLLBACK' (expected true or false)." >&2
  exit 1
fi

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
echo "Project  : ${PROJECT_ID}"
echo "Region   : ${REGION}"
echo "Image    : ${IMAGE}"
echo "Rollback : ${ROLLBACK}"
echo "Dry Run  : ${DRY_RUN}"
echo "=================================================================="

# 1. Resolve immutable @sha256 digest from Artifact Registry
if [ "$DRY_RUN" = "1" ]; then
  DIGEST_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}@sha256:dryrun"
else
  DIGEST_IMAGE="$(gcloud artifacts docker images describe "$IMAGE" --project="$PROJECT_ID" --format='value(image_summary.fully_qualified_digest)')"
  if [[ "$DIGEST_IMAGE" != "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}@sha256:"* ]]; then
    echo "ERROR: Image digest not found for ${IMAGE}" >&2
    exit 1
  fi
fi

# 2. Run database migration + non-destructive seed job (normal release only)
if [[ "$ROLLBACK" == "false" ]]; then
  run_cmd gcloud run jobs update "$MIGRATE_JOB_NAME" \
    --image "$DIGEST_IMAGE" \
    --region "$REGION" \
    --project "$PROJECT_ID" \
    --command "sh" \
    --args "-c,npx prisma migrate deploy && npm run prisma:seed" \
    --update-env-vars "NODE_ENV=production,TZ=Asia/Bangkok,SEED_DEMO_DATA=true" \
    --quiet

  if ! run_cmd gcloud run jobs execute "$MIGRATE_JOB_NAME" \
    --region "$REGION" \
    --wait \
    --project "$PROJECT_ID" \
    --quiet; then
    echo "ERROR: Migration job '${MIGRATE_JOB_NAME}' failed. Service was NOT updated." >&2
    exit 1
  fi
else
  echo "Rollback: reuse existing image; skip tests, build, migration and seed."
fi

# 3. Update Cloud Run service to the verified digest & shift 100% traffic to latest
run_cmd gcloud run services update "$SERVICE_NAME" \
  --image "$DIGEST_IMAGE" \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --port 3000 \
  --min-instances 0 \
  --max-instances 3 \
  --update-env-vars "NODE_ENV=production,TZ=Asia/Bangkok" \
  --quiet

run_cmd gcloud run services update-traffic "$SERVICE_NAME" \
  --to-latest \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --quiet

if [ "$DRY_RUN" = "1" ]; then
  SERVICE_URL="https://${SERVICE_NAME}-4d7hbszvwq-as.a.run.app"
else
  SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --project "$PROJECT_ID" --format='value(status.url)')"
fi

if [[ -n "${GITHUB_ENV:-}" ]]; then
  printf 'SERVICE_URL=%s\nDEPLOYED_IMAGE=%s\n' "$SERVICE_URL" "$DIGEST_IMAGE" >> "$GITHUB_ENV"
fi

echo "=================================================================="
echo "Release Completed!"
echo "Service URL    : ${SERVICE_URL}"
echo "Deployed Image : ${DIGEST_IMAGE}"
echo "=================================================================="
