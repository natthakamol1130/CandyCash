# CandyCash — Lab 5 Cloud Deployment & CI/CD Pipeline Specification

**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (Semester 1/2026)
**Project:** CandyCash — Smart Personal Money & Expense Logging System
**Repository:** `https://github.com/natthakamol1130/CandyCash`

---

## 1. Team Members & IAM Access Matrix (L5-01 / Episode 1)

| Member | Student ID | Full Name | GitHub Username | GCP / Portal Role | Responsibilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Member 1** | `67070505215` | นางสาว ณัฏฐกมล มอญปาน | `@natthakamol1130` | Project Member / Developer (`Editor`) | Cloud provisioning (`L5-01`), Docker packaging (`L5-03`), First GCP deploy (`L5-05`), Auto-deploy pipeline (`L5-07`), and Peer Reviewer for `L5-02, 04, 06, 08` |
| **Member 2** | `67070505227` | นางสาว สุประวีณ์ สุทธิเสรีนิวัฒน์ | `@Suprawi5227` | Project Member / Developer (`Editor`) | Cloud-ready refactoring (`L5-02`), GitHub Actions CI (`L5-04`), WIF & Main merge gate (`L5-06`), Persistence & rollback (`L5-08`), and Peer Reviewer for `L5-01, 03, 05, 07` |

---

## 2. GCP Project, Region & Cost Control Baseline (L5-01 / R-03, R-04)

### 2.1 Cloud Platform Environment
- **GCP Project ID:** `cpe-se-course-2026` (Course Managed Cloud Platform via `https://cpe334-student-cloud-4d7hbszvwq-as.a.run.app`)
- **Primary Region:** `asia-southeast1` (Singapore)
- **Team Name & Assigned Prefix:** `maimuu` / `sb1c2a258`
- **Public Cloud Run Service URL:** `https://sb1c2a258-4d7hbszvwq-as.a.run.app`

### 2.2 Provisioned Cloud Resources
| Resource Type | Naming Pattern | Purpose & Configuration |
| :--- | :--- | :--- |
| **Artifact Registry** | `asia-southeast1-docker.pkg.dev/cpe-se-course-2026/sb1c2a258/sb1c2a258` | Stores immutable Docker container images tagged with full 40-character Git commit SHAs |
| **Cloud SQL (PostgreSQL 16)** | `sb1c2a258-pg` | Persistent managed relational database (`db-f1-micro`, Enterprise edition, 10 GB SSD, storage auto-increase disabled) |
| **Cloud Run Migration Job** | `sb1c2a258-migrate` | Executes `npx prisma migrate deploy && npm run prisma:seed` prior to service traffic updates |
| **Cloud Run Service** | `sb1c2a258` | Runs the unified Next.js + Prisma production container on port `3000` (`min-instances=0`, `max-instances=3`, `memory=512Mi`) |
| **Runtime Service Account** | `sb1c2a258-runner@cpe-se-course-2026.iam.gserviceaccount.com` | Least-privilege identity with `roles/cloudsql.client` and secret-level `roles/secretmanager.secretAccessor` |
| **Deployer Service Account** | `sb1c2a258-deployer@cpe-se-course-2026.iam.gserviceaccount.com` | Keyless GitHub Actions identity authenticated via Workload Identity Federation (WIF) |
| **Secret Manager Secrets** | `sb1c2a258-database-url`, `sb1c2a258-app-secret-1`, `sb1c2a258-admin-password`, `sb1c2a258-demo-password` | Stores sensitive runtime connection strings, optional JWT signing key (`JWT_SECRET`, falls back to `DATABASE_URL` if unset), and initial seeded credentials outside Git |

### 2.3 Cost Control & Safety Guardrails
1. **Scale-to-Zero Compute:** Cloud Run service is configured with `--min-instances 0` and `--max-instances 3` so idle periods incur zero compute instance charges.
2. **Bounded Database Storage:** Cloud SQL uses `db-f1-micro` with `--no-storage-auto-increase` to prevent unexpected disk expansion billing.
3. **Zero Committed Secrets (`R-02`, `R-12`):** `.env` files, database passwords, connection strings, and service account keys are strictly excluded from Git and Docker images.

---

## 3. Architecture & Stack Reference

- **Application Stack:** Next.js 14 (App Router, Full-Stack UI + REST API in a single unified container on port `3000`), TypeScript, Tailwind CSS, Prisma ORM, and PostgreSQL 16.
- **Differences from Reference Starter Kit (`TokTickIT`):**
  - Instead of separate `client/` (Vite + nginx) and `server/` (Express) directories, **CandyCash** uses a unified Next.js 14 full-stack architecture where both the web UI and `/api/*` endpoints are served from the same Node.js process on port `3000`.
  - All database schema migrations and non-destructive seeding use Prisma ORM (`npx prisma migrate deploy && npm run prisma:seed`).

---

## 4. Environment Variables & Secret Configuration (L5-02 / R-02)

