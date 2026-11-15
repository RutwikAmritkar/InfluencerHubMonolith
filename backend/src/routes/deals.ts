import { Router, type IRouter, Request, Response } from "express";
import { db } from "@workspace/db";
import {
  dealsTable,
  dealParticipantsTable,
  dealTermsVersionsTable,
  dealApprovalsTable,
  dealActivityTable,
  brandsTable,
  influencersTable,
  user as userTable,
} from "@workspace/db";
import { eq, and, or, desc } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";
import { isDealRoomEnabled, createDeal } from "../services/deal-creation.service";
import {
  computeCanonicalTermsHash,
  getDealParticipant,
  proposeNewTermsVersion,
  confirmDealTerms,
} from "../services/deal-proposal.service";
import { sendNotification } from "../services/notification.service";

const router: IRouter = Router();

// Helper to notify counterparty on commercial events
async function notifyDealCounterparty({
  dealId,
  actorUserId,
  actorParty,
  type,
  title,
  body,
  badgeLabel,
}: {
  dealId: number;
  actorUserId: string;
  actorParty: "brand" | "creator";
  type: string;
  title: string;
  body: string;
  badgeLabel?: string;
}) {
  try {
    const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, dealId)).limit(1);
    if (!deal) return;

    let targetUserId: string | null = null;
    if (actorParty === "brand") {
      const [inf] = await db
        .select()
        .from(influencersTable)
        .where(eq(influencersTable.id, deal.influencerId))
        .limit(1);
      targetUserId = inf?.userId ? String(inf.userId) : null;
    } else {
      const [brand] = await db
        .select()
        .from(brandsTable)
        .where(eq(brandsTable.id, deal.brandId))
        .limit(1);
      targetUserId = brand?.userId ? String(brand.userId) : null;
    }

    if (targetUserId && targetUserId !== actorUserId) {
      await sendNotification(targetUserId, type, title, body, {
        dealId,
        badgeLabel: badgeLabel || "Commercial Deal Room",
      });
    }
  } catch (err) {
    console.error("[DEAL NOTIFICATION HELPER ERROR]", err);
  }
}

// Middleware to check feature flag
const checkDealRoomFeature = (_req: Request, res: Response, next: () => void) => {
  if (!isDealRoomEnabled()) {
    res.status(503).json({ error: "Deal Room feature is currently disabled." });
    return;
  }
  next();
};

// Pure derived overall status calculation
export function deriveOverallStatus(agreement: string, payment: string, execution: string): string {
  if (agreement === "DECLINED") return "DECLINED";
  if (agreement === "CANCELLED") return "CANCELLED";
  if (agreement === "EXPIRED") return "EXPIRED";
  if (agreement !== "CONFIRMED" && agreement !== "ACCEPTED") return agreement;

  if (payment === "DISPUTED") return "DISPUTED";
  if (execution === "COMPLETED" && (payment === "PAYOUT_RELEASED" || payment === "PAID_HELD"))
    return "COMPLETED";
  if (execution === "POST_VERIFIED" || execution === "FINAL_CONTENT_SUBMITTED")
    return "UNDER_REVIEW";
  if (execution === "DRAFTS_SUBMITTED" || execution === "REVISION_REQUESTED") return "IN_PROGRESS";
  if (payment === "PAID_HELD" || payment === "PAYMENT_PENDING") return "FUNDED";

  return "ACCEPTED";
}

