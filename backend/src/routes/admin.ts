import { Router, type IRouter, Request, Response } from "express";
import {
  db,
  user as userTable,
  session as sessionTable,
  brandsTable,
  influencersTable,
  campaignsTable,
  applicationsTable,
  dealsTable,
  dealTermsVersionsTable,
  adminAuditLogsTable,
  adminRolesTable,
  adminPermissionsTable,
  adminRolePermissionsTable,
  adminUsersTable,
  platformActivityEventsTable,
  moderationReportsTable,
  platformSettingsTable,
  paymentOrdersTable,
  paymentLedgerEntriesTable,
} from "@workspace/db";
import { eq, desc, asc, sql, and, or, ilike, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import {
  requireAdmin,
  requirePermission,
  logAdminAction,
  AdminRequest,
} from "../middlewares/admin";

const router: IRouter = Router();

router.use("/admin", requireAuth as any);
router.use("/admin", requireAdmin as any);

router.get("/admin/me", async (req: Request, res: Response): Promise<void> => {
  const adminReq = req as AdminRequest;
  res.json({
    user: adminReq.user,
    admin: adminReq.adminUser,
  });
});

router.get("/admin/overview", async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      userCount,
      creatorCount,
      brandCount,
      adminCount,
      onlineCount,
      dauCount,
      wauCount,
      mauCount,
      reg24h,
      reg7d,
      reg30d,
      pendingVerif,
      suspendedCount,
      activeCampaignCount,
      totalAppCount,
      activeDealCount,
      totalProposalCount,
      grossVolume,
      releasedPayouts,
      pendingEscrow,
      openReportsCount,
      recentActivity,
      recentAuditLogs,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(userTable),
      db.select({ count: sql<number>`count(*)::int` }).from(influencersTable),
      db.select({ count: sql<number>`count(*)::int` }).from(brandsTable),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(adminUsersTable)
        .where(eq(adminUsersTable.isActive, true)),
      db
        .select({ count: sql<number>`count(distinct ${sessionTable.userId})::int` })
        .from(sessionTable)
        .where(sql`${sessionTable.expiresAt} > now()`),
      db
        .select({ count: sql<number>`count(distinct ${sessionTable.userId})::int` })
        .from(sessionTable)
        .where(
          sql`${sessionTable.updatedAt} >= now() - interval '24 hours' or ${sessionTable.createdAt} >= now() - interval '24 hours'`
        ),
      db
        .select({ count: sql<number>`count(distinct ${sessionTable.userId})::int` })
        .from(sessionTable)
        .where(
          sql`${sessionTable.updatedAt} >= now() - interval '7 days' or ${sessionTable.createdAt} >= now() - interval '7 days'`
        ),
      db
        .select({ count: sql<number>`count(distinct ${sessionTable.userId})::int` })
        .from(sessionTable)
        .where(
          sql`${sessionTable.updatedAt} >= now() - interval '30 days' or ${sessionTable.createdAt} >= now() - interval '30 days'`
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(userTable)
        .where(sql`${userTable.createdAt} >= now() - interval '24 hours'`),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(userTable)
        .where(sql`${userTable.createdAt} >= now() - interval '7 days'`),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(userTable)
        .where(sql`${userTable.createdAt} >= now() - interval '30 days'`),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(influencersTable)
        .where(eq(influencersTable.isVerified, false)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(userTable)
        .where(eq(userTable.banned, true)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(campaignsTable)
        .where(eq(campaignsTable.status, "active")),
      db.select({ count: sql<number>`count(*)::int` }).from(applicationsTable),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(dealsTable)
        .where(
          or(
            eq(dealsTable.agreementStatus, "TERMS_CONFIRMED"),
            eq(dealsTable.executionStatus, "IN_PROGRESS"),
            eq(dealsTable.paymentStatus, "IN_ESCROW")
          )
        ),
      db.select({ count: sql<number>`count(*)::int` }).from(dealTermsVersionsTable),
      db
        .select({
          total: sql<number>`coalesce(sum(${dealTermsVersionsTable.pricePaise}), 0)::bigint`,
        })
        .from(dealsTable)
        .innerJoin(
          dealTermsVersionsTable,
          eq(dealTermsVersionsTable.id, dealsTable.activeProposalId)
        )
        .where(eq(dealsTable.agreementStatus, "TERMS_CONFIRMED")),
      db
        .select({
          total: sql<number>`coalesce(sum(${dealTermsVersionsTable.pricePaise}), 0)::bigint`,
        })
        .from(dealsTable)
        .innerJoin(
          dealTermsVersionsTable,
          eq(dealTermsVersionsTable.id, dealsTable.activeProposalId)
        )
        .where(eq(dealsTable.paymentStatus, "RELEASED")),
      db
        .select({
          total: sql<number>`coalesce(sum(${dealTermsVersionsTable.pricePaise}), 0)::bigint`,
        })
        .from(dealsTable)
        .innerJoin(
          dealTermsVersionsTable,
          eq(dealTermsVersionsTable.id, dealsTable.activeProposalId)
        )
        .where(eq(dealsTable.paymentStatus, "IN_ESCROW")),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(moderationReportsTable)
        .where(
          or(
            eq(moderationReportsTable.status, "open"),
            eq(moderationReportsTable.status, "investigating")
          )
        ),
      db
        .select({
          id: platformActivityEventsTable.id,
          actorUserId: platformActivityEventsTable.actorUserId,
          actorParty: platformActivityEventsTable.actorParty,
          eventType: platformActivityEventsTable.eventType,
          entityType: platformActivityEventsTable.entityType,
          entityId: platformActivityEventsTable.entityId,
          summary: platformActivityEventsTable.summary,
          metadata: platformActivityEventsTable.metadata,
          createdAt: platformActivityEventsTable.createdAt,
          actorName: userTable.name,
          actorEmail: userTable.email,
          actorImage: userTable.image,
        })
        .from(platformActivityEventsTable)
        .leftJoin(userTable, eq(userTable.id, platformActivityEventsTable.actorUserId))
        .orderBy(desc(platformActivityEventsTable.createdAt))
        .limit(10),
      db
        .select({
          id: adminAuditLogsTable.id,
          adminUserId: adminAuditLogsTable.adminUserId,
          adminName: userTable.name,
          adminEmail: userTable.email,
          action: adminAuditLogsTable.action,
          targetEntityType: adminAuditLogsTable.targetEntityType,
          targetEntityId: adminAuditLogsTable.targetEntityId,
          reason: adminAuditLogsTable.reason,
          createdAt: adminAuditLogsTable.createdAt,
        })
        .from(adminAuditLogsTable)
        .leftJoin(userTable, eq(userTable.id, adminAuditLogsTable.adminUserId))
        .orderBy(desc(adminAuditLogsTable.createdAt))
        .limit(6),
    ]);

    const activeSessions = await db
      .select({ userId: sessionTable.userId })
      .from(sessionTable)
      .where(sql`${sessionTable.expiresAt} > now()`);
    const onlineUserIds = new Set(activeSessions.map((s) => s.userId));

    const enrichedActivity = recentActivity.map((ev) => ({
      ...ev,
      isOnline: ev.actorUserId ? onlineUserIds.has(ev.actorUserId) : false,
    }));

    res.json({
      metrics: {
        totalUsers: userCount[0]?.count ?? 0,
        totalCreators: creatorCount[0]?.count ?? 0,
        totalBrands: brandCount[0]?.count ?? 0,
        totalAdmins: adminCount[0]?.count ?? 0,
        onlineUsers: onlineCount[0]?.count ?? 0,
        dau: dauCount[0]?.count ?? 0,
        wau: wauCount[0]?.count ?? 0,
        mau: mauCount[0]?.count ?? 0,
        registrations24h: reg24h[0]?.count ?? 0,
        registrations7d: reg7d[0]?.count ?? 0,
        registrations30d: reg30d[0]?.count ?? 0,
        pendingVerifications: pendingVerif[0]?.count ?? 0,
        suspendedAccounts: suspendedCount[0]?.count ?? 0,
        activeCampaigns: activeCampaignCount[0]?.count ?? 0,
        totalApplications: totalAppCount[0]?.count ?? 0,
        activeDeals: activeDealCount[0]?.count ?? 0,
        totalProposals: totalProposalCount[0]?.count ?? 0,
        grossDealVolumePaise: Number(grossVolume[0]?.total ?? 0),
        releasedPayoutsPaise: Number(releasedPayouts[0]?.total ?? 0),
        pendingSettlementsPaise: Number(pendingEscrow[0]?.total ?? 0),
        openReports: openReportsCount[0]?.count ?? 0,
      },
      recentActivity: enrichedActivity,
      recentAuditLogs,
    });
  } catch (error) {
    console.error("[ADMIN OVERVIEW ERROR]", error);
    res.status(500).json({ error: "Failed to load platform overview metrics." });
  }
});

