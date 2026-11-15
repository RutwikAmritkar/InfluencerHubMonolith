# CreatorsBrand — Deal Room Stage A Investigation Report

> **Document Location:** `docs/deal-room-investigation.md`  
> **Status:** Stage A Complete (Investigation Only — Awaiting User Feedback Before Stage B Design)  
> **Date:** 2026-10-04  

---

## Executive Summary & Stage A Mandate Compliance

Per process instructions:
1. **Stage A Focus:** Investigation ONLY (Sections 1–3 of current architecture, reusability analysis, code-backed citations, UNKNOWNs, and Open Questions).
2. **Strictly Read-Only:** Zero schema migrations, zero dependency installs, zero code edits. Report written directly to [`docs/deal-room-investigation.md`](file:///c:/Project/InfluencerHubMonolith/docs/deal-room-investigation.md).
3. **Fact & Citation Enforcement:** Every technical claim is cited with explicit file paths, database table names, column names, or route paths. Any unverified item is explicitly marked as `UNKNOWN`.
4. **Hold Strategy:** Execution stops at the conclusion of Stage A to await user responses before proceeding to Stage B (Architecture & State Machine Design).

---

## Section 1: Current Architecture Relevant to Deal Rooms

### 1.1 Authentication & User Identity Scoping
- **Dual User Schema Architecture:**
  - **Better Auth Schema (`user` table):** Defined in [`database/src/schema/auth-schema.ts:L3-L19`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/auth-schema.ts#L3-L19). Uses UUID string primary keys (`user.id`). Fields: `id`, `name`, `email`, `role`, `country`, `language`, `onboardingStep`, `onboardingStatus`, `banned`.
  - **Legacy User Schema (`usersTable`):** Defined in [`database/src/schema/users.ts:L5-L13`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/users.ts#L5-L13). Uses auto-increment serial integer primary keys (`users.id`). Fields: `id`, `email`, `passwordHash`, `role`, `name`, `avatarUrl`.
  - **Profile Entities:**
    - `brandsTable`: Defined in [`database/src/schema/brands.ts:L5-L25`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/brands.ts#L5-L25). Uses serial integer `id` and text `userId` referencing `user.id`.
    - `influencersTable`: Defined in [`database/src/schema/influencers.ts:L23-L53`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/influencers.ts#L23-L53). Uses serial integer `id` and text `userId` referencing `user.id`.
- **RBAC & Authorization Middleware:**
  - Auth Middleware: Defined in [`backend/src/middlewares/auth.ts:L20-L89`](file:///c:/Project/InfluencerHubMonolith/backend/src/middlewares/auth.ts#L20-L89). `requireAuth` populates `req.user` with `AuthenticatedUser` (`id` text string, `email`, `name`, `role`).
  - Role Guards: `requireRole(["influencer"])` and `requireRole(["brand"])` strictly enforce global roles (`brand` vs `influencer` / `creator`).
  - `UNKNOWN / UNVERIFIED`: Organization-level sub-roles (e.g. brand team members, creator managers, agency sub-accounts) do NOT exist in `auth-schema.ts` or `auth.ts`. Current system supports only single-user accounts.

### 1.2 Campaign & Application System
- **Campaigns Entity:** Defined in [`database/src/schema/campaigns.ts:L5-L18`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/campaigns.ts#L5-L18). Table `campaigns`.
  - Primary Key: `id` (integer).
  - Columns: `brandId` (integer referencing `brandsTable.id`), `title` (text), `description` (text), `budget` (integer in currency units), `platform` (text), `status` (enum: `draft`, `active`, `completed`, `paused`), `deliverables` (text), `deadline` (text).
  - Routes: Defined in [`backend/src/routes/campaigns.ts`](file:///c:/Project/InfluencerHubMonolith/backend/src/routes/campaigns.ts). Endpoints: `GET /api/campaigns`, `POST /api/campaigns`, `GET /api/campaigns/:id`, `PATCH /api/campaigns/:id`, `DELETE /api/campaigns/:id`.
- **Applications Entity:** Defined in [`database/src/schema/applications.ts:L5-L12`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/applications.ts#L5-L12). Table `applications`.
  - Primary Key: `id` (integer).
  - Columns: `campaignId` (integer), `influencerId` (integer), `status` (enum: `pending`, `accepted`, `rejected`), `message` (text).
  - Routes: Defined in [`backend/src/routes/applications.ts`](file:///c:/Project/InfluencerHubMonolith/backend/src/routes/applications.ts). Endpoints: `GET /api/applications`, `POST /api/applications`, `PATCH /api/applications/:id`.
- **System Limitations:**
  - Applications are strictly 1-way (Influencer applies to a Campaign).
  - Brands cannot directly send a collaboration invitation to a creator outside of open campaigns.
  - Patching an application status to `accepted` in `backend/src/routes/applications.ts:L67-L84` does NOT initialize a contract, workspace, or deal room.

### 1.3 Messaging Infrastructure
- **Conversations & Messages Schema:** Defined in [`database/src/schema/conversations.ts:L5-L19`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/conversations.ts#L5-L19). Tables `conversations` and `messages`.
  - `conversationsTable`: `id` (serial integer), `user1Id` (integer referencing legacy `usersTable.id`), `user2Id` (integer referencing legacy `usersTable.id`), `createdAt`.
  - `messagesTable`: `id` (serial integer), `conversationId` (integer), `senderId` (integer), `content` (text), `isRead` (boolean), `createdAt`.
  - Routes: Defined in [`backend/src/routes/messages.ts`](file:///c:/Project/InfluencerHubMonolith/backend/src/routes/messages.ts). Endpoints: `GET /api/conversations`, `POST /api/conversations`, `GET /api/conversations/:id/messages`, `POST /api/conversations/:id/messages`.
- **System Limitations:**
  - Conversations link integer user IDs.
  - Messages carry plain text content only (`content` text). They lack typed metadata (`message_type`, structured proposal cards, system events, or deal room references).

### 1.4 Social Accounts & Instagram OAuth Integration
- **Social Integration Schema:**
  - `socialAccountsTable`: Defined in [`database/src/schema/social-accounts.ts:L4-L28`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/social-accounts.ts#L4-L28). Table `social_accounts`. Stores `userId` (text), `platform` (`instagram` | `youtube`), `verificationStatus` (`CONNECTED`, `VERIFIED`, `DISCONNECTED`, etc.).
  - `socialTokensTable`: Defined in [`database/src/schema/social-tokens.ts:L4-L15`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/social-tokens.ts#L4-L15). Table `social_tokens`. Stores encrypted OAuth tokens (`accessTokenEncrypted`, `tokenIv`, `tokenAuthTag`).
  - `socialContentTable`: Defined in [`database/src/schema/social-content.ts:L4-L21`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/social-content.ts#L4-L21). Table `social_content`. Stores fetched posts/reels (`externalContentId`, `contentType`, `title`, `caption`, `permalink`, `views`, `likes`, `comments`).
  - Provider Pipeline: Defined in [`backend/src/integrations/social/instagram.provider.ts`](file:///c:/Project/InfluencerHubMonolith/backend/src/integrations/social/instagram.provider.ts) and [`backend/src/routes/social.ts`](file:///c:/Project/InfluencerHubMonolith/backend/src/routes/social.ts).
- **Protected Boundaries:** OAuth token tables (`social_tokens`) and encryption methods (`token-crypto.ts`) are protected system logic and must NOT be mutated.

### 1.5 Audit & Notifications Systems
- **Audit Logs Schema:** Defined in [`database/src/schema/audit-logs.ts:L4-L12`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/audit-logs.ts#L4-L12). Table `audit_logs`. Columns: `id`, `userId` (text), `action` (text), `ipAddress`, `userAgent`, `details` (text). Used in [`backend/src/auth/audit.ts`](file:///c:/Project/InfluencerHubMonolith/backend/src/auth/audit.ts).
- **Notifications Schema:** Defined in [`database/src/schema/notifications.ts:L5-L13`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/notifications.ts#L5-L13). Table `notifications`. Columns: `id`, `userId` (integer), `type`, `title`, `body`, `isRead`.

### 1.6 Payment & Financial Infrastructure Status
- **Current Codebase Audit Result:** `UNKNOWN / NON-EXISTENT IN BACKEND`.
- The database contains zero financial tables (no transactions, no escrow, no GST/TDS tax tables, no invoices).
- The frontend only contains a static mock boolean field `paymentVerified: true` in [`frontend/src/types/brand-domain.ts:L59`](file:///c:/Project/InfluencerHubMonolith/frontend/src/types/brand-domain.ts#L59) and [`frontend/src/pages/brand-profile/index.tsx:L289`](file:///c:/Project/InfluencerHubMonolith/frontend/src/pages/brand-profile/index.tsx#L289).

---

## Section 2: Existing Components to Reuse `[REUSE]`

| Existing Component | Source File Citation | Reuse Purpose in Deal Room |
| :--- | :--- | :--- |
| `requireAuth` | [`backend/src/middlewares/auth.ts:L20-L62`](file:///c:/Project/InfluencerHubMonolith/backend/src/middlewares/auth.ts#L20-L62) | Enforce valid Better Auth session tokens on all Deal Room APIs. |
| `requireRole` | [`backend/src/middlewares/auth.ts:L64-L89`](file:///c:/Project/InfluencerHubMonolith/backend/src/middlewares/auth.ts#L64-L89) | Restrict Brand-only vs Creator-only Deal Room endpoints. |
| `logAuditEvent` | `backend/src/auth/audit.ts:L8-L20` | Audit deal state transitions, contract proposals, and dual approvals. |
| `conversationsTable` & `messagesTable` | [`database/src/schema/conversations.ts:L5-L19`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/conversations.ts#L5-L19) | Substrate for real-time Deal Room chat communication. |
| `socialAccountsTable` & `socialContentTable` | [`database/src/schema/social-accounts.ts`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/social-accounts.ts) & [`social-content.ts`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/social-content.ts) | Read-only verification of live Instagram posts and performance metrics. |
| `notificationsTable` | [`database/src/schema/notifications.ts:L5-L13`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/notifications.ts#L5-L13) | In-app alerts for deal requests, counter-offers, and approvals. |
| `Layout` | `frontend/src/components/layout.tsx` | Main app container wrapper for `/deals` and `/deals/:id`. |

---

## Section 3: Existing Database Tables Reusability Matrix `[REUSE]` & `[MODIFY]`

| Database Table | Schema Source Citation | Status | Reusability Strategy |
| :--- | :--- | :--- | :--- |
| `user` | [`auth-schema.ts:L3-L19`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/auth-schema.ts#L3-L19) | `[REUSE]` | Primary user authentication identity (UUID string). |
| `brands` | [`brands.ts:L5-L25`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/brands.ts#L5-L25) | `[REUSE]` | Brand participant identity entity (`id` integer, `userId` text). |
| `influencers` | [`influencers.ts:L23-L53`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/influencers.ts#L23-L53) | `[REUSE]` | Creator participant identity entity (`id` integer, `userId` text). |
| `campaigns` | [`campaigns.ts:L5-L18`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/campaigns.ts#L5-L18) | `[REUSE]` | Optional source campaign linkage for deals originating from public briefs. |
| `applications` | [`applications.ts:L5-L12`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/applications.ts#L5-L12) | `[MODIFY]` | Add optional `deal_id` (integer) column to link accepted applications to Deal Rooms. |
| `conversations` | [`conversations.ts:L5-L10`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/conversations.ts#L5-L10) | `[MODIFY]` | Add optional `deal_id` (integer) column to bind conversations to Deal Rooms. |
| `messages` | [`conversations.ts:L12-L19`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/conversations.ts#L12-L19) | `[MODIFY]` | Add `message_type` ('text' \| 'system_event' \| 'proposal_card') and `metadata` (JSONB) to render interactive deal cards in chat streams. |
| `notifications` | [`notifications.ts:L5-L13`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/notifications.ts#L5-L13) | `[REUSE]` | Store system notifications for deal activities. |
| `audit_logs` | [`audit-logs.ts:L4-L12`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/audit-logs.ts#L4-L12) | `[REUSE]` | Immutable security audit logs for legal sign-offs and contract alterations. |
| `social_accounts` | [`social-accounts.ts:L4-L28`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/social-accounts.ts#L4-L28) | `[REUSE]` | Query connected creator social accounts for post verification. |
| `social_content` | [`social-content.ts:L4-L21`](file:///c:/Project/InfluencerHubMonolith/database/src/schema/social-content.ts#L4-L21) | `[REUSE]` | Match live post permalinks to submitted deal deliverables. |

---

## Section 4: List of UNKNOWNs & System Gaps

1. **`UNKNOWN: Organization Sub-Roles & Multi-Member Teams`**
   - The current schema (`auth-schema.ts:L9`) supports only a single text `role` per user (`brand` or `influencer`). There is no `organizations` or `brand_members` table. We need clarification on whether deal approval authority resides strictly with the primary user account or if sub-team permissions are needed.
2. **`UNKNOWN: Payment Gateway Integration`**
   - No payment provider SDK (Razorpay, Stripe Connect, Cashfree) or database tables exist in the codebase. Financial transactions are completely absent from backend routes.
3. **`UNKNOWN: Tax & Statutory Compliance (India GST / TDS)`**
   - The codebase does not compute or store tax breakdowns (GST 18%, Section 194J TDS). Budgets in `campaignsTable.budget` are stored as plain integer rupees without tax metadata.
4. **`UNKNOWN: PDF Generation Pipeline`**
   - There is no PDF rendering library (e.g. `pdfkit`, `puppeteer`, `react-pdf`) installed in `package.json` or `backend/package.json`.
5. **`UNKNOWN: User ID Type Mismatch in Messaging`**
   - `conversationsTable` uses `integer` for `user1Id` and `user2Id` (mapping to legacy `usersTable.id`), whereas `brandsTable.userId` and `influencersTable.userId` use text UUIDs (mapping to Better Auth `user.id`). We must reconcile this mapping for deal room participant scoping.

---

## Section 5: Open Questions for the Product Lead (Before Stage B Design)

To ensure the Stage B Architecture & Design Report is 100% aligned with business and product requirements, please review and answer the following open questions:

### 1. Lifecycle & State Machine Architecture
- **Q1.1:** Do you prefer a **Single Unified State Machine** (e.g., `INVITED` → `NEGOTIATING` → `TERMS_PROPOSED` → `CONFIRMED` → `FUNDED` → `IN_PROGRESS` → `COMPLETED`) or **Decoupled Lifecycle Tracks** (Track A: Negotiation/Agreement Status, Track B: Payment/Escrow Status, Track C: Deliverables Status)?
  - *Note:* Single FSM is simpler to audit; Decoupled Tracks handle asynchronous execution better (e.g. partial milestone payments).

### 2. Negotiation, Concurrency & Turn-Taking Rules
- **Q2.1:** When a brand or creator receives a counter-offer, should turn-taking be strictly enforced (i.e. only the recipient can respond or submit the next counter-offer)?
- **Q2.2:** What is the default expiration timeout for an unaccepted proposal or invite (e.g., 7 days, 14 days, or customizable per offer)?
- **Q2.3:** Should creating a new counter-offer automatically invalidate all previous pending approvals immediately?

### 3. Financial, Currency & Compliance (India Context)
- **Q3.1:** All monetary amounts will be stored as **integer paise** (e.g. ₹35,000 = `3500000` paise). Is currency strictly `INR` for Phase 1, or multi-currency?
- **Q3.2:** For Phase 1 payment processing, do you approve starting with a **Stopgap / Manual Payment Mode** ("Mark as Paid by Brand" / "Platform Admin Verified") alongside designing the full **Razorpay Route / Escrow** schema?
- **Q3.3:** How should platform fees and Indian statutory taxes (GST 18%, TDS 1% / 10%) be presented in the Deal Summary? (e.g., Creator Net Payout vs Brand Gross Payable).

### 4. Legal & Agreement Artifacts
- **Q4.1:** Should the system generate a downloadable **Deal Summary PDF Snapshot** at the moment a deal becomes `CONFIRMED`?
- **Q4.2:** In addition to digital signature audit logs (Timestamp, User ID, IP Address, User Agent, Terms SHA-256 Hash), do you require binding legal contract text boilerplate appended to the summary?

### 5. Execution, Deliverables & Instagram Post Verification
- **Q5.1:** For content deliverables, should the creator submit draft files/links for brand review **before** posting live?
- **Q5.2:** For live post verification, should the system automatically match the creator's submitted URL against our existing `social_content` table (fetched via Instagram Graph API) to verify post publication without requesting new OAuth permissions?

### 6. Trust & Safety Controls
- **Q6.1:** Should the Deal Room chat include automated regex filters to detect and warn against off-platform contact leakage (phone numbers, personal emails, external WhatsApp links)?
- **Q6.2:** What file types and maximum size limits should be permitted for deliverable attachments in the Deal Room?

---

### End of Stage A Report
*Awaiting your responses to the Open Questions above before commencing Stage B (Final System Architecture, Data Schema, and State Machine Design).*
