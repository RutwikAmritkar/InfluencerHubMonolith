import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { influencersTable, usersTable } from "@workspace/db";
import { UpdateInfluencerBody } from "@workspace/api-zod";
import { eq, and, gte, lte, ilike, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/influencers", async (req, res): Promise<void> => {
  const { platform, category, country, minFollowers, maxFollowers, search } = req.query as Record<string, string>;

  const conditions = [];
  if (category) conditions.push(ilike(influencersTable.category, `%${category}%`));
  if (country) conditions.push(eq(influencersTable.country, country));
  if (minFollowers) conditions.push(gte(influencersTable.followers, parseInt(minFollowers)));
  if (maxFollowers) conditions.push(lte(influencersTable.followers, parseInt(maxFollowers)));

  let rows = await db
    .select({
      influencer: influencersTable,
      userName: usersTable.name,
    })
    .from(influencersTable)
    .leftJoin(usersTable, eq(usersTable.id, influencersTable.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  if (platform) {
    rows = rows.filter(r => r.influencer.platforms.includes(platform));
  }
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(r =>
      r.userName?.toLowerCase().includes(q) ||
      r.influencer.category.toLowerCase().includes(q) ||
      r.influencer.country.toLowerCase().includes(q)
    );
  }

  res.json(rows.map(r => ({
    id: r.influencer.id,
    userId: r.influencer.userId,
    name: r.userName ?? "Unknown",
    bio: r.influencer.bio,
    category: r.influencer.category,
    country: r.influencer.country,
    followers: r.influencer.followers,
    engagementRate: r.influencer.engagementRate,
    avgViews: r.influencer.avgViews,
    collaborationCost: r.influencer.collaborationCost,
    platforms: r.influencer.platforms,
    languages: r.influencer.languages,
    avatarUrl: r.influencer.avatarUrl,
    coverUrl: r.influencer.coverUrl,
    profileCompletion: r.influencer.profileCompletion,
    monthlyEarnings: r.influencer.monthlyEarnings,
    isVerified: r.influencer.isVerified,
  })));
});

router.get("/influencers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [row] = await db
    .select({ influencer: influencersTable, userName: usersTable.name })
    .from(influencersTable)
    .leftJoin(usersTable, eq(usersTable.id, influencersTable.userId))
    .where(eq(influencersTable.id, id))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Influencer not found" });
    return;
  }

  res.json({
    id: row.influencer.id,
    userId: row.influencer.userId,
    name: row.userName ?? "Unknown",
    bio: row.influencer.bio,
    category: row.influencer.category,
    country: row.influencer.country,
    followers: row.influencer.followers,
    engagementRate: row.influencer.engagementRate,
    avgViews: row.influencer.avgViews,
    collaborationCost: row.influencer.collaborationCost,
    platforms: row.influencer.platforms,
    languages: row.influencer.languages,
    avatarUrl: row.influencer.avatarUrl,
    coverUrl: row.influencer.coverUrl,
    profileCompletion: row.influencer.profileCompletion,
    monthlyEarnings: row.influencer.monthlyEarnings,
    isVerified: row.influencer.isVerified,
    availability: row.influencer.availability,
    portfolio: row.influencer.portfolio,
    previousCollaborations: [
      { id: 1, brandName: "Nike", campaignTitle: "Summer Collection", year: 2024 },
      { id: 2, brandName: "Spotify", campaignTitle: "Launch Campaign", year: 2023 },
    ],
    reviews: [
      { id: 1, brandName: "Nike", rating: 4.8, comment: "Excellent creator with strong engagement. Delivered on time.", createdAt: "2024-06-01" },
      { id: 2, brandName: "Spotify", rating: 4.5, comment: "Great collaboration. Very professional.", createdAt: "2023-11-15" },
    ],
  });
});

router.patch("/influencers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = UpdateInfluencerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { availability, coverUrl, avatarUrl, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (availability !== undefined) updateData.availability = availability;
  if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

  const [updated] = await db
    .update(influencersTable)
    .set(updateData)
    .where(eq(influencersTable.id, id))
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId)).limit(1);

  res.json({
    id: updated.id,
    userId: updated.userId,
    name: user?.name ?? "Unknown",
    bio: updated.bio,
    category: updated.category,
    country: updated.country,
    followers: updated.followers,
    engagementRate: updated.engagementRate,
    avgViews: updated.avgViews,
    collaborationCost: updated.collaborationCost,
    platforms: updated.platforms,
    languages: updated.languages,
    avatarUrl: updated.avatarUrl,
    coverUrl: updated.coverUrl,
    profileCompletion: updated.profileCompletion,
    monthlyEarnings: updated.monthlyEarnings,
    isVerified: updated.isVerified,
  });
});

export default router;