router.get("/admin/search", async (req: Request, res: Response): Promise<void> => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q || q.length < 2) {
      res.json({ users: [], creators: [], brands: [], campaigns: [], deals: [] });
      return;
    }

    const term = `%${q}%`;

    const [users, creators, brands, campaigns, deals] = await Promise.all([
      db
        .select({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          role: userTable.role,
        })
        .from(userTable)
        .where(or(ilike(userTable.name, term), ilike(userTable.email, term)))
        .limit(5),

      db
        .select({
          id: influencersTable.id,
          name: userTable.name,
          category: influencersTable.category,
          followers: influencersTable.followers,
        })
        .from(influencersTable)
        .innerJoin(userTable, eq(influencersTable.userId, userTable.id))
        .where(
          or(
            ilike(userTable.name, term),
            ilike(userTable.email, term),
            ilike(influencersTable.category, term)
          )
        )
        .limit(5),

      db
        .select({
          id: brandsTable.id,
          name: brandsTable.name,
          industry: brandsTable.industry,
        })
        .from(brandsTable)
        .where(or(ilike(brandsTable.name, term), ilike(brandsTable.industry, term)))
        .limit(5),

      db
        .select({
          id: campaignsTable.id,
          title: campaignsTable.title,
          platform: campaignsTable.platform,
          status: campaignsTable.status,
        })
        .from(campaignsTable)
        .where(or(ilike(campaignsTable.title, term), ilike(campaignsTable.platform, term)))
        .limit(5),

      db
        .select({
          id: dealsTable.id,
          title: dealsTable.title,
          agreementStatus: dealsTable.agreementStatus,
        })
        .from(dealsTable)
        .where(ilike(dealsTable.title, term))
        .limit(5),
    ]);

    res.json({
      users,
      creators,
      brands,
      campaigns,
      deals,
    });
  } catch (error) {
    console.error("[ADMIN GLOBAL SEARCH ERROR]", error);
    res.status(500).json({ error: "Failed to perform platform search." });
  }
});

router.get("/admin/users", async (req: Request, res: Response): Promise<void> => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const roleFilter = typeof req.query.role === "string" ? req.query.role.trim() : "all";
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const conditions: any[] = [];
    if (search) {
      conditions.push(
        or(ilike(userTable.name, `%${search}%`), ilike(userTable.email, `%${search}%`))
      );
    }
    if (roleFilter !== "all") {
      conditions.push(eq(userTable.role, roleFilter));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(userTable)
      .where(whereClause);

    const rows = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        role: userTable.role,
        country: userTable.country,
        banned: userTable.banned,
        banReason: userTable.banReason,
        createdAt: userTable.createdAt,
        creatorCategory: influencersTable.category,
        creatorFollowers: influencersTable.followers,
        brandCompany: brandsTable.name,
      })
      .from(userTable)
      .leftJoin(influencersTable, eq(influencersTable.userId, userTable.id))
      .leftJoin(brandsTable, eq(brandsTable.userId, userTable.id))
      .where(whereClause)
      .orderBy(desc(userTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      users: rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        role: r.role,
        country: r.country,
        isSuspended: Boolean(r.banned),
        banReason: r.banReason,
        createdAt: r.createdAt,
        details:
          r.role === "influencer"
            ? `${r.creatorCategory || "General"} • ${(r.creatorFollowers || 0).toLocaleString()} followers`
            : r.brandCompany || "Brand Workspace",
      })),
      total: totalRow?.count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[ADMIN USERS ERROR]", error);
    res.status(500).json({ error: "Failed to query users." });
  }
});

router.patch("/admin/users/:id/status", async (req: Request, res: Response): Promise<void> => {
  const adminReq = req as AdminRequest;
  const targetUserId = String(req.params.id);
  const { isSuspended, reason } = req.body;

  if (typeof isSuspended !== "boolean" || !reason || typeof reason !== "string" || !reason.trim()) {
    res.status(400).json({
      error: "Bad Request: 'isSuspended' (boolean) and a non-empty 'reason' string are mandatory.",
    });
    return;
  }

  const requiredPerm = isSuspended ? "admin.users.suspend" : "admin.users.reactivate";
  if (
    adminReq.adminUser?.roleSlug !== "super_admin" &&
    !adminReq.adminUser?.permissions.includes(requiredPerm)
  ) {
    res.status(403).json({ error: `Missing required permission: '${requiredPerm}'` });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, targetUserId))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Target user not found." });
      return;
    }

    const [updated] = await db
      .update(userTable)
      .set({
        banned: isSuspended,
        banReason: isSuspended ? reason.trim() : null,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, targetUserId))
      .returning();

    await logAdminAction({
      req: adminReq,
      action: isSuspended ? "USER_SUSPENDED" : "USER_REACTIVATED",
      targetEntityType: "user",
      targetEntityId: targetUserId,
      reason: reason.trim(),
      beforeState: { banned: existing.banned, banReason: existing.banReason },
      afterState: { banned: updated.banned, banReason: updated.banReason },
    });

    res.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        isSuspended: Boolean(updated.banned),
        banReason: updated.banReason,
      },
    });
  } catch (error) {
    console.error("[ADMIN USER STATUS ERROR]", error);
    res.status(500).json({ error: "Failed to update user status." });
  }
});

