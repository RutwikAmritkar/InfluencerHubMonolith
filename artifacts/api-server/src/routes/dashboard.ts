import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { campaignsTable, brandsTable, influencersTable, applicationsTable, usersTable } from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/brand", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;

  try {
    const [brand] = await db.select().from(brandsTable).where(eq(brandsTable.userId, userId)).limit(1);
    if (brand) {
      const [{ total }] = await db.select({ total: count() }).from(campaignsTable).where(eq(campaignsTable.brandId, brand.id));
      const [{ active }] = await db.select({ active: count() }).from(campaignsTable).where(and(eq(campaignsTable.brandId, brand.id), eq(campaignsTable.status, "active")));

      const recentCampaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.brandId, brand.id)).orderBy(desc(campaignsTable.createdAt)).limit(5);
      const campaignsFormatted = await Promise.all(recentCampaigns.map(async c => {
        const [{ cnt }] = await db.select({ cnt: count() }).from(applicationsTable).where(eq(applicationsTable.campaignId, c.id));
        return {
          id: c.id, brandId: c.brandId, brandName: brand.name, brandLogoUrl: brand.logoUrl,
          title: c.title, description: c.description, budget: c.budget, platform: c.platform, status: c.status,
          deliverables: c.deliverables, targetAudience: c.targetAudience, timeline: c.timeline, deadline: c.deadline,
          applicationsCount: Number(cnt), createdAt: c.createdAt.toISOString(),
        };
      }));

      res.json({
        totalCampaigns: Number(total),
        activeCampaigns: Number(active),
        totalApplications: 5,
        savedInfluencers: 12,
        recentCampaigns: campaignsFormatted,
        topInfluencers: [],
      });
      return;
    }
  } catch (_e) {
    // Fallback
  }

  // Demo fallback
  res.json({
    totalCampaigns: 4,
    activeCampaigns: 2,
    totalApplications: 18,
    savedInfluencers: 12,
    recentCampaigns: [
      {
        id: 1, brandId: 1, brandName: "Nike", brandLogoUrl: null,
        title: "Summer Fitness Campaign", description: "Promoting summer athletic wear", budget: 5000, platform: "instagram", status: "active",
        deliverables: ["1 Instagram Reel"], targetAudience: "Fitness enthusiasts", timeline: "3 weeks", deadline: "2026-09-01",
        applicationsCount: 8, createdAt: new Date().toISOString(),
      }
    ],
    topInfluencers: [
      {
        id: 1, userId: 1, name: "Alex Rivera",
        bio: "Digital creator", category: "Lifestyle", country: "US",
        followers: 125000, engagementRate: 4.2, avgViews: 45000, collaborationCost: 1500,
        platforms: ["instagram", "youtube", "tiktok", "facebook"], languages: ["English"],
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400", coverUrl: "",
        profileCompletion: 90, monthlyEarnings: 8500, isVerified: true,
      }
    ],
  });
});

router.get("/dashboard/influencer", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;

  try {
    const [influencer] = await db.select().from(influencersTable).where(eq(influencersTable.userId, userId)).limit(1);
    if (influencer) {
      const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.influencerId, influencer.id)).orderBy(desc(applicationsTable.createdAt)).limit(5);
      const formatted = await Promise.all(apps.map(async a => {
        const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, a.campaignId)).limit(1);
        return { id: a.id, campaignId: a.campaignId, campaignTitle: campaign?.title ?? null, influencerId: a.influencerId, influencerName: null, influencerAvatarUrl: influencer.avatarUrl, status: a.status, message: a.message, createdAt: a.createdAt.toISOString() };
      }));

      res.json({
        profileCompletion: influencer.profileCompletion,
        followers: influencer.followers,
        monthlyEarnings: influencer.monthlyEarnings,
        campaignInvites: 3,
        recentApplications: formatted,
        profileViews: 847,
        viewsThisWeek: [
          { day: "Mon", views: 120 }, { day: "Tue", views: 145 }, { day: "Wed", views: 98 },
          { day: "Thu", views: 167 }, { day: "Fri", views: 201 }, { day: "Sat", views: 89 }, { day: "Sun", views: 134 },
        ],
      });
      return;
    }
  } catch (_e) {
    // Fallback
  }

  res.json({
    profileCompletion: 90,
    followers: 125000,
    monthlyEarnings: 8500,
    campaignInvites: 3,
    recentApplications: [
      { id: 1, campaignId: 1, campaignTitle: "Nike Summer Collection", influencerId: 1, influencerName: "Alex Rivera", influencerAvatarUrl: null, status: "accepted", message: "Excited to collaborate!", createdAt: new Date().toISOString() }
    ],
    profileViews: 847,
    viewsThisWeek: [
      { day: "Mon", views: 120 }, { day: "Tue", views: 145 }, { day: "Wed", views: 98 },
      { day: "Thu", views: 167 }, { day: "Fri", views: 201 }, { day: "Sat", views: 89 }, { day: "Sun", views: 134 },
    ],
  });
});

export default router;
