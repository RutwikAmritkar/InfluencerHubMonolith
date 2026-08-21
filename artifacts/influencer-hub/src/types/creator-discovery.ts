/**
 * CREATOR DISCOVERY, MATCHING & INVITATION ARCHITECTURE
 * Multi-dimensional Search, Creator Match Scoring, Pricing Intelligence, and Brand-Led Invitations
 */

export type DataConfidence = "Verified" | "Estimated" | "Self-reported" | "Unavailable";

// 1. CREATOR DISCOVERY FILTERS
export interface CreatorDiscoveryFilters {
  // Creator Level
  categories: string[];
  niches: string[];
  platforms: Array<"instagram" | "tiktok" | "youtube" | "twitter" | "facebook">;
  creatorLocations: string[];
  languages: string[];
  creatorTier: Array<"nano" | "micro" | "mid" | "macro" | "mega">;
  followerMin: number;
  followerMax: number;

  // Audience Level
  audienceAgeRanges: string[];
  audienceGenderRatio: "all" | "female_majority" | "male_majority";
  audienceTopLocations: string[];
  audienceInterests: string[];
  audienceMatchMinPercent: number;

  // Performance Level
  minEngagementRate: number;
  minAverageViews: number;
  minAverageReach: number;
  consistencyScoreMin: number;
  followerGrowthMinPercent: number;

  // Trust Level
  minAuthenticityScore: number;
  minAudienceQualityScore: number;
  verifiedOnly: boolean;
  brandSafetyRating: "all" | "safe_for_all_brands" | "moderate";

  // Commercial Level
  maxEstimatedRate: number;
  budgetMin: number;
  budgetMax: number;
  maxTargetCPV?: number; // Cost Per View
  maxTargetCPE?: number; // Cost Per Engagement
}

// 2. CREATOR MATCH SCORE BREAKDOWN
export interface CreatorMatchBreakdown {
  overallMatchScore: number; // 0 - 100%
  audienceMatchScore: number;
  categoryMatchScore: number;
  performanceMatchScore: number;
  budgetMatchScore: number;
  platformMatchScore: number;
  locationMatchScore: number;
  confidence: DataConfidence;
  matchReasons: string[]; // e.g. ["✓ Strong audience overlap", "✓ Beauty category alignment"]
  improvementSuggestions?: string[];
}

// 3. PRICING INTELLIGENCE ARCHITECTURE
export interface PricingIntelligence {
  creatorAskingRate?: number;
  historicalAverageRate?: number;
  comparableMarketRange: {
    min: number;
    recommended: number;
    max: number;
  };
  costPerViewEstimated: number; // CPV
  costPerEngagementEstimated: number; // CPE
  pricingConfidence: DataConfidence;
  valuationNote: string;
}

// 4. SHORTLIST ITEM & CAMPAIGN SHORTLIST
export interface ShortlistCreatorItem {
  creatorId: number;
  creatorName: string;
  creatorHandle: string;
  avatarUrl: string;
  category: string;
  platform: string;
  followersCount: number;
  engagementRate: number;
  matchBreakdown: CreatorMatchBreakdown;
  pricing: PricingIntelligence;
  savedAt: string;
  notes?: string;
  status: "shortlisted" | "invited" | "in_discussion" | "declined";
}

export interface CampaignShortlist {
  id: number;
  brandId: number;
  campaignId?: number;
  title: string;
  description?: string;
  creators: ShortlistCreatorItem[];
  createdAt: string;
  updatedAt: string;
}

// 5. BRAND-LED CREATOR INVITATION DOMAIN (DISTINCT FROM CREATOR-LED APPLICATION)
export interface CreatorInvitation {
  id: number;
  brandId: number;
  brandName: string;
  brandLogoUrl: string;
  creatorId: number;
  campaignId: number;
  campaignTitle: string;
  proposedBudget: number;
  deliverablesSummary: string;
  invitationMessage: string;
  status: "Draft" | "Sent" | "Viewed" | "Accepted" | "Declined" | "Expired";
  sentAt: string;
  expiresAt: string;
}
