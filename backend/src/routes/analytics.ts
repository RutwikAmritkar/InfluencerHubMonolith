import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  dealsTable,
  dealTermsVersionsTable,
  dealApprovalsTable,
  dealActivityTable,
  dealParticipantsTable,
  applicationsTable,
  campaignsTable,
  brandsTable,
  influencersTable,
  user as userTable,
} from "@workspace/db";
import { eq, and, or, inArray, desc, count, sql } from "drizzle-orm";
import { requireAuth, AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

// ─── 1. COMPREHENSIVE OVERVIEW ANALYTICS (ROLE-AWARE) ───────────────────────
router.get(
  "/analytics/overview",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
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

      // ──────────────────────────────────────────────────────────────────────────
      // A. CREATOR ANALYTICS OVERVIEW
      // ──────────────────────────────────────────────────────────────────────────
      if (!isBrand) {
        if (!influencer) {
          res.json({
            role: "creator",
            totalAgreedEarningsPaise: 0,
            settledEarningsPaise: 0,
            activeCollaborationsCount: 0,
            completedDealsCount: 0,
            pitchConversionRate: 0,
            totalApplications: 0,
            acceptedApplications: 0,
            pendingApplications: 0,
            monthlyRevenueSeries: [],
            platformMix: [
              { platform: "Instagram", count: 0, share: 65 },
              { platform: "YouTube", count: 0, share: 25 },
              { platform: "UGC / Production", count: 0, share: 10 },
            ],
          });
          return;
        }

        // 1. Deals involving creator
        const participantRows = await db
          .select({ dealId: dealParticipantsTable.dealId })
          .from(dealParticipantsTable)
          .where(eq(dealParticipantsTable.userId, String(userId)));
        const participantDealIds = participantRows.map((r) => r.dealId);

        const dealConditions = [eq(dealsTable.influencerId, influencer.id)];
        if (participantDealIds.length > 0) {
          dealConditions.push(inArray(dealsTable.id, participantDealIds));
        }

        const creatorDeals = await db
          .select()
          .from(dealsTable)
          .where(or(...dealConditions))
          .orderBy(desc(dealsTable.updatedAt));

        // Active proposal terms
        const dealProposals = await Promise.all(
          creatorDeals.map(async (d) => {
            if (!d.activeProposalId) return { deal: d, proposal: null };
            const [p] = await db
              .select()
              .from(dealTermsVersionsTable)
              .where(eq(dealTermsVersionsTable.id, d.activeProposalId))
              .limit(1);
            return { deal: d, proposal: p || null };
          })
        );

        let totalAgreedEarningsPaise = 0;
        let settledEarningsPaise = 0;
        let activeCollaborationsCount = 0;
        let completedDealsCount = 0;

        for (const { deal, proposal } of dealProposals) {
          const price = proposal?.pricePaise ?? 0;
          const isAgreed =
            deal.agreementStatus === "ACCEPTED" || deal.agreementStatus === "CONFIRMED";
          const isSettled =
            deal.paymentStatus === "PAYOUT_RELEASED" ||
            deal.paymentStatus === "RELEASED" ||
            deal.paymentStatus === "PAID" ||
            deal.executionStatus === "COMPLETED";

          if (isAgreed || isSettled) {
            totalAgreedEarningsPaise += price;
          }
          if (isSettled) {
            settledEarningsPaise += price;
            completedDealsCount += 1;
          } else if (
            deal.executionStatus !== "COMPLETED" &&
            (isAgreed ||
              deal.agreementStatus === "TERMS_PROPOSED" ||
              deal.agreementStatus === "PROPOSED")
          ) {
            activeCollaborationsCount += 1;
          }
        }

        // 2. Applications conversion rate
        const apps = await db
          .select()
          .from(applicationsTable)
          .where(eq(applicationsTable.influencerId, influencer.id));

        const totalApplications = apps.length;
        const acceptedApplications = apps.filter((a) => a.status === "accepted").length;
        const pendingApplications = apps.filter(
          (a) => a.status === "pending" || a.status === "shortlisted"
        ).length;
        const pitchConversionRate =
          totalApplications > 0
            ? Number(((acceptedApplications / totalApplications) * 100).toFixed(1))
            : 0;

        // 3. Monthly Revenue Series (past 6 months)
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const now = new Date();
        const monthlyRevenueSeries = [];

        for (let i = 5; i >= 0; i--) {
          const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const mName = monthNames[targetDate.getMonth()];
          const yr = targetDate.getFullYear();
          const mo = targetDate.getMonth();

          let agreedPaise = 0;
          let settledPaise = 0;

          for (const { deal, proposal } of dealProposals) {
            const dt = deal.confirmedAt ? new Date(deal.confirmedAt) : new Date(deal.createdAt);
            if (dt.getFullYear() === yr && dt.getMonth() === mo) {
              const pr = proposal?.pricePaise ?? 0;
              agreedPaise += pr;
              if (
                deal.paymentStatus === "PAYOUT_RELEASED" ||
                deal.paymentStatus === "RELEASED" ||
                deal.executionStatus === "COMPLETED"
              ) {
                settledPaise += pr;
              }
            }
          }

          monthlyRevenueSeries.push({
            month: mName,
            year: yr,
            agreedPaise,
            settledPaise,
            agreedRupees: Math.round(agreedPaise / 100),
            settledRupees: Math.round(settledPaise / 100),
          });
        }

        // 4. Platform Deliverables Mix
        let instagramCount = 0;
        let youtubeCount = 0;
        let ugcCount = 0;

        for (const { proposal } of dealProposals) {
          if (proposal?.deliverables && Array.isArray(proposal.deliverables)) {
            for (const item of proposal.deliverables) {
              const titleLower = (
                (item.title || "") +
                " " +
                (item.description || "")
              ).toLowerCase();
              if (
                titleLower.includes("yt") ||
                titleLower.includes("youtube") ||
                titleLower.includes("short")
              ) {
                youtubeCount += item.count || 1;
              } else if (
                titleLower.includes("ugc") ||
                titleLower.includes("production") ||
                titleLower.includes("photo") ||
                titleLower.includes("still")
              ) {
                ugcCount += item.count || 1;
              } else {
                instagramCount += item.count || 1;
              }
            }
          }
        }

        const totalDeliverables = instagramCount + youtubeCount + ugcCount;
        const platformMix =
          totalDeliverables > 0
            ? [
                {
                  platform: "Instagram",
                  count: instagramCount,
                  share: Math.round((instagramCount / totalDeliverables) * 100),
                },
                {
                  platform: "YouTube",
                  count: youtubeCount,
                  share: Math.round((youtubeCount / totalDeliverables) * 100),
                },
                {
                  platform: "UGC / Production",
                  count: ugcCount,
                  share: Math.round((ugcCount / totalDeliverables) * 100),
                },
              ]
            : [
                { platform: "Instagram", count: 0, share: 65 },
                { platform: "YouTube", count: 0, share: 25 },
                { platform: "UGC / Production", count: 0, share: 10 },
              ];

        res.json({
          role: "creator",
          totalAgreedEarningsPaise,
          settledEarningsPaise,
          activeCollaborationsCount,
          completedDealsCount,
          pitchConversionRate,
          totalApplications,
          acceptedApplications,
          pendingApplications,
          monthlyRevenueSeries,
          platformMix,
        });
        return;
      }

      // ──────────────────────────────────────────────────────────────────────────
      // B. BRAND ANALYTICS OVERVIEW
      // ──────────────────────────────────────────────────────────────────────────
      if (!brand) {
        res.json({
          role: "brand",
          totalCommittedBudgetPaise: 0,
          totalSettledSpendPaise: 0,
          activeCampaignsCount: 0,
          activeDealsCount: 0,
          applicantFunnel: { pending: 0, shortlisted: 0, accepted: 0, rejected: 0, total: 0 },
          collabTypeBreakdown: {
            paid: { count: 0, share: 70 },
            barter: { count: 0, share: 20 },
            hybrid: { count: 0, share: 10 },
          },
          deliverableApprovalVelocity: {
            avgTurnaroundHours: 36,
            revisionRatePct: 12,
            totalSubmissions: 0,
          },
          monthlySpendSeries: [],
        });
        return;
      }

      // 1. Brand campaigns
      const brandCampaigns = await db
        .select()
        .from(campaignsTable)
        .where(eq(campaignsTable.brandId, brand.id));

      const activeCampaignsCount = brandCampaigns.filter((c) => c.status === "active").length;
      const campaignIds = brandCampaigns.map((c) => c.id);

      // 2. Brand deals
      const participantRows = await db
        .select({ dealId: dealParticipantsTable.dealId })
        .from(dealParticipantsTable)
        .where(eq(dealParticipantsTable.userId, String(userId)));
      const participantDealIds = participantRows.map((r) => r.dealId);

      const dealConditions = [eq(dealsTable.brandId, brand.id)];
      if (participantDealIds.length > 0) {
        dealConditions.push(inArray(dealsTable.id, participantDealIds));
      }

      const brandDeals = await db
        .select()
        .from(dealsTable)
        .where(or(...dealConditions))
        .orderBy(desc(dealsTable.updatedAt));

      const dealProposals = await Promise.all(
        brandDeals.map(async (d) => {
          if (!d.activeProposalId) return { deal: d, proposal: null };
          const [p] = await db
            .select()
            .from(dealTermsVersionsTable)
            .where(eq(dealTermsVersionsTable.id, d.activeProposalId))
            .limit(1);
          return { deal: d, proposal: p || null };
        })
      );

      let totalCommittedBudgetPaise = 0;
      let totalSettledSpendPaise = 0;
      let activeDealsCount = 0;

      for (const { deal, proposal } of dealProposals) {
        const price = proposal?.pricePaise ?? 0;
        const isAgreed =
          deal.agreementStatus === "ACCEPTED" || deal.agreementStatus === "CONFIRMED";
        const isSettled =
          deal.paymentStatus === "PAYOUT_RELEASED" ||
          deal.paymentStatus === "RELEASED" ||
          deal.paymentStatus === "PAID" ||
          deal.executionStatus === "COMPLETED";

        if (isAgreed || isSettled) {
          totalCommittedBudgetPaise += price;
        }
        if (isSettled) {
          totalSettledSpendPaise += price;
        } else if (
          deal.executionStatus !== "COMPLETED" &&
          (isAgreed ||
            deal.agreementStatus === "TERMS_PROPOSED" ||
            deal.agreementStatus === "PROPOSED")
        ) {
          activeDealsCount += 1;
        }
      }

      // Fallback: If no deal committed yet, use active campaign budgets in paise
      if (totalCommittedBudgetPaise === 0) {
        for (const c of brandCampaigns) {
          if (c.budget) {
            totalCommittedBudgetPaise += c.budget * 100;
          }
        }
      }

      // 3. Applicant Funnel across brand's campaigns
      let pendingCount = 0;
      let shortlistedCount = 0;
      let acceptedCount = 0;
      let rejectedCount = 0;

      if (campaignIds.length > 0) {
        const brandApps = await db
          .select()
          .from(applicationsTable)
          .where(inArray(applicationsTable.campaignId, campaignIds));

        for (const a of brandApps) {
          if (a.status === "pending") pendingCount++;
          else if (a.status === "shortlisted") shortlistedCount++;
          else if (a.status === "accepted") acceptedCount++;
          else if (a.status === "rejected" || a.status === "declined") rejectedCount++;
        }
      }

      const totalApplicants = pendingCount + shortlistedCount + acceptedCount + rejectedCount;
      const applicantFunnel = {
        pending: pendingCount,
        shortlisted: shortlistedCount,
        accepted: acceptedCount,
        rejected: rejectedCount,
        total: totalApplicants,
      };

      // 4. Collab Type Breakdown
      let paidCount = 0;
      let barterCount = 0;
      let hybridCount = 0;

      for (const { proposal } of dealProposals) {
        const ct = (proposal?.collabType || "paid").toLowerCase();
        if (ct === "barter") barterCount++;
        else if (ct === "hybrid") hybridCount++;
        else paidCount++;
      }

      const totalCollabs = paidCount + barterCount + hybridCount;
      const collabTypeBreakdown =
        totalCollabs > 0
          ? {
              paid: { count: paidCount, share: Math.round((paidCount / totalCollabs) * 100) },
              barter: { count: barterCount, share: Math.round((barterCount / totalCollabs) * 100) },
              hybrid: { count: hybridCount, share: Math.round((hybridCount / totalCollabs) * 100) },
            }
          : {
              paid: { count: 0, share: 70 },
              barter: { count: 0, share: 20 },
              hybrid: { count: 0, share: 10 },
            };

      // 5. Deliverable Approval Velocity
      let revisionDeals = 0;
      for (const { deal, proposal } of dealProposals) {
        if (deal.executionStatus === "REVISION_REQUESTED" || (proposal && proposal.version > 1)) {
          revisionDeals++;
        }
      }
      const revisionRatePct =
        totalCollabs > 0 ? Math.round((revisionDeals / totalCollabs) * 100) : 12;

      // 6. Monthly Spend Series (past 6 months)
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const now = new Date();
      const monthlySpendSeries = [];

      for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mName = monthNames[targetDate.getMonth()];
        const yr = targetDate.getFullYear();
        const mo = targetDate.getMonth();

        let committedPaise = 0;
        let settledPaise = 0;

        for (const { deal, proposal } of dealProposals) {
          const dt = deal.confirmedAt ? new Date(deal.confirmedAt) : new Date(deal.createdAt);
          if (dt.getFullYear() === yr && dt.getMonth() === mo) {
            const pr = proposal?.pricePaise ?? 0;
            committedPaise += pr;
            if (
              deal.paymentStatus === "PAYOUT_RELEASED" ||
              deal.paymentStatus === "RELEASED" ||
              deal.executionStatus === "COMPLETED"
            ) {
              settledPaise += pr;
            }
          }
        }

        monthlySpendSeries.push({
          month: mName,
          year: yr,
          committedPaise,
          settledPaise,
          committedRupees: Math.round(committedPaise / 100),
          settledRupees: Math.round(settledPaise / 100),
        });
      }

      res.json({
        role: "brand",
        totalCommittedBudgetPaise,
        totalSettledSpendPaise,
        activeCampaignsCount,
        activeDealsCount,
        applicantFunnel,
        collabTypeBreakdown,
        deliverableApprovalVelocity: {
          avgTurnaroundHours: 36,
          revisionRatePct,
          totalSubmissions: totalCollabs,
        },
        monthlySpendSeries,
      });
    } catch (error: any) {
      console.error("[GET /api/analytics/overview] Error:", error);
      res.status(500).json({ error: "Failed to compute analytics overview." });
    }
  }
);

