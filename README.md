# 🚀 InfluencerHub — Creator Economy & Brand Marketplace Platform

InfluencerHub is a modern, premium creator marketplace and intelligence platform connecting verified influencers with top brand campaigns. Inspired by sleek SaaS aesthetics (Linear, Vercel, Superlist), it combines real-time campaign management with server-side AI creator telemetry and official social media integrations.

---

## 🌟 Key Features

### 1. 🔑 **Authentication & Role-Based Workspaces**
- **Better Auth Integration**: Better Auth with PostgreSQL Drizzle ORM (`database/`). Session token cookie authentication with strict server-side identity resolution (`req.userId`).
- **Influencer Workspace (`/dashboard/influencer`)**: Audience telemetry, connected social accounts, earnings, rate cards, and active campaign opportunities.
- **Brand Workspace (`/dashboard/brand`)**: Aggregate campaign performance, creator discovery grid, live application review, and AI campaign builder.

### 2. 📱 **Official Social Media Integration System**
- **Instagram / Meta Integration**: Official Meta Instagram Login for Business (Graph API v20.0). Scopes `instagram_business_basic` and `instagram_business_manage_insights`. 60-day long-lived token exchange (`ig_exchange_token`) with token refresh (`ig_refresh_token`).
- **YouTube Integration**: Official Google OAuth 2.0 & YouTube Data API v3 (`channels`, `search`, `videos`) for channel subscribers, total view counts, video performance, and token auto-refresh.
- **Persistent OAuth State Security**: Short-lived single-use `oauth_states` records in PostgreSQL with 15-minute expiration, session ownership checks, and immediate consumption (`used_at = NOW()`).
- **AES-256-GCM Token Encryption**: Social access and refresh tokens are encrypted at rest with unique 12-byte IVs (`token_iv`) and auth tags (`token_auth_tag`) using `SOCIAL_TOKEN_SECRET`. Zero token exposure in API responses or frontend state.

### 3. 🔍 **Creator Discovery & Marketplace**
- Responsive verified creator cards (`/find-creators` & `/influencers/:id`) with real-time keyword search, category filters, and detailed profile views.

### 4. 🤖 **Server-Side OpenAI LLM Intelligence Engine**
- AI Assistant (`/ai-assistant`) powered by Express backend service (`backend/src/services/llm.ts`).
- Server-side RAG aggregation pulling database telemetry securely on the server.

---

## 🏗️ Repository Architecture

This repository is structured as a clean, domain-separated TypeScript `pnpm` workspace:

```
InfluencerHub/
├── frontend/                 # React 18 + Vite Web Application
│   ├── src/                  # Components, Pages, Contexts, Theme
│   ├── public/               # Static web assets
│   └── package.json          # Frontend workspace configuration
│
├── backend/                  # Express 5 REST API Backend & Social Sync Engine
│   ├── src/routes/           # Express route controllers (/social, /auth, /campaigns, /influencers)
│   ├── src/integrations/     # Platform adapters (instagram.provider.ts, youtube.provider.ts)
│   ├── src/services/         # SocialSyncService, LLM & Verification services
│   ├── src/auth/             # Better Auth integration & session handling
│   └── src/__tests__/        # Backend API end-to-end and unit test suites
│
├── database/                 # Drizzle ORM Database Schemas, Migrations & Seeds
│   ├── src/schema/           # Relational PostgreSQL table schemas
│   ├── drizzle/              # Drizzle Kit SQL migrations
│   └── seeds/                # Mock data seeder script (`seed.ts`)
│
├── shared/                   # Workspace Shared Specifications & Codegen
│   ├── api-spec/             # OpenAPI 3.0 YAML API Specifications
│   ├── api-zod/              # Generated Zod Validation Schemas
│   └── api-client-react/     # Generated React Query Data Fetching Hooks
│
├── docs/                     # Developer Architecture & Integration Guides
│   ├── architecture/         # System design, data flow, security model
│   ├── development/          # Setup guide, environment configuration, debugging
│   ├── deployment/           # Environment isolation (Local, QA, UAT, Production)
│   └── integrations/         # Instagram Graph API & YouTube Data API OAuth specs
│
├── scripts/                  # Workspace Maintenance & Startup Scripts
│   └── start-local.ps1       # One-Command Local Startup Script
│
├── .github/workflows/        # Automated CI/CD Pipelines
│   └── ci.yml                # Typecheck & Build validation workflow
│
├── package.json              # Monorepo root scripts & pnpm workspace config
├── CHANGELOG.md              # Project versioning and release history
└── README.md                 # Repository documentation index
```

