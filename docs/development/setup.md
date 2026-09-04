# 💻 Local Development Setup Guide

This document covers local setup, prerequisites, environment variables, and debugging instructions for developers working on **InfluencerHub**.

---

## 🛠️ Prerequisites

- **Node.js**: `v18.x` or higher (Node.js 24 recommended)
- **pnpm**: `v9.x` or higher (`npm i -g pnpm`)
- **PostgreSQL**: PostgreSQL 14+ database instance running on `localhost:5432`

---

## 🚀 Step-by-Step Setup

### 1. Repository Installation
```bash
git clone https://github.com/RutwikAmritkar/Influencer-Hub.git
cd Influencer-Hub
pnpm install
```

### 2. Configure Environment Variables

Create `.env` at root and in `backend/`:

#### `backend/.env`
```env
APP_ENV=local
NODE_ENV=development
PORT=5001
BETTER_AUTH_SECRET=influencer_hub_secret_key_32_chars_long_local_dev
BETTER_AUTH_URL=http://localhost:5001
FRONTEND_URL=http://localhost:5000
DATABASE_URL=postgres://postgres:password@127.0.0.1:5432/influencer_hub
SOCIAL_TOKEN_SECRET=32_byte_social_encryption_secret_key_dev
```

#### `frontend/.env`
```env
VITE_API_URL=http://localhost:5001
```

---

## ⚡ Starting Local Environment

### **One-Command Local Startup (Windows)**
```powershell
.\start-local.ps1
```
*This automatically starts PostgreSQL 18 service, builds the backend, and launches Vite frontend on port 5000 and Express API on port 5001.*

### **Manual Startup**
```bash
# Build backend bundle
pnpm --filter @workspace/api-server run build

# Start backend server
node --env-file=backend/.env backend/dist/index.mjs

# Start frontend dev server
pnpm --filter @workspace/influencer-hub run dev
```

---

## 🗄️ Database Commands

```bash
# Push schema changes to local PostgreSQL instance
pnpm db:push

# Force push schema changes
pnpm db:push-force

# Seed mock influencers, brands, and campaigns
pnpm db:seed
```

---

## 🧪 Verification & Typechecking

```bash
# Workspace-wide TypeScript typecheck
pnpm run typecheck

# Production build test
pnpm run build
```
