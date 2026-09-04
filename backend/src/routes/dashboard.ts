import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { campaignsTable, brandsTable, influencersTable, applicationsTable, usersTable } from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/brand", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: string | number }).userId;

  try {
    const [brand] = await db.select().from(brandsTable).where(eq(brandsTable.userId, String(userId))).limit(1);
    if (brand) {
      const [{ total }] = await db.select({ total: count() }).from(campaignsTable).where(eq(campaignsTable.brandId, brand.id));
      const [{ active }] = await db.select({ active: count() }).from(campaignsTable).where(and(eq(campaignsTable.brandId, brand.id), eq(campaignsTable.status, "active")));
      const [{ totalApps }] = await db.select({ totalApps: count() }).from(applicationsTable);

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
        totalApplications: Number(totalApps),
        savedInfluencers: 0,
        recentCampaigns: campaignsFormatted,
        topInfluencers: [],
      });
      return;
    }
  } catch (_e) {
    // Return clean empty state
  }

  res.json({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalApplications: 0,
    savedInfluencers: 0,
    recentCampaigns: [],
    topInfluencers: [],
  });
});

router.get("/dashboard/influencer", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: string | number }).userId;

  try {
    const [influencer] = await db.select().from(influencersTable).where(eq(influencersTable.userId, String(userId))).limit(1);
    if (influencer) {
      const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.influencerId, influencer.id)).orderBy(desc(applicationsTable.createdAt)).limit(5);
      const formatted = await Promise.all(apps.map(async a => {
        const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, a.campaignId)).limit(1);
        return { id: a.id, campaignId: a.campaignId, campaignTitle: campaign?.title ?? null, influencerId: a.influencerId, influencerName: null, influencerAvatarUrl: influencer.avatarUrl, status: a.status, message: a.message, createdAt: a.createdAt.toISOString() };
      }));

      res.json({
        profileCompletion: influencer.profileCompletion ?? 40,
        followers: influencer.followers ?? 0,
        monthlyEarnings: influencer.monthlyEarnings ?? 0,
        campaignInvites: apps.length,
        recentApplications: formatted,
        profileViews: influencer.avgViews ?? 0,
        viewsThisWeek: [
          { day: "Mon", views: 0 }, { day: "Tue", views: 0 }, { day: "Wed", views: 0 },
          { day: "Thu", views: 0 }, { day: "Fri", views: 0 }, { day: "Sat", views: 0 }, { day: "Sun", views: 0 },
        ],
        category: influencer.category,
        country: influencer.country,
        isVerified: influencer.isVerified,
        socialAccounts: influencer.socialAccounts || [],
      });
      return;
    }
  } catch (_e) {
    // Return clean empty state
  }

  res.json({
    profileCompletion: 40,
    followers: 0,
    monthlyEarnings: 0,
    campaignInvites: 0,
    recentApplications: [],
    profileViews: 0,
    viewsThisWeek: [
      { day: "Mon", views: 0 }, { day: "Tue", views: 0 }, { day: "Wed", views: 0 },
      { day: "Thu", views: 0 }, { day: "Fri", views: 0 }, { day: "Sat", views: 0 }, { day: "Sun", views: 0 },
    ],
    category: "Lifestyle",
    country: "United States",
    isVerified: false,
    socialAccounts: [],
  });
});

export default router;
