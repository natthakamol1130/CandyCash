#!/usr/bin/env bash
# Offline stub test for deploy/release.sh (no GCP calls).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RELEASE_SCRIPT="$REPO_ROOT/deploy/release.sh"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

export TEST_STATE_DIR="$TMP_DIR"
export PATH="$TMP_DIR/bin:$PATH"
mkdir -p "$TMP_DIR/bin"

FAKE_SHA="0123456789abcdef0123456789abcdef01234567"
FAKE_DIGEST="asia-southeast1-docker.pkg.dev/my-proj/sb1c2a258/sb1c2a258@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

cat > "$TMP_DIR/bin/gcloud" <<EOF
#!/usr/bin/env bash
set -euo pipefail
echo "\$*" >> "\$TEST_STATE_DIR/gcloud.log"
if [ "\${1:-}" = "artifacts" ] && [ "\${2:-}" = "docker" ] && [ "\${3:-}" = "images" ] && [ "\${4:-}" = "describe" ]; then
  echo "$FAKE_DIGEST"
  exit 0
fi
if [ "\${STUB_FAIL_JOB:-0}" = "1" ] && [ "\${1:-}" = "run" ] && [ "\${2:-}" = "jobs" ] && [ "\${3:-}" = "execute" ]; then
  exit 1
fi
if [ "\${1:-}" = "run" ] && [ "\${2:-}" = "services" ] && [ "\${3:-}" = "describe" ]; then
  echo "https://sb1c2a258-4d7hbszvwq-as.a.run.app"
  exit 0
fi
exit 0
EOF
chmod +x "$TMP_DIR/bin/gcloud"

# 1. Successful release resolves digest, runs migration job BEFORE service update, and exports GITHUB_ENV
rm -f "$TEST_STATE_DIR/gcloud.log" "$TMP_DIR/github_env"
GITHUB_ENV="$TMP_DIR/github_env" PROJECT_ID="my-proj" REGION="asia-southeast1" IMAGE_TAG="$FAKE_SHA" bash "$RELEASE_SCRIPT" > "$TMP_DIR/out.txt"
grep -q '^artifacts docker images describe ' "$TEST_STATE_DIR/gcloud.log"
grep -q '^run jobs update sb1c2a258-migrate ' "$TEST_STATE_DIR/gcloud.log"
grep -q '^run jobs execute sb1c2a258-migrate ' "$TEST_STATE_DIR/gcloud.log"
grep -q '^run services update sb1c2a258 ' "$TEST_STATE_DIR/gcloud.log"
grep -q '^run services update-traffic sb1c2a258 ' "$TEST_STATE_DIR/gcloud.log"
grep -q '^SERVICE_URL=https://sb1c2a258-4d7hbszvwq-as.a.run.app$' "$TMP_DIR/github_env"
grep -q "^DEPLOYED_IMAGE=${FAKE_DIGEST}\$" "$TMP_DIR/github_env"
echo "PASS: release resolves digest, runs migration job before service rollout, and sets GITHUB_ENV"

# 2. Rollback mode (ROLLBACK=true) skips migration job and updates service
rm -f "$TEST_STATE_DIR/gcloud.log"
ROLLBACK=true PROJECT_ID="my-proj" REGION="asia-southeast1" IMAGE_TAG="$FAKE_SHA" bash "$RELEASE_SCRIPT" > "$TMP_DIR/rollback.txt"
if grep -q '^run jobs ' "$TEST_STATE_DIR/gcloud.log"; then
  echo "FAIL: rollback should not run migration job"
  exit 1
fi
grep -q '^run services update sb1c2a258 ' "$TEST_STATE_DIR/gcloud.log"
echo "PASS: rollback skips migration job and updates service"

# 3. Failed migration job aborts before service update
rm -f "$TEST_STATE_DIR/gcloud.log"
set +e
STUB_FAIL_JOB=1 bash "$RELEASE_SCRIPT" my-proj "$FAKE_SHA" asia-southeast1 > "$TMP_DIR/fail.txt" 2>&1
rc=$?
set -e
if [ "$rc" -eq 0 ]; then
  echo "FAIL: expected non-zero exit when migration job fails"
  exit 1
fi
if grep -q '^run services update sb1c2a258 ' "$TEST_STATE_DIR/gcloud.log"; then
  echo "FAIL: service was updated even though migration failed"
  exit 1
fi
echo "PASS: migration failure aborts service rollout"

# 4. DRY_RUN makes zero gcloud calls
rm -f "$TEST_STATE_DIR/gcloud.log"
DRY_RUN=1 bash "$RELEASE_SCRIPT" my-proj "$FAKE_SHA" asia-southeast1 > "$TMP_DIR/dry.txt"
if [ -f "$TEST_STATE_DIR/gcloud.log" ]; then
  echo "FAIL: dry run called gcloud"
  exit 1
fi
echo "PASS: dry run makes no gcloud calls"
