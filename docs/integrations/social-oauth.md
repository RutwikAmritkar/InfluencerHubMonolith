# 📱 Social Media & Auth OAuth Integrations

InfluencerHub integrates official Meta Business Login for Instagram (Instagram Graph API v20.0) and Google YouTube Data API v3 for authenticating creators and syncing real-time channel telemetry.

---

## 1. Meta Business Login for Instagram (Direct Creator Architecture)

- **Architecture Flow**:
  Instagram Login / Business Login for Instagram
  → Instagram Professional Account (Creator or Business)
  → Instagram User Access Token
  → `graph.instagram.com`
  → Profile / Media / Insights Telemetry
- **Adapter File**: `backend/src/integrations/social/instagram.provider.ts`
- **OAuth Authorization Host**: `https://www.instagram.com/oauth/authorize`
- **OAuth Token Host**: `https://api.instagram.com/oauth/access_token`
- **Graph API Host**: `https://graph.instagram.com/v20.0`
- **OAuth Scopes**: `instagram_business_basic`, `instagram_business_manage_insights`
- **Facebook Page Requirement**: **None**. Creators connect their Instagram Professional account directly without needing or linking a Facebook Page.
- **Long-Lived Token Exchange**: 60-day short-lived to long-lived User Access Token exchange (`ig_exchange_token`) via `graph.instagram.com` with automated background token refresh (`ig_refresh_token`).
- **Metrics & Telemetry Collected**: Follower count, follows count, media posts count, post captions, thumbnails, publish timestamps, and engagement telemetry.

---

## 2. YouTube Data API v3

- **Adapter File**: `backend/src/integrations/social/youtube.provider.ts`
- **OAuth Scopes**: `https://www.googleapis.com/auth/youtube.readonly`
- **Endpoints**: Google OAuth 2.0 token refresh, `channels` API, `videos` API.
- **Metrics Collected**: Channel subscribers count, total video count, aggregate view counts, latest video performance.

---

## 3. Security, Encryption & Mock Rules

- **Token Storage**: OAuth access and refresh tokens stored in `social_tokens` table in PostgreSQL.
- **Encryption**: AES-256-GCM authenticated cipher with 12-byte initialization vectors (`token_iv`) and auth tags (`token_auth_tag`).
- **Secret Key**: `SOCIAL_TOKEN_SECRET` loaded exclusively on server-side.
- **Backend Environment Variables**:
  - `INSTAGRAM_CLIENT_ID`: Meta App Client ID
  - `INSTAGRAM_CLIENT_SECRET`: Meta App Secret (Backend Only)
  - `INSTAGRAM_REDIRECT_URI`: `http://localhost:5001/api/social/instagram/callback`
  - `SOCIAL_TOKEN_SECRET`: 32-byte AES-256 key
- **Production Safety**: Mock/sandbox mode is strictly disabled in production (`NODE_ENV === "production"`). Missing Meta credentials or real API failures produce real, un-swallowed errors. Mock fallback only activates when `ENABLE_SOCIAL_MOCK_FALLBACK="true"` or during explicit test execution.
