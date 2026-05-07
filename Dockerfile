# syntax=docker/dockerfile:1.7
# Multi-stage production build for the Budget SvelteKit + Bun + SQLite app.

ARG BUN_VERSION=1.3
ARG PNPM_VERSION=10.33.0

# ----------------------------------------------------------------
# Stage 1 — install all deps + build the SvelteKit app
# ----------------------------------------------------------------
FROM oven/bun:${BUN_VERSION} AS builder
WORKDIR /app

ARG PNPM_VERSION
RUN bun install -g pnpm@${PNPM_VERSION}

# Manifest layer first — invalidated only when deps change.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ----------------------------------------------------------------
# Stage 2 — production-only node_modules (no devDependencies)
# ----------------------------------------------------------------
FROM oven/bun:${BUN_VERSION} AS deps
WORKDIR /app

ARG PNPM_VERSION
RUN bun install -g pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ----------------------------------------------------------------
# Stage 3 — minimal runtime image
# ----------------------------------------------------------------
FROM oven/bun:${BUN_VERSION}-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
	PORT=3000 \
	HOST=0.0.0.0 \
	DATABASE_URL=/app/data/budget.db \
	ORIGIN=http://localhost:3000

# Non-root user with a writable data dir.
RUN groupadd --system --gid 1001 budget && \
	useradd  --system --uid 1001 --gid budget --home /app budget && \
	mkdir -p /app/data && \
	chown -R budget:budget /app
USER budget

COPY --from=builder --chown=budget:budget /app/build ./build
COPY --from=builder --chown=budget:budget /app/drizzle ./drizzle
COPY --from=deps    --chown=budget:budget /app/node_modules ./node_modules
COPY              --chown=budget:budget package.json ./

EXPOSE 3000
VOLUME ["/app/data"]

# hooks.server.ts applies pending migrations on boot, so the server
# command is the only thing we run.
CMD ["bun", "run", "build/index.js"]
