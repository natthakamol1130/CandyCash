#!/bin/sh
set -e

# CandyCash container entrypoint.
# Transfers execution directly to the target command via exec so Next.js
# (or the Cloud Run migration job command) runs as PID 1 and handles SIGTERM cleanly.
exec "$@"
