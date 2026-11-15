import { Router, type IRouter, Request, Response } from "express";
import { db } from "@workspace/db";
import {
  collaborationRequestsTable,
  brandsTable,
  influencersTable,
  user as userTable,
} from "@workspace/db";
import { eq, and, or, gte, desc } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";
import { createDeal, isDealRoomEnabled } from "../services/deal-creation.service";

const router: IRouter = Router();

// Middleware to check feature flag
const checkDealRoomFeature = (_req: Request, res: Response, next: () => void) => {
  if (!isDealRoomEnabled()) {
    res.status(503).json({ error: "Deal Room feature is currently disabled." });
    return;
  }
  next();
};

async function getProfilesForUser(userId: string) {
  const [brand] = await db
    .select()
    .from(brandsTable)
    .where(eq(brandsTable.userId, userId))
    .limit(1);
  const [influencer] = await db
    .select()
    .from(influencersTable)
    .where(eq(influencersTable.userId, userId))
    .limit(1);
  return { brand, influencer };
}

// Format collaboration request for client response
async function formatCollabRequest(req: typeof collaborationRequestsTable.$inferSelect) {
  const [brand] = await db
    .select()
    .from(brandsTable)
    .where(eq(brandsTable.id, req.brandId))
    .limit(1);
  const [influencer] = await db
    .select()
    .from(influencersTable)
    .where(eq(influencersTable.id, req.influencerId))
    .limit(1);
  const [brandUser] = brand
    ? await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, String(brand.userId)))
        .limit(1)
    : [null];
  const [creatorUser] = influencer
    ? await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, String(influencer.userId)))
        .limit(1)
    : [null];

  return {
    id: req.id,
    brandId: req.brandId,
    brandName: brand?.name || brandUser?.name || "Brand",
    brandLogoUrl: brand?.logoUrl || brandUser?.image || null,
    influencerId: req.influencerId,
    influencerName: creatorUser?.name || "Creator",
    influencerAvatarUrl: influencer?.avatarUrl || creatorUser?.image || null,
    status: req.status,
    title: req.title,
    description: req.description,
    deliverables: req.deliverables,
    budgetMinPaise: req.budgetMinPaise,
    budgetMaxPaise: req.budgetMaxPaise,
    currency: req.currency,
    proposedTimeline: req.proposedTimeline,
    message: req.message,
    declineReason: req.declineReason,
    createdAt: req.createdAt.toISOString(),
    updatedAt: req.updatedAt.toISOString(),
  };
}