// Helper to format complete deal room payload
async function formatDealDetail(deal: typeof dealsTable.$inferSelect) {
  const [brand] = await db
    .select()
    .from(brandsTable)
    .where(eq(brandsTable.id, deal.brandId))
    .limit(1);
  const [influencer] = await db
    .select()
    .from(influencersTable)
    .where(eq(influencersTable.id, deal.influencerId))
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

  const participants = await db
    .select()
    .from(dealParticipantsTable)
    .where(eq(dealParticipantsTable.dealId, deal.id));

  // Active proposal version
  let activeProposal: (typeof dealTermsVersionsTable.$inferSelect & { termsHash: string }) | null =
    null;

  if (deal.activeProposalId) {
    const [p] = await db
      .select()
      .from(dealTermsVersionsTable)
      .where(eq(dealTermsVersionsTable.id, deal.activeProposalId))
      .limit(1);
    if (p) {
      activeProposal = {
        ...p,
        termsHash: computeCanonicalTermsHash(p as any),
      };
    }
  }

  // Approvals for active proposal version
  const approvals = activeProposal
    ? await db
        .select()
        .from(dealApprovalsTable)
        .where(
          and(
            eq(dealApprovalsTable.dealId, deal.id),
            eq(dealApprovalsTable.proposalVersion, activeProposal.version)
          )
        )
    : [];

  const activityLogs = await db
    .select()
    .from(dealActivityTable)
    .where(eq(dealActivityTable.dealId, deal.id))
    .orderBy(desc(dealActivityTable.createdAt));

  const overallStatus = deriveOverallStatus(
    deal.agreementStatus,
    deal.paymentStatus,
    deal.executionStatus
  );

  return {
    id: deal.id,
    title: deal.title,
    brandId: deal.brandId,
    brandName: brand?.name || brandUser?.name || "Brand Partner",
    brandLogoUrl: brand?.logoUrl || brandUser?.image || null,
    influencerId: deal.influencerId,
    influencerName: creatorUser?.name || "Creator Partner",
    influencerAvatarUrl: influencer?.avatarUrl || creatorUser?.image || null,
    influencerCategory: influencer?.category || null,
    collaborationRequestId: deal.collaborationRequestId,
    applicationId: deal.applicationId,
    campaignId: deal.campaignId,
    conversationId: deal.conversationId,
    agreementStatus: deal.agreementStatus,
    paymentStatus: deal.paymentStatus,
    executionStatus: deal.executionStatus,
    overallStatus,
    confirmedAt: deal.confirmedAt ? deal.confirmedAt.toISOString() : null,
    createdAt: deal.createdAt.toISOString(),
    updatedAt: deal.updatedAt.toISOString(),
    participants,
    activeProposal,
    approvals,
    activityLogs: activityLogs.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}

// ─── 1. LIST DEALS FOR CURRENT USER ──────────────────────────────────────────
router.get(
  "/deals",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;

    // Find deals where user is a participant or owner
    const participantRows = await db
      .select({ dealId: dealParticipantsTable.dealId })
      .from(dealParticipantsTable)
      .where(eq(dealParticipantsTable.userId, userId));

    const dealIds = participantRows.map((r) => r.dealId);

    // Fallback check on brand/influencer profiles
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

    const conditions = [];
    if (dealIds.length > 0) {
      conditions.push(or(...dealIds.map((id) => eq(dealsTable.id, id))));
    }
    if (brand) {
      conditions.push(eq(dealsTable.brandId, brand.id));
    }
    if (influencer) {
      conditions.push(eq(dealsTable.influencerId, influencer.id));
    }

    if (conditions.length === 0) {
      res.json([]);
      return;
    }

    const deals = await db
      .select()
      .from(dealsTable)
      .where(or(...conditions))
      .orderBy(desc(dealsTable.updatedAt));

    // Deduplicate
    const uniqueDealsMap = new Map<number, typeof dealsTable.$inferSelect>();
    for (const d of deals) {
      uniqueDealsMap.set(d.id, d);
    }

    const formattedDeals = await Promise.all(
      Array.from(uniqueDealsMap.values()).map(formatDealDetail)
    );
    res.json(formattedDeals);
  }
);

