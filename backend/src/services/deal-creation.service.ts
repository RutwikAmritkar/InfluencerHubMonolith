import { db } from "@workspace/db";
import {
  dealsTable,
  dealParticipantsTable,
  dealTermsVersionsTable,
  dealActivityTable,
  brandsTable,
  influencersTable,
  conversationsTable,
} from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import { sendNotification } from "./notification.service";

let featureDealRoomEnabled = true;

export function isDealRoomEnabled(): boolean {
  if (
    process.env.FEATURE_DEAL_ROOM_ENABLED === "false" ||
    process.env.ENABLE_DEAL_ROOM === "false"
  ) {
    return false;
  }
  return featureDealRoomEnabled;
}

export function setDealRoomFeatureFlag(enabled: boolean): void {
  featureDealRoomEnabled = enabled;
}

export interface CreateDealParams {
  brandId: number;
  influencerId: number;
  title: string;
  collaborationRequestId?: number;
  applicationId?: number;
  campaignId?: number;
  initiatorParty?: "brand" | "creator";
  initiatorUserId?: string;
  prefillTerms?: {
    dealTitle?: string;
    collabType?: "paid" | "barter" | "hybrid";
    deliverables?: Array<{
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
    pricePaise?: number;
    currency?: string;
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
    contentDeadline?: Date | string;
    postingDate?: Date | string;
    usageRightsDays?: number;
    exclusivityDays?: number;
    revisionCount?: number;
    notes?: string | null;
  };
}

export async function createDeal(params: CreateDealParams) {
  if (!isDealRoomEnabled()) {
    throw new Error("FEATURE_DISABLED: Deal Room feature is currently disabled.");
  }

  // 1. Check duplicate deals if applicationId or collaborationRequestId provided
  if (params.applicationId) {
    const [existing] = await db
      .select()
      .from(dealsTable)
      .where(eq(dealsTable.applicationId, params.applicationId))
      .limit(1);
    if (existing) return existing;
  }

  if (params.collaborationRequestId) {
    const [existing] = await db
      .select()
      .from(dealsTable)
      .where(eq(dealsTable.collaborationRequestId, params.collaborationRequestId))
      .limit(1);
    if (existing) return existing;
  }

  // 2. Fetch Brand & Influencer records to get user IDs
  const [brand] = await db
    .select()
    .from(brandsTable)
    .where(eq(brandsTable.id, params.brandId))
    .limit(1);
  const [influencer] = await db
    .select()
    .from(influencersTable)
    .where(eq(influencersTable.id, params.influencerId))
    .limit(1);

  if (!brand || !influencer) {
    throw new Error("NOT_FOUND: Brand or Influencer profile not found.");
  }

  const brandUserId = String(brand.userId);
  const creatorUserId = String(influencer.userId);

  const initiatorParty: "brand" | "creator" = params.initiatorParty || "brand";
  const initiatorUserId =
    params.initiatorUserId || (initiatorParty === "creator" ? creatorUserId : brandUserId);

  // 3. Conversation lookup or creation
  let conversationId: number | null = null;
  const brandUserIdInt = parseInt(brandUserId, 10) || brand.id;
  const creatorUserIdInt = parseInt(creatorUserId, 10) || influencer.id;

  if (brandUserIdInt && creatorUserIdInt) {
    const [existingConv] = await db
      .select()
      .from(conversationsTable)
      .where(
        or(
          and(
            eq(conversationsTable.user1Id, brandUserIdInt),
            eq(conversationsTable.user2Id, creatorUserIdInt)
          ),
          and(
            eq(conversationsTable.user1Id, creatorUserIdInt),
            eq(conversationsTable.user2Id, brandUserIdInt)
          )
        )
      )
      .limit(1);

    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      const [newConv] = await db
        .insert(conversationsTable)
        .values({ user1Id: brandUserIdInt, user2Id: creatorUserIdInt })
        .returning();
      conversationId = newConv.id;
    }
  }

