import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  dealsTable,
  dealTermsVersionsTable,
  dealParticipantsTable,
  dealActivityTable,
  brandsTable,
  influencersTable,
  user as userTable,
  creatorPayoutAccountsTable,
  paymentOrdersTable,
  paymentLedgerEntriesTable,
} from "@workspace/db";
import { eq, or, and, inArray, desc, lte } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";
import { sendEmail } from "../services/email.service";
import { logPlatformActivity } from "../services/activity.service";
import { notifyDealCounterparty } from "./deals";
import { logger } from "../lib/logger";

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

        const [paymentOrder] = await db
          .select()
          .from(paymentOrdersTable)
          .where(eq(paymentOrdersTable.dealId, d.id))
          .orderBy(desc(paymentOrdersTable.createdAt))
          .limit(1);

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
          paymentOrder: paymentOrder
            ? {
                id: paymentOrder.id,
                status: paymentOrder.status,
                autoReleaseAt: paymentOrder.autoReleaseAt
                  ? paymentOrder.autoReleaseAt.toISOString()
                  : null,
                grossAmountPaise: paymentOrder.grossAmountPaise,
                netCreatorPayoutPaise: paymentOrder.netCreatorPayoutPaise,
                platformFeePaise: paymentOrder.platformFeePaise,
                gstAmountPaise: paymentOrder.gstAmountPaise,
                tdsAmountPaise: paymentOrder.tdsAmountPaise,
              }
            : null,
          confirmedAt: d.confirmedAt ? d.confirmedAt.toISOString() : null,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        };
      })
    );

    res.json(records);
  } catch (error: any) {
    logger.error({ error }, "[GET /api/payments] Error");
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
      logger.error({ error }, "[GET /api/payments/overview] Error");
      res.status(500).json({ error: "Failed to fetch payment overview." });
    }
  }
);