// ─── 2. INITIATE NEW DEAL (BIDIRECTIONAL: BRAND OR CREATOR) ─────────────────
router.post(
  "/deals",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;

    // Look up if user has brand and/or influencer profiles
    const [userBrand] = await db
      .select()
      .from(brandsTable)
      .where(eq(brandsTable.userId, userId))
      .limit(1);
    const [userInfluencer] = await db
      .select()
      .from(influencersTable)
      .where(eq(influencersTable.userId, userId))
      .limit(1);

    const {
      brandId: reqBrandId,
      influencerId: reqInfluencerId,
      title,
      campaignId,
      collabType = "paid",
      deliverables = [],
      pricePaise,
      price,
      currency = "INR",
      barterDetails,
      timelines,
      paidAdsPermission = false,
      cancellationTerms,
      usageRightsDays = 30,
      exclusivityDays = 0,
      revisionCount = 1,
      notes,
      contentDeadline,
      postingDate,
    } = req.body;

    let brandId: number;
    let influencerId: number;
    let initiatorParty: "brand" | "creator";

    if (userBrand && !userInfluencer) {
      initiatorParty = "brand";
      brandId = userBrand.id;
      if (!reqInfluencerId) {
        res.status(400).json({ error: "influencerId is required when brand initiates a deal." });
        return;
      }
      influencerId = Number(reqInfluencerId);
    } else if (userInfluencer && !userBrand) {
      initiatorParty = "creator";
      influencerId = userInfluencer.id;
      if (!reqBrandId) {
        res.status(400).json({ error: "brandId is required when creator initiates a deal." });
        return;
      }
      brandId = Number(reqBrandId);
    } else if (userBrand && userInfluencer) {
      // Both profiles exist (e.g. testing) - respect explicit role or context
      if (reqBrandId && !reqInfluencerId) {
        initiatorParty = "creator";
        brandId = Number(reqBrandId);
        influencerId = userInfluencer.id;
      } else {
        initiatorParty = "brand";
        brandId = userBrand.id;
        influencerId = Number(reqInfluencerId);
      }
    } else {
      // Fallback based on user.role
      if (authReq.user?.role === "brand") {
        initiatorParty = "brand";
        const [brand] = await db
          .select()
          .from(brandsTable)
          .where(eq(brandsTable.userId, userId))
          .limit(1);
        if (!brand) {
          res.status(400).json({ error: "Brand profile required before proposing a deal." });
          return;
        }
        brandId = brand.id;
        influencerId = Number(reqInfluencerId);
      } else {
        initiatorParty = "creator";
        const [inf] = await db
          .select()
          .from(influencersTable)
          .where(eq(influencersTable.userId, userId))
          .limit(1);
        if (!inf) {
          res.status(400).json({ error: "Creator profile required before proposing a deal." });
          return;
        }
        influencerId = inf.id;
        brandId = Number(reqBrandId);
      }
    }

    // Calculate final price in paise
    let finalPricePaise = 0;
    if (collabType === "barter") {
      finalPricePaise = 0;
    } else if (pricePaise != null) {
      finalPricePaise = Number(pricePaise);
    } else if (price != null) {
      finalPricePaise = Math.round(Number(price) * 100);
    } else {
      finalPricePaise = 100000;
    }

    const dealTitle = title?.trim() || "Collaboration Agreement";

    try {
      const deal = await createDeal({
        brandId,
        influencerId,
        title: dealTitle,
        campaignId: campaignId ? Number(campaignId) : undefined,
        initiatorParty,
        initiatorUserId: userId,
        prefillTerms: {
          dealTitle,
          collabType,
          deliverables:
            deliverables.length > 0 ? deliverables : [{ title: "Sponsored Deliverable", count: 1 }],
          pricePaise: finalPricePaise,
          currency,
          barterDetails: barterDetails || null,
          timelines: timelines || null,
          paidAdsPermission: Boolean(paidAdsPermission),
          cancellationTerms: cancellationTerms || null,
          usageRightsDays: usageRightsDays != null ? Number(usageRightsDays) : 30,
          exclusivityDays: exclusivityDays != null ? Number(exclusivityDays) : 0,
          revisionCount: revisionCount != null ? Number(revisionCount) : 1,
          notes: notes || null,
          contentDeadline:
            contentDeadline ||
            (timelines?.contentSubmissionDate
              ? new Date(timelines.contentSubmissionDate)
              : undefined),
          postingDate:
            postingDate ||
            (timelines?.publishingDate ? new Date(timelines.publishingDate) : undefined),
        },
      });

      res.status(201).json(await formatDealDetail(deal as any));
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// ─── 3. GET SINGLE DEAL ROOM DETAILS (IDOR PROTECTED) ─────────────────────────
router.get(
  "/deals/:id",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid deal ID." });
      return;
    }

    const { deal, party } = await getDealParticipant(id, userId);

    if (!deal || !party) {
      res.status(403).json({ error: "Forbidden: You are not a participant in this Deal Room." });
      return;
    }

    res.json(await formatDealDetail(deal));
  }
);

