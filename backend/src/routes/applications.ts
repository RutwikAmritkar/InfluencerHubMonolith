import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  applicationsTable,
  campaignsTable,
  influencersTable,
  brandsTable,
  user as userTable,
} from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { requireAuth, requireRole, AuthenticatedRequest } from "../middlewares/auth";
import { createDeal } from "../services/deal-creation.service";
import { sendNotification } from "../services/notification.service";
import { z } from "@workspace/api-zod";

const router: IRouter = Router();

const CreateApplicationInputSchema = z.object({
  campaignId: z.coerce.number(),
  message: z.string().optional(),
  pitchText: z.string().optional(),
  quotedRatePaise: z.coerce.number().optional(),
  quotedRate: z.coerce.number().optional(),
  proposedTimeline: z.string().optional(),
  portfolioSamples: z.array(z.string()).optional(),
});

const UpdateApplicationInputSchema = z.object({
  status: z.enum(["pending", "shortlisted", "accepted", "rejected", "declined", "withdrawn"]),
});

async function formatApplication(a: typeof applicationsTable.$inferSelect) {
  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, a.campaignId))
    .limit(1);
  const [brand] = campaign
    ? await db.select().from(brandsTable).where(eq(brandsTable.id, campaign.brandId)).limit(1)
    : [null];
  const [influencer] = await db
    .select()
    .from(influencersTable)
    .where(eq(influencersTable.id, a.influencerId))
    .limit(1);
  const [user] = influencer
    ? await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, String(influencer.userId)))
        .limit(1)
    : [null];

  return {
    id: a.id,
    campaignId: a.campaignId,
    campaignTitle: campaign?.title ?? null,
    campaignBudget: campaign?.budget ?? null,
    brandId: campaign?.brandId ?? null,
    brandName: brand?.name ?? null,
    brandLogoUrl: brand?.logoUrl ?? null,
    influencerId: a.influencerId,
    influencerName: user?.name ?? null,
    influencerAvatarUrl: influencer?.avatarUrl ?? user?.image ?? null,
    influencerCategory: influencer?.category ?? null,
    influencerFollowers: influencer?.followers ?? null,
    status: a.status,
    message: a.message,
    pitchText: a.pitchText ?? a.message ?? null,
    quotedRatePaise: a.quotedRatePaise ?? null,
    quotedRate: a.quotedRatePaise ? Math.round(a.quotedRatePaise / 100) : null,
    proposedTimeline: a.proposedTimeline ?? null,
    portfolioSamples: a.portfolioSamples ?? [],
    createdAt: a.createdAt.toISOString(),
  };
}

// ─── 1. PUBLIC / FILTERED APPLICATIONS LIST ──────────────────────────────────────────
router.get("/applications", async (req, res): Promise<void> => {
  const { campaignId, influencerId, status } = req.query as Record<string, string>;

  const conditions = [];
  if (campaignId) conditions.push(eq(applicationsTable.campaignId, parseInt(campaignId, 10)));
  if (influencerId) conditions.push(eq(applicationsTable.influencerId, parseInt(influencerId, 10)));
  if (status) conditions.push(eq(applicationsTable.status, status));

  const rows = await db
    .select()
    .from(applicationsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(applicationsTable.createdAt));

  res.json(await Promise.all(rows.map(formatApplication)));
});

// ─── 2. CREATOR'S OWN APPLICATIONS FEED ──────────────────────────────────────────────
router.get("/applications/my", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId || authReq.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [influencer] = await db
    .select()
    .from(influencersTable)
    .where(eq(influencersTable.userId, String(userId)))
    .limit(1);

  if (!influencer) {
    res.json([]);
    return;
  }

  const rows = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.influencerId, influencer.id))
    .orderBy(desc(applicationsTable.createdAt));

  res.json(await Promise.all(rows.map(formatApplication)));
});