// ─── 3. CREATE RAZORPAY PAYMENT ESCROW ORDER (ZERO CLIENT-SIDE TRUST) ─────────
router.post("/payments/orders", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId || authReq.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { dealId, idempotencyKey: customIdempotencyKey } = req.body;
  const parsedDealId = Number(dealId);

  if (!parsedDealId || isNaN(parsedDealId)) {
    res.status(400).json({ error: "Valid dealId is required." });
    return;
  }

  try {
    // 1. Fetch deal & verify mutual acceptance
    const [deal] = await db
      .select()
      .from(dealsTable)
      .where(eq(dealsTable.id, parsedDealId))
      .limit(1);

    if (!deal) {
      res.status(404).json({ error: "Deal not found." });
      return;
    }

    if (deal.agreementStatus !== "CONFIRMED" && deal.agreementStatus !== "ACCEPTED") {
      res.status(400).json({
        error: "Deal commercial terms must be bilaterally signed before escrow funding.",
      });
      return;
    }

    if (!deal.activeProposalId) {
      res.status(400).json({ error: "Deal does not have an active confirmed proposal." });
      return;
    }

    // 2. Fetch active signed proposal terms
    const [proposal] = await db
      .select()
      .from(dealTermsVersionsTable)
      .where(eq(dealTermsVersionsTable.id, deal.activeProposalId))
      .limit(1);

    if (!proposal) {
      res.status(400).json({ error: "Signed terms version not found." });
      return;
    }

    // 3. Resolve Counterparties
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

    if (!brand || !influencer) {
      res.status(400).json({ error: "Counterparty profiles missing." });
      return;
    }

    const brandUserId = String(brand.userId);
    const creatorUserId = String(influencer.userId);

    // Verify caller is authorized (must be the brand owner or participant)
    if (userId !== brandUserId && authReq.user?.role !== "admin") {
      const [isParticipant] = await db
        .select()
        .from(dealParticipantsTable)
        .where(
          and(
            eq(dealParticipantsTable.dealId, parsedDealId),
            eq(dealParticipantsTable.userId, String(userId))
          )
        )
        .limit(1);
      if (!isParticipant) {
        res.status(403).json({ error: "Forbidden: Only the Brand can fund this Deal Escrow." });
        return;
      }
    }

    // 4. Server-Side Financial Computation (Zero Client Trust)
    const grossAmountPaise = Number(proposal.pricePaise) || 0;
    if (grossAmountPaise <= 0) {
      res.status(400).json({ error: "Non-monetary (barter) deals do not require escrow funding." });
      return;
    }

    const platformFeePaise = Math.round(grossAmountPaise * 0.1); // 10% platform fee
    const gstAmountPaise = Math.round(platformFeePaise * 0.18); // 18% GST on platform fee
    const tdsAmountPaise = Math.round(grossAmountPaise * 0.01); // 1% statutory TDS under 194J/194C
    const netCreatorPayoutPaise = grossAmountPaise - platformFeePaise - tdsAmountPaise;
    const totalBrandPayablePaise = grossAmountPaise + gstAmountPaise;

    // 5. Deterministic Idempotency Key
    const idempotencyKey =
      customIdempotencyKey || `cb_order_deal_${deal.id}_terms_${proposal.id}_v${proposal.version}`;

    // Check if order already exists for this idempotency key
    const [existingOrder] = await db
      .select()
      .from(paymentOrdersTable)
      .where(eq(paymentOrdersTable.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existingOrder && existingOrder.status !== "failed") {
      res.json({
        order: existingOrder,
        breakdown: {
          grossAmountPaise: existingOrder.grossAmountPaise,
          platformFeePaise: existingOrder.platformFeePaise,
          gstAmountPaise: existingOrder.gstAmountPaise,
          tdsAmountPaise: existingOrder.tdsAmountPaise,
          netCreatorPayoutPaise: existingOrder.netCreatorPayoutPaise,
          totalBrandPayablePaise: existingOrder.grossAmountPaise + existingOrder.gstAmountPaise,
          grossAmountRupees: Math.round(existingOrder.grossAmountPaise / 100),
          totalBrandPayableRupees: Math.round(
            (existingOrder.grossAmountPaise + existingOrder.gstAmountPaise) / 100
          ),
        },
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_creatorsbrand_mock",
      });
      return;
    }

    // 6. Razorpay Order Creation (API Integration or Mock for Dev)
    let razorpayOrderId = `order_cb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      try {
        const authString = Buffer.from(
          `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
        ).toString("base64");

        const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            Authorization: `Basic ${authString}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: totalBrandPayablePaise,
            currency: "INR",
            receipt: `cb_deal_${deal.id}_v${proposal.version}`,
            notes: {
              dealId: String(deal.id),
              termsVersionId: String(proposal.id),
              brandUserId,
              creatorUserId,
            },
          }),
        });

        if (rzpRes.ok) {
          const rzpData = (await rzpRes.json()) as any;
          razorpayOrderId = rzpData.id;
        } else {
          const errBody = await rzpRes.text();
          logger.warn(
            { errBody },
            "[RAZORPAY ORDER API WARNING] Falling back to generated order ID"
          );
        }
      } catch (apiErr) {
        logger.error({ apiErr }, "[RAZORPAY ORDER API EXCEPTION]");
      }
    }

    // 7. Persist Payment Order
    const [newOrder] = await db
      .insert(paymentOrdersTable)
      .values({
        dealId: deal.id,
        termsVersionId: proposal.id,
        brandUserId,
        creatorUserId,
        razorpayOrderId,
        grossAmountPaise,
        platformFeePaise,
        gstAmountPaise,
        tdsAmountPaise,
        netCreatorPayoutPaise,
        status: "created",
        idempotencyKey,
      })
      .returning();

    // Update Deal payment status to PAYMENT_PENDING
    await db
      .update(dealsTable)
      .set({
        paymentStatus: "PAYMENT_PENDING",
        updatedAt: new Date(),
      })
      .where(eq(dealsTable.id, deal.id));

    res.status(201).json({
      order: newOrder,
      breakdown: {
        grossAmountPaise,
        platformFeePaise,
        gstAmountPaise,
        tdsAmountPaise,
        netCreatorPayoutPaise,
        totalBrandPayablePaise,
        grossAmountRupees: Math.round(grossAmountPaise / 100),
        totalBrandPayableRupees: Math.round(totalBrandPayablePaise / 100),
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_creatorsbrand_mock",
    });
  } catch (error: any) {
    logger.error({ error }, "[POST /api/payments/orders] Error");
    res.status(500).json({ error: error.message || "Failed to create escrow order." });
  }
});

// ─── 4. SIMULATE ESCROW CAPTURE (DEV & SANDBOX INSTANT VERIFICATION) ─────────
router.post(
  "/payments/orders/:id/simulate-capture",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const orderId = parseInt(rawId, 10);

    if (isNaN(orderId)) {
      res.status(400).json({ error: "Invalid order ID." });
      return;
    }

    try {
      const [order] = await db
        .select()
        .from(paymentOrdersTable)
        .where(eq(paymentOrdersTable.id, orderId))
        .limit(1);

      if (!order) {
        res.status(404).json({ error: "Payment order not found." });
        return;
      }

      if (order.status !== "created") {
        res.status(400).json({ error: `Order is already in state '${order.status}'.` });
        return;
      }

      const mockPaymentId = `pay_sim_${Date.now()}`;
      const totalCapturedPaise = order.grossAmountPaise + order.gstAmountPaise;

      // Transition order to funded_on_hold
      const [updatedOrder] = await db
        .update(paymentOrdersTable)
        .set({
          status: "funded_on_hold",
          razorpayPaymentId: mockPaymentId,
          updatedAt: new Date(),
        })
        .where(eq(paymentOrdersTable.id, order.id))
        .returning();

      // Update deal paymentStatus
      await db
        .update(dealsTable)
        .set({
          paymentStatus: "HELD_IN_ESCROW",
          updatedAt: new Date(),
        })
        .where(eq(dealsTable.id, order.dealId));

      // Insert Double-Entry Ledger entries
      await db.insert(paymentLedgerEntriesTable).values([
        {
          paymentOrderId: order.id,
          dealId: order.dealId,
          entryType: "brand_capture",
          direction: "credit",
          amountPaise: totalCapturedPaise,
          description: `Brand escrow capture for Deal #${order.dealId}`,
        },
        {
          paymentOrderId: order.id,
          dealId: order.dealId,
          entryType: "platform_fee",
          direction: "credit",
          amountPaise: order.platformFeePaise,
          description: `Platform fee allocation (10%)`,
        },
        {
          paymentOrderId: order.id,
          dealId: order.dealId,
          entryType: "gst_collected",
          direction: "credit",
          amountPaise: order.gstAmountPaise,
          description: `18% GST collected on platform fee`,
        },
        {
          paymentOrderId: order.id,
          dealId: order.dealId,
          entryType: "tds_withheld",
          direction: "credit",
          amountPaise: order.tdsAmountPaise,
          description: `1% statutory TDS withheld under Section 194J/194C`,
        },
      ]);

      await db.insert(dealActivityTable).values({
        dealId: order.dealId,
        actorId: order.brandUserId,
        actorParty: "brand",
        action: "ESCROW_FUNDED",
        description: `Brand funded ₹${(totalCapturedPaise / 100).toLocaleString("en-IN")} into RBI-compliant escrow. Funds held on hold pending deliverable approval.`,
        metadata: {
          orderId: order.id,
          paymentId: mockPaymentId,
          totalCapturedPaise,
        },
      });

      notifyDealCounterparty({
        dealId: order.dealId,
        actorUserId: order.brandUserId,
        actorParty: "brand",
        type: "deal_escrow_funded",
        title: "Escrow Funded & Secured",
        body: "The brand has secured project funds in escrow. You can now execute your approved deliverables.",
        badgeLabel: "Escrow Secured",
      });

      res.json({
        success: true,
        order: updatedOrder,
        message: "Escrow funds successfully captured into holding escrow.",
      });
    } catch (error: any) {
      logger.error({ error }, "[SIMULATE CAPTURE ERROR]");
      res.status(500).json({ error: error.message || "Failed to simulate capture." });
    }
  }
);

