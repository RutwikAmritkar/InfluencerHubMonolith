# 🌐 Environment Isolation & Deployment Strategy

## 🌿 Branch vs. Environment Model

InfluencerHub follows a strict single-branch deployment model:
- **`main`**: The **ONLY** application code branch.
- **QA**: GitHub Environment (`APP_ENV=qa`)
- **UAT**: GitHub Environment (`APP_ENV=uat`)
- **Production**: GitHub Environment (`APP_ENV=production`)

---

## 🔒 1. Multi-Environment Matrix

| Environment | GitHub Environment | `APP_ENV` | Backend URL | Frontend URL | Database Policy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Local** | N/A | `local` | `http://localhost:5001` | `http://localhost:5000` | Local PostgreSQL instance (`influencer_hub`) |
| **QA** | **QA** | `qa` | `https://api-qa.influencerhub.io` | `https://qa.influencerhub.io` | Isolated QA PostgreSQL RDS Database |
| **UAT** | **UAT** | `uat` | `https://api-uat.influencerhub.io` | `https://uat.influencerhub.io` | Isolated UAT Staging PostgreSQL RDS Database |
| **Production** | **Production** | `production` | `https://api.influencerhub.io` | `https://app.influencerhub.io` | Primary Production Managed PostgreSQL Cluster |

> [!CAUTION]
> **Strict Security Isolation Rule**: Production `DATABASE_URL` and `SOCIAL_TOKEN_SECRET` values must **NEVER** be used in Local, QA, or UAT environments.

---

## 🚀 2. Deployment Configurations

### Frontend Deployment (Netlify)
- Root build command: `pnpm --filter @workspace/frontend run build`
- Output directory: `frontend/dist`
- Environment Variables required: `VITE_API_URL`

### Backend Deployment (Render / Node Service)
- Build command: `pnpm --filter @workspace/api-server run build`
- Entry point: `node backend/dist/index.mjs`
- Required Environment Variables:
  - `APP_ENV` (`qa` | `uat` | `production`)
  - `PORT`
  - `DATABASE_URL`
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL`
  - `FRONTEND_URL`
  - `SOCIAL_TOKEN_SECRET`
