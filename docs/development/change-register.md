# 📜 InfluencerHub Change Register

This document serves as the historical ledger of verified code changes, Pull Requests, and releases for the **InfluencerHub** monolith repository.

---

## 📌 Verified Register Entries

### Entry #5 — Finalize CI & Branch Deployment Configuration
| Field | Value |
|---|---|
| PR | N/A |
| Commit SHA | `48fe131` |
| Target Version | 0.2.0 |
| Released Version | N/A |
| Release Type | Infrastructure |
| Change Type | CI/CD |
| Area | Automated CI/CD Pipelines |
| Risk | Low |
| Status | Merged |
| Impacted Modules | `.github/workflows/ci.yml` |

**Summary**: Configured automated GitHub Actions CI workflow (`ci.yml`) covering frozen pnpm installation, workspace typecheck, backend test suites, and workspace build for `main`, `qa`, and `uat` branches.

**Changes**:
- Created `.github/workflows/ci.yml` workflow triggering on push and PR to `main`, `qa`, `uat`.
- Validated Node 24 environment with pnpm 11 package caching.

**Testing**:
- Workspace Typecheck: Passed
- Workspace Build: Passed
- Backend Unit Tests: Passed

---

### Entry #4 — Domain-Separated Monolith Architecture Restructure
| Field | Value |
|---|---|
| PR | N/A |
| Commit SHA | `e43ade4` |
| Target Version | 0.1.0 |
| Released Version | N/A |
| Release Type | Refactor |
| Change Type | Shared |
| Area | Monorepo Structure & Developer Tooling |
| Risk | Medium |
| Status | Merged |
| Impacted Modules | `frontend/`, `backend/`, `database/`, `shared/`, `docs/`, `scripts/`, `package.json`, `pnpm-workspace.yaml` |

**Summary**: Reorganized monorepo directory layout into clear domain concerns (`frontend/`, `backend/`, `database/`, `shared/`, `docs/`), updated `pnpm-workspace.yaml`, root `package.json` scripts, and `start-local.ps1`.

**Changes**:
- Separated frontend React app into `frontend/`.
- Separated Express REST API into `backend/`.
- Separated Drizzle ORM database schemas and migrations into `database/`.
- Consolidated shared OpenAPI specs and generated client into `shared/`.
- Created standardized developer setup guides in `docs/`.

---

### Entry #3 — Merge Branch 'main' & Remote Synchronization
| Field | Value |
|---|---|
| PR | N/A |
| Commit SHA | `7f7cdb3` |
| Target Version | 0.1.0 |
| Released Version | N/A |
| Release Type | Refactor |
| Change Type | Shared |
| Area | Git Repository Synchronization |
| Risk | Low |
| Status | Merged |
| Impacted Modules | Monorepo Root |

**Summary**: Merged remote main branch updates to synchronize monolith workspace HEAD.

---

### Entry #2 — Social Integration & i18n Multilingual Support
| Field | Value |
|---|---|
| PR | Historical reference PR #1 (Original PR context not independently verified) |
| Commit SHA | `d59bedb` |
| Target Version | 0.1.0 |
| Released Version | N/A |
| Release Type | Feature |
| Change Type | Frontend + Backend + Database |
| Area | Official Social OAuth Integrations & Localization |
| Risk | Medium |
| Status | Merged |
| Impacted Modules | `backend/src/routes/social.ts`, `backend/src/services/social-sync.service.ts`, `frontend/src/i18n.ts`, `database/src/schema/social.ts` |

**Summary**: Integrated official Instagram Graph API and YouTube Data API v3 OAuth flows, AES-256-GCM token encryption, language selector, and Netlify deployment readiness.

---

### Entry #1 — Replit Agent Deploy Build Fix
| Field | Value |
|---|---|
| PR | Historical reference PR #1 (Original PR context not independently verified) |
| Commit SHA | `4980f90` |
| Target Version | 0.1.0 |
| Released Version | N/A |
| Release Type | Fix |
| Change Type | CI/CD |
| Area | Build Script Output |
| Risk | Low |
| Status | Merged |
| Impacted Modules | Build Scripts / Deployment Manifests |

**Summary**: Resolved build script error where deploy directory `dist/public` was missing during static site export.
