# InfluencerHub — Creator Economy & Brand Marketplace Platform

InfluencerHub is a modern, premium creator marketplace and intelligence platform designed to connect verified influencers with top brand campaigns. Inspired by sleek SaaS aesthetics (Superlist, Linear, Vercel), it combines real-time campaign management with server-side AI creator telemetry.

---

## 🌟 Key Features

### 1. 🔑 **Superlist-Inspired Authentication & Onboarding**
- Frameless, distraction-free Sign In (`/login`) with synchronized slide themes (Electric Blue, Warm Coral, Royal Purple).
- 4-Step Legal Consent & Onboarding Wizard (`/signup`) with terms validation and smooth page transitions.

### 2. 📊 **V2 Creator & Brand Workspaces**
- **Influencer Dashboard (`/dashboard/influencer`)**:
  - Profile verified hero surface, audience demographic summary, and rate card indicator.
  - Minimal 4-column KPI metric row (Audience, Earnings, Profile Views, Active Opportunities).
  - Recharts performance telemetry area chart with dark-aware tooltips.
  - Active campaign opportunities and connected social accounts.
- **Brand Workspace (`/dashboard/brand`)**:
  - Aggregate campaign telemetry, top performing creators roster, live activity log, and AI campaign builder.

### 3. 🔍 **Creator Discovery Grid**
- Responsive 4-column verified creator cards (`/influencers`) with real-time keyword search, category filters, and detailed profile views (`/influencers/:id`).

### 4. 🤖 **Server-Side OpenAI LLM Intelligence Engine**
- AI Assistant (`/ai-assistant`) powered by a secure Express backend service (`artifacts/api-server/src/services/llm.ts`).
- Prompts user via prompt composer with interactive suggested chips (*"How can I grow my audience?"*, *"When should I post?"*).
- Context-aware RAG aggregation: pulls database telemetry (followers, engagement rate, earnings, active campaigns) securely on the server.
- Server-side LLM response validation with a resilient database-driven rule fallback when API keys are absent.

### 5. 🌗 **Seamless Light & Dark Theme Support**
- Native Tailwind CSS v4 dark mode styling across every card, workspace layout, tooltip, and interactive element.

---

## 🏗️ Repository Architecture

This repository is structured as a TypeScript pnpm workspace:

```
Influencer-Hub/
├── artifacts/
│   ├── api-server/              # Express 5 REST API Backend & Server-Side LLM Service
│   │   ├── src/routes/          # Express route controllers (/ai, /auth, /campaigns, /influencers)
│   │   ├── src/services/llm.ts  # Server-side OpenAI provider & resilient fallback engine
│   │   └── src/middlewares/     # Cookie session authentication middleware
│   │
│   └── influencer-hub/          # React 18 + Vite Web Application
│       ├── src/components/      # UI components, layout shell & mobile navigation
│       ├── src/pages/           # Page routes (Dashboard, AI Assistant, Discovery, Campaigns)
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
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```
> **Security Note**: `OPENAI_API_KEY` is loaded exclusively by `@workspace/api-server` and is never exposed to the client bundle.

### **3. Running Locally**

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
