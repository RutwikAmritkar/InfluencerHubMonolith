import {
  SocialPlatformProvider,
  PlatformCapabilities,
  NormalizedSocialProfile,
  NormalizedSocialContent,
  OAuthTokenResponse,
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
  private isMockModeEnabled(): boolean {
    if (process.env.NODE_ENV === "production") {
      return false;
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

    try {
      const formData = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: "authorization_code",
        redirect_uri: this.redirectUri,
        code,
      });

      const res = await fetch(`${INSTAGRAM_OAUTH_HOST}/oauth/access_token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      const data = (await res.json()) as any;

      if (!res.ok || data.error || data.error_message) {
        throw new Error(data.error_message || data.error?.message || "Failed to exchange Instagram OAuth code");
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
      if (this.isMockModeEnabled()) {
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
      if (this.isMockModeEnabled()) {
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
   */
  async getContent(accessToken: string, _externalAccountId: string, limit = 10): Promise<NormalizedSocialContent[]> {
    if (accessToken.startsWith("ig_") || accessToken.startsWith("mock_")) {
      if (this.isMockModeEnabled()) {
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
      const url = `${INSTAGRAM_GRAPH_HOST}/${INSTAGRAM_GRAPH_API_VERSION}/me/media?fields=id,caption,media_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count&limit=${limit}&access_token=${accessToken}`;
      const res = await fetch(url);
      const data = (await res.json()) as any;

      if (!res.ok || !data.data) {
        return [];
      }

      return data.data.map((item: any) => ({
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
    } catch (_err) {
      return [];
    }
  }

  /**
   * Fetches Instagram account insights (reach metric) directly via graph.instagram.com/{user-id}/insights?metric=reach&period=day.
   * Returns { reach: number } on success, or { reach: null } on HTTP/API/network/malformed response failure.
   */
  async getInsights(accessToken: string, externalAccountId: string): Promise<{ reach: number | null }> {
    if (accessToken.startsWith("ig_") || accessToken.startsWith("mock_")) {
      if (this.isMockModeEnabled()) {
        if (accessToken.includes("zero_reach")) {
          return { reach: 0 };
        }
        if (accessToken.includes("api_error") || accessToken.includes("malformed")) {
          return { reach: null };
        }
        return { reach: 12500 };
      }
    }

    try {
      const url = `${INSTAGRAM_GRAPH_HOST}/${INSTAGRAM_GRAPH_API_VERSION}/${externalAccountId}/insights?metric=reach&period=day&access_token=${accessToken}`;
      const res = await fetch(url);
      const data = (await res.json()) as any;

      if (!res.ok || data.error) {
        logger.warn({
          category: "SOCIAL_INSIGHTS",
          platform: "instagram",
          statusCode: res.status,
          errorCode: data.error?.code,
          errorType: data.error?.type,
          reason: data.error?.message || `HTTP ${res.status} error from Meta Insights API`,
        }, "[INSTAGRAM INSIGHTS API ERROR] Failed to fetch reach metric from Meta API.");
        return { reach: null };
      }

      if (!data.data || !Array.isArray(data.data)) {
        logger.warn({
          category: "SOCIAL_INSIGHTS",
          platform: "instagram",
          reason: "Malformed payload from Meta Insights API: missing data array.",
        }, "[INSTAGRAM INSIGHTS MALFORMED] Missing data array in response payload.");
        return { reach: null };
      }

      const reachMetric = data.data.find((item: any) => item.name === "reach");
      if (!reachMetric || !Array.isArray(reachMetric.values) || reachMetric.values.length === 0) {
        return { reach: null };
      }

      const latestValue = reachMetric.values[reachMetric.values.length - 1]?.value;
      if (latestValue === undefined || latestValue === null) {
        return { reach: null };
      }

      const numericReach = Number(latestValue);
      return { reach: isNaN(numericReach) ? null : numericReach };
    } catch (err: any) {
      logger.warn({
        category: "SOCIAL_INSIGHTS",
        platform: "instagram",
        reason: err?.message || "Network exception fetching Instagram Insights.",
      }, "[INSTAGRAM INSIGHTS EXCEPTION] Exception occurred during reach metric fetch.");
      return { reach: null };
    }
  }

  async disconnect(_accessToken: string): Promise<void> {
    return;
  }
}