router.get("/admin/creators", async (req: Request, res: Response): Promise<void> => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const verifiedFilter =
      typeof req.query.verified === "string" ? req.query.verified.trim() : "all";
    const categoryFilter =
      typeof req.query.category === "string" ? req.query.category.trim() : "all";
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const conditions: any[] = [];
    if (search) {
      conditions.push(
        or(
          ilike(userTable.name, `%${search}%`),
          ilike(userTable.email, `%${search}%`),
          ilike(influencersTable.category, `%${search}%`)
        )
      );
    }
    if (verifiedFilter === "verified") {
      conditions.push(eq(influencersTable.isVerified, true));
    } else if (verifiedFilter === "pending") {
      conditions.push(eq(influencersTable.isVerified, false));
    }
    if (categoryFilter !== "all") {
      conditions.push(eq(influencersTable.category, categoryFilter));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(influencersTable)
      .innerJoin(userTable, eq(userTable.id, influencersTable.userId))
      .where(whereClause);

    const rows = await db
      .select({
        id: influencersTable.id,
        userId: influencersTable.userId,
        name: userTable.name,
        email: userTable.email,
        category: influencersTable.category,
        country: influencersTable.country,
        followers: influencersTable.followers,
        engagementRate: influencersTable.engagementRate,
        collaborationCost: influencersTable.collaborationCost,
        isVerified: influencersTable.isVerified,
        avatarUrl: influencersTable.avatarUrl,
        socialAccounts: influencersTable.socialAccounts,
        createdAt: influencersTable.createdAt,
      })
      .from(influencersTable)
      .innerJoin(userTable, eq(userTable.id, influencersTable.userId))
      .where(whereClause)
      .orderBy(desc(influencersTable.followers))
      .limit(limit)
      .offset(offset);

    res.json({
      creators: rows,
      total: totalRow?.count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[ADMIN CREATORS ERROR]", error);
    res.status(500).json({ error: "Failed to query creator profiles." });
  }
});

router.patch("/admin/creators/:id/verify", async (req: Request, res: Response): Promise<void> => {
  const adminReq = req as AdminRequest;
  const creatorId = Number(req.params.id);
  const { isVerified, reason = "Administrative verification badge update" } = req.body;

  if (typeof isVerified !== "boolean" || !creatorId || isNaN(creatorId)) {
    res.status(400).json({ error: "Valid creator ID and boolean 'isVerified' are required." });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(influencersTable)
      .where(eq(influencersTable.id, creatorId))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Creator profile not found." });
      return;
    }

    const [updated] = await db
      .update(influencersTable)
      .set({ isVerified })
      .where(eq(influencersTable.id, creatorId))
      .returning();

    await logAdminAction({
      req: adminReq,
      action: isVerified ? "CREATOR_VERIFIED" : "CREATOR_VERIFICATION_REVOKED",
      targetEntityType: "creator",
      targetEntityId: String(creatorId),
      reason,
      beforeState: { isVerified: existing.isVerified },
      afterState: { isVerified: updated.isVerified },
    });

    res.json({ success: true, creator: updated });
  } catch (error) {
    console.error("[ADMIN CREATOR VERIFY ERROR]", error);
    res.status(500).json({ error: "Failed to update creator verification status." });
  }
});

