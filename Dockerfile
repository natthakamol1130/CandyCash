# ==============================================================================
# CandyCash — Unified Production Dockerfile (Multi-Stage)
# ==============================================================================
# Builds a single Next.js 14 + Prisma production container serving both the web
# UI and /api/* routes on 0.0.0.0:$PORT (default: 3000).
#
# Stages:
#   1. deps       -> Installs npm dependencies cleanly with npm ci
#   2. builder    -> Generates Prisma Client and compiles the Next.js production bundle
#   3. production -> Minimal Alpine runtime image running as non-root `USER node`
#
# Notes:
#   - Build from the repository root: docker build -t candycash:local .
#   - Secrets (DATABASE_URL, JWT_SECRET, ADMIN_PASSWORD, DEMO_USER_PASSWORD) are
#     never baked into the image; they are injected at runtime via environment
#     variables / GCP Secret Manager.
#   - prisma/ and node_modules/ remain in the runtime stage so the Cloud Run
#     migration job (`<prefix>-migrate`) can execute `npx prisma migrate deploy`
#     and `npm run prisma:seed` from this exact same immutable image.
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Install Dependencies
# ------------------------------------------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app

# Prisma requires OpenSSL on Alpine Linux
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 2: Build Application (Prisma Generate + Next.js Production Build)
# ------------------------------------------------------------------------------
FROM node:24-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json next.config.mjs postcss.config.mjs tailwind.config.ts tsconfig.json next-env.d.ts ./
COPY prisma ./prisma
COPY src ./src

ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# ------------------------------------------------------------------------------
# Stage 3: Production Runtime (Non-Root, Cloud Run Compatible)
# ------------------------------------------------------------------------------
FROM node:24-alpine AS production
WORKDIR /app

RUN apk add --no-cache openssl

# Copy built Next.js artifacts, runtime dependencies, and Prisma assets
# (node_modules stays root-owned read-only for stronger non-root isolation;
#  .next is owned by node:node so Next.js runtime cache remains writable)
COPY --from=builder /app/package.json /app/package-lock.json /app/next.config.mjs ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder /app/prisma ./prisma
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh

# Normalize line endings (Windows checkout safeguard) and mark entrypoint executable
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh

ENV NODE_ENV=production
ENV TZ=Asia/Bangkok
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
EXPOSE 3000

# Run as unprivileged non-root user
USER node

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "node_modules/next/dist/bin/next", "start", "-H", "0.0.0.0"]
