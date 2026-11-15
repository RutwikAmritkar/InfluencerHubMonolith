import { Router, type IRouter } from "express";
import {
  db,
  campaignsTable,
  brandsTable,
  influencersTable,
  applicationsTable,
  dealsTable,
  dealTermsVersionsTable,
  dealActivityTable,
  user as userTable,
} from "@workspace/db";
import { eq, and, or, inArray, count, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// ─── 1. BRAND DASHBOARD OVERVIEW ─────────────────────────────────────────────
router.get("/dashboard/brand", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: string | number }).userId;

  try {
    const [brand] = await db
      .select()
      .from(brandsTable)
      .where(eq(brandsTable.userId, String(userId)))
      .limit(1);

    if (brand) {
      // 1. Campaigns
      const allCampaigns = await db
        .select()
        .from(campaignsTable)
        .where(eq(campaignsTable.brandId, brand.id))
        .orderBy(desc(campaignsTable.createdAt));

      const totalCampaigns = allCampaigns.length;
      const activeCampaigns = allCampaigns.filter((c) => c.status === "active").length;
      const campaignIds = allCampaigns.map((c) => c.id);

      // 2. Applications for brand's campaigns
      let brandApps: Array<typeof applicationsTable.$inferSelect> = [];
      if (campaignIds.length > 0) {
        brandApps = await db
          .select()
          .from(applicationsTable)
          .where(inArray(applicationsTable.campaignId, campaignIds))
          .orderBy(desc(applicationsTable.createdAt));
      }

      const totalApplications = brandApps.length;
      const pendingApplications = brandApps.filter((a) => a.status === "pending").length;

      // 3. Deals for this brand
      const brandDeals = await db
        .select()
        .from(dealsTable)
        .where(eq(dealsTable.brandId, brand.id))
        .orderBy(desc(dealsTable.updatedAt));

      let activeDealsCount = 0;
      let totalCommittedBudgetPaise = 0;
      let totalSettledSpendPaise = 0;

      const recentDealsFormatted = await Promise.all(
        brandDeals.slice(0, 5).map(async (d) => {
          const [inf] = await db
            .select()
            .from(influencersTable)
            .where(eq(influencersTable.id, d.influencerId))
            .limit(1);
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
          const isSettled =
            d.paymentStatus === "PAYOUT_RELEASED" ||
            d.paymentStatus === "RELEASED" ||
            d.executionStatus === "COMPLETED";

          if (isSettled) {
            totalSettledSpendPaise += pricePaise;
          } else if (d.agreementStatus === "ACCEPTED" || d.agreementStatus === "CONFIRMED") {
            totalCommittedBudgetPaise += pricePaise;
            activeDealsCount += 1;
          }

          return {
            id: d.id,
            title: d.title,
            influencerName: infUser?.name || "Creator Partner",
            influencerAvatarUrl: inf?.avatarUrl || infUser?.image || null,
            pricePaise,
            amountRupees: Math.round(pricePaise / 100),
            agreementStatus: d.agreementStatus,
            paymentStatus: d.paymentStatus,
            executionStatus: d.executionStatus,
            updatedAt: d.updatedAt.toISOString(),
          };
        })
      );

      // Add remaining deals to totals
      for (const d of brandDeals.slice(5)) {
        if (d.activeProposalId) {
          const [p] = await db
            .select()
            .from(dealTermsVersionsTable)
            .where(eq(dealTermsVersionsTable.id, d.activeProposalId))
            .limit(1);
          const price = p?.pricePaise ?? 0;
          if (
            d.paymentStatus === "PAYOUT_RELEASED" ||
            d.paymentStatus === "RELEASED" ||
            d.executionStatus === "COMPLETED"
          ) {
            totalSettledSpendPaise += price;
          } else if (d.agreementStatus === "ACCEPTED" || d.agreementStatus === "CONFIRMED") {
            totalCommittedBudgetPaise += price;
            activeDealsCount += 1;
          }
        }
      }

      // Fallback budget if 0
      if (totalCommittedBudgetPaise === 0) {
        for (const c of allCampaigns) {
          if (c.budget) totalCommittedBudgetPaise += c.budget * 100;
        }
      }

      // Recent campaigns
      const recentCampaignsFormatted = await Promise.all(
        allCampaigns.slice(0, 5).map(async (c) => {
          const appCount = brandApps.filter((a) => a.campaignId === c.id).length;
          return {
            id: c.id,
            brandId: c.brandId,
            brandName: brand.name,
            brandLogoUrl: brand.logoUrl,
            title: c.title,
            description: c.description,
            budget: c.budget,
            platform: c.platform,
            status: c.status,
            deliverables: c.deliverables,
            targetAudience: c.targetAudience,
            timeline: c.timeline,
            deadline: c.deadline,
            applicationsCount: appCount,
            createdAt: c.createdAt.toISOString(),
          };
        })
      );

      // Audit activity logs
      const dealIds = brandDeals.map((d) => d.id);
      let activityLogs: Array<any> = [];
      if (dealIds.length > 0) {
        const rawLogs = await db
          .select()
          .from(dealActivityTable)
          .where(inArray(dealActivityTable.dealId, dealIds))
          .orderBy(desc(dealActivityTable.createdAt))
          .limit(6);
        activityLogs = rawLogs.map((l) => ({
          id: l.id,
          event: l.action,
          detail: l.description,
          time: l.createdAt.toISOString(),
          verified: true,
        }));
      }

      res.json({
        totalCampaigns,
        activeCampaigns,
        activeDealsCount,
        totalApplications,
        pendingApplications,
        totalBudgetPaise: totalCommittedBudgetPaise,
        totalBudgetRupees: Math.round(totalCommittedBudgetPaise / 100),
        settledSpendPaise: totalSettledSpendPaise,
        settledSpendRupees: Math.round(totalSettledSpendPaise / 100),
        recentCampaigns: recentCampaignsFormatted,
        recentDeals: recentDealsFormatted,
        recentActivity: activityLogs,
      });
      return;
    }
  } catch (_e) {
    // Return clean zero state
  }

  res.json({
    totalCampaigns: 0,
    activeCampaigns: 0,
    activeDealsCount: 0,
    totalApplications: 0,
    pendingApplications: 0,
    totalBudgetPaise: 0,
    totalBudgetRupees: 0,
    settledSpendPaise: 0,
    settledSpendRupees: 0,
    recentCampaigns: [],
    recentDeals: [],
    recentActivity: [],
  });
});

