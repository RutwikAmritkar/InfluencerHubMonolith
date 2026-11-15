import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  dealsTable,
  dealTermsVersionsTable,
  dealParticipantsTable,
  brandsTable,
  influencersTable,
  user as userTable,
} from "@workspace/db";
import { eq, or, inArray, desc } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

// ─── 1. LIST PAYMENTS & ESCROW MILESTONES ────────────────────────────────────
router.get("/payments", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId || authReq.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [currentUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, String(userId)))
      .limit(1);

    const [brand] = await db
      .select()
      .from(brandsTable)
      .where(eq(brandsTable.userId, String(userId)))
      .limit(1);

    const [influencer] = await db
      .select()
      .from(influencersTable)
      .where(eq(influencersTable.userId, String(userId)))
      .limit(1);

    const isBrand =
      currentUser?.role === "brand" ||
      (!!brand && currentUser?.role !== "influencer" && currentUser?.role !== "creator");

    // Find deal IDs by participant
    const participantRows = await db
      .select({ dealId: dealParticipantsTable.dealId })
      .from(dealParticipantsTable)
      .where(eq(dealParticipantsTable.userId, String(userId)));
    const participantDealIds = participantRows.map((r) => r.dealId);

    const conditions = [];
    if (participantDealIds.length > 0) {
      conditions.push(inArray(dealsTable.id, participantDealIds));
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

    const records = await Promise.all(
      deals.map(async (d) => {
        const [b] = await db
          .select()
          .from(brandsTable)
          .where(eq(brandsTable.id, d.brandId))
          .limit(1);
        const [inf] = await db
          .select()
          .from(influencersTable)
          .where(eq(influencersTable.id, d.influencerId))
          .limit(1);
        const [bUser] = b
          ? await db
              .select()
              .from(userTable)
              .where(eq(userTable.id, String(b.userId)))
              .limit(1)
          : [null];
        const [infUser] = inf
          ? await db
              .select()
              .from(userTable)
              .where(eq(userTable.id, String(inf.userId)))
              .limit(1)
          : [null];

        let proposal: typeof dealTermsVersionsTable.$inferSelect | null = null;
        if (d.activeProposalId) {
          const [p] = await db
            .select()
            .from(dealTermsVersionsTable)
            .where(eq(dealTermsVersionsTable.id, d.activeProposalId))
            .limit(1);
          proposal = p || null;
        }

        const pricePaise = proposal?.pricePaise ?? 0;

        return {
          id: d.id,
          dealId: d.id,
          title: d.title,
          brandId: d.brandId,
          brandName: b?.name || bUser?.name || "Brand Partner",
          brandLogoUrl: b?.logoUrl || bUser?.image || null,
          influencerId: d.influencerId,
          influencerName: infUser?.name || "Creator Partner",
          influencerAvatarUrl: inf?.avatarUrl || infUser?.image || null,
          pricePaise,
          amountPaise: pricePaise,
          amountRupees: Math.round(pricePaise / 100),
          currency: proposal?.currency || "INR",
          deliverables: proposal?.deliverables || [],
          agreementStatus: d.agreementStatus,
          paymentStatus: d.paymentStatus,
          executionStatus: d.executionStatus,
          confirmedAt: d.confirmedAt ? d.confirmedAt.toISOString() : null,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        };
      })
    );

    res.json(records);
  } catch (error: any) {
    console.error("[GET /api/payments] Error:", error);
    res.status(500).json({ error: "Failed to fetch payments ledger." });
  }
});

// ─── 2. PAYMENTS SUMMARY OVERVIEW ────────────────────────────────────────────
router.get(
  "/payments/overview",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId || authReq.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const [brand] = await db
        .select()
        .from(brandsTable)
        .where(eq(brandsTable.userId, String(userId)))
        .limit(1);
      const [influencer] = await db
        .select()
        .from(influencersTable)
        .where(eq(influencersTable.userId, String(userId)))
        .limit(1);

      const conditions = [];
      if (brand) conditions.push(eq(dealsTable.brandId, brand.id));
      if (influencer) conditions.push(eq(dealsTable.influencerId, influencer.id));

      if (conditions.length === 0) {
        res.json({ totalCommittedPaise: 0, activeSecuredPaise: 0, releasedSettledPaise: 0 });
        return;
      }

      const deals = await db
        .select()
        .from(dealsTable)
        .where(or(...conditions));

      let totalCommittedPaise = 0;
      let activeSecuredPaise = 0;
      let releasedSettledPaise = 0;

      for (const d of deals) {
        if (d.activeProposalId) {
          const [p] = await db
            .select()
            .from(dealTermsVersionsTable)
            .where(eq(dealTermsVersionsTable.id, d.activeProposalId))
            .limit(1);
          const price = p?.pricePaise ?? 0;
          totalCommittedPaise += price;

          if (
            d.paymentStatus === "PAYOUT_RELEASED" ||
            d.paymentStatus === "RELEASED" ||
            d.executionStatus === "COMPLETED"
          ) {
            releasedSettledPaise += price;
          } else if (
            d.paymentStatus === "PAID_HELD" ||
            d.paymentStatus === "HELD_IN_ESCROW" ||
            d.agreementStatus === "ACCEPTED" ||
            d.agreementStatus === "CONFIRMED"
          ) {
            activeSecuredPaise += price;
          }
        }
      }

      res.json({
        totalCommittedPaise,
        activeSecuredPaise,
        releasedSettledPaise,
        totalCommittedRupees: Math.round(totalCommittedPaise / 100),
        activeSecuredRupees: Math.round(activeSecuredPaise / 100),
        releasedSettledRupees: Math.round(releasedSettledPaise / 100),
      });
    } catch (error: any) {
      console.error("[GET /api/payments/overview] Error:", error);
      res.status(500).json({ error: "Failed to fetch payment overview." });
    }
  }
);

export default router;