  // 4. Transactional creation of deal, participants, prefilled v1 terms, and activity log
  return await db.transaction(async (tx) => {
    if (params.collaborationRequestId) {
      const [existing] = await tx
        .select()
        .from(dealsTable)
        .where(eq(dealsTable.collaborationRequestId, params.collaborationRequestId))
        .limit(1);
      if (existing) return existing;
    }
    if (params.applicationId) {
      const [existing] = await tx
        .select()
        .from(dealsTable)
        .where(eq(dealsTable.applicationId, params.applicationId))
        .limit(1);
      if (existing) return existing;
    }

    const [deal] = await tx
      .insert(dealsTable)
      .values({
        brandId: params.brandId,
        influencerId: params.influencerId,
        collaborationRequestId: params.collaborationRequestId ?? null,
        applicationId: params.applicationId ?? null,
        campaignId: params.campaignId ?? null,
        conversationId,
        title: params.title,
        agreementStatus: "TERMS_PROPOSED",
        paymentStatus: "UNFUNDED",
        executionStatus: "NOT_STARTED",
      })
      .returning();

    await tx.insert(dealParticipantsTable).values([
      {
        dealId: deal.id,
        userId: brandUserId,
        party: "brand",
        role: "primary_owner",
      },
      {
        dealId: deal.id,
        userId: creatorUserId,
        party: "creator",
        role: "primary_owner",
      },
    ]);

    const now = new Date();
    const defaultDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const defaultPostingDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const rawDeliverables =
      params.prefillTerms?.deliverables && params.prefillTerms.deliverables.length > 0
        ? params.prefillTerms.deliverables
        : [{ title: "Sponsored Content", count: 1, description: "Deliverable per agreement" }];

    const deliverables = rawDeliverables.map((d) => ({
      title: d.title || "Deliverable",
      count: d.count ?? d.quantity ?? 1,
      platform: d.platform,
      contentType: d.contentType || d.format,
      specs: d.specs,
      publishingRequirement: d.publishingRequirement,
      deadline: d.deadline,
      description: d.description || d.specs,
    }));

    const collabType = params.prefillTerms?.collabType || "paid";

    const pricePaise =
      collabType === "barter"
        ? 0
        : params.prefillTerms?.pricePaise && params.prefillTerms.pricePaise > 0
          ? params.prefillTerms.pricePaise
          : 100000;

    const contentDeadline = params.prefillTerms?.contentDeadline
      ? new Date(params.prefillTerms.contentDeadline)
      : params.prefillTerms?.timelines?.contentSubmissionDate
        ? new Date(params.prefillTerms.timelines.contentSubmissionDate)
        : defaultDeadline;

    const postingDate = params.prefillTerms?.postingDate
      ? new Date(params.prefillTerms.postingDate)
      : params.prefillTerms?.timelines?.publishingDate
        ? new Date(params.prefillTerms.timelines.publishingDate)
        : defaultPostingDate;

    const [v1Proposal] = await tx
      .insert(dealTermsVersionsTable)
      .values({
        dealId: deal.id,
        version: 1,
        baseVersion: null,
        proposedByParty: initiatorParty,
        proposedByUserId: initiatorUserId,
        deliverables,
        pricePaise,
        currency: params.prefillTerms?.currency || "INR",
        contentDeadline,
        postingDate,
        usageRightsDays: params.prefillTerms?.usageRightsDays ?? 30,
        exclusivityDays: params.prefillTerms?.exclusivityDays ?? 0,
        revisionCount: params.prefillTerms?.revisionCount ?? 1,
        notes: params.prefillTerms?.notes || "Initial proposal v1 created upon deal initiation.",
        dealTitle: params.prefillTerms?.dealTitle || params.title,
        collabType,
        barterDetails: params.prefillTerms?.barterDetails || null,
        timelines: params.prefillTerms?.timelines || null,
        paidAdsPermission: Boolean(params.prefillTerms?.paidAdsPermission),
        cancellationTerms: params.prefillTerms?.cancellationTerms || null,
        status: "pending",
      })
      .returning();

    await tx
      .update(dealsTable)
      .set({ activeProposalId: v1Proposal.id })
      .where(eq(dealsTable.id, deal.id));

    await tx.insert(dealActivityTable).values({
      dealId: deal.id,
      actorId: initiatorUserId,
      actorParty: initiatorParty,
      action: "DEAL_ROOM_INITIALIZED",
      description: `${initiatorParty === "creator" ? "Creator" : "Brand"} proposed initial terms version 1`,
      metadata: {
        source: params.collaborationRequestId
          ? "direct_invite"
          : params.applicationId
            ? "application"
            : "direct_proposal",
        collaborationRequestId: params.collaborationRequestId,
        applicationId: params.applicationId,
        collabType,
        pricePaise,
      },
    });

    // Notify counterparty in real-time
    try {
      const targetUserId = initiatorParty === "creator" ? brandUserId : creatorUserId;
      const initiatorName =
        initiatorParty === "creator"
          ? (influencer as any).name || "A creator"
          : (brand as any).name || "A brand";
      await sendNotification(
        targetUserId,
        "deal_proposal_received",
        "New Deal Proposal",
        `${initiatorName} proposed a new ${collabType} collaboration "${params.title}".`
      );
    } catch (notifErr) {
      console.error("[DEAL INIT NOTIFICATION ERROR]", notifErr);
    }

    return {
      ...deal,
      activeProposalId: v1Proposal.id,
    };
  });
}
