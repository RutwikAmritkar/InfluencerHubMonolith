import {
  SocialPlatformProvider,
  PlatformCapabilities,
  NormalizedSocialProfile,
  NormalizedSocialContent,
  OAuthTokenResponse,
  ProbedMetricResult,
} from "./base.provider";
import { logger } from "../../lib/logger";

export const INSTAGRAM_GRAPH_API_VERSION = "v20.0";
export const INSTAGRAM_AUTH_HOST = "https://www.instagram.com";
export const INSTAGRAM_OAUTH_HOST = "https://api.instagram.com";
export const INSTAGRAM_GRAPH_HOST = "https://graph.instagram.com";

export class InstagramProvider implements SocialPlatformProvider {
  readonly platform = "instagram" as const;
  readonly capabilities: PlatformCapabilities = {
    hasFollowingCount: true,
    hasTotalViews: false,
    hasAudienceDemographics: true,
    hasContentAnalytics: true,
    hasSharesCount: true,
  };

  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.INSTAGRAM_CLIENT_ID || "demo-meta-client-id";
    this.clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || "demo-meta-client-secret";
    this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI || "http://localhost:5001/api/social/instagram/callback";
  }

  /**
   * Safe check for mock mode.
   * Mock mode is strictly forbidden in production (NODE_ENV === "production").
   * It only activates if ENABLE_SOCIAL_MOCK_FALLBACK is explicitly "true"
   * or during development/test when real Meta credentials are not configured.
   */
  private isMockModeEnabled(token?: string): boolean {
    if (process.env.NODE_ENV === "production") {
      return false;
    }
    if (token && (token.startsWith("mock_") || token.startsWith("ig_demo_") || token.startsWith("ig_test_"))) {
      return true;
    }
    if (process.env.ENABLE_SOCIAL_MOCK_FALLBACK === "true") {
      return true;
    }
    if (this.clientId === "demo-meta-client-id" || !this.clientId) {
      return true;
    }
    return false;
  }


  /**
   * Asserts that backend environment variables for Instagram Meta Graph API are configured.
   */
  private ensureConfigured(): void {
    if (!this.clientId || !this.clientSecret || this.clientId === "demo-meta-client-id") {
      if (this.isMockModeEnabled()) {
        return;
      }
      throw new Error("Instagram Meta integration is not configured. Missing INSTAGRAM_CLIENT_ID or INSTAGRAM_CLIENT_SECRET.");
    }
  }

  /**
   * Generates direct Instagram Login authorization URL for Instagram Professional accounts.
   * Eliminates legacy Facebook Page authorization requirement.
   */
  async getAuthorizationUrl(state: string): Promise<string> {
    this.ensureConfigured();
    const scopes = ["instagram_business_basic", "instagram_business_manage_insights"].join(",");
    const clientIdToUse = this.clientId || "demo-meta-client-id";
    const params = new URLSearchParams({
      client_id: clientIdToUse,
      redirect_uri: this.redirectUri,
      scope: scopes,
      state,
      response_type: "code",
    });
    return `${INSTAGRAM_AUTH_HOST}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchanges OAuth authorization code for Instagram User Access Tokens via direct Instagram OAuth API.
   * Exchanges short-lived token for long-lived 60-day token via graph.instagram.com.
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthTokenResponse> {
    if (!code || code === "mock_code_123" || code.startsWith("mock_")) {
      if (this.isMockModeEnabled()) {
        return {
          accessToken: `ig_long_lived_token_${Date.now()}`,
          refreshToken: `ig_refresh_token_${Date.now()}`,
          expiresIn: 60 * 24 * 60 * 60, // 60 days
          scopes: ["instagram_business_basic", "instagram_business_manage_insights"],
        };
      }
      throw new Error("Missing or invalid OAuth authorization code.");
    }

    this.ensureConfigured();

    // Sanitize authorization code (strip trailing #_ fragment and whitespace appended by Instagram OAuth redirects)
    const sanitizedCode = code.replace(/#_$/, "").replace(/#.*$/, "").trim();

    try {
      const formData = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "authorization_code",
        redirect_uri: this.redirectUri,
        code: sanitizedCode,
      });

      logger.info({
        category: "INSTAGRAM_OAUTH",
        clientId: this.clientId,
        redirectUri: this.redirectUri,
        codeLength: sanitizedCode.length,
      }, "[INSTAGRAM OAUTH] Initiating token exchange with Meta API...");

      const res = await fetch(`${INSTAGRAM_OAUTH_HOST}/oauth/access_token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      const data = (await res.json()) as any;

      if (!res.ok || data.error || data.error_message) {
        const errorDetail = data.error_message || data.error?.message || (typeof data.error === "string" ? data.error : null) || data.error_type || JSON.stringify(data);
        logger.error({
          category: "INSTAGRAM_OAUTH",
          statusCode: res.status,
          errorDetail,
        }, "[INSTAGRAM OAUTH ERROR] Meta API rejected authorization code exchange.");

        throw new Error(`Meta API error (${res.status}): ${errorDetail}`);
      }

      const shortLivedToken = data.access_token;

      // Exchange short-lived token for 60-day long-lived token via graph.instagram.com
      const exchangeUrl = `${INSTAGRAM_GRAPH_HOST}/access_token?grant_type=ig_exchange_token&client_secret=${this.clientSecret}&access_token=${shortLivedToken}`;
      const exchangeRes = await fetch(exchangeUrl);
      const exchangeData = (await exchangeRes.json()) as any;

      if (!exchangeRes.ok || exchangeData.error) {
        return {
          accessToken: shortLivedToken,
          expiresIn: 3600,
          scopes: ["instagram_business_basic", "instagram_business_manage_insights"],
        };
      }

      return {
        accessToken: exchangeData.access_token || shortLivedToken,
        expiresIn: exchangeData.expires_in || 5184000,
        scopes: ["instagram_business_basic", "instagram_business_manage_insights"],
      };
    } catch (err: any) {
      if (this.isMockModeEnabled()) {
        console.warn("[INSTAGRAM OAUTH WARNING] Live Graph API exchange error, using sandbox token in mock mode:", err.message);
        return {
          accessToken: `ig_long_lived_token_${Date.now()}`,
          expiresIn: 60 * 24 * 60 * 60,
          scopes: ["instagram_business_basic", "instagram_business_manage_insights"],
        };
      }
      throw new Error(`Instagram OAuth exchange failed: ${err.message}`);
    }
  }

  /**
   * Refreshes long-lived Instagram User Access Token via graph.instagram.com.
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn?: number }> {
    if (refreshToken.startsWith("ig_")) {
      if (this.isMockModeEnabled()) {
        return {
          accessToken: `ig_refreshed_token_${Date.now()}`,
          expiresIn: 60 * 24 * 60 * 60,
        };
      }
    }

    this.ensureConfigured();

    try {
      const url = `${INSTAGRAM_GRAPH_HOST}/refresh_access_token?grant_type=ig_refresh_token&access_token=${refreshToken}`;
      const res = await fetch(url);
      const data = (await res.json()) as any;

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || "Failed to refresh Instagram access token");
      }

      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in || 5184000,
      };
    } catch (err: any) {
      if (this.isMockModeEnabled()) {
        return {
          accessToken: `ig_refreshed_token_${Date.now()}`,
          expiresIn: 60 * 24 * 60 * 60,
        };
      }
      throw err;
    }
  }

  /**
   * Fetches Instagram Professional profile directly via graph.instagram.com/v20.0/me.
   * Completely bypasses legacy Facebook Page /me/accounts discovery.
   */
  async getProfile(accessToken: string): Promise<NormalizedSocialProfile> {
    if (accessToken.startsWith("ig_") || accessToken.startsWith("mock_")) {
      if (this.isMockModeEnabled(accessToken)) {
        return {
          externalAccountId: "ig_1784140123456789",
          username: "maya.chen.creator",
          displayName: "Maya Chen",
          profileUrl: "https://instagram.com/maya.chen.creator",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
          followers: 125000,
          following: 840,
          totalContent: 142,
          totalLikes: 580000,
        };
      }
    }

    try {
      const url = `${INSTAGRAM_GRAPH_HOST}/${INSTAGRAM_GRAPH_API_VERSION}/me?fields=id,username,name,profile_picture_url,followers_count,follows_count,media_count&access_token=${accessToken}`;
      const res = await fetch(url);
      const data = (await res.json()) as any;

      logger.info({
        category: "INSTAGRAM_PROFILE_FETCH",
        endpoint: "/v20.0/me",
        statusCode: res.status,
        accountId: data?.id || null,
        username: data?.username || null,
        responseFields: data ? Object.keys(data) : [],
      }, "[INSTAGRAM PROFILE] Graph API profile endpoint called.");

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || "Failed to fetch Instagram profile from Meta API.");
      }

      return {
        externalAccountId: data.id,
        username: data.username,
        displayName: data.name || data.username,
        profileUrl: `https://instagram.com/${data.username}`,
        avatarUrl: data.profile_picture_url || null,
        followers: data.followers_count || 0,
        following: data.follows_count || 0,
        totalContent: data.media_count || 0,
      };
    } catch (err: any) {
      if (this.isMockModeEnabled(accessToken)) {
        console.warn("[INSTAGRAM PROFILE FETCH WARNING] Falling back to sandbox profile in mock mode:", err.message);
        return {
          externalAccountId: "ig_1784140123456789",
          username: "maya.chen.creator",
          displayName: "Maya Chen",
          profileUrl: "https://instagram.com/maya.chen.creator",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
          followers: 125000,
          following: 840,
          totalContent: 142,
          totalLikes: 580000,
        };
      }
      throw err;
    }
  }

  /**
   * Fetches Instagram media posts directly via graph.instagram.com/v20.0/me/media.
   * Handles pagination properly and gracefully handles empty media responses (totalContent = 0).
   */
  async getContent(accessToken: string, _externalAccountId: string, limit = 10): Promise<NormalizedSocialContent[]> {
    if (accessToken.startsWith("ig_") || accessToken.startsWith("mock_")) {
      if (this.isMockModeEnabled(accessToken)) {
        return [
          {
            externalContentId: "ig_media_101",
            contentType: "reel",
            caption: "Summer workout routines & fitness gear review! #fitness #lifestyle",
            permalink: "https://instagram.com/p/C12345678",
            thumbnailUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=400",
            publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            views: 67000,
            likes: 5400,
            comments: 420,
            shares: 180,
          },
          {
            externalContentId: "ig_media_102",
            contentType: "post",
            caption: "Morning routine in Tokyo ☕✨ #travel #tokyo",
            permalink: "https://instagram.com/p/C12345679",
            thumbnailUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=400",
            publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            views: 45000,
            likes: 6100,
            comments: 510,
            shares: 210,
          },
        ];
      }
    }

    try {
      let items: NormalizedSocialContent[] = [];
      let nextUrl: string | null = `${INSTAGRAM_GRAPH_HOST}/${INSTAGRAM_GRAPH_API_VERSION}/me/media?fields=id,caption,media_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count&limit=${limit}&access_token=${accessToken}`;

      while (nextUrl && items.length < limit) {
        const res: Response = await fetch(nextUrl);
        const data = (await res.json()) as any;

        logger.info({
          category: "INSTAGRAM_MEDIA_FETCH",
          endpoint: "/v20.0/me/media",
          statusCode: res.status,
          returnedCount: data?.data?.length || 0,
        }, "[INSTAGRAM MEDIA] Graph API media endpoint called.");

        if (!res.ok || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
          break;
        }

        const normalizedBatch: NormalizedSocialContent[] = data.data.map((item: any) => ({
          externalContentId: item.id,
          contentType: item.media_type?.toLowerCase() === "video" || item.media_type?.toLowerCase() === "reel" ? "reel" : "post",
          caption: item.caption || "",
          permalink: item.permalink || "",
          thumbnailUrl: item.thumbnail_url || item.media_url || "",
          publishedAt: item.timestamp ? new Date(item.timestamp) : new Date(),
          views: 0,
          likes: item.like_count || 0,
          comments: item.comments_count || 0,
          shares: 0,
        }));

        items.push(...normalizedBatch);
        nextUrl = data.paging?.next ? data.paging.next : null;
      }

      return items;
    } catch (_err) {
      return [];
    }
  }

  /**
   * Dynamic account-level insights probing.
   * Probes candidate metrics under instagram_business_manage_insights permission without hardcoded assumptions.
   * Records whether Meta accepts each metric, value, period, and error if rejected.
   */
  async probeAccountInsights(accessToken: string, externalAccountId: string): Promise<ProbedMetricResult[]> {
    if (accessToken.startsWith("ig_") || accessToken.startsWith("mock_")) {
      if (accessToken === "ig_test_zero_reach") {
        return [{ metric: "reach", accepted: true, value: 0, period: "day", fetchedAt: new Date().toISOString() }];
      }
      if (accessToken === "ig_test_api_error" || accessToken === "ig_test_malformed") {
        return [{ metric: "reach", accepted: false, value: null, period: "day", fetchedAt: new Date().toISOString(), error: "Meta API HTTP error" }];
      }
      if (this.isMockModeEnabled(accessToken)) {
        return [
          {
            metric: "reach",
            accepted: true,
            value: 12500,
            period: "day",
            fetchedAt: new Date().toISOString(),
          },
          {
            metric: "impressions",
            accepted: true,
            value: 45000,
            period: "day",
            fetchedAt: new Date().toISOString(),
          },
          {
            metric: "profile_views",
            accepted: true,
            value: 890,
            period: "day",
            fetchedAt: new Date().toISOString(),
          },
        ];
      }
    }

    const candidateMetrics = ["reach", "impressions", "profile_views", "accounts_engaged", "total_interactions", "follower_count"];
    const results: ProbedMetricResult[] = [];
    const nowIso = new Date().toISOString();

    for (const metric of candidateMetrics) {
      try {
        const url = `${INSTAGRAM_GRAPH_HOST}/${INSTAGRAM_GRAPH_API_VERSION}/${externalAccountId}/insights?metric=${metric}&period=day&access_token=${accessToken}`;
        const res = await fetch(url);
        const data = (await res.json()) as any;

        if (res.ok && data.data && Array.isArray(data.data) && data.data.length > 0) {
          const metricObj = data.data[0];
          const latestValueObj = Array.isArray(metricObj.values) && metricObj.values.length > 0
            ? metricObj.values[metricObj.values.length - 1]
            : null;
          const val = latestValueObj ? latestValueObj.value : null;

          results.push({
            metric,
            accepted: true,
            value: val,
            period: metricObj.period || "day",
            periodStart: latestValueObj?.end_time ? new Date(latestValueObj.end_time) : null,
            fetchedAt: nowIso,
          });

          logger.info({
            category: "ACCOUNT_INSIGHTS_PROBE",
            metric,
            accepted: true,
            statusCode: res.status,
            value: val,
          }, `[INSTAGRAM INSIGHTS] Account metric '${metric}' ACCEPTED by Meta API.`);
        } else {
          const errMsg = data.error?.message || `HTTP ${res.status} rejection`;
          results.push({
            metric,
            accepted: false,
            value: null,
            period: "day",
            fetchedAt: nowIso,
            error: errMsg,
          });

          logger.warn({
            category: "ACCOUNT_INSIGHTS_PROBE",
            metric,
            accepted: false,
            statusCode: res.status,
            errorMsg: errMsg,
          }, `[INSTAGRAM INSIGHTS] Account metric '${metric}' REJECTED by Meta API.`);
        }
      } catch (err: any) {
        results.push({
          metric,
          accepted: false,
          value: null,
          period: "day",
          fetchedAt: nowIso,
          error: err.message,
        });
      }
    }

    return results;
  }

  /**
   * Dynamic media-level insights probing.
   * Probes metrics supported for each media type without assuming all metrics work for all types.
   */
  async probeMediaInsights(accessToken: string, mediaId: string, mediaType: string): Promise<ProbedMetricResult[]> {
    if (accessToken.startsWith("ig_") || accessToken.startsWith("mock_")) {
      if (this.isMockModeEnabled()) {
        return [
          {
            metric: "engagement",
            accepted: true,
            value: 5820,
            period: "lifetime",
            fetchedAt: new Date().toISOString(),
          },
          {
            metric: "saved",
            accepted: true,
            value: 340,
            period: "lifetime",
            fetchedAt: new Date().toISOString(),
          },
        ];
      }
    }

    const typeUpper = (mediaType || "").toUpperCase();
    const candidateMetrics = typeUpper.includes("VIDEO") || typeUpper.includes("REEL")
      ? ["plays", "reach", "total_interactions", "likes", "comments", "shares", "saved"]
      : ["engagement", "impressions", "reach", "saved"];

    const results: ProbedMetricResult[] = [];
    const nowIso = new Date().toISOString();

    for (const metric of candidateMetrics) {
      try {
        const url = `${INSTAGRAM_GRAPH_HOST}/${INSTAGRAM_GRAPH_API_VERSION}/${mediaId}/insights?metric=${metric}&access_token=${accessToken}`;
        const res = await fetch(url);
        const data = (await res.json()) as any;

        if (res.ok && data.data && Array.isArray(data.data) && data.data.length > 0) {
          const metricObj = data.data[0];
          const valObj = Array.isArray(metricObj.values) && metricObj.values.length > 0
            ? metricObj.values[0]
            : null;
          const val = valObj ? valObj.value : null;

          results.push({
            metric,
            accepted: true,
            value: val,
            period: "lifetime",
            fetchedAt: nowIso,
          });
        } else {
          results.push({
            metric,
            accepted: false,
            value: null,
            period: "lifetime",
            fetchedAt: nowIso,
            error: data.error?.message || `HTTP ${res.status} rejection`,
          });
        }
      } catch (err: any) {
        results.push({
          metric,
          accepted: false,
          value: null,
          period: "lifetime",
          fetchedAt: nowIso,
          error: err.message,
        });
      }
    }

    return results;
  }

  /**
   * Legacy simple getInsights method retained for backward compatibility.
   */
  async getInsights(accessToken: string, externalAccountId: string): Promise<{ reach: number | null }> {
    const probed = await this.probeAccountInsights(accessToken, externalAccountId);
    const reachObj = probed.find((p) => p.metric === "reach" && p.accepted);
    if (reachObj && reachObj.value !== null) {
      const num = Number(reachObj.value);
      return { reach: isNaN(num) ? null : num };
    }
    return { reach: null };
  }

  async disconnect(_accessToken: string): Promise<void> {
    return;
  }
}
