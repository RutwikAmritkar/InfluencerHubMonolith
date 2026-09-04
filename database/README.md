# 🗄️ Database Operations & Schema Management (`@workspace/db`)

This package manages the PostgreSQL database layer using **Drizzle ORM** (`drizzle-orm`) and **Drizzle Kit** (`drizzle-kit`).

---

## 📁 Package Structure

```
database/
├── src/
│   ├── schema/                  # Relational Schema Definitions
│   │   ├── users.ts             # System users & profiles
│   │   ├── auth-schema.ts       # Better Auth sessions & user accounts
│   │   ├── influencers.ts       # Influencer telemetry, rate cards, categories
│   │   ├── brands.ts            # Brand workspace metadata
│   │   ├── campaigns.ts         # Brand campaign listings
│   │   ├── applications.ts      # Creator campaign applications
│   │   ├── social-accounts.ts   # Connected Instagram/YouTube social profiles
│   │   ├── social-content.ts    # Posts & video content telemetry
│   │   ├── social-snapshots.ts  # Historical telemetry snapshots
│   │   ├── social-tokens.ts     # Encrypted OAuth tokens (AES-256-GCM)
│   │   ├── oauth-states.ts      # Short-lived OAuth CSRF state verification
│   │   ├── notifications.ts     # In-app notification alerts
│   │   ├── conversations.ts     # Messaging threads
│   │   └── audit-logs.ts        # System & security audit logs
│   └── index.ts                 # Database client export
├── drizzle/                     # Drizzle Kit SQL Migrations
├── seeds/                       # Seed Scripts
│   └── seed.ts                  # Mock data seeder
└── drizzle.config.ts            # Drizzle Kit Configuration
```

---

## 🛠️ CLI Commands

```bash
# Push schema directly to database (development)
pnpm --filter @workspace/db run push

# Force push schema changes
pnpm --filter @workspace/db run push-force

# Build TypeScript types
pnpm --filter @workspace/db run build

# Seed database with mock creators, brands, and campaigns
pnpm --filter database exec tsx ./seeds/seed.ts
```

---

## 🔑 Environment Configuration

Ensure `DATABASE_URL` is set in `backend/.env` or root `.env`:

```env
DATABASE_URL=postgres://postgres:password@127.0.0.1:5432/influencer_hub
```
