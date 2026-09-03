import { Router, type IRouter } from "express";
import { db, brandsTable, campaignsTable } from "@workspace/db";
import { eq, count, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/brands", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ brand: brandsTable })
    .from(brandsTable);

  const brandList = await Promise.all(rows.map(async r => {
    const [{ total }] = await db.select({ total: count() }).from(campaignsTable).where(eq(campaignsTable.brandId, r.brand.id));
    const [{ active }] = await db.select({ active: count() }).from(campaignsTable).where(and(eq(campaignsTable.brandId, r.brand.id), eq(campaignsTable.status, "active")));
    return {
      id: r.brand.id,
      userId: r.brand.userId,
      name: r.brand.name,
      industry: r.brand.industry,
      country: r.brand.country,
      city: r.brand.city,
      monthlyBudget: r.brand.monthlyBudget || 50000,
      description: r.brand.description,
      logoUrl: r.brand.logoUrl,
      website: r.brand.website,
      categories: r.brand.categories || [],
      targetAudience: r.brand.targetAudience,
      campaignGoals: r.brand.campaignGoals || [],
      socialAccounts: r.brand.socialAccounts || [],
      totalCampaigns: Number(total),
      activeInfluencers: Number(active),
    };
  }));

  res.json(brandList);
});

router.get("/brands/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid brand ID" });
    return;
  }

  const [row] = await db.select().from(brandsTable).where(eq(brandsTable.id, id)).limit(1);
  if (!row) {
    res.status(404).json({ error: "Brand not found" });
    return;
  }

  const [{ total }] = await db.select({ total: count() }).from(campaignsTable).where(eq(campaignsTable.brandId, row.id));

  res.json({
    id: row.id,
    userId: row.userId,
    name: row.name,
    industry: row.industry,
    country: row.country,
    city: row.city,
    monthlyBudget: row.monthlyBudget || 50000,
    description: row.description,
    logoUrl: row.logoUrl,
    website: row.website,
    categories: row.categories || [],
    targetAudience: row.targetAudience,
    campaignGoals: row.campaignGoals || [],
    socialAccounts: row.socialAccounts || [],
    totalCampaigns: Number(total),
    activeInfluencers: 0,
  });
});

router.patch("/brands/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid brand ID" });
    return;
  }

  const {
    name,
    industry,
    country,
    city,
    monthlyBudget,
    description,
    logoUrl,
    website,
    categories,
    targetAudience,
    campaignGoals,
    socialAccounts,
  } = req.body || {};

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (industry !== undefined) updateData.industry = industry;
  if (country !== undefined) updateData.country = country;
  if (city !== undefined) updateData.city = city;
  if (monthlyBudget !== undefined) updateData.monthlyBudget = typeof monthlyBudget === "number" ? monthlyBudget : parseInt(monthlyBudget, 10) || 50000;
  if (description !== undefined) updateData.description = description;
  if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
  if (website !== undefined) updateData.website = website;
  if (categories !== undefined) updateData.categories = categories;
  if (targetAudience !== undefined) updateData.targetAudience = targetAudience;
  if (campaignGoals !== undefined) updateData.campaignGoals = campaignGoals;
  if (socialAccounts !== undefined) updateData.socialAccounts = socialAccounts;

  const [updated] = await db.update(brandsTable).set(updateData).where(eq(brandsTable.id, id)).returning();

  if (!updated) {
    res.status(404).json({ error: "Brand not found" });
    return;
  }

  res.json({
    id: updated.id,
    userId: updated.userId,
    name: updated.name,
    industry: updated.industry,
    country: updated.country,
    city: updated.city,
    monthlyBudget: updated.monthlyBudget || 50000,
    description: updated.description,
    logoUrl: updated.logoUrl,
    website: updated.website,
    categories: updated.categories || [],
    targetAudience: updated.targetAudience,
    campaignGoals: updated.campaignGoals || [],
    socialAccounts: updated.socialAccounts || [],
    totalCampaigns: 0,
    activeInfluencers: 0,
  });
});

export default router;