---

## 🚀 Quick Start & Development

### **Prerequisites**
- **Node.js**: `v18.x` or higher (Node 24 recommended)
- **pnpm**: `v9.x` or higher (`npm i -g pnpm`)
- **PostgreSQL**: PostgreSQL 14+ database instance running on `localhost:5432`

### **1. Installation**
```bash
git clone https://github.com/RutwikAmritkar/Influencer-Hub.git
cd Influencer-Hub
pnpm install
```

### **⚡ One-Command Local Startup (Windows)**
Start the complete local environment (PostgreSQL service, Express backend on port 5001, Vite frontend on port 5000):

```powershell
.\start-local.ps1
```

### **2. Environment Variables Configuration**
Configure server-side environment variables in `backend/.env`:
```env
APP_ENV=local
NODE_ENV=development
PORT=5001
DATABASE_URL=postgres://postgres:password@127.0.0.1:5432/influencer_hub
BETTER_AUTH_SECRET=your_better_auth_secret_here
SOCIAL_TOKEN_SECRET=your_32_byte_social_encryption_secret_here
FRONTEND_URL=http://localhost:5000
```

Configure frontend web app environment in `frontend/.env`:
```env
VITE_API_URL=http://localhost:5001
```

---

## 🧪 Verification & Build Commands

```bash
# Workspace-wide TypeScript typecheck
pnpm run typecheck

# Build backend and frontend bundles
pnpm run build

# Push database schema changes
pnpm run db:push

# Run backend API test suites
pnpm run test
```

---

## 📚 Detailed Documentation

For in-depth guides, please visit the [`docs/`](file:///c:/Project/InfluencerHubMonolith/docs/README.md) folder:
- 📖 [Architecture Overview](file:///c:/Project/InfluencerHubMonolith/docs/architecture/overview.md)
- 💻 [Local Development Guide](file:///c:/Project/InfluencerHubMonolith/docs/development/setup.md)
- 🌐 [Environment & Deployment Strategy](file:///c:/Project/InfluencerHubMonolith/docs/deployment/environments.md)
- 📱 [Social Media OAuth Integrations](file:///c:/Project/InfluencerHubMonolith/docs/integrations/social-oauth.md)
- 🗄️ [Database Management & Seeds](file:///c:/Project/InfluencerHubMonolith/database/README.md)

---

## 🛠️ Development & Change Tracking

- **Pull Requests**: Every PR must use the standard template at [`.github/pull_request_template.md`](file:///.github/pull_request_template.md).
- **Layer & Module Classification**: Every PR explicitly records affected architectural layers (Frontend, Backend, Database, Shared, Infrastructure, CI/CD) and impacted modules.
- **Target Versioning**: PRs specify an intended **Target Version** (`MAJOR.MINOR.PATCH`).
- **Semantic Versioning & Releases**: Official product releases follow Semantic Versioning (`MAJOR.MINOR.PATCH`) and receive annotated Git tags (`vX.Y.Z`).
- **Historical Change Register**: Detailed change history and verified commit ledgers are maintained in [`docs/development/change-register.md`](file:///docs/development/change-register.md).

---

## 📄 License
This project is licensed under the MIT License.
