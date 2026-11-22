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
- **Resource Prefix Convention:** `<prefix>` (assigned per team by the CPE 334 Student Cloud Portal)

### 2.2 Provisioned Cloud Resources
| Resource Type | Naming Pattern | Purpose & Configuration |
| :--- | :--- | :--- |
| **Artifact Registry** | `asia-southeast1-docker.pkg.dev/cpe-se-course-2026/<prefix>/<prefix>` | Stores immutable Docker container images tagged with full 40-character Git commit SHAs |
| **Cloud SQL (PostgreSQL 16)** | `<prefix>-pg` | Persistent managed relational database (`db-f1-micro`, Enterprise edition, 10 GB SSD, storage auto-increase disabled) |
| **Cloud Run Migration Job** | `<prefix>-migrate` | Executes `npx prisma migrate deploy && npm run prisma:seed` prior to service traffic updates |
| **Cloud Run Service** | `<prefix>` | Runs the unified Next.js + Prisma production container on port `3000` (`min-instances=0`, `max-instances=3`, `memory=512Mi`) |
| **Runtime Service Account** | `<prefix>-runner@cpe-se-course-2026.iam.gserviceaccount.com` | Least-privilege identity with `roles/cloudsql.client` and secret-level `roles/secretmanager.secretAccessor` |
| **Deployer Service Account** | `<prefix>-deployer@cpe-se-course-2026.iam.gserviceaccount.com` | Keyless GitHub Actions identity authenticated via Workload Identity Federation (WIF) |
| **Secret Manager Secrets** | `<prefix>-database-url`, `<prefix>-admin-password`, `<prefix>-demo-password` | Stores sensitive runtime connection strings and initial seeded credentials outside Git |

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