// ─── 3. BRAND'S INCOMING APPLICATIONS FEED ──────────────────────────────────────────
router.get("/applications/brand", requireAuth, async (req, res): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId || authReq.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [brand] = await db
    .select()
    .from(brandsTable)
    .where(eq(brandsTable.userId, String(userId)))
    .limit(1);

  if (!brand) {
    res.json([]);
    return;
  }

  // Find all campaigns belonging to this brand
  const brandCampaigns = await db
    .select({ id: campaignsTable.id })
    .from(campaignsTable)
    .where(eq(campaignsTable.brandId, brand.id));

  const campaignIds = brandCampaigns.map((c) => c.id);
  if (campaignIds.length === 0) {
    res.json([]);
    return;
  }

  // Find all applications for these campaigns
  const rows = await db
    .select()
    .from(applicationsTable)
    .where(inArray(applicationsTable.campaignId, campaignIds))
    .orderBy(desc(applicationsTable.createdAt));

  res.json(await Promise.all(rows.map(formatApplication)));
});

// ─── 4. CREATOR SUBMIT APPLICATION / PITCH ───────────────────────────────────────────
router.post(
  "/applications",
  requireAuth,
  requireRole(["influencer"]),
  async (req, res): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId || authReq.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const parsed = CreateApplicationInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [influencer] = await db
      .select()
      .from(influencersTable)
      .where(eq(influencersTable.userId, String(userId)))
      .limit(1);

    if (!influencer) {
      res.status(403).json({ error: "Only influencers/creators can submit pitches" });
      return;
    }

    // Check if creator already applied to this campaign
    const [existing] = await db
      .select()
      .from(applicationsTable)
      .where(
        and(
          eq(applicationsTable.campaignId, parsed.data.campaignId),
          eq(applicationsTable.influencerId, influencer.id)
        )
      )
      .limit(1);

    if (existing) {
      res.status(409).json({
        error: "You have already pitched for this campaign brief.",
        existingApplicationId: existing.id,
      });
      return;
    }

    // Calculate quotedRatePaise: prefer quotedRatePaise, otherwise quotedRate in INR * 100
    let quotedPaise: number | null = null;
    if (parsed.data.quotedRatePaise != null) {
      quotedPaise = Math.round(parsed.data.quotedRatePaise);
    } else if (parsed.data.quotedRate != null) {
      quotedPaise = Math.round(parsed.data.quotedRate * 100);
    }

    const finalPitchText = parsed.data.pitchText || parsed.data.message || "";

    const [application] = await db
      .insert(applicationsTable)
      .values({
        campaignId: parsed.data.campaignId,
        influencerId: influencer.id,
        message: finalPitchText,
        pitchText: finalPitchText,
        quotedRatePaise: quotedPaise,
        proposedTimeline: parsed.data.proposedTimeline || null,
        portfolioSamples: parsed.data.portfolioSamples || [],
        status: "pending",
      })
      .returning();

    // Notify brand of incoming application
    try {
      const [campaign] = await db
        .select()
        .from(campaignsTable)
        .where(eq(campaignsTable.id, application.campaignId))
        .limit(1);

      if (campaign) {
        const [brand] = await db
          .select()
          .from(brandsTable)
          .where(eq(brandsTable.id, campaign.brandId))
          .limit(1);

        if (brand?.userId) {
          await sendNotification(
            brand.userId,
            "application_received",
            "New Creator Pitch Received",
            `A creator submitted a pitch for "${campaign.title}". Quoted rate: ${quotedPaise ? "₹" + (quotedPaise / 100).toLocaleString("en-IN") : "Undisclosed"}.`
          );
        }
      }
    } catch (notifErr) {
      console.error("[APPLICATION NOTIFICATION ERROR]", notifErr);
    }

    res.status(201).json(await formatApplication(application));
  }
);

