# 🌐 Environment Isolation & Deployment Strategy

InfluencerHub is configured for multi-environment execution (**Local**, **QA**, **UAT**, and **Production**).

---

## 🔒 1. Multi-Environment Matrix

| Environment | `APP_ENV` | Backend URL | Frontend URL | Database Policy |
| :--- | :--- | :--- | :--- | :--- |
| **Local** | `local` | `http://localhost:5001` | `http://localhost:5000` | Local PostgreSQL instance (`influencer_hub`) |
| **QA** | `qa` | `https://api-qa.influencerhub.io` | `https://qa.influencerhub.io` | Isolated QA PostgreSQL RDS Database |
| **UAT** | `uat` | `https://api-uat.influencerhub.io` | `https://uat.influencerhub.io` | Isolated UAT Staging PostgreSQL RDS Database |
| **Production** | `production` | `https://api.influencerhub.io` | `https://app.influencerhub.io` | Primary Production Managed PostgreSQL Cluster |

> [!CAUTION]
> **Strict Security Isolation Rule**: Production `DATABASE_URL` and `SOCIAL_TOKEN_SECRET` values must **NEVER** be used in Local, QA, or UAT environments.

---

## 🚀 2. Deployment Configurations

### Frontend Deployment (Netlify / Vercel)
- Root build command: `pnpm --filter @workspace/influencer-hub run build`
- Output directory: `frontend/dist`
- Environment Variables required: `VITE_API_URL`

### Backend Deployment (Docker / Node Service)
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
