/**
 * BRAND DOMAIN ARCHITECTURE & TYPE SYSTEM
 * InfluencerHub Two-Sided Marketplace — Brand Domain
 */

export type UserRole = "influencer" | "brand" | "admin" | "agency";

export interface SocialAccountLink {
  platform: "instagram" | "tiktok" | "youtube" | "twitter" | "facebook" | "linkedin";
  handle: string;
  url: string;
  followerCount?: number;
}

// 1. BRAND IDENTITY
export interface BrandIdentity {
  id: number;
  brandName: string;
  legalName?: string;
  logoUrl: string;
  coverImageUrl?: string;
  description: string;
  tagline?: string;
  industry: string;
  websiteUrl: string;
  headquartersRegion: string;
  companySize: "1-10" | "11-50" | "51-200" | "201-500" | "500+";
  foundedYear?: number;
  socialAccounts: SocialAccountLink[];
}

// 2. CREATOR PREFERENCES
export interface CreatorPreferences {
  preferredCategories: string[];
  preferredPlatforms: Array<"instagram" | "tiktok" | "youtube" | "twitter" | "facebook">;
  preferredCreatorSizes: Array<"nano" | "micro" | "mid" | "macro" | "mega">; // nano <10k, micro 10k-50k, mid 50k-250k, macro 250k-1M, mega 1M+
  preferredAudienceAge: Array<"18-24" | "25-34" | "35-44" | "45+">;
  preferredAudienceGender: "all" | "female_predominant" | "male_predominant";
  preferredCreatorLocations: string[];
  preferredLanguages: string[];
  minEngagementRate: number; // e.g. 2.5%
}

// 3. CAMPAIGN PREFERENCES
export interface CampaignPreferences {
  typicalCampaignBudgetMin: number;
  typicalCampaignBudgetMax: number;
  typicalCreatorPayoutMin: number;
  typicalCreatorPayoutMax: number;
  primaryObjectives: Array<"brand_awareness" | "conversions" | "content_creation" | "event_coverage" | "app_installs">;
  preferredContentFormats: Array<"reels" | "shorts" | "unboxing" | "dedicated_video" | "story_frames" | "sponsored_post">;
}

// 4. VERIFICATION STATUS
export interface BrandVerification {
  businessVerified: boolean;
  websiteVerified: boolean;
  socialVerified: boolean;
  paymentVerified: boolean;
  verificationBadge: "verified_enterprise" | "verified_business" | "pending" | "unverified";
}

// 5. COMPLETE BRAND PROFILE DOMAIN
export interface BrandProfileDomain {
  identity: BrandIdentity;
  creatorPreferences: CreatorPreferences;
  campaignPreferences: CampaignPreferences;
  verification: BrandVerification;
  updatedAt: string;
}

/**
 * Public vs Private Brand Profile View Boundary
 */
export interface PublicBrandProfile {
  id: number;
  brandName: string;
  logoUrl: string;
  coverImageUrl?: string;
  description: string;
  industry: string;
  websiteUrl: string;
  verificationBadge: string;
  preferredCategories: string[];
  activeCampaignCount: number;
}