router.get("/admin/brands", async (req: Request, res: Response): Promise<void> => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const industryFilter =
      typeof req.query.industry === "string" ? req.query.industry.trim() : "all";
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const conditions: any[] = [];
    if (search) {
      conditions.push(
        or(
          ilike(brandsTable.name, `%${search}%`),
          ilike(userTable.email, `%${search}%`),
          ilike(brandsTable.industry, `%${search}%`)
        )
      );
    }
    if (industryFilter !== "all") {
      conditions.push(eq(brandsTable.industry, industryFilter));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(brandsTable)
      .innerJoin(userTable, eq(userTable.id, brandsTable.userId))
      .where(whereClause);

    const rows = await db
      .select({
        id: brandsTable.id,
        userId: brandsTable.userId,
        name: brandsTable.name,
        industry: brandsTable.industry,
        country: brandsTable.country,
        city: brandsTable.city,
        monthlyBudget: brandsTable.monthlyBudget,
        website: brandsTable.website,
        logoUrl: brandsTable.logoUrl,
        userEmail: userTable.email,
        createdAt: brandsTable.createdAt,
      })
      .from(brandsTable)
      .innerJoin(userTable, eq(userTable.id, brandsTable.userId))
      .where(whereClause)
      .orderBy(desc(brandsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const enriched = await Promise.all(
      rows.map(async (brand) => {
        const [campCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(campaignsTable)
          .where(eq(campaignsTable.brandId, brand.id));

        const [dealCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(dealsTable)
          .where(eq(dealsTable.brandId, brand.id));

        return {
          ...brand,
          campaignCount: campCount?.count ?? 0,
          dealCount: dealCount?.count ?? 0,
        };
      })
    );

    res.json({
      brands: enriched,
      total: totalRow?.count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[ADMIN BRANDS ERROR]", error);
    res.status(500).json({ error: "Failed to query brand workspaces." });
  }
});

router.get("/admin/roles", async (_req: Request, res: Response): Promise<void> => {
  try {
    const roles = await db.select().from(adminRolesTable).orderBy(asc(adminRolesTable.id));

    const enriched = await Promise.all(
      roles.map(async (role) => {
        const permissions = await db
          .select({
            slug: adminPermissionsTable.slug,
            module: adminPermissionsTable.module,
            description: adminPermissionsTable.description,
          })
          .from(adminRolePermissionsTable)
          .innerJoin(
            adminPermissionsTable,
            eq(adminPermissionsTable.id, adminRolePermissionsTable.permissionId)
          )
          .where(eq(adminRolePermissionsTable.roleId, role.id));

        const [adminCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(adminUsersTable)
          .where(and(eq(adminUsersTable.roleId, role.id), eq(adminUsersTable.isActive, true)));

        return {
          ...role,
          permissions,
          operatorCount: adminCount?.count ?? 0,
        };
      })
    );

    res.json({ roles: enriched });
  } catch (error) {
    console.error("[ADMIN ROLES ERROR]", error);
    res.status(500).json({ error: "Failed to query platform roles." });
  }
});

router.get("/admin/roles/permissions", async (_req: Request, res: Response): Promise<void> => {
  try {
    const perms = await db
      .select()
      .from(adminPermissionsTable)
      .orderBy(asc(adminPermissionsTable.module), asc(adminPermissionsTable.slug));
    res.json({ permissions: perms });
  } catch (error) {
    console.error("[ADMIN PERMISSIONS ERROR]", error);
    res.status(500).json({ error: "Failed to load permissions catalog." });
  }
});

router.get("/admin/roles/admins", async (_req: Request, res: Response): Promise<void> => {
  try {
    const admins = await db
      .select({
        id: adminUsersTable.id,
        userId: adminUsersTable.userId,
        roleId: adminUsersTable.roleId,
        isActive: adminUsersTable.isActive,
        createdAt: adminUsersTable.createdAt,
        updatedAt: adminUsersTable.updatedAt,
        userName: userTable.name,
        userEmail: userTable.email,
        roleSlug: adminRolesTable.slug,
        roleName: adminRolesTable.name,
      })
      .from(adminUsersTable)
      .innerJoin(userTable, eq(userTable.id, adminUsersTable.userId))
      .innerJoin(adminRolesTable, eq(adminRolesTable.id, adminUsersTable.roleId))
      .orderBy(desc(adminUsersTable.createdAt));

    res.json({ admins });
  } catch (error) {
    console.error("[ADMIN ADMINS ERROR]", error);
    res.status(500).json({ error: "Failed to query admin operators." });
  }
});

router.post("/admin/roles/admins", async (req: Request, res: Response): Promise<void> => {
  const adminReq = req as AdminRequest;
  const { email, roleSlug, reason = "Administrative operator provisioning" } = req.body;

  if (!email || !roleSlug) {
    res.status(400).json({ error: "User email and roleSlug are required." });
    return;
  }

  try {
    const [targetUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email.trim().toLowerCase()))
      .limit(1);

    if (!targetUser) {
      res.status(404).json({ error: `User account '${email}' does not exist on the platform.` });
      return;
    }

    const [role] = await db
      .select()
      .from(adminRolesTable)
      .where(eq(adminRolesTable.slug, roleSlug.trim()))
      .limit(1);

    if (!role) {
      res.status(404).json({ error: `Role '${roleSlug}' not found.` });
      return;
    }

    const [existing] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.userId, targetUser.id))
      .limit(1);

    let assigned: typeof adminUsersTable.$inferSelect;

    if (existing) {
      const [updated] = await db
        .update(adminUsersTable)
        .set({
          roleId: role.id,
          isActive: true,
          assignedByUserId: adminReq.adminUser?.userId,
          updatedAt: new Date(),
        })
        .where(eq(adminUsersTable.id, existing.id))
        .returning();
      assigned = updated;
    } else {
      const [inserted] = await db
        .insert(adminUsersTable)
        .values({
          userId: targetUser.id,
          roleId: role.id,
          isActive: true,
          assignedByUserId: adminReq.adminUser?.userId,
        })
        .returning();
      assigned = inserted;
    }

    await logAdminAction({
      req: adminReq,
      action: "ADMIN_OPERATOR_ASSIGNED",
      targetEntityType: "admin_user",
      targetEntityId: String(assigned.id),
      reason,
      afterState: { roleSlug: role.slug, userId: targetUser.id, userEmail: targetUser.email },
    });

    res.json({ success: true, admin: assigned });
  } catch (error) {
    console.error("[ADMIN ASSIGN OPERATOR ERROR]", error);
    res.status(500).json({ error: "Failed to assign administrative role." });
  }
});

router.patch("/admin/roles/admins/:id", async (req: Request, res: Response): Promise<void> => {
  const adminReq = req as AdminRequest;
  const adminId = Number(req.params.id);
  const { isActive, roleSlug, reason = "Administrative operator modification" } = req.body;

  if (!adminId || isNaN(adminId)) {
    res.status(400).json({ error: "Valid admin ID required." });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.id, adminId))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Admin record not found." });
      return;
    }

    const updates: Partial<typeof adminUsersTable.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof isActive === "boolean") updates.isActive = isActive;

    if (roleSlug) {
      const [role] = await db
        .select()
        .from(adminRolesTable)
        .where(eq(adminRolesTable.slug, roleSlug))
        .limit(1);
      if (role) updates.roleId = role.id;
    }

    const [updated] = await db
      .update(adminUsersTable)
      .set(updates)
      .where(eq(adminUsersTable.id, adminId))
      .returning();

    await logAdminAction({
      req: adminReq,
      action: "ADMIN_OPERATOR_UPDATED",
      targetEntityType: "admin_user",
      targetEntityId: String(adminId),
      reason,
      beforeState: { roleId: existing.roleId, isActive: existing.isActive },
      afterState: { roleId: updated.roleId, isActive: updated.isActive },
    });

    res.json({ success: true, admin: updated });
  } catch (error) {
    console.error("[ADMIN MODIFY OPERATOR ERROR]", error);
    res.status(500).json({ error: "Failed to update admin operator." });
  }
});