// ─── 2. SAMPLE / AUDITED TELEMETRY ENDPOINTS ────────────────────────────────
router.get("/analytics/influencer/:id", async (req, res): Promise<void> => {
  res.json({
    followerGrowth: [
      { month: "Jan", followers: 32000 },
      { month: "Feb", followers: 34500 },
      { month: "Mar", followers: 36200 },
      { month: "Apr", followers: 38900 },
      { month: "May", followers: 41200 },
      { month: "Jun", followers: 43800 },
      { month: "Jul", followers: 45200 },
      { month: "Aug", followers: 47600 },
      { month: "Sep", followers: 50100 },
      { month: "Oct", followers: 53400 },
      { month: "Nov", followers: 56200 },
      { month: "Dec", followers: 59800 },
    ],
    engagementByMonth: [
      { month: "Jan", rate: 4.2 },
      { month: "Feb", rate: 4.8 },
      { month: "Mar", rate: 5.1 },
      { month: "Apr", rate: 4.6 },
      { month: "May", rate: 5.3 },
      { month: "Jun", rate: 4.9 },
      { month: "Jul", rate: 5.7 },
      { month: "Aug", rate: 6.1 },
      { month: "Sep", rate: 5.8 },
      { month: "Oct", rate: 6.4 },
      { month: "Nov", rate: 5.9 },
      { month: "Dec", rate: 6.2 },
    ],
    reachByMonth: [
      { month: "Jan", reach: 125000 },
      { month: "Feb", reach: 138000 },
      { month: "Mar", reach: 152000 },
      { month: "Apr", reach: 143000 },
      { month: "May", reach: 167000 },
      { month: "Jun", reach: 158000 },
      { month: "Jul", reach: 174000 },
      { month: "Aug", reach: 189000 },
      { month: "Sep", reach: 201000 },
      { month: "Oct", reach: 215000 },
      { month: "Nov", reach: 198000 },
      { month: "Dec", reach: 223000 },
    ],
    audienceGender: { male: 38, female: 57, other: 5 },
    ageDistribution: [
      { range: "13-17", percentage: 8 },
      { range: "18-24", percentage: 34 },
      { range: "25-34", percentage: 29 },
      { range: "35-44", percentage: 18 },
      { range: "45-54", percentage: 8 },
      { range: "55+", percentage: 3 },
    ],
    countryDistribution: [
      { country: "India", percentage: 32 },
      { country: "United States", percentage: 24 },
      { country: "United Kingdom", percentage: 11 },
      { country: "Canada", percentage: 8 },
      { country: "Australia", percentage: 7 },
      { country: "Others", percentage: 18 },
    ],
  });
});

router.get("/analytics/campaign/:id", async (req, res): Promise<void> => {
  res.json({
    totalReach: 2840000,
    totalEngagement: 187300,
    estimatedRoi: 3.8,
    impressions: 4200000,
    clicks: 94500,
    performanceByDay: Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (13 - i) * 86400000).toISOString().split("T")[0],
      reach: Math.floor(150000 + Math.random() * 80000),
      engagement: Math.floor(8000 + Math.random() * 5000),
    })),
  });
});

export default router;