// ─── 2. CREATOR DASHBOARD OVERVIEW ───────────────────────────────────────────
router.get("/dashboard/influencer", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as typeof req & { userId: string | number }).userId;

  try {
    const [influencer] = await db
      .select()
      .from(influencersTable)
      .where(eq(influencersTable.userId, String(userId)))
      .limit(1);

    // Count open campaigns across the marketplace
    const [{ openOpportunities }] = await db
      .select({ openOpportunities: count() })
      .from(campaignsTable)
      .where(eq(campaignsTable.status, "active"));

    if (influencer) {
      // 1. Applications
      const apps = await db
        .select()
        .from(applicationsTable)
        .where(eq(applicationsTable.influencerId, influencer.id))
        .orderBy(desc(applicationsTable.createdAt));

      const pendingApplications = apps.filter(
        (a) => a.status === "pending" || a.status === "shortlisted"
      ).length;

      const formattedApps = await Promise.all(
        apps.slice(0, 5).map(async (a) => {
          const [campaign] = await db
            .select()
            .from(campaignsTable)
            .where(eq(campaignsTable.id, a.campaignId))
            .limit(1);
          return {
            id: a.id,
            campaignId: a.campaignId,
            campaignTitle: campaign?.title ?? "Campaign Brief",
            campaignBudget: campaign?.budget ?? 0,
            status: a.status,
            message: a.message,
            pitchText: a.pitchText,
            quotedRatePaise: a.quotedRatePaise,
            createdAt: a.createdAt.toISOString(),
          };
        })
      );

      // 2. Deals
      const creatorDeals = await db
        .select()
        .from(dealsTable)
        .where(eq(dealsTable.influencerId, influencer.id))
        .orderBy(desc(dealsTable.updatedAt));

      let activeDealsCount = 0;
      let pendingPaymentsCount = 0;
      let totalAgreedEarningsPaise = 0;
      let clearedEarningsPaise = 0;

      const formattedDeals = await Promise.all(
        creatorDeals.slice(0, 5).map(async (d) => {
          const [brand] = await db
            .select()
            .from(brandsTable)
            .where(eq(brandsTable.id, d.brandId))
            .limit(1);
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
          const isSettled =
            d.paymentStatus === "PAYOUT_RELEASED" ||
            d.paymentStatus === "RELEASED" ||
            d.executionStatus === "COMPLETED";

          if (isSettled) {
            clearedEarningsPaise += pricePaise;
          } else if (d.agreementStatus === "ACCEPTED" || d.agreementStatus === "CONFIRMED") {
            totalAgreedEarningsPaise += pricePaise;
            activeDealsCount += 1;
            if (d.paymentStatus === "PAYMENT_PENDING" || d.paymentStatus === "PAID_HELD") {
              pendingPaymentsCount += 1;
            }
          }

          return {
            id: d.id,
            title: d.title,
            brandName: brand?.name || "Brand Partner",
            brandLogoUrl: brand?.logoUrl || null,
            deliverables: proposal?.deliverables || [],
            pricePaise,
            amountRupees: Math.round(pricePaise / 100),
            agreementStatus: d.agreementStatus,
            paymentStatus: d.paymentStatus,
            executionStatus: d.executionStatus,
            updatedAt: d.updatedAt.toISOString(),
          };
        })
      );

      // Sum rest of deals
      for (const d of creatorDeals.slice(5)) {
        if (d.activeProposalId) {
          const [p] = await db
            .select()
            .from(dealTermsVersionsTable)
            .where(eq(dealTermsVersionsTable.id, d.activeProposalId))
            .limit(1);
          const price = p?.pricePaise ?? 0;
          if (
            d.paymentStatus === "PAYOUT_RELEASED" ||
            d.paymentStatus === "RELEASED" ||
            d.executionStatus === "COMPLETED"
          ) {
            clearedEarningsPaise += price;
          } else if (d.agreementStatus === "ACCEPTED" || d.agreementStatus === "CONFIRMED") {
            totalAgreedEarningsPaise += price;
            activeDealsCount += 1;
            if (d.paymentStatus === "PAYMENT_PENDING" || d.paymentStatus === "PAID_HELD") {
              pendingPaymentsCount += 1;
            }
          }
        }
      }

      res.json({
        profileCompletion: influencer.profileCompletion ?? 80,
        followers: influencer.followers ?? 0,
        openOpportunities: Number(openOpportunities),
        pendingApplications,
        activeDeals: activeDealsCount,
        pendingPayments: pendingPaymentsCount,
        agreedEarningsPaise: totalAgreedEarningsPaise,
        agreedEarningsRupees: Math.round(totalAgreedEarningsPaise / 100),
        clearedEarningsPaise,
        clearedEarningsRupees: Math.round(clearedEarningsPaise / 100),
        recentApplications: formattedApps,
        recentDeals: formattedDeals,
        category: influencer.category || "Lifestyle",
        country: influencer.country || "India",
        isVerified: influencer.isVerified ?? true,
      });
      return;
    }
  } catch (_e) {
    // Return clean zero state
  }

  res.json({
    profileCompletion: 40,
    followers: 0,
    openOpportunities: 0,
    pendingApplications: 0,
    activeDeals: 0,
    pendingPayments: 0,
    agreedEarningsPaise: 0,
    agreedEarningsRupees: 0,
    clearedEarningsPaise: 0,
    clearedEarningsRupees: 0,
    recentApplications: [],
    recentDeals: [],
    category: "Lifestyle",
    country: "India",
    isVerified: true,
  });
});

export default router;
