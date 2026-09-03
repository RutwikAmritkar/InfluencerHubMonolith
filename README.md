# InfluencerHub — Creator Economy & Brand Marketplace Platform

InfluencerHub is a modern, premium creator marketplace and intelligence platform designed to connect verified influencers with top brand campaigns. Inspired by sleek SaaS aesthetics (Linear, Vercel, Superlist), it combines real-time campaign management with server-side AI creator telemetry and official social media integrations.

---

## 🌟 Key Features

### 1. 🔑 **Authentication & Role-Based Workspaces**
- **Better Auth Integration**: Better Auth with PostgreSQL Drizzle ORM (`@workspace/db`). Session token cookie authentication with strict server-side identity resolution (`req.userId`).
- **Influencer Workspace (`/dashboard/influencer`)**: Audience telemetry, connected social accounts, earnings, rate card indicators, and active campaign opportunities.
- **Brand Workspace (`/dashboard/brand`)**: Aggregate campaign performance, creator discovery grid, live application review, and AI campaign builder.

### 2. 📱 **Official Social Media Integration System**
- **Instagram / Meta Integration**: Official Meta Instagram Login for Business (Graph API v20.0). Scopes `instagram_business_basic` and `instagram_business_manage_insights`. 60-day long-lived token exchange (`ig_exchange_token`) with token refresh (`ig_refresh_token`).
- **YouTube Integration**: Official Google OAuth 2.0 & YouTube Data API v3 (`channels`, `search`, `videos`) for channel subscribers, total view counts, video performance, and token auto-refresh.
- **Persistent OAuth State Security**: Short-lived single-use `oauth_states` records in PostgreSQL with 15-minute expiration, session ownership checks, and immediate consumption (`used_at = NOW()`) to eliminate replay attacks.
- **AES-256-GCM Token Encryption**: Social access and refresh tokens are encrypted at rest with unique 12-byte IVs (`token_iv`) and auth tags (`token_auth_tag`) using `SOCIAL_TOKEN_SECRET`. Zero token exposure in API responses or frontend state.
- **Idempotent Data Sync**: Idempotent upsert of social content using `(social_account_id, external_content_id)` uniqueness identity. Append-only immutable historical telemetry in `social_metric_snapshots`.
- **Data Retention & Privacy Strategy**: Soft-disconnect revokes and destroys OAuth credentials in `social_tokens` while retaining historical snapshots & media for past campaign reporting. Dedicated GDPR endpoint (`/api/social/privacy/gdpr-delete-user-data`) executes full data erasure upon request.

### 3. 🔍 **Creator Discovery & Marketplace**
- Responsive verified creator cards (`/find-creators` & `/influencers/:id`) with real-time keyword search, category filters, and detailed profile views.

### 4. 🤖 **Server-Side OpenAI LLM Intelligence Engine**
- AI Assistant (`/ai-assistant`) powered by Express backend service (`artifacts/api-server/src/services/llm.ts`).
- Server-side RAG aggregation pulling database telemetry (followers, engagement rate, active campaigns) securely on the server.

### 5. 📝 **Production-Safe Structured Logging**
- Centralized Pino logger ([`logger.ts`](file:///c:/Influencer%20Hub/Asset-Manager/artifacts/api-server/src/lib/logger.ts)) with explicit secret redaction rules (`passwords`, `access_tokens`, `DATABASE_URL`, secrets).
- Structured logging helpers for `AUTH`, `OAUTH`, `SOCIAL_SYNC`, and `DATABASE` events.

---

## 🏗️ Repository Architecture

This repository is structured as a TypeScript pnpm workspace:

```
Influencer-Hub/
├── artifacts/
│   ├── api-server/              # Express 5 REST API Backend & Social Sync Engine
│   │   ├── src/routes/          # Express route controllers (/social, /auth, /campaigns, /influencers)
│   │   ├── src/integrations/    # Platform adapters (instagram.provider.ts, youtube.provider.ts)
│   │   ├── src/services/        # SocialSyncService background sync engine
│   │   ├── src/lib/             # Structured Pino logger & session helpers
│   │   └── src/middlewares/     # Better Auth session authentication middleware
│   │
│   └── influencer-hub/          # React 18 + Vite Web Application
│       ├── src/components/      # SocialAccountsForm, UI components, layout shell
│       ├── src/pages/           # Page routes (Dashboard, Creator Discovery, Campaigns, Settings)
│       └── src/contexts/        # Auth context & theme provider
│
├── lib/
│   ├── db/                      # Drizzle ORM Database Schemas & Migrations
│   ├── api-spec/                # OpenAPI 3.0 YAML API Specifications
│   ├── api-zod/                 # Zod Validation Schemas
│   └── api-client-react/        # Generated React Query Data Fetching Hooks
│
├── package.json                 # Monorepo root scripts & pnpm workspace config
└── README.md                    # Repository documentation
```

---

## 🚀 Getting Started

### **Prerequisites**
- **Node.js**: `v18.x` or higher
- **pnpm**: `v9.x` or higher (`npm i -g pnpm`)
- **PostgreSQL**: PostgreSQL 14+ database instance

### **1. Installation**
Clone the repository and install dependencies:
```bash
git clone https://github.com/RutwikAmritkar/Influencer-Hub.git
cd Influencer-Hub
pnpm install
```

### **2. Environment Variables**
Configure server-side environment variables in `artifacts/api-server/.env`:
```env
APP_ENV=local
NODE_ENV=development
PORT=5001
DATABASE_URL=postgres://postgres:password@localhost:5432/influencer_hub
BETTER_AUTH_SECRET=your_better_auth_secret_here
SOCIAL_TOKEN_SECRET=your_32_byte_social_encryption_secret_here
FRONTEND_URL=http://localhost:5000
```
> **Security Note**: Secrets (`DATABASE_URL`, `SOCIAL_TOKEN_SECRET`, OAuth client secrets) are loaded exclusively by `@workspace/api-server` and are never exposed to Vite frontend bundles.

### **⚡ One-Command Local Startup (Windows)**

Start the complete local environment (PostgreSQL service, Express backend on port 5001, Vite frontend on port 5000):

```powershell
.\start-local.ps1
```

---

### **3. Running Locally Manually**

Start the backend API server and frontend development server:
```bash
# Start backend API server
pnpm --filter @workspace/api-server run start

# Start frontend development server
pnpm --filter @workspace/influencer-hub run dev
```

Open **http://localhost:5000** in your browser.

---

## 🧪 Verification & Build Commands

```bash
# Run TypeScript typechecks across all workspace packages
pnpm run typecheck

# Build production bundles
pnpm run build
```

---

## 📄 License
This project is licensed under the MIT License.