// ─── 5. UPDATE APPLICATION STATUS (Shortlist / Accept / Reject / Withdraw) ──────────────
router.patch("/applications/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid application ID" });
    return;
  }

  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId || authReq.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = UpdateApplicationInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, id))
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, existing.campaignId))
    .limit(1);
  const [brand] = campaign
    ? await db.select().from(brandsTable).where(eq(brandsTable.id, campaign.brandId)).limit(1)
    : [null];
  const [influencer] = await db
    .select()
    .from(influencersTable)
    .where(eq(influencersTable.id, existing.influencerId))
    .limit(1);

  const isOwningBrand = brand && String(brand.userId) === String(userId);
  const isOwningCreator = influencer && String(influencer.userId) === String(userId);

  // IDOR & Authorization Enforcements
  if (parsed.data.status === "withdrawn") {
    if (!isOwningCreator) {
      res
        .status(403)
        .json({ error: "Forbidden: Only the owning creator can withdraw this application." });
      return;
    }
  } else {
    if (!isOwningBrand) {
      res.status(403).json({
        error:
          "Forbidden: Only the campaign brand owner can shortlist, accept, or decline applications.",
      });
      return;
    }
  }

  const [updated] = await db
    .update(applicationsTable)
    .set({ status: parsed.data.status })
    .where(eq(applicationsTable.id, id))
    .returning();

  // Notify creator of status update
  try {
    const [influencer] = await db
      .select()
      .from(influencersTable)
      .where(eq(influencersTable.id, existing.influencerId))
      .limit(1);

    const [campaign] = await db
      .select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, existing.campaignId))
      .limit(1);

    if (influencer?.userId && campaign) {
      const statusLabels: Record<string, string> = {
        shortlisted: "Shortlisted",
        accepted: "Accepted",
        rejected: "Declined",
        declined: "Declined",
      };
      const label = statusLabels[parsed.data.status] || parsed.data.status;
      await sendNotification(
        influencer.userId,
        "application_status_updated",
        `Pitch ${label}: ${campaign.title}`,
        `The brand updated your pitch status to "${label}".`
      );
    }
  } catch (notifErr) {
    console.error("[APPLICATION STATUS NOTIFICATION ERROR]", notifErr);
  }

  res.json(await formatApplication(updated));
});

// ─── 6. OPEN DEAL ROOM FROM APPLICATION ──────────────────────────────────────────────
router.post("/applications/:id/open-deal", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId || authReq.user?.id;

  const [application] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, id))
    .limit(1);
  if (!application) {
    res.status(404).json({ error: "Application not found." });
    return;
  }

  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, application.campaignId))
    .limit(1);
  if (!campaign) {
    res.status(404).json({ error: "Associated campaign not found." });
    return;
  }

  const [brand] = await db
    .select()
    .from(brandsTable)
    .where(eq(brandsTable.id, campaign.brandId))
    .limit(1);
  if (!brand || String(brand.userId) !== String(userId)) {
    res.status(403).json({ error: "Forbidden: Only the campaign owner can open a deal room." });
    return;
  }

  // Pre-fill deal terms using creator's quoted rate or campaign budget
  const initialPricePaise =
    application.quotedRatePaise || (campaign.budget ? campaign.budget * 100 : 100000);

  const deal = await createDeal({
    brandId: campaign.brandId,
    influencerId: application.influencerId,
    title: campaign.title,
    applicationId: application.id,
    campaignId: campaign.id,
    prefillTerms: {
      deliverables: [{ title: campaign.title || "Campaign Deliverable", count: 1 }],
      pricePaise: initialPricePaise,
    },
  });

  // Mark application as accepted upon opening deal room
  const [updatedApp] = await db
    .update(applicationsTable)
    .set({ status: "accepted" })
    .where(eq(applicationsTable.id, application.id))
    .returning();

  // Notify creator
  try {
    const [influencer] = await db
      .select()
      .from(influencersTable)
      .where(eq(influencersTable.id, application.influencerId))
      .limit(1);

    if (influencer?.userId) {
      await sendNotification(
        influencer.userId,
        "deal_room_opened",
        "Deal Room Opened!",
        `The brand accepted your pitch and opened a commercial Deal Room for "${campaign.title}". Review terms and sign off.`
      );
    }
  } catch (notifErr) {
    console.error("[DEAL OPEN NOTIFICATION ERROR]", notifErr);
  }

  res.json({
    application: await formatApplication(updatedApp),
    deal,
  });
});

export default router;