All configuration values are read from environment variables and documented with placeholders in `.env.example`. No real secret is ever committed to Git or baked into Docker images.

| Variable | Purpose | Secret? | Source (Local vs. Cloud Run) |
| :--- | :--- | :---: | :--- |
| `DATABASE_URL` | PostgreSQL 16 connection string for Prisma ORM | **Yes** | Local `.env` / Cloud Run Secret Manager (`sb1c2a258-database-url`) |
| `JWT_SECRET` | HS256 signing key for HTTP-only session cookies | **Yes** | Local `.env` / Cloud Run Secret Manager (`sb1c2a258-app-secret-1`); falls back to `DATABASE_URL` in production if unset |
| `PORT` | HTTP server port (`0.0.0.0:$PORT`, default `3000`) | No | Local default `3000` / Injected automatically by Cloud Run |
| `NODE_ENV` | Runtime mode (`development` or `production`) | No | Local `.env` / Cloud Run `--update-env-vars NODE_ENV=production` (never use `--set-env-vars` so portal-managed vars are not overwritten) |
| `TZ` | Runtime timezone (`Asia/Bangkok`) | No | Cloud Run `--update-env-vars TZ=Asia/Bangkok` |
| `ADMIN_PASSWORD` | Initial password for `admin@candycash.local` during seed | **Yes** | Local fallback / Cloud Run Job Secret Manager (`sb1c2a258-admin-password`) |
| `SEED_DEMO_DATA` | Toggle demo users & sample wallets (`true`/`false`) | No | Local default `true` / Cloud Run Job env var (`false` unless `--demo`) |
| `DEMO_USER_PASSWORD` | Initial password for demo accounts when `SEED_DEMO_DATA=true` | **Yes** | Local fallback / Cloud Run Job Secret Manager (`sb1c2a258-demo-password`) |

---

## 5. Six-Point Cloud-Readiness Verification (Episode 2.2)

1. **No local file uploads:** CandyCash stores all financial records in PostgreSQL and writes nothing to the container filesystem.
2. **Production-safe idempotent seed:** `prisma/seed.ts` uses non-destructive `upsert` operations and reads passwords from `ADMIN_PASSWORD` and `DEMO_USER_PASSWORD`.
3. **No dev shortcuts in production:** `/login` disables default password pre-fill and hides the demo quick-fill buttons when `NODE_ENV=production`.
4. **Stateless session persistence:** Signed HTTP-only JWT cookies (`jose` HS256) remain valid across container restarts and horizontal scaling.
5. **Dynamic port binding:** Next.js binds to `0.0.0.0` and listens on `$PORT` (default `3000`).
6. **Health & readiness probes:** `GET /api/health` (`200 OK`) and `GET /api/ready` (`SELECT 1` database check returning `200` or `503`) are implemented and allowed in `src/middleware.ts`.

---

## 6. Build, Test, Migrate & Seed Commands

```bash
# Install dependencies & generate Prisma client
npm ci
npx prisma generate

# Apply PostgreSQL migrations & run idempotent seed
npx prisma migrate deploy
npm run prisma:seed

# Run automated test suite (52 tests) & TypeScript / Next.js production build
npm test
npx tsc --noEmit
npm run build
```

---

## 7. Multi-Stage Docker Packaging & Local Compose Verification (L5-03 / R-03, R-04)

### 7.1 Unified Multi-Stage `Dockerfile`
- **Stage 1 (`deps`):** Installs locked dependencies via `npm ci` on `node:24-alpine` with `openssl` for Prisma.
- **Stage 2 (`builder`):** Copies configuration, `prisma/`, and `src/`, runs `npx prisma generate && npm run build`.
- **Stage 3 (`production`):** Copies only runtime assets (`package*.json`, `next.config.mjs`, `node_modules/`, `.next/`, `prisma/`, `docker-entrypoint.sh`) owned by `node:node`, runs as unprivileged `USER node`, listens on `0.0.0.0:$PORT` (default `3000`), and executes Next.js directly as PID 1 via `exec "$@"`.
- **Context Isolation (`.dockerignore`):** Strictly excludes `.env*`, local `*.db`/`*.sqlite` files, `node_modules`, `.next`, `.git`, `tests`, `docs`, `*.pdf`, and reference starter folders from the Docker build context.

### 7.2 Local Full-Stack Verification (`docker-compose.yml`)
The Compose stack mirrors Cloud Run + Cloud SQL locally using three orchestrated services:
1. `db` (`postgres:16-alpine`) with a persistent `postgres_data` volume and `pg_isready` healthcheck.
2. `migrate` (one-shot container built from `Dockerfile`) waiting on `db: service_healthy` to run `npx prisma migrate deploy && npm run prisma:seed`.
3. `server` (unified production container built from `Dockerfile`) waiting on `migrate: service_completed_successfully`, exposing port `3000` with a `/api/ready` healthcheck.