// 1. Create Collaboration Request (Direct Invitation)
router.post(
  "/collaboration-requests",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const { brand } = await getProfilesForUser(userId);

    if (!brand) {
      res
        .status(403)
        .json({ error: "Only registered brand profiles can create collaboration requests." });
      return;
    }

    const {
      influencerId,
      title,
      description,
      deliverables,
      budgetMinPaise,
      budgetMaxPaise,
      proposedTimeline,
      message,
    } = req.body;

    // Input Validation
    if (!influencerId || typeof influencerId !== "number") {
      res.status(400).json({ error: "Valid numeric influencerId is required." });
      return;
    }
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      res.status(400).json({ error: "Title is required." });
      return;
    }
    if (!description || typeof description !== "string") {
      res.status(400).json({ error: "Description is required." });
      return;
    }
    if (!deliverables || !Array.isArray(deliverables) || deliverables.length === 0) {
      res.status(400).json({ error: "At least one deliverable item is required." });
      return;
    }

    // Creator Existence & Eligibility Check
    const [influencer] = await db
      .select()
      .from(influencersTable)
      .where(eq(influencersTable.id, influencerId))
      .limit(1);
    if (!influencer) {
      res.status(404).json({ error: "Creator profile not found." });
      return;
    }

    // Rate Limiting: Max 10 requests per hour per brand
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await db
      .select()
      .from(collaborationRequestsTable)
      .where(
        and(
          eq(collaborationRequestsTable.brandId, brand.id),
          gte(collaborationRequestsTable.createdAt, oneHourAgo)
        )
      );

    if (recentRequests.length >= 10) {
      res
        .status(429)
        .json({ error: "Rate limit exceeded. Maximum 10 collaboration requests per hour." });
      return;
    }

    // 14-day Decline Cooldown Check on Direct Requests
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentDeclined = await db
      .select()
      .from(collaborationRequestsTable)
      .where(
        and(
          eq(collaborationRequestsTable.brandId, brand.id),
          eq(collaborationRequestsTable.influencerId, influencerId),
          eq(collaborationRequestsTable.status, "declined"),
          gte(collaborationRequestsTable.updatedAt, fourteenDaysAgo)
        )
      );

    if (recentDeclined.length > 0) {
      res.status(422).json({
        error:
          "You must wait 14 days after a declined request before sending another direct invitation to this creator.",
      });
      return;
    }

    // One Open Request per Pair Rule
    const openRequests = await db
      .select()
      .from(collaborationRequestsTable)
      .where(
        and(
          eq(collaborationRequestsTable.brandId, brand.id),
          eq(collaborationRequestsTable.influencerId, influencerId),
          eq(collaborationRequestsTable.status, "pending")
        )
      );

    if (openRequests.length > 0) {
      res.status(400).json({
        error: "An open collaboration request already exists between this brand and creator.",
      });
      return;
    }

    const [newRequest] = await db
      .insert(collaborationRequestsTable)
      .values({
        brandId: brand.id,
        influencerId,
        status: "pending",
        title: title.trim(),
        description: description.trim(),
        deliverables,
        budgetMinPaise: budgetMinPaise ?? null,
        budgetMaxPaise: budgetMaxPaise ?? null,
        currency: "INR",
        proposedTimeline: proposedTimeline || null,
        message: message || null,
      })
      .returning();

    res.status(201).json(await formatCollabRequest(newRequest));
  }
);

// 2. List Collaboration Requests for Current User
router.get(
  "/collaboration-requests",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const { brand, influencer } = await getProfilesForUser(userId);
    const { status } = req.query as { status?: string };

    const conditions = [];
    if (brand && influencer) {
      conditions.push(
        or(
          eq(collaborationRequestsTable.brandId, brand.id),
          eq(collaborationRequestsTable.influencerId, influencer.id)
        )
      );
    } else if (brand) {
      conditions.push(eq(collaborationRequestsTable.brandId, brand.id));
    } else if (influencer) {
      conditions.push(eq(collaborationRequestsTable.influencerId, influencer.id));
    } else {
      res.json([]);
      return;
    }

    if (status) {
      conditions.push(eq(collaborationRequestsTable.status, status));
    }

    const requests = await db
      .select()
      .from(collaborationRequestsTable)
      .where(and(...conditions))
      .orderBy(desc(collaborationRequestsTable.createdAt));

    res.json(await Promise.all(requests.map(formatCollabRequest)));
  }
);

// 3. Get Single Collaboration Request (with Participant Check)
router.get(
  "/collaboration-requests/:id",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid request ID." });
      return;
    }

    const [collabReq] = await db
      .select()
      .from(collaborationRequestsTable)
      .where(eq(collaborationRequestsTable.id, id))
      .limit(1);
    if (!collabReq) {
      res.status(404).json({ error: "Collaboration request not found." });
      return;
    }

    const { brand, influencer } = await getProfilesForUser(userId);
    const isParticipant =
      (brand && brand.id === collabReq.brandId) ||
      (influencer && influencer.id === collabReq.influencerId);

    if (!isParticipant) {
      res
        .status(403)
        .json({ error: "Forbidden: You are not a participant in this collaboration request." });
      return;
    }

    res.json(await formatCollabRequest(collabReq));
  }
);

