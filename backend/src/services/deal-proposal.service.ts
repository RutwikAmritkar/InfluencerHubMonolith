import crypto from "crypto";
import { db } from "@workspace/db";
import {
  dealsTable,
  dealParticipantsTable,
  dealTermsVersionsTable,
  dealApprovalsTable,
  dealActivityTable,
  brandsTable,
  influencersTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { isDealRoomEnabled } from "./deal-creation.service";
import { sendNotification } from "./notification.service";

export interface FixedProposalTerms {
  dealTitle?: string | null;
  deliverables: Array<{
    title: string;
    count?: number;
    quantity?: number;
    platform?: string;
    contentType?: string;
    format?: string;
    specs?: string;
    publishingRequirement?: string;
    deadline?: string;
    description?: string;
  }>;
  pricePaise: number;
  currency?: string;
  collabType?: "paid" | "barter" | "hybrid";
  barterDetails?: {
    productDescription: string;
    quantity: number;
    estimatedValuePaise: number;
    shippingBy: "brand" | "creator";
  } | null;
  timelines?: {
    startDate?: string;
    productDeliveryDate?: string;
    contentSubmissionDate?: string;
    publishingDate?: string;
    finalApprovalDate?: string;
  } | null;
  paidAdsPermission?: boolean;
  cancellationTerms?: string | null;
  contentDeadline?: string | Date;
  postingDate?: string | Date;
  usageRightsDays?: number | null;
  exclusivityDays?: number | null;
  revisionCount?: number | null;
  notes?: string | null;
}

// 1. Server-side Canonical Hash Function (Deterministic SHA-256)
export function computeCanonicalTermsHash(terms: FixedProposalTerms): string {
  const normalizedDeliverables = (terms.deliverables || [])
    .map((d) => ({
      count: d.count ?? d.quantity ?? 1,
      title: (d.title || "").trim(),
      platform: (d.platform || "Instagram").trim(),
      contentType: (d.contentType || d.format || "").trim(),
      specs: (d.specs || d.description || "").trim(),
      publishingRequirement: (d.publishingRequirement || "").trim(),
      deadline: d.deadline ? new Date(d.deadline).toISOString() : null,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const normalizedBarter = terms.barterDetails
    ? {
        productDescription: (terms.barterDetails.productDescription || "").trim(),
        quantity: Number(terms.barterDetails.quantity || 1),
        estimatedValuePaise: Number(terms.barterDetails.estimatedValuePaise || 0),
        shippingBy: terms.barterDetails.shippingBy || "brand",
      }
    : null;

  const normalizedTimelines = terms.timelines
    ? {
        startDate: terms.timelines.startDate
          ? new Date(terms.timelines.startDate).toISOString()
          : null,
        productDeliveryDate: terms.timelines.productDeliveryDate
          ? new Date(terms.timelines.productDeliveryDate).toISOString()
          : null,
        contentSubmissionDate: terms.timelines.contentSubmissionDate
          ? new Date(terms.timelines.contentSubmissionDate).toISOString()
          : null,
        publishingDate: terms.timelines.publishingDate
          ? new Date(terms.timelines.publishingDate).toISOString()
          : null,
        finalApprovalDate: terms.timelines.finalApprovalDate
          ? new Date(terms.timelines.finalApprovalDate).toISOString()
          : null,
      }
    : null;

  const canonicalObj = {
    collabType: terms.collabType || "paid",
    pricePaise: Number(terms.pricePaise || 0),
    currency: (terms.currency || "INR").toUpperCase(),
    deliverables: normalizedDeliverables,
    barterDetails: normalizedBarter,
    timelines: normalizedTimelines,
    usageRightsDays: terms.usageRightsDays ?? 30,
    exclusivityDays: terms.exclusivityDays ?? 0,
    revisionCount: terms.revisionCount ?? 1,
    paidAdsPermission: Boolean(terms.paidAdsPermission),
    cancellationTerms: (terms.cancellationTerms || "").trim(),
    notes: (terms.notes || "").trim().replace(/\r\n/g, "\n"),
  };

  const jsonString = JSON.stringify(canonicalObj);
  return crypto.createHash("sha256").update(jsonString, "utf8").digest("hex");
}

// Helper to resolve user's party and participant authorization for a deal
export async function getDealParticipant(dealId: number, userId: string) {
  const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, dealId)).limit(1);
  if (!deal) return { deal: null, participant: null, party: null, counterpartyUserId: null };

  const [participant] = await db
    .select()
    .from(dealParticipantsTable)
    .where(and(eq(dealParticipantsTable.dealId, dealId), eq(dealParticipantsTable.userId, userId)))
    .limit(1);

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

  const brandUserId = brand ? String(brand.userId) : null;
  const creatorUserId = influencer ? String(influencer.userId) : null;

  let party: "brand" | "creator" | null = null;
  if (participant) {
    party = participant.party as "brand" | "creator";
  } else if (brandUserId === userId) {
    party = "brand";
  } else if (creatorUserId === userId) {
    party = "creator";
  }

  const counterpartyUserId = party === "brand" ? creatorUserId : brandUserId;

  return { deal, participant, party, counterpartyUserId };
}

// 2. Propose New Terms Version Engine with Optimistic Locking
export async function proposeNewTermsVersion(
  dealId: number,
  userId: string,
  baseProposalRef: { baseProposalId?: number; baseVersion?: number },
  terms: FixedProposalTerms
) {
  if (!isDealRoomEnabled()) {
    throw new Error("FEATURE_DISABLED: Deal Room feature is currently disabled.");
  }

  const { deal, party, counterpartyUserId } = await getDealParticipant(dealId, userId);

  if (!deal || !party) {
    const error: any = new Error("FORBIDDEN: You are not a participant in this Deal Room.");
    error.statusCode = 403;
    throw error;
  }

  // Post-Confirmation Locking Rule
  if (deal.agreementStatus === "CONFIRMED" || deal.agreementStatus === "ACCEPTED") {
    const error: any = new Error("TERMS_LOCKED: Terms are locked on an accepted deal.");
    error.statusCode = 400;
    throw error;
  }

  return await db.transaction(async (tx) => {
    // Row-level lock on deal record
    const [latestDeal] = await tx
      .select()
      .from(dealsTable)
      .where(eq(dealsTable.id, dealId))
      .for("update");

    if (latestDeal.agreementStatus === "CONFIRMED" || latestDeal.agreementStatus === "ACCEPTED") {
      const error: any = new Error("TERMS_LOCKED: Terms are locked on an accepted deal.");
      error.statusCode = 400;
      throw error;
    }

    // ─── OPTIMISTIC LOCKING: STALE PROPOSAL GUARD ──────────────────────────────
    if (baseProposalRef.baseProposalId != null && latestDeal.activeProposalId != null) {
      if (baseProposalRef.baseProposalId !== latestDeal.activeProposalId) {
        const error: any = new Error(
          "STALE_PROPOSAL: A newer terms proposal already exists. Please review the latest proposal before submitting a counter-offer."
        );
        error.statusCode = 409;
        error.activeProposalId = latestDeal.activeProposalId;
        throw error;
      }
    }

    // Get current latest proposal version
    const [latestProposal] = await tx
      .select()
      .from(dealTermsVersionsTable)
      .where(eq(dealTermsVersionsTable.dealId, dealId))
      .orderBy(desc(dealTermsVersionsTable.version))
      .limit(1);

    const currentLatestVersion = latestProposal ? latestProposal.version : 0;

    if (
      baseProposalRef.baseVersion != null &&
      baseProposalRef.baseVersion !== currentLatestVersion
    ) {
      const error: any = new Error(
        `STALE_PROPOSAL: A newer terms version (${currentLatestVersion}) already exists.`
      );
      error.statusCode = 409;
      error.currentLatestVersion = currentLatestVersion;
      throw error;
    }

    // 20-Version Cap Guard
    if (currentLatestVersion >= 20) {
      const error: any = new Error(
        "VERSION_CAP_EXCEEDED: Maximum proposal version limit (20) reached for this deal."
      );
      error.statusCode = 400;
      throw error;
    }

    const newVersion = currentLatestVersion + 1;

    // Mark previous active proposals as superceded
    await tx
      .update(dealTermsVersionsTable)
      .set({ status: "superceded" })
      .where(
        and(eq(dealTermsVersionsTable.dealId, dealId), eq(dealTermsVersionsTable.status, "pending"))
      );

    const now = new Date();
    const defaultDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const defaultPostingDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const contentDeadline = terms.contentDeadline
      ? new Date(terms.contentDeadline)
      : terms.timelines?.contentSubmissionDate
        ? new Date(terms.timelines.contentSubmissionDate)
        : defaultDeadline;

    const postingDate = terms.postingDate
      ? new Date(terms.postingDate)
      : terms.timelines?.publishingDate
        ? new Date(terms.timelines.publishingDate)
        : defaultPostingDate;

    // Insert new version
    const [newProposal] = await tx
      .insert(dealTermsVersionsTable)
      .values({
        dealId,
        version: newVersion,
        baseVersion: currentLatestVersion,
        proposedByParty: party,
        proposedByUserId: userId,
        dealTitle: terms.dealTitle || latestDeal.title,
        collabType: terms.collabType || "paid",
        deliverables: terms.deliverables as any,
        pricePaise: terms.pricePaise,
        currency: terms.currency || "INR",
        barterDetails: terms.barterDetails || null,
        timelines: terms.timelines || null,
        paidAdsPermission: Boolean(terms.paidAdsPermission),
        cancellationTerms: terms.cancellationTerms || null,
        contentDeadline,
        postingDate,
        usageRightsDays: terms.usageRightsDays ?? 30,
        exclusivityDays: terms.exclusivityDays ?? 0,
        revisionCount: terms.revisionCount ?? 1,
        notes: terms.notes || null,
        status: "pending",
      })
      .returning();

    // Reset confirmations & update active proposal
    await tx
      .update(dealsTable)
      .set({
        activeProposalId: newProposal.id,
        agreementStatus: "TERMS_PROPOSED",
        updatedAt: new Date(),
      })
      .where(eq(dealsTable.id, dealId));

    // Log Activity
    await tx.insert(dealActivityTable).values({
      dealId,
      actorId: userId,
      actorParty: party,
      action: "PROPOSAL_VERSION_CREATED",
      description: `${party === "brand" ? "Brand" : "Creator"} proposed terms version ${newVersion}.`,
      metadata: {
        version: newVersion,
        baseProposalId: baseProposalRef.baseProposalId,
        collabType: terms.collabType,
        pricePaise: terms.pricePaise,
        proposedByParty: party,
      },
    });

    // Notify Counterparty
    if (counterpartyUserId) {
      try {
        await sendNotification(
          counterpartyUserId,
          "proposal_counter_received",
          "Counter-Proposal Received",
          `${party === "brand" ? "Brand" : "Creator"} proposed revised terms (version ${newVersion}) for "${latestDeal.title}". Review and sign off.`
        );
      } catch (notifErr) {
        console.error("[COUNTER PROPOSAL NOTIF ERROR]", notifErr);
      }
    }

    return newProposal;
  });
}

// 3. Transactional Dual Confirmation Engine with Bilateral Acceptance
export async function confirmDealTerms(
  dealId: number,
  proposalVersion: number,
  userId: string,
  reqMetadata: { ipAddress?: string; userAgent?: string } = {}
) {
  if (!isDealRoomEnabled()) {
    throw new Error("FEATURE_DISABLED: Deal Room feature is currently disabled.");
  }

  const { deal, party, counterpartyUserId } = await getDealParticipant(dealId, userId);

  if (!deal || !party) {
    const error: any = new Error("FORBIDDEN: You are not a participant in this Deal Room.");
    error.statusCode = 403;
    throw error;
  }

  return await db.transaction(async (tx) => {
    // 1. Row-level lock on deal record
    const [lockedDeal] = await tx
      .select()
      .from(dealsTable)
      .where(eq(dealsTable.id, dealId))
      .for("update");

    if (lockedDeal.agreementStatus === "CONFIRMED" || lockedDeal.agreementStatus === "ACCEPTED") {
      const error: any = new Error("TERMS_LOCKED: Deal is already mutually accepted.");
      error.statusCode = 400;
      throw error;
    }

    // 2. Row-level lock on specified proposal version
    const [targetProposal] = await tx
      .select()
      .from(dealTermsVersionsTable)
      .where(
        and(
          eq(dealTermsVersionsTable.dealId, dealId),
          eq(dealTermsVersionsTable.version, proposalVersion)
        )
      )
      .for("update");

    if (!targetProposal || targetProposal.status !== "pending") {
      const error: any = new Error(
        `STALE_VERSION: Proposal version ${proposalVersion} is no longer active for confirmation.`
      );
      error.statusCode = 409;
      throw error;
    }

    const termsHash = computeCanonicalTermsHash(targetProposal as any);

    // 3. Upsert approval record for this party & version
    const [existingApproval] = await tx
      .select()
      .from(dealApprovalsTable)
      .where(
        and(
          eq(dealApprovalsTable.dealId, dealId),
          eq(dealApprovalsTable.proposalVersion, proposalVersion),
          eq(dealApprovalsTable.party, party)
        )
      );

    if (!existingApproval) {
      await tx.insert(dealApprovalsTable).values({
        dealId,
        proposalId: targetProposal.id,
        proposalVersion,
        userId,
        party,
        termsHash,
        ipAddress: reqMetadata.ipAddress || null,
        userAgent: reqMetadata.userAgent || null,
      });
    }

    // 4. Query all approvals for THIS exact proposal version
    const allApprovals = await tx
      .select()
      .from(dealApprovalsTable)
      .where(
        and(
          eq(dealApprovalsTable.dealId, dealId),
          eq(dealApprovalsTable.proposalVersion, proposalVersion)
        )
      );

    const brandConfirmed = allApprovals.some((a) => a.party === "brand");
    const creatorConfirmed = allApprovals.some((a) => a.party === "creator");

    let newAgreementStatus: string;
    const isBothConfirmed = brandConfirmed && creatorConfirmed;

    if (isBothConfirmed) {
      newAgreementStatus = "ACCEPTED";

      await tx
        .update(dealsTable)
        .set({
          agreementStatus: "ACCEPTED",
          confirmedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(dealsTable.id, dealId));

      await tx
        .update(dealTermsVersionsTable)
        .set({ status: "accepted" })
        .where(eq(dealTermsVersionsTable.id, targetProposal.id));

      await tx.insert(dealActivityTable).values({
        dealId,
        actorId: userId,
        actorParty: party,
        action: "DEAL_CONFIRMED",
        description: `Collaboration terms version ${proposalVersion} mutually accepted by both parties.`,
        metadata: {
          version: proposalVersion,
          termsHash,
          confirmedAt: new Date().toISOString(),
        },
      });

      // Notify both parties of final confirmation
      try {
        await sendNotification(
          userId,
          "deal_finalized",
          "Deal Mutually Confirmed!",
          `Both parties have signed version ${proposalVersion} of "${lockedDeal.title}". Deal is now active.`
        );
        if (counterpartyUserId) {
          await sendNotification(
            counterpartyUserId,
            "deal_finalized",
            "Deal Mutually Confirmed!",
            `Both parties have signed version ${proposalVersion} of "${lockedDeal.title}". Deal is now active.`
          );
        }
      } catch (notifErr) {
        console.error("[DEAL CONFIRM NOTIF ERROR]", notifErr);
      }
    } else {
      newAgreementStatus =
        party === "brand" ? "AWAITING_CREATOR_APPROVAL" : "AWAITING_BRAND_APPROVAL";

      await tx
        .update(dealsTable)
        .set({
          agreementStatus: newAgreementStatus,
          updatedAt: new Date(),
        })
        .where(eq(dealsTable.id, dealId));

      await tx.insert(dealActivityTable).values({
        dealId,
        actorId: userId,
        actorParty: party,
        action: "TERMS_VERSION_CONFIRMED",
        description: `${party === "brand" ? "Brand" : "Creator"} signed terms version ${proposalVersion}.`,
        metadata: {
          version: proposalVersion,
          party,
          termsHash,
        },
      });

      // Notify counterparty that their signature is needed
      if (counterpartyUserId) {
        try {
          await sendNotification(
            counterpartyUserId,
            "deal_terms_signed",
            "Terms Signed by Partner",
            `${party === "brand" ? "Brand" : "Creator"} signed terms version ${proposalVersion} for "${lockedDeal.title}". Your signoff is required to finalize.`
          );
        } catch (notifErr) {
          console.error("[DEAL SIGN NOTIF ERROR]", notifErr);
        }
      }
    }

    return {
      success: true,
      proposalVersion,
      party,
      termsHash,
      confirmed: isBothConfirmed,
      agreementStatus: newAgreementStatus,
    };
  });
}
