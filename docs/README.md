# 📚 InfluencerHub Monolith — Documentation Index

Welcome to the central documentation for **InfluencerHub** — a creator economy and brand marketplace platform.

---

## 🗂️ Documentation Sections

| Section | Link | Description |
| :--- | :--- | :--- |
| **Architecture Overview** | [`docs/architecture/overview.md`](file:///c:/Project/InfluencerHubMonolith/docs/architecture/overview.md) | High-level system design, monorepo topology, database schemas, and security model |
| **Local Development** | [`docs/development/setup.md`](file:///c:/Project/InfluencerHubMonolith/docs/development/setup.md) | Step-by-step developer setup, environment configuration, pnpm commands, and debugging |
| **Pull Request Guide** | [`docs/development/pull-request-guide.md`](file:///c:/Project/InfluencerHubMonolith/docs/development/pull-request-guide.md) | Pull request workflow, change classification, risk assessment, and PR template usage |
| **Release Policy** | [`docs/development/releases.md`](file:///c:/Project/InfluencerHubMonolith/docs/development/releases.md) | Semantic Versioning (`MAJOR.MINOR.PATCH`), product release lifecycle, and Git tagging |
| **Change Register** | [`docs/development/change-register.md`](file:///c:/Project/InfluencerHubMonolith/docs/development/change-register.md) | Historical ledger of verified code changes, Pull Requests, and releases |
| **Environments & Deployment** | [`docs/deployment/environments.md`](file:///c:/Project/InfluencerHubMonolith/docs/deployment/environments.md) | Environment isolation strategy (Local, QA, UAT, Production), Netlify, Vercel, and CI/CD pipelines |
| **Social & Auth Integrations** | [`docs/integrations/social-oauth.md`](file:///c:/Project/InfluencerHubMonolith/docs/integrations/social-oauth.md) | Better Auth, Meta Instagram Graph API v20.0, YouTube Data API v3, and AES-256-GCM token encryption |
| **Database Operations** | [`database/README.md`](file:///c:/Project/InfluencerHubMonolith/database/README.md) | Drizzle ORM schema guide, migrations, connection strings, and seed commands |

---

## 📂 Repository Topology

```
InfluencerHub/
├── frontend/                 # React 18 + Vite Web Application
├── backend/                  # Express 5 REST API & Social Sync Engine
├── database/                 # Drizzle ORM Schemas, Migrations & Seeds
├── shared/                   # OpenAPI Specs, Zod Schemas & Generated Client Hooks
├── docs/                     # Developer Architecture & Integration Guides
├── scripts/                  # Workspace Startup & Helper Scripts
├── .github/workflows/        # Automated CI/CD Pipelines
├── README.md                 # Project Overview & Quick Start
└── CHANGELOG.md              # Project Versioning & Release History
```
