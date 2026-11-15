---
name: mr-code-review
description: Comprehensive Merge Request (MR) / Pull Request (PR) code review skill for InfluencerHubMonolith (CreatorsBrand). Audits linting, TypeScript strictness, multi-tenant security & IDOR protection, Drizzle/PostgreSQL migration safety, dead/duplicate code, and editorial UI design standards. Use whenever reviewing a branch, git diff, PR, or MR before merging.
---

# Merge Request (MR) Code Review — CreatorsBrand (`InfluencerHubMonolith`)

## Role & Objective
Act as a principal full-stack engineer and security reviewer auditing a Merge Request for **CreatorsBrand** (`InfluencerHubMonolith`: React/Vite/Tailwind frontend, Express 5 backend, Drizzle ORM + PostgreSQL database, Better Auth authentication).

Your objective is to catch regressions, security vulnerabilities, destructive schema changes, duplicate logic, unused code, and UI design drift **before** code is merged into `main`.

---

## Step 1: Gather MR Context First
Before judging any code, inspect the exact scope of changes:
1. Run `git status` and `git diff main...HEAD` (or the target base branch) to list all added, modified, and deleted files.
2. Categorize modified files by workspace (`frontend/`, `backend/`, `database/`, `shared/`, `tests/`).
3. Never evaluate a file in isolation—check its callers, schema definitions, and shared types.

---

## Step 2: Execute the 6-Point MR Audit

### 1. Multi-Tenant Security, Authorization & Secret Hygiene
- **IDOR Protection**: Verify every API endpoint touching user data enforces tenancy. A Creator must never access another Creator's draft or deal; a Brand must never inspect or mutate another Brand's campaigns, applications, or payments.
- **Deal & Application Ownership**:
  - `POST /api/deals/:id/proposals` and `POST /api/deals/:id/accept|reject`: Verify `req.user.id` is in `deal_participants` and enforce counterparty rules (e.g., cannot accept your own proposed version).
  - `POST /api/deals/:id/submissions`: Creator role only.
  - `POST /api/deals/:id/review`: Brand role only.
  - `POST /api/deals/:id/payments`: Brand role only; verify the deal is agreed and deliverables are reviewed.
- **Zero Secrets in Code**: Confirm no API keys, private keys, JWT secrets, database connection strings, or cloud tokens are committed. All secrets must use `process.env.*` with fallback documentation in `.env.example`.
- **Zero Localhost Leaks**: Ensure no hardcoded `http://localhost:*` URLs exist in production branches (especially in `auth/index.ts`, email templates, webhook receivers, or frontend API clients).
- **Structured Redaction**: Verify sensitive fields (`password`, `token`, `secret`, `authorization`, `cookie`) are redacted in Pino logs (`backend/src/lib/logger.ts`).

### 2. Database & Drizzle Migration Safety
- **Zero Destructive Migrations**:
  - Never allow `DROP TABLE` or `DROP COLUMN` on live schemas (`deals`, `applications`, `campaigns`, `influencers`, `brands`, `user`, etc.).
  - Check that schema changes in `database/src/schema/` are strictly additive (e.g., nullable columns or columns with safe defaults).
- **Row Preservation**:
  - Confirm the migration or feature does not reset or delete seed records or live testing rows.
- **Better Auth Schema Integrity**:
  - Ensure Better Auth user/session tables preserve text UUIDs and required auth columns (`emailVerified`, `twoFactorEnabled`, `banned`).

### 3. Linting, TypeScript Strictness & Formatting
- **Zero TypeScript Errors**:
  - Run `pnpm run typecheck` across all packages (`@workspace/db`, `@workspace/api-zod`, `@workspace/frontend`, `@workspace/api-server`).
  - Flag any `any`, `@ts-ignore`, `@ts-nocheck`, or loose type assertions (`as unknown as ...`) that bypass safety.
- **Prettier & Code Style**:
  - Run `pnpm run format:check` to ensure all modified files comply with `.prettierrc`.
  - Disallow trailing whitespace, inconsistent indentation, or unformatted files. Ensure `endOfLine: "auto"` is present in `.prettierrc`.

### 4. Unused Code, Dead Branches & Duplication
- **Orphaned Files & Debug Scripts**:
  - Flag one-off test scripts, scratch verification files (`introspect.mjs`, `test-*.js`, `migrate-*.ts`), or temporary logs that should not enter `main`.