// ─── 4. GET TERMS VERSION HISTORY FOR A DEAL ─────────────────────────────────
router.get(
  "/deals/:id/proposals",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);

    const { deal, party } = await getDealParticipant(id, userId);

    if (!deal || !party) {
      res.status(403).json({ error: "Forbidden: You are not a participant in this Deal Room." });
      return;
    }

    const proposals = await db
      .select()
      .from(dealTermsVersionsTable)
      .where(eq(dealTermsVersionsTable.dealId, id))
      .orderBy(desc(dealTermsVersionsTable.version));

    const formattedProposals = proposals.map((p) => ({
      ...p,
      termsHash: computeCanonicalTermsHash(p as any),
      createdAt: p.createdAt.toISOString(),
    }));

    res.json(formattedProposals);
  }
);

// ─── 5. PROPOSE NEW TERMS VERSION (OPTIMISTIC LOCKING PROTECTED) ──────────────
router.post(
  "/deals/:id/proposals",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);

    const { deal, party } = await getDealParticipant(id, userId);
    if (!deal || !party) {
      res.status(403).json({ error: "Forbidden: You are not a participant in this Deal Room." });
      return;
    }

    const {
      baseProposalId,
      baseVersion,
      dealTitle,
      collabType = "paid",
      deliverables,
      pricePaise,
      price,
      currency = "INR",
      barterDetails,
      timelines,
      paidAdsPermission = false,
      cancellationTerms,
      contentDeadline,
      postingDate,
      usageRightsDays = 30,
      exclusivityDays = 0,
      revisionCount = 1,
      notes,
    } = req.body;

    if (baseProposalId === undefined && baseVersion === undefined) {
      res
        .status(400)
        .json({ error: "baseProposalId (number) is required to counter-propose terms." });
      return;
    }

    if (!deliverables || !Array.isArray(deliverables) || deliverables.length === 0) {
      res.status(400).json({ error: "At least one deliverable is required." });
      return;
    }

    let finalPricePaise = 0;
    if (collabType === "barter") {
      finalPricePaise = 0;
    } else if (pricePaise != null) {
      finalPricePaise = Number(pricePaise);
    } else if (price != null) {
      finalPricePaise = Math.round(Number(price) * 100);
    } else {
      finalPricePaise = 100000;
    }

    try {
      const newProposal = await proposeNewTermsVersion(
        id,
        userId,
        {
          baseProposalId: baseProposalId != null ? Number(baseProposalId) : undefined,
          baseVersion: baseVersion != null ? Number(baseVersion) : undefined,
        },
        {
          dealTitle: dealTitle || deal.title,
          collabType,
          deliverables,
          pricePaise: finalPricePaise,
          currency,
          barterDetails: barterDetails || null,
          timelines: timelines || null,
          paidAdsPermission: Boolean(paidAdsPermission),
          cancellationTerms: cancellationTerms || null,
          contentDeadline:
            contentDeadline ||
            (timelines?.contentSubmissionDate
              ? new Date(timelines.contentSubmissionDate)
              : undefined),
          postingDate:
            postingDate ||
            (timelines?.publishingDate ? new Date(timelines.publishingDate) : undefined),
          usageRightsDays: usageRightsDays != null ? Number(usageRightsDays) : 30,
          exclusivityDays: exclusivityDays != null ? Number(exclusivityDays) : 0,
          revisionCount: revisionCount != null ? Number(revisionCount) : 1,
          notes: notes || null,
        }
      );

      const termsHash = computeCanonicalTermsHash(newProposal as any);

      notifyDealCounterparty({
        dealId: id,
        actorUserId: userId,
        actorParty: party,
        type: "deal_proposal_countered",
        title: `Counter-Proposal Received (v${newProposal.version}): ${dealTitle || deal.title}`,
        body: `${party === "brand" ? "The brand" : "The creator"} has submitted revised terms (Version ${newProposal.version}) for your review.`,
        badgeLabel: "Negotiation Room",
      });

      res.status(201).json({
        ...newProposal,
        termsHash,
        createdAt: newProposal.createdAt.toISOString(),
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ error: err.message, activeProposalId: err.activeProposalId });
    }
  }
);

