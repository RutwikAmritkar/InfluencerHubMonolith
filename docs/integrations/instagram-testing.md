# 📱 Instagram OAuth Integration & Testing Guide

This guide covers running automated test suites, database persistence audits, security verification, and executing live Meta OAuth integration testing using `ngrok`.

---

## 🧪 Test Suite Organization

The Instagram integration test suite is separated into 5 dedicated, production-grade test modules:

| Test Module | File Location | Scope & Coverage |
| :--- | :--- | :--- |
| **A. OAuth Integration** | `backend/src/__tests__/instagram-oauth-integration.test.ts` | Authorization URL generation, parameter validation, code sanitization (`#_` stripping), missing code/state rejection, state CSRF mismatch validation. |
| **B. Database Persistence** | `backend/src/__tests__/instagram-db-persistence.test.ts` | PostgreSQL schema verification (`social_accounts`, `social_tokens`), AES-256-GCM encryption at rest, IV & AuthTag storage, unique constraint duplicate prevention. |
| **C. Instagram API Integration** | `backend/src/__tests__/instagram-api-integration.test.ts` | Token decryption in memory, `/v20.0/me` profile resolution, daily reach insights (`getInsights`), media posts (`getContent`), invalid token handling. |
| **D. Frontend E2E / Component** | `frontend/src/__tests__/instagram-frontend-e2e.test.ts` | Creator onboarding UI, "Connect Instagram" visibility, callback query string parsing, "Instagram Connected" badge, disconnect action, zero token storage in `localStorage`/`sessionStorage`. |
| **E. Security & Audit** | `backend/src/__tests__/instagram-security-audit.test.ts` | Zero credential logging across logger statements, encryption at rest, zero raw token exposure in API payloads, cross-tenant creator data isolation (`req.userId`). |
| **Live Integration Runner** | `backend/src/__tests__/live-instagram-integration.runner.ts` | Manual live test runner against real Meta environment over ngrok. |

---

## 🚀 Running Automated Test Suites

Run the complete automated Instagram test suite locally:

```bash
# Run all Instagram test suites
pnpm run test:instagram
```

Or run individual suites:

```bash
# A. OAuth Integration Tests
cmd.exe /c "npx --prefix backend tsx --env-file=backend/.env backend/src/__tests__/instagram-oauth-integration.test.ts"

# B. Database Persistence Tests
cmd.exe /c "npx --prefix backend tsx --env-file=backend/.env backend/src/__tests__/instagram-db-persistence.test.ts"

# C. Instagram API Integration Tests
cmd.exe /c "npx --prefix backend tsx --env-file=backend/.env backend/src/__tests__/instagram-api-integration.test.ts"

# E. Security Audit Tests
cmd.exe /c "npx --prefix backend tsx --env-file=backend/.env backend/src/__tests__/instagram-security-audit.test.ts"
```

---

## 🌐 Running Live Meta OAuth Tests Locally using `ngrok`

Follow these step-by-step instructions to execute a live Meta OAuth test with a real Instagram Professional account:

### **Step 1: Start ngrok Tunnel**
Expose Express API (port 5001) using your registered static ngrok domain:

```powershell
ngrok http --url=bulgur-residue-probiotic.ngrok-free.dev 5001
```

### **Step 2: Verify Backend Configuration (`backend/.env`)**
Ensure `backend/.env` contains your Parent Meta App credentials:

```env
APP_ENV=local
NODE_ENV=development
PORT=5001
INSTAGRAM_CLIENT_ID=1364546255392982
INSTAGRAM_CLIENT_SECRET=your_parent_meta_app_secret_here
INSTAGRAM_REDIRECT_URI=https://bulgur-residue-probiotic.ngrok-free.dev/api/social/instagram/callback
SOCIAL_TOKEN_SECRET=32_byte_social_encryption_secret_key_dev
```

### **Step 3: Start Local Application**
```powershell
.\start-local.ps1
```
*(Starts PostgreSQL 18, Express API on port 5001, and Vite Frontend on port 5000).*

### **Step 4: Execute Live Browser OAuth**
1. Open [http://localhost:5000/settings](http://localhost:5000/settings) in your browser.
2. Click **Connect Instagram**.
3. Authorize permissions on Meta's official login screen.
4. Upon redirect, verify the Settings page displays **Instagram Connected** with the **Verified** checkmark badge.

### **Step 5: Run Live Meta API Integration Runner**
Execute the live runner to test real Graph API calls with the newly saved long-lived access token:

```bash
cmd.exe /c "npx --prefix backend tsx --env-file=backend/.env backend/src/__tests__/live-instagram-integration.runner.ts"
```

---

## 🔒 Security Policy & Zero-Trust Guidelines

- **No Raw Tokens in Frontend**: Frontend API contracts (`GET /api/social/accounts`) return normalized creator metadata (`username`, `displayName`, `avatarUrl`, `followers`) with **zero** access token or client secret fields.
- **No Raw Tokens in Storage**: Access tokens are never stored in browser `localStorage`, `sessionStorage`, or cookies.
- **No Credential Logging**: Logging utilities (`logger.info`, `logger.error`) filter out access tokens, refresh tokens, client secrets, and authorization codes.
- **AES-256-GCM Encryption**: Tokens are stored encrypted in `social_tokens` with unique 12-byte IVs (`token_iv`) and 16-byte authentication tags (`token_auth_tag`).