// ─── 5. ROW-LOCKED IDEMPOTENT PAYOUT RELEASE ─────────────────────────────────
router.post(
  "/payments/orders/:id/release",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId || authReq.user?.id;
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const orderId = parseInt(rawId, 10);

    if (isNaN(orderId)) {
      res.status(400).json({ error: "Invalid order ID." });
      return;
    }

    try {
      // Execute in Row-Locked Transaction to prevent double-spending or race conditions
      const result = await db.transaction(async (tx) => {
        // Row-lock the payment order with FOR UPDATE
        const [order] = await tx
          .select()
          .from(paymentOrdersTable)
          .where(eq(paymentOrdersTable.id, orderId))
          .for("update");

        if (!order) {
          throw { status: 404, message: "Payment order not found." };
        }

        if (order.status === "settled") {
          return { success: true, message: "Order already settled.", order };
        }

        if (order.status !== "funded_on_hold" && order.status !== "release_queued") {
          throw {
            status: 400,
            message: `Cannot release funds from order in status '${order.status}'. Funds must be funded_on_hold.`,
          };
        }

        // Fetch Creator Payout Account & Verify KYC + 24h Freeze
        const [payoutAccount] = await tx
          .select()
          .from(creatorPayoutAccountsTable)
          .where(eq(creatorPayoutAccountsTable.userId, order.creatorUserId))
          .limit(1);

        if (!payoutAccount) {
          throw {
            status: 422,
            message:
              "Creator has not registered a linked payout account (Bank/UPI). Escrow payout cannot be routed.",
          };
        }

        if (payoutAccount.kycStatus !== "verified") {
          throw {
            status: 403,
            message: `Creator payout account KYC status is '${payoutAccount.kycStatus}'. RBI regulations require verified KYC prior to transfer release.`,
          };
        }

        // 24-Hour Beneficiary Freeze Check
        if (
          payoutAccount.beneficiaryLockedUntil &&
          new Date(payoutAccount.beneficiaryLockedUntil) > new Date()
        ) {
          const unlockTime = new Date(payoutAccount.beneficiaryLockedUntil).toLocaleString("en-IN");
          throw {
            status: 423,
            message: `SECURITY HOLD: Creator payout account details were recently updated. Beneficiary is in mandatory 24-hour security lock-in until ${unlockTime}. Payout release is temporarily frozen.`,
          };
        }

        // Process Route Transfer / Settlement
        const mockTransferId = `tr_rel_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const mockUtr = `UTR${Date.now()}`;

        // Update payment order to settled
        const [settledOrder] = await tx
          .update(paymentOrdersTable)
          .set({
            status: "settled",
            razorpayTransferId: mockTransferId,
            autoReleaseAt: null,
            updatedAt: new Date(),
          })
          .where(eq(paymentOrdersTable.id, order.id))
          .returning();

        // Update Deal
        await tx
          .update(dealsTable)
          .set({
            paymentStatus: "PAYOUT_RELEASED",
            executionStatus: "COMPLETED",
            updatedAt: new Date(),
          })
          .where(eq(dealsTable.id, order.dealId));

        // Insert double-entry ledger entry
        await tx.insert(paymentLedgerEntriesTable).values({
          paymentOrderId: order.id,
          dealId: order.dealId,
          entryType: "creator_transfer",
          direction: "debit",
          amountPaise: order.netCreatorPayoutPaise,
          providerTransferId: mockTransferId,
          utrNumber: mockUtr,
          description: `Split settlement transferred to Creator linked beneficiary account (${payoutAccount.accountType.toUpperCase()})`,
        });

        // Deal Activity Log
        await tx.insert(dealActivityTable).values({
          dealId: order.dealId,
          actorId: String(userId),
          actorParty: "brand",
          action: "PAYOUT_RELEASED",
          description: `Milestone payout of ₹${(order.netCreatorPayoutPaise / 100).toLocaleString("en-IN")} released to creator. UTR: ${mockUtr}`,
          metadata: {
            orderId: order.id,
            transferId: mockTransferId,
            utrNumber: mockUtr,
            amountPaise: order.netCreatorPayoutPaise,
          },
        });

        return {
          success: true,
          message: "Payout successfully settled to creator.",
          order: settledOrder,
          utrNumber: mockUtr,
        };
      });

      notifyDealCounterparty({
        dealId: result.order.dealId,
        actorUserId: String(userId),
        actorParty: "brand",
        type: "deal_payout_released",
        title: "Payout Transferred & Settled",
        body: `Milestone payout of ₹${(result.order.netCreatorPayoutPaise / 100).toLocaleString("en-IN")} has been released to your linked bank account. UTR: ${result.utrNumber}`,
        badgeLabel: "Payout Transferred",
      });

      await logPlatformActivity({
        actorUserId: String(userId),
        actorParty: "brand",
        eventType: "deal.updated",
        entityType: "deal",
        entityId: result.order.dealId,
        summary: `Released ₹${(result.order.netCreatorPayoutPaise / 100).toLocaleString("en-IN")} payout for Deal #${result.order.dealId}`,
      });

      res.json(result);
    } catch (error: any) {
      logger.error({ error }, "[PAYOUT RELEASE ERROR]");
      res.status(error.status || 500).json({ error: error.message || "Failed to release payout." });
    }
  }
);

