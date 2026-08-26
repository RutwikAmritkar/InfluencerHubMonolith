export interface PlatformCapabilities {
  hasFollowingCount: boolean;
  hasTotalViews: boolean;
  hasAudienceDemographics: boolean;
  hasContentAnalytics: boolean;
  hasSharesCount: boolean;
}

export interface NormalizedSocialProfile {
  externalAccountId: string;
  username: string;
  displayName?: string;
  profileUrl?: string;
  avatarUrl?: string;
  followers: number;
  following?: number | null;
  totalContent: number;
  totalViews?: number | null;
  totalLikes?: number | null;
}

export interface NormalizedSocialContent {
  externalContentId: string;
  contentType: "post" | "reel" | "video" | "short";
  title?: string;
  caption?: string;
  permalink?: string;
  thumbnailUrl?: string;
  publishedAt?: Date;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scopes: string[];
}

export interface SocialPlatformProvider {
  readonly platform: "instagram" | "youtube" | "tiktok";
  readonly capabilities: PlatformCapabilities;

  getAuthorizationUrl(state: string): Promise<string>;
  exchangeCodeForTokens(code: string): Promise<OAuthTokenResponse>;
  refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
  }>;
  getProfile(accessToken: string): Promise<NormalizedSocialProfile>;
  getContent(accessToken: string, externalAccountId: string, limit?: number): Promise<NormalizedSocialContent[]>;
  disconnect(accessToken: string): Promise<void>;
}
