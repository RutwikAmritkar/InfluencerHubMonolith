import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { campaignsTable, brandsTable, influencersTable, applicationsTable, usersTable } from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/brand", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;

  const [brand] = await db.select().from(brandsTable).where(eq(brandsTable.userId, userId)).limit(1);
  if (!brand) {
    // Return demo data if brand profile doesn't exist
    const allCampaigns = await db.select().from(campaignsTable).orderBy(desc(campaignsTable.createdAt)).limit(5);
    const allInfluencers = await db.select({ influencer: influencersTable, name: usersTable.name })
      .from(influencersTable)
      .leftJoin(usersTable, eq(usersTable.id, influencersTable.userId))
      .limit(4);

    const [{ total }] = await db.select({ total: count() }).from(campaignsTable);
    const [{ active }] = await db.select({ active: count() }).from(campaignsTable).where(eq(campaignsTable.status, "active"));
    const [{ apps }] = await db.select({ apps: count() }).from(applicationsTable);

    const campaignsFormatted = await Promise.all(allCampaigns.map(async c => {
      const b = await db.select().from(brandsTable).where(eq(brandsTable.id, c.brandId)).limit(1);
      const [{ cnt }] = await db.select({ cnt: count() }).from(applicationsTable).where(eq(applicationsTable.campaignId, c.id));
      return {
        id: c.id, brandId: c.brandId, brandName: b[0]?.name ?? "Unknown", brandLogoUrl: b[0]?.logoUrl ?? null,
        title: c.title, description: c.description, budget: c.budget, platform: c.platform, status: c.status,
        deliverables: c.deliverables, targetAudience: c.targetAudience, timeline: c.timeline, deadline: c.deadline,
        applicationsCount: Number(cnt), createdAt: c.createdAt.toISOString(),
      };
    }));

    res.json({
      totalCampaigns: Number(total),
      activeCampaigns: Number(active),
      totalApplications: Number(apps),
      savedInfluencers: 12,
      recentCampaigns: campaignsFormatted,
      topInfluencers: allInfluencers.map(r => ({
        id: r.influencer.id, userId: r.influencer.userId, name: r.name ?? "Unknown",
        bio: r.influencer.bio, category: r.influencer.category, country: r.influencer.country,
        followers: r.influencer.followers, engagementRate: r.influencer.engagementRate,
        avgViews: r.influencer.avgViews, collaborationCost: r.influencer.collaborationCost,
        platforms: r.influencer.platforms, languages: r.influencer.languages,
        avatarUrl: r.influencer.avatarUrl, coverUrl: r.influencer.coverUrl,
        profileCompletion: r.influencer.profileCompletion, monthlyEarnings: r.influencer.monthlyEarnings,
        isVerified: r.influencer.isVerified,
      })),
    });
    return;
  }

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

  // Sum applications across all brand campaigns
  const allBrandCampaigns = await db.select().from(campaignsTable).where(eq(campaignsTable.brandId, brand.id));
  let totalApps = 0;
  for (const c of allBrandCampaigns) {
    const [{ cnt }] = await db.select({ cnt: count() }).from(applicationsTable).where(eq(applicationsTable.campaignId, c.id));
    totalApps += Number(cnt);
  }

  const topInfluencers = await db.select({ influencer: influencersTable, name: usersTable.name })
    .from(influencersTable)
    .leftJoin(usersTable, eq(usersTable.id, influencersTable.userId))
    .limit(4);

  res.json({
    totalCampaigns: Number(total),
    activeCampaigns: Number(active),
    totalApplications: totalApps,
    savedInfluencers: 12,
    recentCampaigns: campaignsFormatted,
    topInfluencers: topInfluencers.map(r => ({
      id: r.influencer.id, userId: r.influencer.userId, name: r.name ?? "Unknown",
      bio: r.influencer.bio, category: r.influencer.category, country: r.influencer.country,
      followers: r.influencer.followers, engagementRate: r.influencer.engagementRate,
      avgViews: r.influencer.avgViews, collaborationCost: r.influencer.collaborationCost,
      platforms: r.influencer.platforms, languages: r.influencer.languages,
      avatarUrl: r.influencer.avatarUrl, coverUrl: r.influencer.coverUrl,
      profileCompletion: r.influencer.profileCompletion, monthlyEarnings: r.influencer.monthlyEarnings,
      isVerified: r.influencer.isVerified,
    })),
  });
});

router.get("/dashboard/influencer", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: number }).userId;

  const [influencer] = await db.select().from(influencersTable).where(eq(influencersTable.userId, userId)).limit(1);
  if (!influencer) {
    const allInfluencers = await db.select().from(influencersTable).limit(1);
    const inf = allInfluencers[0];
    if (inf) {
      const apps = await db.select().from(applicationsTable).where(eq(applicationsTable.influencerId, inf.id)).orderBy(desc(applicationsTable.createdAt)).limit(5);
      const formatted = await Promise.all(apps.map(async a => {
        const [campaign] = await db.select().from(campaignsTable).where(eq(campaignsTable.id, a.campaignId)).limit(1);
        return { id: a.id, campaignId: a.campaignId, campaignTitle: campaign?.title ?? null, influencerId: a.influencerId, influencerName: null, influencerAvatarUrl: null, status: a.status, message: a.message, createdAt: a.createdAt.toISOString() };
      }));
      res.json({ profileCompletion: inf.profileCompletion, followers: inf.followers, monthlyEarnings: inf.monthlyEarnings, campaignInvites: 3, recentApplications: formatted, profileViews: 847, viewsThisWeek: [{ day: "Mon", views: 120 }, { day: "Tue", views: 145 }, { day: "Wed", views: 98 }, { day: "Thu", views: 167 }, { day: "Fri", views: 201 }, { day: "Sat", views: 89 }, { day: "Sun", views: 134 }] });
    } else {
      res.json({ profileCompletion: 75, followers: 45200, monthlyEarnings: 3200, campaignInvites: 3, recentApplications: [], profileViews: 847, viewsThisWeek: [{ day: "Mon", views: 120 }, { day: "Tue", views: 145 }, { day: "Wed", views: 98 }, { day: "Thu", views: 167 }, { day: "Fri", views: 201 }, { day: "Sat", views: 89 }, { day: "Sun", views: 134 }] });
    }
    return;
  }

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
});

export default router;