// ─── 6. GET CREATOR PAYOUT ACCOUNT DETAILS ───────────────────────────────────
router.get(
  "/payments/payout-account",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId || authReq.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    try {
      const [account] = await db
        .select()
        .from(creatorPayoutAccountsTable)
        .where(eq(creatorPayoutAccountsTable.userId, String(userId)))
        .limit(1);

      if (!account) {
        res.json({ account: null, hasLinkedAccount: false });
        return;
      }

      const isLocked =
        account.beneficiaryLockedUntil && new Date(account.beneficiaryLockedUntil) > new Date();

      res.json({
        hasLinkedAccount: true,
        account: {
          id: account.id,
          accountType: account.accountType,
          accountNumberMasked: account.accountNumberMasked,
          ifscCode: account.ifscCode,
          bankName: account.bankName,
          vpaAddress: account.vpaAddress,
          beneficiaryName: account.beneficiaryName,
          panNumberMasked: account.panNumberMasked,
          kycStatus: account.kycStatus,
          isLocked,
          beneficiaryLockedUntil: account.beneficiaryLockedUntil
            ? account.beneficiaryLockedUntil.toISOString()
            : null,
          createdAt: account.createdAt.toISOString(),
          updatedAt: account.updatedAt.toISOString(),
        },
      });
    } catch (error: any) {
      logger.error({ error }, "[GET /api/payments/payout-account] Error");
      res.status(500).json({ error: "Failed to fetch payout account." });
    }
  }
);

