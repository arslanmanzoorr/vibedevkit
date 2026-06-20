# @seos/cloud

The hosted, multi-tenant **AISEOS gateway** — a Streamable-HTTP MCP endpoint that serves all 10 AISEOS servers' tools to authenticated users, with per-user state isolation and usage metering. Built for demand validation (Vercel frontend + this on a VPS).

## What it does

- **`POST /api/signup`** `{ email }` → issues an access token + a personal MCP URL. Idempotent per email (re-signup keeps your user id but rotates the token).
- **`POST /mcp`** — Streamable-HTTP MCP. Authenticates a `Bearer` token, builds that user's `ToolContext` (absolute per-user paths, `createPrMode: "plan"`), mounts all ~35 tools, logs each call, and serves the request.
- **`GET /healthz`** → `{ ok: true }`.
- **`GET /admin/usage`** (header `x-admin-secret`) → active-usage metric.

**Isolation & safety:** each user's memory/ADRs live under `SEOS_DATA_DIR/users/<id>/`; `create_pr` runs in **plan mode** (returns the PR plan, never executes git). Tokens are stored **hashed only**.

## Configuration (env)

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | Listen port |
| `SEOS_DATA_DIR` | `./data` | Volume for the SQLite db + per-user state |
| `SEOS_MCP_BASE_URL` | `http://localhost:$PORT` | Base URL used in the signup response's `mcpUrl` |
| `SEOS_FRONTEND_ORIGIN` | `*` | CORS origin allowed for `/api/*` (set to your Vercel origin) |
| `SEOS_ADMIN_SECRET` | — (**required**) | Secret for `/admin/usage` |

Persistence uses Node 24's built-in `node:sqlite` (users + usage_events) — no native dependency.

## Run

```bash
pnpm install && pnpm -r build
SEOS_ADMIN_SECRET=change-me SEOS_DATA_DIR=./data node packages/cloud/dist/index.js
```

## Docker

```bash
docker build -f packages/cloud/Dockerfile -t aiseos-cloud .
docker run -p 3000:3000 -e SEOS_ADMIN_SECRET=change-me -v aiseos-data:/data aiseos-cloud
```

Put a TLS-terminating reverse proxy (e.g. Caddy) in front in production.

## Connect a client

After signup, point any MCP client at the returned `mcpUrl` with the token as a bearer credential — all ~35 AISEOS tools become available to the assistant.