```bash
# Build the unified production image
docker build -t candycash:local .

# Start PostgreSQL, run migrations + idempotent seed, and boot CandyCash on :3000
docker compose up --build -d

# Verify liveness, readiness, and non-root execution
curl -fsS http://localhost:3000/api/health
curl -fsS http://localhost:3000/api/ready
docker exec candycash-server id

# Tear down containers (add -v only if resetting local PostgreSQL data)
docker compose down
```

---

## 8. Repeatable CI/CD Release & Rollback Procedure (L5-06, L5-07, L5-08 / R-07, R-08)

### 8.1 GitHub Environment (`demo`) & Merge Gate (`protect-main`)
- **Keyless Authentication (Workload Identity Federation):** GitHub Actions authenticates to GCP project `cpe-se-course-2026` as `sb1c2a258-deployer@cpe-se-course-2026.iam.gserviceaccount.com` via `google-github-actions/auth` using OIDC (`id-token: write`). Zero service-account JSON keys exist in GitHub or GCP.
- **GitHub Environment `demo` (restricted to `main`):**
  - `GCP_PROJECT_ID`: `cpe-se-course-2026`
  - `GCP_REGION`: `asia-southeast1`
  - `WIF_PROVIDER`: Workload Identity Pool Provider resource path for `sb1c2a258`
  - `WIF_SERVICE_ACCOUNT`: `sb1c2a258-deployer@cpe-se-course-2026.iam.gserviceaccount.com`
  - Optional smoke-test credentials: `SMOKE_EMAIL` (variable) and `SMOKE_PASSWORD` (secret)
- **Branch Protection Ruleset (`protect-main`):** Active on `main` with an empty bypass list, requiring pull request review (`1` approval), up-to-date branches, and passing `test-and-docker` status check before merge (`R-05`, `R-06`, `C-02`).

### 8.2 Automated Release Pipeline (`.github/workflows/deploy.yml`)
Every merge into `main` triggers the **`Deploy demo`** workflow automatically:
1. **`test` job:** Calls `./.github/workflows/ci-docker.yml` (`test-and-docker`) to re-verify all deployment scripts, PostgreSQL migrations, seed, 52 Vitest unit/integration tests, TypeScript check, Next.js build, and Docker build.
2. **`deploy` job (`environment: demo`):**
   - Validates `PROJECT_ID`, `REGION`, `WIF_PROVIDER`, `WIF_SERVICE_ACCOUNT`, and the 40-character commit SHA `IMAGE_TAG`.
   - Authenticates to GCP via WIF and pushes `asia-southeast1-docker.pkg.dev/cpe-se-course-2026/sb1c2a258/sb1c2a258:<40-char-SHA>`.
   - Runs `bash deploy/release.sh`, which resolves the immutable `@sha256` digest, updates and executes `sb1c2a258-migrate` (`npx prisma migrate deploy && npm run prisma:seed`), and only after migration succeeds updates the `sb1c2a258` Cloud Run service and shifts 100% traffic to the latest revision.
   - Executes `python3 deploy/smoke_test.py "$SERVICE_URL"` against `https://sb1c2a258-4d7hbszvwq-as.a.run.app` (`/api/health`, `/api/ready`, `/`, `/login`, and optional login round-trip).
   - Writes the deployed commit SHA tag, `@sha256` image digest, rollback flag, and public URL to the GitHub Actions run summary (`$GITHUB_STEP_SUMMARY`).

### 8.3 How to Identify the Running Commit & Perform a Rollback (`R-08`, `C-05`)
- **Identify Running Commit:**
  1. Open **GitHub Actions -> Deploy demo -> latest run -> Summary** to read `Commit image tag` (full 40-character Git SHA) and `Digest` (`@sha256:...`).
  2. In **Google Cloud Console -> Cloud Run -> `sb1c2a258` -> Revisions**, verify the active revision serving 100% traffic matches the exact `@sha256` digest and commit SHA in Artifact Registry (`sb1c2a258/sb1c2a258`).
- **Rollback / Roll-Forward Procedure:**
  1. In GitHub, navigate to **Actions -> Deploy demo -> Run workflow** on branch `main`.
  2. Paste the full 40-character commit SHA of an existing tested image in Artifact Registry (for example, **Release A**: `47b4c316ed1f3056498a7b974ab837507cb70176`, deployed in [Actions Run #45066805664](https://github.com/natthakamol1130/CandyCash/actions/runs/45066805664)) into `image_tag` and click **Run workflow**.
  3. When `image_tag` is provided (`ROLLBACK=true`), the workflow skips `test`, image build, and `sb1c2a258-migrate`, resolves the existing image's `@sha256` digest, updates `sb1c2a258` to serve 100% traffic on that digest, and verifies the live URL with `deploy/smoke_test.py`.
  4. To roll forward, run `Deploy demo` again with the newer 40-character commit SHA of **Release B** (or leave `image_tag` empty to deploy the head of `main`).