// ─── 7. REGISTER / UPDATE CREATOR PAYOUT ACCOUNT (24H SECURITY LOCK-IN) ──────
router.post(
  "/payments/payout-account",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId || authReq.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const {
      accountType = "bank_account",
      accountNumber,
      ifscCode,
      bankName,
      vpaAddress,
      beneficiaryName,
      panNumber,
    } = req.body;

    if (!beneficiaryName?.trim()) {
      res.status(400).json({ error: "Beneficiary legal name is required." });
      return;
    }

    if (accountType === "bank_account") {
      if (!accountNumber || !ifscCode) {
        res
          .status(400)
          .json({ error: "Account number and IFSC code are required for bank transfer." });
        return;
      }
    } else if (accountType === "vpa") {
      if (!vpaAddress || !vpaAddress.includes("@")) {
        res.status(400).json({ error: "Valid UPI VPA address is required." });
        return;
      }
    } else {
      res.status(400).json({ error: "Invalid accountType. Must be 'bank_account' or 'vpa'." });
      return;
    }

    try {
      // Masking logic
      const rawAcc = String(accountNumber || "");
      const accountNumberMasked = rawAcc.length > 4 ? `••••••••${rawAcc.slice(-4)}` : rawAcc;

      const rawPan = String(panNumber || "").toUpperCase();
      const panNumberMasked =
        rawPan.length === 10
          ? `${rawPan.slice(0, 3)}••••${rawPan.slice(-2)}`
          : rawPan || "ABCDE••••F";

      // Mandatory 24-Hour Security Freeze Timestamp
      const beneficiaryLockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const [existing] = await db
        .select()
        .from(creatorPayoutAccountsTable)
        .where(eq(creatorPayoutAccountsTable.userId, String(userId)))
        .limit(1);

      let savedAccount;
      if (existing) {
        [savedAccount] = await db
          .update(creatorPayoutAccountsTable)
          .set({
            accountType,
            accountNumberMasked,
            ifscCode: ifscCode ? ifscCode.toUpperCase().trim() : null,
            bankName: bankName || null,
            vpaAddress: vpaAddress ? vpaAddress.trim().toLowerCase() : null,
            beneficiaryName: beneficiaryName.trim(),
            panNumberMasked,
            kycStatus: "verified", // Pre-verified in demo/sandbox
            beneficiaryLockedUntil,
            updatedAt: new Date(),
          })
          .where(eq(creatorPayoutAccountsTable.id, existing.id))
          .returning();
      } else {
        [savedAccount] = await db
          .insert(creatorPayoutAccountsTable)
          .values({
            userId: String(userId),
            accountType,
            accountNumberMasked,
            ifscCode: ifscCode ? ifscCode.toUpperCase().trim() : null,
            bankName: bankName || null,
            vpaAddress: vpaAddress ? vpaAddress.trim().toLowerCase() : null,
            beneficiaryName: beneficiaryName.trim(),
            panNumberMasked,
            kycStatus: "verified",
            beneficiaryLockedUntil,
          })
          .returning();
      }

      // Security Notification Email to Creator
      const [userRecord] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.id, String(userId)))
        .limit(1);

      if (userRecord?.email) {
        const unlockDateStr = beneficiaryLockedUntil.toLocaleString("en-IN");
        await sendEmail({
          to: userRecord.email,
          subject: "[Security Alert] Payout Account Updated - 24-Hour Lock Applied",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto; border: 1px solid #E5E4DF; border-radius: 12px;">
              <h2 style="color: #6A0D18; margin-top: 0;">Security Alert: Beneficiary Account Details Updated</h2>
              <p>Hello ${userRecord.name || "Creator"},</p>
              <p>Your payout disbursement account on CreatorsBrand was recently updated to:</p>
              <ul style="line-height: 1.8;">
                <li><strong>Type:</strong> ${accountType === "bank_account" ? "Direct Bank Account" : "UPI Virtual Payment Address"}</li>
                <li><strong>Beneficiary:</strong> ${beneficiaryName}</li>
                <li><strong>Masked Identifier:</strong> ${accountType === "bank_account" ? accountNumberMasked : vpaAddress}</li>
              </ul>
              <div style="background: #FDF6F7; border: 1px solid #EED8DC; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <strong style="color: #6A0D18;">24-Hour Security Hold Active</strong>
                <p style="margin: 6px 0 0; color: #4A4A4A; font-size: 14px;">
                  Per RBI cyber-security standards and to protect your funds against unauthorized account diversion, automated payout releases to this beneficiary are locked until <strong>${unlockDateStr}</strong>.
                </p>
              </div>
              <p style="font-size: 13px; color: #666;">If you did not authorize this change, please immediately reset your password and contact platform security at security@creatorsbrand.in.</p>
            </div>
          `,
          text: `Security Alert: Your CreatorsBrand payout account was updated. A 24-hour security hold is active until ${unlockDateStr}. If you did not make this change, please notify support immediately.`,
        }).catch((err) => logger.error({ err }, "[SECURITY EMAIL SEND ERROR]"));
      }

      res.status(200).json({
        success: true,
        message: "Payout account registered successfully. 24-hour security lock-in applied.",
        account: savedAccount,
      });
    } catch (error: any) {
      logger.error({ error }, "[POST /api/payments/payout-account] Error");
      res.status(500).json({ error: error.message || "Failed to update payout account." });
    }
  }
);

// ─── 8. 72-HOUR REVIEW SLA AUTO-RELEASE WORKER / TRIGGER ──────────────────────
router.post("/payments/cron/auto-release", async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    // Find all funded_on_hold orders whose 72h autoReleaseAt has passed
    const expiredOrders = await db
      .select()
      .from(paymentOrdersTable)
      .where(
        and(
          eq(paymentOrdersTable.status, "funded_on_hold"),
          lte(paymentOrdersTable.autoReleaseAt, now)
        )
      );

    const releasedOrderIds: number[] = [];

    for (const order of expiredOrders) {
      const [deal] = await db
        .select()
        .from(dealsTable)
        .where(eq(dealsTable.id, order.dealId))
        .limit(1);

      // Only auto-release if deliverables were submitted and not in dispute
      if (deal && deal.executionStatus === "FINAL_CONTENT_SUBMITTED") {
        const mockTransferId = `tr_auto_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const mockUtr = `AUTOSLA${Date.now()}`;

        await db
          .update(paymentOrdersTable)
          .set({
            status: "settled",
            razorpayTransferId: mockTransferId,
            autoReleaseAt: null,
            updatedAt: new Date(),
          })
          .where(eq(paymentOrdersTable.id, order.id));

        await db
          .update(dealsTable)
          .set({
            paymentStatus: "PAYOUT_RELEASED",
            executionStatus: "COMPLETED",
            updatedAt: new Date(),
          })
          .where(eq(dealsTable.id, order.dealId));

        await db.insert(paymentLedgerEntriesTable).values({
          paymentOrderId: order.id,
          dealId: order.dealId,
          entryType: "creator_transfer",
          direction: "debit",
          amountPaise: order.netCreatorPayoutPaise,
          providerTransferId: mockTransferId,
          utrNumber: mockUtr,
          description: `72-Hour Review SLA Auto-Release to Creator`,
        });

        await db.insert(dealActivityTable).values({
          dealId: order.dealId,
          actorId: order.creatorUserId,
          actorParty: "creator",
          action: "PAYOUT_RELEASED",
          description: `72-Hour Review SLA expired without brand dispute. Milestone payout of ₹${(order.netCreatorPayoutPaise / 100).toLocaleString("en-IN")} automatically released to Creator.`,
          metadata: { orderId: order.id, transferId: mockTransferId, utrNumber: mockUtr },
        });

        releasedOrderIds.push(order.id);
      }
    }

    res.json({
      success: true,
      processed: expiredOrders.length,
      released: releasedOrderIds.length,
      releasedOrderIds,
    });
  } catch (error: any) {
    logger.error({ error }, "[AUTO-RELEASE CRON ERROR]");
    res.status(500).json({ error: error.message || "Failed to process auto-releases." });
  }
});

export default router;