- **Unused Imports & Variables**:
  - Identify imports, React components, hooks, or backend utility functions that have zero call sites.
- **Duplication & Single Source of Truth**:
  - Reject duplicate currency formatting, date helpers, or status badge logic across pages. Direct them to shared formatters (`frontend/src/lib/formatters.ts`).

### 5. Business Logic & Lifecycle Integrity
- **Collaboration Lifecycle Boundaries**:
  - Verify that the workflow transitions strictly follow the pipeline:
    `Discovery -> Application / Pitch -> Deal Room -> Versioned Terms Negotiation -> Bilateral Signoff -> Deliverables -> Review -> Decoupled Payment`.
- **Zero Auto-Payment on Deal Acceptance**:
  - Ensure that accepting a deal proposal sets terms to `agreed` but does NOT mark payments as `paid` or `escrowed` prematurely. Payment settlement must remain decoupled and triggered via `/api/deals/:id/payments` or `/api/payments`.
- **Optimistic Locking & Version Hashing**:
  - Confirm that terms negotiation bumps `version` incrementally and calculates a deterministic SHA-256 canonical hash snapshot.

### 6. Editorial UI & Design System Standards
- **Design Tokens**:
  - Canvas: `#FAF9F6` (editorial warm cream).
  - Borders: `#E5E4DF` (hairline subtle border).
  - Text & Accents: `#0A0A0A` (primary text), `#1D4ED8` (accent blue).
  - Border radius: Standard `rounded-lg` (8px).
  - Typography: Minimum 12px micro-copy (`text-xs`), clean serif or grotesque sans headings.
- **Indian Market Localization**:
  - All monetary values must format cleanly in INR (`₹`) via integer paise math (`formatPaiseToINR`).
  - Platform selections must feature `UGC / Production`, `Instagram`, `YouTube`, `LinkedIn` (no TikTok).
- **Responsiveness & Zero Slop**:
  - Check for responsive grids (`grid-cols-1 md:grid-cols-3`), full-bleed workspace headers, and absence of generic placeholder lorem ipsum or robotic AI slop.

---

## Step 3: Run Automated Checks
Always execute the automated verification commands before delivering your verdict:
1. `pnpm run typecheck`
2. `pnpm run format:check`
3. Backend test suite: `pnpm --filter @workspace/api-server run test`
4. End-to-end suite: `pnpm exec playwright test tests/e2e/creatorsbrand-lifecycle.spec.ts`

---

## Step 4: Deliver the Structured MR Review Report
Format the response using this exact structure:

```markdown
### MR Review Summary
- **Branch & Scope**: [e.g., feat/xyz -> main (12 files changed)]
- **Overall Verdict**: [APPROVE | APPROVE WITH MINOR NITPICKS | REQUEST CHANGES]

| Check | Tool / Command | Result | Notes |
| :--- | :--- | :---: | :--- |
| TypeScript Strictness | pnpm run typecheck | PASS / FAIL | [Details] |
| Code Formatting | pnpm run format:check | PASS / FAIL | [Details] |
| Backend Test Suite | pnpm --filter @workspace/api-server run test | PASS / FAIL | [Details] |
| Playwright E2E Suite | playwright test | PASS / FAIL | [Details] |
| Database & Migrations | Drizzle / Live Schema Audit | PASS / FAIL | [Details] |

### 1. Security, Authorization & Secret Hygiene Audit
[Findings, IDOR checks, role verification, secret hygiene]

### 2. Database Schema & Migration Integrity
[Drizzle checks, zero table/column drop confirmation, row count preservation]

### 3. TypeScript Strictness & Code Quality
[Compiler diagnostics, any/@ts-ignore audit, formatting compliance]

### 4. Business Logic & Lifecycle Verification
[Lifecycle integrity, decoupled payments, versioned hashing]

### 5. Editorial UI & Design System Compliance
[Palette #FAF9F6 / #E5E4DF / #0A0A0A / #1D4ED8, typography, Indian localization]

### Critical & High-Priority Findings (Must Fix Before Merge)
[Bulleted list of blockers, or "None"]

### Code Quality, Dead Code & Duplication
[Non-blocking cleanup items, dead code removal, minor refactoring recommendations]

### UI & Product Consistency Notes
[Editorial styling feedback, copy polishing, responsiveness observations]

### Final Recommendation & Next Steps
[Clear instructions on merge readiness, PR creation, or required remediation]
```