// ─── 6. CONFIRM ACTIVE PROPOSAL VERSION (BILATERAL ACCEPTANCE) ───────────────
router.post(
  "/deals/:id/confirm",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);

    const { deal, party } = await getDealParticipant(id, userId);
    if (!deal || !party) {
      res.status(403).json({ error: "Forbidden: You are not a participant in this Deal Room." });
      return;
    }

    const { proposalVersion } = req.body;

    if (proposalVersion === undefined || typeof proposalVersion !== "number") {
      res.status(400).json({ error: "proposalVersion (number) is required for confirmation." });
      return;
    }

    // Multi-tenant check: Author cannot accept their own proposal (must be signed by counterparty)
    const [targetProposal] = await db
      .select()
      .from(dealTermsVersionsTable)
      .where(
        and(
          eq(dealTermsVersionsTable.dealId, id),
          eq(dealTermsVersionsTable.version, proposalVersion)
        )
      )
      .limit(1);

    if (
      targetProposal &&
      (targetProposal.proposedByUserId === userId || targetProposal.proposedByParty === party)
    ) {
      res.status(400).json({
        error:
          "CANNOT_ACCEPT_OWN_PROPOSAL: You authored this version. Counterparty acceptance is required.",
      });
      return;
    }

    try {
      const result = await confirmDealTerms(id, proposalVersion, userId, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      notifyDealCounterparty({
        dealId: id,
        actorUserId: userId,
        actorParty: party,
        type: "deal_accepted",
        title: `Terms Confirmed & Signed: ${deal.title}`,
        body: `Version ${proposalVersion} has been accepted and signed by ${party === "brand" ? "the brand" : "the creator"}.`,
        badgeLabel: "Terms Executed",
      });

      res.json(result);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ error: err.message });
    }
  }
);

// ─── 6B. ALIAS: POST /deals/:id/accept ─────────────────────────────────────────
router.post(
  "/deals/:id/accept",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);

    const { deal, party } = await getDealParticipant(id, userId);
    if (!deal || !party) {
      res.status(403).json({ error: "Forbidden: You are not a participant in this Deal Room." });
      return;
    }

    let proposalVersion = req.body.proposalVersion;
    if (!proposalVersion && deal.activeProposalId) {
      const [active] = await db
        .select()
        .from(dealTermsVersionsTable)
        .where(eq(dealTermsVersionsTable.id, deal.activeProposalId))
        .limit(1);
      proposalVersion = active?.version;
    }

    if (proposalVersion === undefined) {
      res.status(400).json({ error: "No active proposal version to accept." });
      return;
    }

    const [targetProposal] = await db
      .select()
      .from(dealTermsVersionsTable)
      .where(
        and(
          eq(dealTermsVersionsTable.dealId, id),
          eq(dealTermsVersionsTable.version, proposalVersion)
        )
      )
      .limit(1);

    if (
      targetProposal &&
      (targetProposal.proposedByUserId === userId || targetProposal.proposedByParty === party)
    ) {
      res.status(400).json({
        error:
          "CANNOT_ACCEPT_OWN_PROPOSAL: You authored this version. Counterparty acceptance is required.",
      });
      return;
    }

    try {
      const result = await confirmDealTerms(id, proposalVersion, userId, {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      notifyDealCounterparty({
        dealId: id,
        actorUserId: userId,
        actorParty: party,
        type: "deal_accepted",
        title: `Terms Confirmed & Signed: ${deal.title}`,
        body: `Version ${proposalVersion} has been accepted and signed by ${party === "brand" ? "the brand" : "the creator"}.`,
        badgeLabel: "Terms Executed",
      });

      res.json(result);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ error: err.message });
    }
  }
);

// ─── 6C. POST /deals/:id/reject ───────────────────────────────────────────────
router.post(
  "/deals/:id/reject",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);

    const { deal, party } = await getDealParticipant(id, userId);
    if (!deal || !party) {
      res.status(403).json({ error: "Forbidden: You are not a participant in this Deal Room." });
      return;
    }

    const { reason } = req.body;

    const [updated] = await db
      .update(dealsTable)
      .set({
        agreementStatus: "DECLINED",
        updatedAt: new Date(),
      })
      .where(eq(dealsTable.id, id))
      .returning();

    await db.insert(dealActivityTable).values({
      dealId: id,
      actorId: userId,
      actorParty: party,
      action: "PROPOSAL_REJECTED",
      description: `Proposal terms rejected by ${party === "brand" ? "Brand" : "Creator"}.`,
      metadata: { reason: reason || null },
    });

    res.json(await formatDealDetail(updated));
  }
);