router.get("/admin/campaigns", async (req: Request, res: Response): Promise<void> => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const statusFilter = typeof req.query.status === "string" ? req.query.status.trim() : "all";
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const conditions: any[] = [];
    if (search) {
      conditions.push(
        or(
          ilike(campaignsTable.title, `%${search}%`),
          ilike(campaignsTable.platform, `%${search}%`)
        )
      );
    }
    if (statusFilter !== "all") {
      conditions.push(eq(campaignsTable.status, statusFilter as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(campaignsTable)
      .where(whereClause);

    const rows = await db
      .select({
        id: campaignsTable.id,
        brandId: campaignsTable.brandId,
        title: campaignsTable.title,
        description: campaignsTable.description,
        budget: campaignsTable.budget,
        platform: campaignsTable.platform,
        status: campaignsTable.status,
        deadline: campaignsTable.deadline,
        createdAt: campaignsTable.createdAt,
        brandName: brandsTable.name,
      })
      .from(campaignsTable)
      .leftJoin(brandsTable, eq(brandsTable.id, campaignsTable.brandId))
      .where(whereClause)
      .orderBy(desc(campaignsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const enriched = await Promise.all(
      rows.map(async (c) => {
        const [apps] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(applicationsTable)
          .where(eq(applicationsTable.campaignId, c.id));

        return {
          ...c,
          applicantCount: apps?.count ?? 0,
        };
      })
    );

    res.json({
      campaigns: enriched,
      total: totalRow?.count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[ADMIN CAMPAIGNS ERROR]", error);
    res.status(500).json({ error: "Failed to query campaigns." });
  }
});

router.patch("/admin/campaigns/:id/status", async (req: Request, res: Response): Promise<void> => {
  const adminReq = req as AdminRequest;
  const campaignId = Number(req.params.id);
  const { status, reason = "Administrative campaign status update" } = req.body;

  const validStatuses = ["active", "paused", "completed", "draft"];
  if (!campaignId || isNaN(campaignId) || !validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid campaign ID or status." });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, campaignId))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Campaign not found." });
      return;
    }

    const [updated] = await db
      .update(campaignsTable)
      .set({ status })
      .where(eq(campaignsTable.id, campaignId))
      .returning();

    await logAdminAction({
      req: adminReq,
      action: "CAMPAIGN_STATUS_UPDATED",
      targetEntityType: "campaign",
      targetEntityId: String(campaignId),
      reason,
      beforeState: { status: existing.status },
      afterState: { status: updated.status },
    });

    res.json({ success: true, campaign: updated });
  } catch (error) {
    console.error("[ADMIN CAMPAIGN STATUS ERROR]", error);
    res.status(500).json({ error: "Failed to update campaign status." });
  }
});

router.get("/admin/applications", async (req: Request, res: Response): Promise<void> => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const statusFilter = typeof req.query.status === "string" ? req.query.status.trim() : "all";
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const conditions: any[] = [];
    if (search) {
      conditions.push(
        or(
          ilike(campaignsTable.title, `%${search}%`),
          ilike(applicationsTable.message, `%${search}%`)
        )
      );
    }
    if (statusFilter !== "all") {
      conditions.push(eq(applicationsTable.status, statusFilter));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(applicationsTable)
      .leftJoin(campaignsTable, eq(campaignsTable.id, applicationsTable.campaignId))
      .where(whereClause);

    const rows = await db
      .select({
        id: applicationsTable.id,
        campaignId: applicationsTable.campaignId,
        influencerId: applicationsTable.influencerId,
        status: applicationsTable.status,
        message: applicationsTable.message,
        quotedRatePaise: applicationsTable.quotedRatePaise,
        createdAt: applicationsTable.createdAt,
        campaignTitle: campaignsTable.title,
        campaignBudget: campaignsTable.budget,
        campaignPlatform: campaignsTable.platform,
        brandId: campaignsTable.brandId,
        brandName: brandsTable.name,
      })
      .from(applicationsTable)
      .leftJoin(campaignsTable, eq(campaignsTable.id, applicationsTable.campaignId))
      .leftJoin(brandsTable, eq(brandsTable.id, campaignsTable.brandId))
      .where(whereClause)
      .orderBy(desc(applicationsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const enriched = await Promise.all(
      rows.map(async (app) => {
        const [inf] = await db
          .select({
            userId: influencersTable.userId,
            category: influencersTable.category,
            followers: influencersTable.followers,
          })
          .from(influencersTable)
          .where(eq(influencersTable.id, app.influencerId))
          .limit(1);

        let creatorName = "Creator Partner";
        if (inf?.userId) {
          const [u] = await db
            .select({ name: userTable.name })
            .from(userTable)
            .where(eq(userTable.id, inf.userId))
            .limit(1);
          if (u?.name) creatorName = u.name;
        }

        return {
          ...app,
          creatorName,
          creatorCategory: inf?.category || "Lifestyle",
          creatorFollowers: inf?.followers || 0,
        };
      })
    );

    res.json({
      applications: enriched,
      total: totalRow?.count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[ADMIN APPLICATIONS ERROR]", error);
    res.status(500).json({ error: "Failed to query applications." });
  }
});

router.get("/admin/deals", async (req: Request, res: Response): Promise<void> => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status.trim() : "all";
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const conditions: any[] = [];
    if (status !== "all") {
      conditions.push(eq(dealsTable.agreementStatus, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(dealsTable)
      .where(whereClause);

    const rows = await db
      .select({
        id: dealsTable.id,
        title: dealsTable.title,
        agreementStatus: dealsTable.agreementStatus,
        paymentStatus: dealsTable.paymentStatus,
        executionStatus: dealsTable.executionStatus,
        confirmedAt: dealsTable.confirmedAt,
        createdAt: dealsTable.createdAt,
        brandName: brandsTable.name,
        creatorName: influencersTable.userId,
        activeProposalId: dealsTable.activeProposalId,
        pricePaise: dealTermsVersionsTable.pricePaise,
        currency: dealTermsVersionsTable.currency,
        version: dealTermsVersionsTable.version,
      })
      .from(dealsTable)
      .leftJoin(brandsTable, eq(brandsTable.id, dealsTable.brandId))
      .leftJoin(influencersTable, eq(influencersTable.id, dealsTable.influencerId))
      .leftJoin(dealTermsVersionsTable, eq(dealTermsVersionsTable.id, dealsTable.activeProposalId))
      .where(whereClause)
      .orderBy(desc(dealsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const enriched = await Promise.all(
      rows.map(async (row) => {
        let creatorDisplay = "Creator";
        if (row.creatorName) {
          const [u] = await db
            .select({ name: userTable.name })
            .from(userTable)
            .where(eq(userTable.id, row.creatorName))
            .limit(1);
          if (u?.name) creatorDisplay = u.name;
        }

        return {
          id: row.id,
          title: row.title,
          brandName: row.brandName || "Brand Partner",
          creatorName: creatorDisplay,
          agreementStatus: row.agreementStatus,
          paymentStatus: row.paymentStatus,
          executionStatus: row.executionStatus,
          totalAmount: Math.round((row.pricePaise ?? 0) / 100),
          pricePaise: row.pricePaise ?? 0,
          currency: row.currency || "INR",
          termsVersion: row.version ?? 1,
          confirmedAt: row.confirmedAt,
          createdAt: row.createdAt,
        };
      })
    );

    res.json({
      deals: enriched,
      total: totalRow?.count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[ADMIN DEALS ERROR]", error);
    res.status(500).json({ error: "Failed to query commercial deals." });
  }
});

router.post("/admin/deals/:id/intervene", async (req: Request, res: Response): Promise<void> => {
  const adminReq = req as AdminRequest;
  const dealId = Number(req.params.id);
  const { action, reason, notes } = req.body;

  if (!dealId || isNaN(dealId)) {
    res.status(400).json({ error: "Invalid deal ID." });
    return;
  }

  const validActions = ["force_cancel", "force_release", "mark_disputed"];
  if (!validActions.includes(action) || !reason || typeof reason !== "string" || !reason.trim()) {
    res.status(400).json({
      error: `Bad Request: action must be one of [${validActions.join(", ")}] and a non-empty 'reason' is required.`,
    });
    return;
  }

  if (
    adminReq.adminUser?.roleSlug !== "super_admin" &&
    !adminReq.adminUser?.permissions.includes("admin.deals.intervene")
  ) {
    res.status(403).json({ error: "Missing required permission: 'admin.deals.intervene'" });
    return;
  }

  try {
    const [deal] = await db.select().from(dealsTable).where(eq(dealsTable.id, dealId)).limit(1);

    if (!deal) {
      res.status(404).json({ error: "Deal room not found." });
      return;
    }

    const updates: Partial<typeof dealsTable.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (action === "force_cancel") {
      updates.agreementStatus = "CANCELLED";
      updates.paymentStatus = "REFUNDED";
    } else if (action === "force_release") {
      updates.paymentStatus = "RELEASED";
      updates.executionStatus = "COMPLETED";
    } else if (action === "mark_disputed") {
      updates.agreementStatus = "DISPUTED";
    }

    const [updated] = await db
      .update(dealsTable)
      .set(updates)
      .where(eq(dealsTable.id, dealId))
      .returning();

    await logAdminAction({
      req: adminReq,
      action: `DEAL_INTERVENTION_${action.toUpperCase()}`,
      targetEntityType: "deal",
      targetEntityId: String(dealId),
      reason: reason.trim(),
      beforeState: {
        agreementStatus: deal.agreementStatus,
        paymentStatus: deal.paymentStatus,
        executionStatus: deal.executionStatus,
      },
      afterState: {
        agreementStatus: updated.agreementStatus,
        paymentStatus: updated.paymentStatus,
        executionStatus: updated.executionStatus,
        notes: notes || null,
      },
    });

    res.json({ success: true, deal: updated });
  } catch (error) {
    console.error("[ADMIN DEAL INTERVENTION ERROR]", error);
    res.status(500).json({ error: "Failed to execute deal intervention." });
  }
});

router.get("/admin/payments", async (_req: Request, res: Response): Promise<void> => {
  try {
    const deals = await db
      .select({
        id: dealsTable.id,
        title: dealsTable.title,
        brandId: dealsTable.brandId,
        influencerId: dealsTable.influencerId,
        paymentStatus: dealsTable.paymentStatus,
        agreementStatus: dealsTable.agreementStatus,
        confirmedAt: dealsTable.confirmedAt,
        createdAt: dealsTable.createdAt,
        brandName: brandsTable.name,
        creatorUserId: influencersTable.userId,
        pricePaise: dealTermsVersionsTable.pricePaise,
        currency: dealTermsVersionsTable.currency,
      })
      .from(dealsTable)
      .leftJoin(brandsTable, eq(brandsTable.id, dealsTable.brandId))
      .leftJoin(influencersTable, eq(influencersTable.id, dealsTable.influencerId))
      .leftJoin(dealTermsVersionsTable, eq(dealTermsVersionsTable.id, dealsTable.activeProposalId))
      .orderBy(desc(dealsTable.createdAt));

    // Also fetch double-entry ledger entries
    const ledgerEntries = await db
      .select({
        id: paymentLedgerEntriesTable.id,
        paymentOrderId: paymentLedgerEntriesTable.paymentOrderId,
        dealId: paymentLedgerEntriesTable.dealId,
        entryType: paymentLedgerEntriesTable.entryType,
        direction: paymentLedgerEntriesTable.direction,
        amountPaise: paymentLedgerEntriesTable.amountPaise,
        providerTransferId: paymentLedgerEntriesTable.providerTransferId,
        utrNumber: paymentLedgerEntriesTable.utrNumber,
        description: paymentLedgerEntriesTable.description,
        createdAt: paymentLedgerEntriesTable.createdAt,
      })
      .from(paymentLedgerEntriesTable)
      .orderBy(desc(paymentLedgerEntriesTable.createdAt))
      .limit(100);

    let totalCommittedPaise = 0;
    let inEscrowPaise = 0;
    let releasedPayoutsPaise = 0;
    let refundedPaise = 0;

    const enriched = await Promise.all(
      deals.map(async (d) => {
        const amountPaise = d.pricePaise ?? 0;
        totalCommittedPaise += amountPaise;

        if (
          d.paymentStatus === "IN_ESCROW" ||
          d.paymentStatus === "HELD_IN_ESCROW" ||
          d.paymentStatus === "PAID_HELD"
        )
          inEscrowPaise += amountPaise;
        if (d.paymentStatus === "RELEASED" || d.paymentStatus === "PAYOUT_RELEASED")
          releasedPayoutsPaise += amountPaise;
        if (d.paymentStatus === "REFUNDED") refundedPaise += amountPaise;

        let creatorDisplay = "Creator Partner";
        if (d.creatorUserId) {
          const [u] = await db
            .select({ name: userTable.name })
            .from(userTable)
            .where(eq(userTable.id, d.creatorUserId))
            .limit(1);
          if (u?.name) creatorDisplay = u.name;
        }

        const [order] = await db
          .select()
          .from(paymentOrdersTable)
          .where(eq(paymentOrdersTable.dealId, d.id))
          .orderBy(desc(paymentOrdersTable.createdAt))
          .limit(1);

        return {
          id: d.id,
          dealId: d.id,
          title: d.title,
          brandName: d.brandName || "Brand Partner",
          creatorName: creatorDisplay,
          amountPaise,
          amountRupees: Math.round(amountPaise / 100),
          currency: d.currency || "INR",
          paymentStatus: d.paymentStatus,
          agreementStatus: d.agreementStatus,
          platformFeePaise: order ? order.platformFeePaise : Math.round(amountPaise * 0.1),
          gstAmountPaise: order ? order.gstAmountPaise : Math.round(amountPaise * 0.1 * 0.18),
          tdsAmountPaise: order ? order.tdsAmountPaise : Math.round(amountPaise * 0.01),
          netCreatorPayoutPaise: order
            ? order.netCreatorPayoutPaise
            : Math.round(amountPaise * 0.89),
          razorpayOrderId: order?.razorpayOrderId || null,
          razorpayPaymentId: order?.razorpayPaymentId || null,
          autoReleaseAt: order?.autoReleaseAt ? order.autoReleaseAt.toISOString() : null,
          confirmedAt: d.confirmedAt,
          createdAt: d.createdAt,
        };
      })
    );

    res.json({
      summary: {
        totalCommittedPaise,
        inEscrowPaise,
        releasedPayoutsPaise,
        refundedPaise,
        estimatedPlatformFeePaise: Math.round(releasedPayoutsPaise * 0.1),
      },
      ledger: enriched,
      doubleEntryLedger: ledgerEntries.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[ADMIN PAYMENTS ERROR]", error);
    res.status(500).json({ error: "Failed to load financial escrow ledger." });
  }
});

router.get("/admin/analytics", async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await db
      .select({
        category: influencersTable.category,
        count: sql<number>`count(*)::int`,
      })
      .from(influencersTable)
      .groupBy(influencersTable.category)
      .orderBy(desc(sql`count(*)`));

    const dealStatuses = await db
      .select({
        status: dealsTable.agreementStatus,
        count: sql<number>`count(*)::int`,
      })
      .from(dealsTable)
      .groupBy(dealsTable.agreementStatus);

    const platforms = await db
      .select({
        platform: campaignsTable.platform,
        count: sql<number>`count(*)::int`,
      })
      .from(campaignsTable)
      .groupBy(campaignsTable.platform)
      .orderBy(desc(sql`count(*)`));

    const [creatorsTotal] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(influencersTable);
    const [brandsTotal] = await db.select({ count: sql<number>`count(*)::int` }).from(brandsTable);

    res.json({
      creatorCategories: categories,
      dealStatuses,
      campaignPlatforms: platforms,
      audienceRatio: {
        creators: creatorsTotal?.count ?? 0,
        brands: brandsTotal?.count ?? 0,
      },
    });
  } catch (error) {
    console.error("[ADMIN ANALYTICS ERROR]", error);
    res.status(500).json({ error: "Failed to load platform analytics." });
  }
});

router.get("/admin/reports", async (req: Request, res: Response): Promise<void> => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status.trim() : "all";
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const conditions: any[] = [];
    if (status !== "all") {
      conditions.push(eq(moderationReportsTable.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(moderationReportsTable)
      .where(whereClause);

    const rows = await db
      .select({
        id: moderationReportsTable.id,
        reporterUserId: moderationReportsTable.reporterUserId,
        reporterName: userTable.name,
        reporterEmail: userTable.email,
        targetType: moderationReportsTable.targetType,
        targetId: moderationReportsTable.targetId,
        category: moderationReportsTable.category,
        description: moderationReportsTable.description,
        status: moderationReportsTable.status,
        resolutionNotes: moderationReportsTable.resolutionNotes,
        resolvedAt: moderationReportsTable.resolvedAt,
        createdAt: moderationReportsTable.createdAt,
      })
      .from(moderationReportsTable)
      .leftJoin(userTable, eq(userTable.id, moderationReportsTable.reporterUserId))
      .where(whereClause)
      .orderBy(desc(moderationReportsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      reports: rows,
      total: totalRow?.count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[ADMIN REPORTS ERROR]", error);
    res.status(500).json({ error: "Failed to query moderation reports." });
  }
});

router.patch("/admin/reports/:id", async (req: Request, res: Response): Promise<void> => {
  const adminReq = req as AdminRequest;
  const reportId = Number(req.params.id);
  const { status, resolutionNotes } = req.body;

  if (!reportId || isNaN(reportId)) {
    res.status(400).json({ error: "Invalid report ID." });
    return;
  }

  const validStatuses = ["investigating", "resolved", "dismissed"];
  if (!validStatuses.includes(status)) {
    res.status(400).json({
      error: `Invalid status. Must be one of: [${validStatuses.join(", ")}]`,
    });
    return;
  }

  if (
    adminReq.adminUser?.roleSlug !== "super_admin" &&
    !adminReq.adminUser?.permissions.includes("admin.reports.resolve")
  ) {
    res.status(403).json({ error: "Missing required permission: 'admin.reports.resolve'" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(moderationReportsTable)
      .where(eq(moderationReportsTable.id, reportId))
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Moderation report not found." });
      return;
    }

    const [updated] = await db
      .update(moderationReportsTable)
      .set({
        status,
        resolutionNotes: resolutionNotes || existing.resolutionNotes,
        assignedAdminUserId: adminReq.adminUser?.userId,
        resolvedAt: status === "resolved" || status === "dismissed" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(moderationReportsTable.id, reportId))
      .returning();

    await logAdminAction({
      req: adminReq,
      action: `REPORT_${status.toUpperCase()}`,
      targetEntityType: "report",
      targetEntityId: String(reportId),
      reason: resolutionNotes || `Report status updated to ${status}`,
      beforeState: { status: existing.status, resolutionNotes: existing.resolutionNotes },
      afterState: { status: updated.status, resolutionNotes: updated.resolutionNotes },
    });

    res.json({ success: true, report: updated });
  } catch (error) {
    console.error("[ADMIN REPORT UPDATE ERROR]", error);
    res.status(500).json({ error: "Failed to update moderation report." });
  }
});

router.get("/admin/activity-logs", async (req: Request, res: Response): Promise<void> => {
  try {
    const roleFilter =
      typeof req.query.role === "string" ? req.query.role.trim().toLowerCase() : "all";
    const eventTypeFilter =
      typeof req.query.eventType === "string" ? req.query.eventType.trim() : "all";
    const statusFilter =
      typeof req.query.status === "string" ? req.query.status.trim().toLowerCase() : "all";
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const conditions: any[] = [];

    if (roleFilter !== "all") {
      conditions.push(eq(platformActivityEventsTable.actorParty, roleFilter));
    }

    if (eventTypeFilter !== "all") {
      conditions.push(eq(platformActivityEventsTable.eventType, eventTypeFilter));
    }

    if (search) {
      conditions.push(
        or(
          ilike(platformActivityEventsTable.summary, `%${search}%`),
          ilike(userTable.name, `%${search}%`),
          ilike(userTable.email, `%${search}%`),
          ilike(platformActivityEventsTable.entityId, `%${search}%`),
          ilike(platformActivityEventsTable.eventType, `%${search}%`)
        )
      );
    }

    const activeSessions = await db
      .select({ userId: sessionTable.userId })
      .from(sessionTable)
      .where(sql`${sessionTable.expiresAt} > now()`);
    const onlineUserIds = new Set(activeSessions.map((s) => s.userId));

    if (statusFilter === "online") {
      if (onlineUserIds.size === 0) {
        res.json({
          events: [],
          total: 0,
          limit,
          offset,
          onlineCount: 0,
        });
        return;
      }
      conditions.push(inArray(platformActivityEventsTable.actorUserId, Array.from(onlineUserIds)));
    } else if (statusFilter === "offline") {
      if (onlineUserIds.size > 0) {
        conditions.push(
          or(
            sql`${platformActivityEventsTable.actorUserId} is null`,
            sql`${platformActivityEventsTable.actorUserId} not in (${sql.join(
              Array.from(onlineUserIds).map((id) => sql`${id}`),
              sql`, `
            )})`
          )
        );
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(platformActivityEventsTable)
      .leftJoin(userTable, eq(userTable.id, platformActivityEventsTable.actorUserId))
      .where(whereClause);

    const rows = await db
      .select({
        id: platformActivityEventsTable.id,
        actorUserId: platformActivityEventsTable.actorUserId,
        actorParty: platformActivityEventsTable.actorParty,
        eventType: platformActivityEventsTable.eventType,
        entityType: platformActivityEventsTable.entityType,
        entityId: platformActivityEventsTable.entityId,
        summary: platformActivityEventsTable.summary,
        metadata: platformActivityEventsTable.metadata,
        createdAt: platformActivityEventsTable.createdAt,
        actorName: userTable.name,
        actorEmail: userTable.email,
        actorImage: userTable.image,
      })
      .from(platformActivityEventsTable)
      .leftJoin(userTable, eq(userTable.id, platformActivityEventsTable.actorUserId))
      .where(whereClause)
      .orderBy(desc(platformActivityEventsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const events = rows.map((r) => ({
      ...r,
      isOnline: r.actorUserId ? onlineUserIds.has(r.actorUserId) : false,
    }));

    res.json({
      events,
      total: totalRow?.count ?? 0,
      limit,
      offset,
      onlineCount: onlineUserIds.size,
    });
  } catch (error) {
    console.error("[ADMIN GET ACTIVITY LOGS ERROR]", error);
    res.status(500).json({ error: "Failed to load platform activity logs." });
  }
});

router.get("/admin/audit-logs", async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const action = typeof req.query.action === "string" ? req.query.action.trim() : "";
    const targetType =
      typeof req.query.targetEntityType === "string" ? req.query.targetEntityType.trim() : "";

    const conditions: any[] = [];
    if (action) conditions.push(eq(adminAuditLogsTable.action, action));
    if (targetType) conditions.push(eq(adminAuditLogsTable.targetEntityType, targetType));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminAuditLogsTable)
      .where(whereClause);

    const rows = await db
      .select({
        id: adminAuditLogsTable.id,
        adminUserId: adminAuditLogsTable.adminUserId,
        adminName: userTable.name,
        adminEmail: userTable.email,
        action: adminAuditLogsTable.action,
        targetEntityType: adminAuditLogsTable.targetEntityType,
        targetEntityId: adminAuditLogsTable.targetEntityId,
        reason: adminAuditLogsTable.reason,
        beforeState: adminAuditLogsTable.beforeState,
        afterState: adminAuditLogsTable.afterState,
        ipAddress: adminAuditLogsTable.ipAddress,
        userAgent: adminAuditLogsTable.userAgent,
        createdAt: adminAuditLogsTable.createdAt,
      })
      .from(adminAuditLogsTable)
      .leftJoin(userTable, eq(userTable.id, adminAuditLogsTable.adminUserId))
      .where(whereClause)
      .orderBy(desc(adminAuditLogsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      logs: rows,
      total: totalRow?.count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[ADMIN AUDIT LOGS ERROR]", error);
    res.status(500).json({ error: "Failed to query admin audit logs." });
  }
});

router.get(
  "/admin/system-health",
  requirePermission("admin.dashboard.view") as any,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const pgVerResult = await db.execute(sql`SELECT version()`);
      const pgDbSizeResult = await db.execute(
        sql`SELECT pg_size_pretty(pg_database_size(current_database())) as size`
      );
      const pgVer = pgVerResult.rows[0];
      const pgDbSize = pgDbSizeResult.rows[0];

      const [
        usersCount,
        sessionsCount,
        activeSessionsCount,
        influencersCount,
        brandsCount,
        campaignsCount,
        applicationsCount,
        dealsCount,
        dealVersionsCount,
        reportsCount,
        auditLogsCount,
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)::int` }).from(userTable),
        db.select({ count: sql<number>`count(*)::int` }).from(sessionTable),
        db
          .select({ count: sql<number>`count(distinct ${sessionTable.userId})::int` })
          .from(sessionTable)
          .where(sql`${sessionTable.expiresAt} > now()`),
        db.select({ count: sql<number>`count(*)::int` }).from(influencersTable),
        db.select({ count: sql<number>`count(*)::int` }).from(brandsTable),
        db.select({ count: sql<number>`count(*)::int` }).from(campaignsTable),
        db.select({ count: sql<number>`count(*)::int` }).from(applicationsTable),
        db.select({ count: sql<number>`count(*)::int` }).from(dealsTable),
        db.select({ count: sql<number>`count(*)::int` }).from(dealTermsVersionsTable),
        db.select({ count: sql<number>`count(*)::int` }).from(moderationReportsTable),
        db.select({ count: sql<number>`count(*)::int` }).from(adminAuditLogsTable),
      ]);

      const memory = process.memoryUsage();

      res.json({
        status: "healthy",
        database: {
          connected: true,
          version: (pgVer as any)?.version || "PostgreSQL",
          size: (pgDbSize as any)?.size || "Unknown",
        },
        runtime: {
          nodeVersion: process.version,
          platform: process.platform,
          uptimeSeconds: Math.round(process.uptime()),
          memoryRssMb: Math.round(memory.rss / (1024 * 1024)),
          memoryHeapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
          memoryHeapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
        },
        tableTelemetry: {
          users: usersCount[0]?.count ?? 0,
          sessions: sessionsCount[0]?.count ?? 0,
          activeSessions: activeSessionsCount[0]?.count ?? 0,
          creators: influencersCount[0]?.count ?? 0,
          brands: brandsCount[0]?.count ?? 0,
          campaigns: campaignsCount[0]?.count ?? 0,
          applications: applicationsCount[0]?.count ?? 0,
          deals: dealsCount[0]?.count ?? 0,
          dealProposals: dealVersionsCount[0]?.count ?? 0,
          moderationReports: reportsCount[0]?.count ?? 0,
          auditLogs: auditLogsCount[0]?.count ?? 0,
        },
      });
    } catch (error) {
      console.error("[ADMIN SYSTEM HEALTH ERROR]", error);
      res.status(500).json({ error: "Failed to query system health." });
    }
  }
);

router.get("/admin/settings", async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await db
      .select()
      .from(platformSettingsTable)
      .orderBy(asc(platformSettingsTable.key));
    res.json({ settings });
  } catch (error) {
    console.error("[ADMIN GET SETTINGS ERROR]", error);
    res.status(500).json({ error: "Failed to load platform settings." });
  }
});

router.put("/admin/settings", async (req: Request, res: Response): Promise<void> => {
  const adminReq = req as AdminRequest;
  const { settings, reason = "Global platform configuration update" } = req.body;

  if (!Array.isArray(settings)) {
    res
      .status(400)
      .json({ error: "Invalid payload. 'settings' must be an array of { key, value }." });
    return;
  }

  try {
    const previous = await db.select().from(platformSettingsTable);
    const prevMap = new Map(previous.map((s) => [s.key, s.value]));

    for (const item of settings) {
      if (item.key && typeof item.value === "string") {
        await db
          .insert(platformSettingsTable)
          .values({
            key: item.key,
            value: item.value,
            updatedByUserId: adminReq.adminUser?.userId,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: platformSettingsTable.key,
            set: {
              value: item.value,
              updatedByUserId: adminReq.adminUser?.userId,
              updatedAt: new Date(),
            },
          });
      }
    }

    const updatedAll = await db.select().from(platformSettingsTable);

    await logAdminAction({
      req: adminReq,
      action: "PLATFORM_SETTINGS_UPDATED",
      targetEntityType: "platform_settings",
      targetEntityId: "global",
      reason,
      beforeState: Object.fromEntries(prevMap),
      afterState: Object.fromEntries(updatedAll.map((s) => [s.key, s.value])),
    });

    res.json({ success: true, settings: updatedAll });
  } catch (error) {
    console.error("[ADMIN UPDATE SETTINGS ERROR]", error);
    res.status(500).json({ error: "Failed to update platform settings." });
  }
});

export default router;