// 4. Withdraw Collaboration Request (Brand Only)
router.post(
  "/collaboration-requests/:id/withdraw",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);

    const [collabReq] = await db
      .select()
      .from(collaborationRequestsTable)
      .where(eq(collaborationRequestsTable.id, id))
      .limit(1);
    if (!collabReq) {
      res.status(404).json({ error: "Collaboration request not found." });
      return;
    }

    const { brand } = await getProfilesForUser(userId);
    if (!brand || brand.id !== collabReq.brandId) {
      res
        .status(403)
        .json({ error: "Forbidden: Only the issuing brand can withdraw this request." });
      return;
    }

    if (collabReq.status !== "pending") {
      res.status(400).json({ error: "Only pending requests can be withdrawn." });
      return;
    }

    const [updated] = await db
      .update(collaborationRequestsTable)
      .set({ status: "withdrawn", updatedAt: new Date() })
      .where(eq(collaborationRequestsTable.id, id))
      .returning();

    res.json(await formatCollabRequest(updated));
  }
);

// 5. Accept Collaboration Request (Creator Only -> Triggers createDeal)
router.post(
  "/collaboration-requests/:id/accept",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);

    const [collabReq] = await db
      .select()
      .from(collaborationRequestsTable)
      .where(eq(collaborationRequestsTable.id, id))
      .limit(1);
    if (!collabReq) {
      res.status(404).json({ error: "Collaboration request not found." });
      return;
    }

    const { influencer } = await getProfilesForUser(userId);
    if (!influencer || influencer.id !== collabReq.influencerId) {
      res
        .status(403)
        .json({ error: "Forbidden: Only the target creator can accept this request." });
      return;
    }

    // Atomic state change with transaction
    const updatedReqs = await db
      .update(collaborationRequestsTable)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(
        and(eq(collaborationRequestsTable.id, id), eq(collaborationRequestsTable.status, "pending"))
      )
      .returning();

    if (updatedReqs.length === 0) {
      // Check if deal already exists due to parallel accept
      const deal = await createDeal({
        brandId: collabReq.brandId,
        influencerId: collabReq.influencerId,
        title: collabReq.title,
        collaborationRequestId: collabReq.id,
      });
      res.json({
        request: await formatCollabRequest(collabReq),
        deal,
      });
      return;
    }

    const acceptedReq = updatedReqs[0];

    // Call shared createDeal()
    const deal = await createDeal({
      brandId: acceptedReq.brandId,
      influencerId: acceptedReq.influencerId,
      title: acceptedReq.title,
      collaborationRequestId: acceptedReq.id,
      prefillTerms: {
        deliverables: acceptedReq.deliverables,
        pricePaise: acceptedReq.budgetMaxPaise || acceptedReq.budgetMinPaise || 100000,
        currency: acceptedReq.currency,
        notes: acceptedReq.message || undefined,
      },
    });

    res.json({
      request: await formatCollabRequest(acceptedReq),
      deal,
    });
  }
);

// 6. Decline Collaboration Request (Creator Only)
router.post(
  "/collaboration-requests/:id/decline",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    const { declineReason } = req.body;

    const [collabReq] = await db
      .select()
      .from(collaborationRequestsTable)
      .where(eq(collaborationRequestsTable.id, id))
      .limit(1);
    if (!collabReq) {
      res.status(404).json({ error: "Collaboration request not found." });
      return;
    }

    const { influencer } = await getProfilesForUser(userId);
    if (!influencer || influencer.id !== collabReq.influencerId) {
      res
        .status(403)
        .json({ error: "Forbidden: Only the target creator can decline this request." });
      return;
    }

    if (collabReq.status !== "pending") {
      res.status(400).json({ error: "Only pending requests can be declined." });
      return;
    }

    const [updated] = await db
      .update(collaborationRequestsTable)
      .set({
        status: "declined",
        declineReason: declineReason || null,
        updatedAt: new Date(),
      })
      .where(eq(collaborationRequestsTable.id, id))
      .returning();

    res.json(await formatCollabRequest(updated));
  }
);

export default router;