// ─── 7. CANCEL DEAL PRIOR TO MUTUAL CONFIRMATION ────────────────────────────
router.post(
  "/deals/:id/cancel",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);
    const { reason } = req.body;

    const { deal, party } = await getDealParticipant(id, userId);

    if (!deal || !party) {
      res.status(403).json({ error: "Forbidden: You are not a participant in this Deal Room." });
      return;
    }

    if (deal.agreementStatus === "CONFIRMED" || deal.agreementStatus === "ACCEPTED") {
      res.status(400).json({ error: "Cannot cancel an accepted deal." });
      return;
    }

    const [updated] = await db
      .update(dealsTable)
      .set({
        agreementStatus: "CANCELLED",
        updatedAt: new Date(),
      })
      .where(eq(dealsTable.id, id))
      .returning();

    await db.insert(dealActivityTable).values({
      dealId: id,
      actorId: userId,
      actorParty: party,
      action: "DEAL_CANCELLED",
      description: `Deal cancelled by ${party === "brand" ? "Brand" : "Creator"}.`,
      metadata: { reason: reason || null },
    });

    res.json(await formatDealDetail(updated));
  }
);

// ─── 8. SUBMISSIONS: CREATOR SUBMIT DELIVERABLE PACKAGE ───────────────────────
router.post(
  "/deals/:id/submissions",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);

    const { deal, party } = await getDealParticipant(id, userId);
    if (!deal || !party) {
      res.status(403).json({ error: "Forbidden: You are not a participant in this Deal Room." });
      return;
    }

    // Only Creator can submit deliverable packages
    if (party !== "creator") {
      res
        .status(403)
        .json({ error: "Forbidden: Only the Creator can submit deliverable packages." });
      return;
    }

    const { round = 1, contentUrls = [], notes, deliverableId } = req.body;

    const [updated] = await db
      .update(dealsTable)
      .set({
        executionStatus: "FINAL_CONTENT_SUBMITTED",
        updatedAt: new Date(),
      })
      .where(eq(dealsTable.id, id))
      .returning();

    await db.insert(dealActivityTable).values({
      dealId: id,
      actorId: userId,
      actorParty: "creator",
      action: "CONTENT_PACKAGE_SUBMITTED",
      description: `Creator submitted deliverable package (Round ${round}) for review.`,
      metadata: { round, contentUrls, notes: notes || null, deliverableId: deliverableId || null },
    });

    notifyDealCounterparty({
      dealId: id,
      actorUserId: userId,
      actorParty: "creator",
      type: "deal_content_submitted",
      title: `Deliverables Submitted: ${deal.title}`,
      body: `Creator submitted deliverable package (Round ${round}) for your review and approval.`,
      badgeLabel: "Review Deliverables",
    });

    res.json({
      success: true,
      executionStatus: "FINAL_CONTENT_SUBMITTED",
      deal: await formatDealDetail(updated),
    });
  }
);

