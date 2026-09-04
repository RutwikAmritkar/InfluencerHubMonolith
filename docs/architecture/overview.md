# 🏗️ Architecture Overview

## 1. Monorepo Topology & Workspace Architecture

InfluencerHub is built as a **TypeScript pnpm Monorepo** designed to keep frontend UI, backend Express services, and database concerns cleanly isolated while sharing typed API contracts.

```
                  ┌──────────────────────────────┐
                  │    React 18 + Vite Web App   │
                  │         (`frontend/`)        │
                  └──────────────┬───────────────┘
                                 │ HTTP / REST API Calls
                                 ▼
                  ┌──────────────────────────────┐
                  │    Express 5 REST API Server │
                  │         (`backend/`)         │
                  └──────────────┬───────────────┘
                                 │ Drizzle ORM Queries
                                 ▼
                  ┌──────────────────────────────┐
                  │    PostgreSQL Database 18    │
                  │        (`database/`)         │
                  └──────────────────────────────┘
```

---

## 2. Core Package Responsibilities

### 🎨 `frontend/` (`@workspace/influencer-hub`)
- Built with React 18, Vite, Tailwind CSS, Lucide icons, and Framer Motion.
- Role-based workspaces: **Brand Workspace** (`/dashboard/brand`) and **Influencer Workspace** (`/dashboard/influencer`).
- Integrates React Query hooks generated from the OpenAPI 3.0 specification (`shared/api-client-react`).

### ⚙️ `backend/` (`@workspace/api-server`)
- Express 5 REST API backend.
- Handles Authentication via Better Auth (`/api/auth`), Social OAuth exchanges (`/api/social`), LLM query assistant (`/api/ai`), and campaign/application controllers.
- Background worker `SocialSyncService` handles background metrics sync from Instagram and YouTube Graph APIs.
- Structured Pino logging with automatic secret redaction (`DATABASE_URL`, tokens, passwords).

### 🗄️ `database/` (`@workspace/db`)
- PostgreSQL 14+ database layer powered by Drizzle ORM (`drizzle-orm`).
- Strong relational schema: `users`, `auth`, `influencers`, `brands`, `campaigns`, `applications`, `social_accounts`, `social_content`, `social_snapshots`, `social_tokens`, `oauth_states`, `notifications`, `conversations`, `messages`, `audit_logs`.

### 📦 `shared/`
- `shared/api-spec`: OpenAPI 3.0 YAML specification definitions.
- `shared/api-zod`: Auto-generated Zod schemas for input validation.
- `shared/api-client-react`: Auto-generated React Query data fetching hooks.

---

## 3. Security & Token Encryption Model

- **AES-256-GCM Encryption**: Social OAuth tokens (`access_token`, `refresh_token`) are encrypted at rest using `SOCIAL_TOKEN_SECRET` with randomized 12-byte initialization vectors (`token_iv`) and auth tags (`token_auth_tag`).
- **OAuth Replay Defense**: OAuth authentication flow uses single-use `oauth_states` records in PostgreSQL with 15-minute time-to-live (`expires_at`) and mandatory consumption marking (`used_at`).
- **Zero Token Leakage**: Encrypted tokens are strictly scoped to `backend` server-side background processes and never exposed to `frontend` client bundles or API payloads.
