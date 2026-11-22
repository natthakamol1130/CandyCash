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

cat > "$TMP_DIR/bin/gcloud" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
echo "$*" >> "$TEST_STATE_DIR/gcloud.log"
if [ "${STUB_FAIL_JOB:-0}" = "1" ] && [ "${1:-}" = "run" ] && [ "${2:-}" = "jobs" ] && [ "${3:-}" = "execute" ]; then
  exit 1
fi
if [ "${1:-}" = "run" ] && [ "${2:-}" = "services" ] && [ "${3:-}" = "describe" ]; then
  echo "https://sb1c2a258-4d7hbszvwq-as.a.run.app"
fi
exit 0
EOF
chmod +x "$TMP_DIR/bin/gcloud"

# 1. Successful release runs migration job BEFORE service deploy
rm -f "$TEST_STATE_DIR/gcloud.log"
bash "$RELEASE_SCRIPT" my-proj abc1234 asia-southeast1 > "$TMP_DIR/out.txt"
grep -q '^run jobs update sb1c2a258-migrate ' "$TEST_STATE_DIR/gcloud.log"
grep -q '^run jobs execute sb1c2a258-migrate ' "$TEST_STATE_DIR/gcloud.log"
grep -q '^run deploy sb1c2a258 ' "$TEST_STATE_DIR/gcloud.log"
echo "PASS: release runs migration job before service rollout"

# 2. Failed migration job aborts before service deploy
rm -f "$TEST_STATE_DIR/gcloud.log"
set +e
STUB_FAIL_JOB=1 bash "$RELEASE_SCRIPT" my-proj abc1234 asia-southeast1 > "$TMP_DIR/fail.txt" 2>&1
rc=$?
set -e
if [ "$rc" -eq 0 ]; then
  echo "FAIL: expected non-zero exit when migration job fails"
  exit 1
fi
if grep -q '^run deploy sb1c2a258 ' "$TEST_STATE_DIR/gcloud.log"; then
  echo "FAIL: service was deployed even though migration failed"
  exit 1
fi
echo "PASS: migration failure aborts service rollout"

# 3. DRY_RUN makes zero gcloud calls
rm -f "$TEST_STATE_DIR/gcloud.log"
DRY_RUN=1 bash "$RELEASE_SCRIPT" my-proj abc1234 asia-southeast1 > "$TMP_DIR/dry.txt"
if [ -f "$TEST_STATE_DIR/gcloud.log" ]; then
  echo "FAIL: dry run called gcloud"
  exit 1
fi
echo "PASS: dry run makes no gcloud calls"