// ─── 9. REVIEW: BRAND APPROVE OR REQUEST REVISION ─────────────────────────────
router.post(
  "/deals/:id/review",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);

    const { deal, party } = await getDealParticipant(id, userId);
    if (!deal || !party) {
      res.status(403).json({ error: "Forbidden: You are not a participant in this Deal Room." });
      return;
    }

    // Only Brand can review deliverable packages
    if (party !== "brand") {
      res.status(403).json({
        error: "Forbidden: Only the Brand can approve or request revisions on deliverables.",
      });
      return;
    }

    const { action, revisionNotes } = req.body;

    if (action === "approve") {
      const [updated] = await db
        .update(dealsTable)
        .set({
          executionStatus: "COMPLETED",
          updatedAt: new Date(),
        })
        .where(eq(dealsTable.id, id))
        .returning();

      await db.insert(dealActivityTable).values({
        dealId: id,
        actorId: userId,
        actorParty: "brand",
        action: "CONTENT_APPROVED",
        description: "Brand approved deliverable package. Execution completed.",
        metadata: { approvedAt: new Date().toISOString() },
      });

      notifyDealCounterparty({
        dealId: id,
        actorUserId: userId,
        actorParty: "brand",
        type: "deal_content_approved",
        title: `Deliverables Approved: ${deal.title}`,
        body: "Brand approved your deliverable package. Execution completed and milestone payout is authorized.",
        badgeLabel: "Content Approved",
      });

      res.json({
        success: true,
        executionStatus: "COMPLETED",
        deal: await formatDealDetail(updated),
      });
    } else if (action === "request_revision") {
      const [updated] = await db
        .update(dealsTable)
        .set({
          executionStatus: "REVISION_REQUESTED",
          updatedAt: new Date(),
        })
        .where(eq(dealsTable.id, id))
        .returning();

      await db.insert(dealActivityTable).values({
        dealId: id,
        actorId: userId,
        actorParty: "brand",
        action: "REVISION_REQUESTED",
        description: `Brand requested revision: ${revisionNotes || "Changes requested"}`,
        metadata: { revisionNotes: revisionNotes || null },
      });

      notifyDealCounterparty({
        dealId: id,
        actorUserId: userId,
        actorParty: "brand",
        type: "deal_revision_requested",
        title: `Revision Requested: ${deal.title}`,
        body: revisionNotes || "Brand requested adjustments on your deliverable package.",
        badgeLabel: "Revision Needed",
      });

      res.json({
        success: true,
        executionStatus: "REVISION_REQUESTED",
        deal: await formatDealDetail(updated),
      });
    } else {
      res
        .status(400)
        .json({ error: "Invalid review action. Must be 'approve' or 'request_revision'." });
    }
  }
);

// ─── 10. BARTER DISPATCH: BRAND MARKS PRODUCT DISPATCHED ─────────────────────
router.post(
  "/deals/:id/barter-dispatch",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);

    const { deal, party } = await getDealParticipant(id, userId);
    if (!deal || !party) {
      res.status(403).json({ error: "Forbidden: You are not a participant in this Deal Room." });
      return;
    }

    if (party !== "brand") {
      res.status(403).json({ error: "Forbidden: Only the Brand can dispatch barter products." });
      return;
    }

    const { trackingNumber, courier, estimatedArrivalDate } = req.body;

    await db.insert(dealActivityTable).values({
      dealId: id,
      actorId: userId,
      actorParty: "brand",
      action: "BARTER_PRODUCT_SHIPPED",
      description: `Brand dispatched barter package via ${courier || "courier"}. Tracking: ${trackingNumber || "Pending"}`,
      metadata: { trackingNumber, courier, estimatedArrivalDate },
    });

    res.json({
      success: true,
      message: "Barter product shipment recorded.",
      deal: await formatDealDetail(deal),
    });
  }
);

// ─── 11. RECORD PAYMENT SETTLEMENT FOR DEAL ──────────────────────────────────
router.post(
  "/deals/:id/payments",
  checkDealRoomFeature,
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(rawId, 10);

    const { deal, party } = await getDealParticipant(id, userId);
    if (!deal || !party) {
      res.status(403).json({ error: "Forbidden: You are not a participant in this Deal Room." });
      return;
    }

    if (party !== "brand") {
      res.status(403).json({ error: "Forbidden: Only the Brand can confirm/release payment." });
      return;
    }

    const { status = "PAYOUT_RELEASED", utrReference } = req.body;

    const [updated] = await db
      .update(dealsTable)
      .set({
        paymentStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(dealsTable.id, id))
      .returning();

    await db.insert(dealActivityTable).values({
      dealId: id,
      actorId: userId,
      actorParty: "brand",
      action: status,
      description: `Payment status updated to ${status}. UTR: ${utrReference || "Direct UPI"}`,
      metadata: { status, utrReference: utrReference || null },
    });

    notifyDealCounterparty({
      dealId: id,
      actorUserId: userId,
      actorParty: "brand",
      type: "deal_payment_released",
      title: `Milestone Payout Settled & Released: ${deal.title}`,
      body: `Brand released payment settlement (${status}). Reference: ${utrReference || "Direct UPI"}`,
      badgeLabel: "Payout Released",
    });

    res.json({
      success: true,
      paymentStatus: status,
      deal: await formatDealDetail(updated),
    });
  }
);

export default router;
