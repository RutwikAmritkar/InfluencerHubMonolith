# 📱 Social Media & Auth OAuth Integrations

InfluencerHub integrates official Meta Instagram Graph API v20.0 and Google YouTube Data API v3 for authenticating creators and syncing real-time channel telemetry.

---

## 1. Authentication & Better Auth

- **Backend Route Controllers**: `backend/src/routes/auth.ts`
- **Session Middleware**: `backend/src/middlewares/auth.middleware.ts`
- **Session Persistence**: Better Auth integrated with PostgreSQL Drizzle ORM (`database/src/schema/auth-schema.ts`).
- **Session Resolution**: Strict server-side `req.userId` session token cookie verification.

---

## 2. Meta Instagram Business Graph API v20.0

- **Adapter File**: `backend/src/integrations/social/instagram.provider.ts`
- **OAuth Scopes**: `instagram_business_basic`, `instagram_business_manage_insights`
- **Long-Lived Token Exchange**: 60-day short-lived to long-lived token exchange (`ig_exchange_token`) with background token auto-refresh (`ig_refresh_token`).
- **Metrics Collected**: Followers count, media posts count, profile reach, impression analytics.

---

## 3. YouTube Data API v3

- **Adapter File**: `backend/src/integrations/social/youtube.provider.ts`
- **OAuth Scopes**: `https://www.googleapis.com/auth/youtube.readonly`
- **Endpoints**: Google OAuth 2.0 token refresh, `channels` API, `videos` API.
- **Metrics Collected**: Channel subscribers count, total video count, aggregate view counts, latest video performance.

---

## 4. Security & Encryption Details

- **Token Storage**: OAuth access and refresh tokens stored in `social_tokens` table in PostgreSQL.
- **Encryption**: AES-256-GCM authenticated cipher with 12-byte initialization vectors (`token_iv`) and auth tags (`token_auth_tag`).
- **Secret Key**: `SOCIAL_TOKEN_SECRET` loaded exclusively on server-side.
