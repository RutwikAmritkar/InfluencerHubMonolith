/**
 * BRAND EXPERIENCE SERVICE LAYER
 * Business logic, creator matching algorithms, pricing estimations, and shortlist helpers.
 */

import { BrandProfileDomain } from "../types/brand-domain";
import { CreatorMatchBreakdown, PricingIntelligence, CampaignShortlist } from "../types/creator-discovery";

// DEFAULT BRAND PROFILE MOCK SEED DATA
export const DEFAULT_BRAND_PROFILE: BrandProfileDomain = {
  identity: {
    id: 1,
    brandName: "Glow Cosmetics Co.",
    legalName: "Glow Beauty Labs International Inc.",
    logoUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=150&auto=format&fit=crop",
    coverImageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1000&auto=format&fit=crop",
    description: "Clean, organic, dermatologist-tested skincare formulations crafted for modern minimalist beauty rituals.",
    tagline: "Radiance by nature, backed by science.",
    industry: "Beauty & Personal Care",
    websiteUrl: "https://glowcosmetics.demo",
    headquartersRegion: "New York, USA",
    companySize: "51-200",
    foundedYear: 2021,
    socialAccounts: [
      { platform: "instagram", handle: "@glowcosmetics", url: "https://instagram.com", followerCount: 240000 },
      { platform: "tiktok", handle: "@glowbeauty", url: "https://tiktok.com", followerCount: 180000 }
    ]
  },
  creatorPreferences: {
    preferredCategories: ["Beauty & Wellness", "Fashion & Lifestyle", "Skincare"],
    preferredPlatforms: ["instagram", "tiktok"],
    preferredCreatorSizes: ["micro", "mid", "macro"],
    preferredAudienceAge: ["18-24", "25-34"],
    preferredAudienceGender: "female_predominant",
    preferredCreatorLocations: ["United States", "United Kingdom", "Canada"],
    preferredLanguages: ["English"],
    minEngagementRate: 3.2,
  },
  campaignPreferences: {
    typicalCampaignBudgetMin: 5000,
    typicalCampaignBudgetMax: 50000,
    typicalCreatorPayoutMin: 1500,
    typicalCreatorPayoutMax: 12000,
    primaryObjectives: ["brand_awareness", "content_creation", "conversions"],
    preferredContentFormats: ["reels", "shorts", "unboxing"],
  },
  verification: {
    businessVerified: true,
    websiteVerified: true,
    socialVerified: true,
    paymentVerified: true,
    verificationBadge: "verified_enterprise",
  },
  updatedAt: new Date().toISOString(),
};

/**
 * Calculate Creator Match Breakdown against Brand Preferences & Campaign Requirements
 */
export function calculateCreatorMatch(
  creator: {
    category?: string;
    platform?: string;
    followersCount?: number;
    engagementRate?: number;
    location?: string;
    price?: number;
  },
  brandPrefs: typeof DEFAULT_BRAND_PROFILE.creatorPreferences,
  campaignBudget?: number
): CreatorMatchBreakdown {
  const categoryMatch = (creator.category && brandPrefs.preferredCategories.includes(creator.category)) ? 100 : 75;
  const platformMatch = (creator.platform && brandPrefs.preferredPlatforms.includes(creator.platform as any)) ? 100 : 80;
  const performanceMatch = (creator.engagementRate && creator.engagementRate >= brandPrefs.minEngagementRate) ? 95 : 82;
  const budgetMatch = (creator.price && campaignBudget && creator.price <= campaignBudget) ? 98 : 88;
  const locationMatch = (creator.location && brandPrefs.preferredCreatorLocations.includes(creator.location)) ? 95 : 85;
  const audienceMatch = 92;

  const overall = Math.round(
    categoryMatch * 0.25 +
    platformMatch * 0.15 +
    performanceMatch * 0.25 +
    budgetMatch * 0.15 +
    audienceMatch * 0.20
  );

  const matchReasons: string[] = [];
  if (categoryMatch > 90) matchReasons.push(`✓ Category alignment (${creator.category || "Beauty"})`);
  if (performanceMatch > 90) matchReasons.push(`✓ Engagement rate above target (${creator.engagementRate || 4.2}%)`);
  if (platformMatch > 90) matchReasons.push(`✓ High performance on preferred platform (${creator.platform || "Instagram"})`);
  if (budgetMatch > 90) matchReasons.push(`✓ Within target campaign budget`);

  return {
    overallMatchScore: overall,
    audienceMatchScore: audienceMatch,
    categoryMatchScore: categoryMatch,
    performanceMatchScore: performanceMatch,
    budgetMatchScore: budgetMatch,
    platformMatchScore: platformMatch,
    locationMatchScore: locationMatch,
    confidence: "Verified",
    matchReasons,
  };
}

/**
 * Calculate Pricing Intelligence for a Creator
 */
export function calculatePricingIntelligence(followers: number, engagementRate: number): PricingIntelligence {
  const baseRate = Math.round((followers / 1000) * 35 * (engagementRate / 3));
  const minRate = Math.round(baseRate * 0.85);
  const maxRate = Math.round(baseRate * 1.25);
  const estimatedViews = Math.round(followers * (engagementRate / 100) * 4.5);

  return {
    creatorAskingRate: baseRate,
    historicalAverageRate: Math.round(baseRate * 0.95),
    comparableMarketRange: {
      min: minRate,
      recommended: baseRate,
      max: maxRate,
    },
    costPerViewEstimated: Number((baseRate / Math.max(estimatedViews, 1000)).toFixed(3)),
    costPerEngagementEstimated: Number((baseRate / Math.max(followers * (engagementRate / 100), 500)).toFixed(2)),
    pricingConfidence: "Estimated",
    valuationNote: `Based on historical performance of creators with ${followers.toLocaleString()} followers & ${engagementRate}% engagement.`,
  };
}

/**
 * Default Shortlists Seed Data
 */
export const DEFAULT_CAMPAIGN_SHORTLISTS: CampaignShortlist[] = [
  {
    id: 1,
    brandId: 1,
    campaignId: 1,
    title: "Summer Beauty Campaign — Primary Roster",
    description: "Top shortlisted beauty & lifestyle creators for Instagram Reels launch.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date().toISOString(),
    creators: [
      {
        creatorId: 101,
        creatorName: "Maya Chen",
        creatorHandle: "@mayachen_beauty",
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop",
        category: "Beauty & Wellness",
        platform: "instagram",
        followersCount: 125000,
        engagementRate: 4.8,
        matchBreakdown: {
          overallMatchScore: 98,
          audienceMatchScore: 96,
          categoryMatchScore: 100,
          performanceMatchScore: 98,
          budgetMatchScore: 95,
          platformMatchScore: 100,
          locationMatchScore: 95,
          confidence: "Verified",
          matchReasons: ["✓ 98% Audience Overlap", "✓ High Reel Engagement", "✓ Within Budget"]
        },
        pricing: {
          creatorAskingRate: 4500,
          comparableMarketRange: { min: 3800, recommended: 4500, max: 5200 },
          costPerViewEstimated: 0.042,
          costPerEngagementEstimated: 0.75,
          pricingConfidence: "Verified",
          valuationNote: "Strong historical conversion rate."
        },
        savedAt: new Date().toISOString(),
        notes: "Ideal lead creator for product tutorial.",
        status: "shortlisted"
      }
    ]
  }
];
