import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import {
  db,
  socialAccountsTable,
  socialTokensTable,
  socialMetricSnapshotsTable,
  socialContentTable,
  oauthStatesTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireRole, AuthenticatedRequest } from "../middlewares/auth";
import { encryptSocialToken } from "../integrations/social/token-crypto";
import { InstagramProvider } from "../integrations/social/instagram.provider";
import { YouTubeProvider } from "../integrations/social/youtube.provider";
import { SocialPlatformProvider } from "../integrations/social/base.provider";
import { socialSyncService } from "../services/social-sync.service";
import { logAuditEvent } from "../auth/audit";

const router: IRouter = Router();

// Register official social platform adapters (Instagram & YouTube)
const providers: Record<string, SocialPlatformProvider> = {
  instagram: new InstagramProvider(),
  youtube: new YouTubeProvider(),
};

// 1. POST /api/social/:platform/connect
router.post("/social/:platform/connect", requireAuth, requireRole(["influencer"]), async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const platformRaw = req.params.platform;
  const platform = (Array.isArray(platformRaw) ? platformRaw[0] : platformRaw).toLowerCase();
  const provider = providers[platform];

  if (!provider) {
    res.status(400).json({ error: `Platform '${platform}' is not supported. Supported platforms: instagram, youtube.` });
    return;
  }

  const userId = authReq.userId!;
  const state = crypto.randomBytes(24).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // Valid for 15 minutes

  // Persist short-lived, single-use OAuth state record in PostgreSQL
  await db.insert(oauthStatesTable).values({
    state,
    userId,
    provider: platform,
    createdAt: now,
    expiresAt,
  });

  const redirectUrl = await provider.getAuthorizationUrl(state);

  res.json({
    platform,
    redirectUrl,
    state,
    capabilities: provider.capabilities,
  });
});

// 2. GET /api/social/:platform/callback
router.get("/social/:platform/callback", async (req: Request, res: Response): Promise<void> => {
  const platformRaw = req.params.platform;
  const platform = (Array.isArray(platformRaw) ? platformRaw[0] : platformRaw).toLowerCase();
  const provider = providers[platform];
  const { code, state } = req.query as Record<string, string>;

  if (!provider) {
    res.status(400).json({ error: `Platform '${platform}' is not supported.` });
    return;
  }

  if (!state) {
    res.status(400).json({ error: "Missing required OAuth state parameter." });
    return;
  }

  // Retrieve persistent OAuth state record from PostgreSQL
  const [stateRecord] = await db
    .select()
    .from(oauthStatesTable)
    .where(eq(oauthStatesTable.state, state))
    .limit(1);

  if (!stateRecord) {
    res.status(400).json({ error: "Invalid or unrecognized OAuth state parameter." });
    return;
  }

  if (new Date() > new Date(stateRecord.expiresAt)) {
    res.status(400).json({ error: "OAuth state has expired. Please initiate authorization again." });
    return;
  }

  if (stateRecord.usedAt !== null) {
    res.status(400).json({ error: "OAuth state has already been consumed." });
    return;
  }

  if (stateRecord.provider.toLowerCase() !== platform) {
    res.status(400).json({ error: `OAuth state provider mismatch (expected '${stateRecord.provider}', got '${platform}').` });
    return;
  }

  // Mark state consumed immediately
  await db
    .update(oauthStatesTable)
    .set({ usedAt: new Date() })
    .where(eq(oauthStatesTable.id, stateRecord.id));

  const userId = stateRecord.userId;

  try {
    // Exchange OAuth code for tokens
    const tokens = await provider.exchangeCodeForTokens(code || "mock_code_123");
    const profile = await provider.getProfile(tokens.accessToken);

    // Encrypt access and refresh tokens using AES-256-GCM
    const encryptedAccess = encryptSocialToken(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken ? encryptSocialToken(tokens.refreshToken) : null;

    // Upsert social account record for user in PostgreSQL
    const existingAccounts = await db
      .select()
      .from(socialAccountsTable)
      .where(and(eq(socialAccountsTable.userId, userId), eq(socialAccountsTable.platform, platform as any)))
      .limit(1);

    let socialAccountId: number;

    if (existingAccounts.length > 0) {
      socialAccountId = existingAccounts[0].id;
      await db
        .update(socialAccountsTable)
        .set({
          externalAccountId: profile.externalAccountId,
          username: profile.username,
          displayName: profile.displayName || null,
          profileUrl: profile.profileUrl || null,
          avatarUrl: profile.avatarUrl || null,
          verificationStatus: "VERIFIED",
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(socialAccountsTable.id, socialAccountId));

      await db
        .update(socialTokensTable)
        .set({
          accessTokenEncrypted: encryptedAccess.encryptedToken,
          refreshTokenEncrypted: encryptedRefresh ? encryptedRefresh.encryptedToken : null,
          tokenIv: encryptedAccess.iv,
          tokenAuthTag: encryptedAccess.authTag,
          expiresAt: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : null,
          scopes: tokens.scopes || [],
          updatedAt: new Date(),
        })
        .where(eq(socialTokensTable.socialAccountId, socialAccountId));
    } else {
      const [newAccount] = await db
        .insert(socialAccountsTable)
        .values({
          userId,
          platform: platform as any,
          externalAccountId: profile.externalAccountId,
          username: profile.username,
          displayName: profile.displayName || null,
          profileUrl: profile.profileUrl || null,
          avatarUrl: profile.avatarUrl || null,
          verificationStatus: "VERIFIED",
          isOfficialOAuth: true,
          lastSyncedAt: new Date(),
        })
        .returning();

      socialAccountId = newAccount.id;

      await db.insert(socialTokensTable).values({
        socialAccountId,
        accessTokenEncrypted: encryptedAccess.encryptedToken,
        refreshTokenEncrypted: encryptedRefresh ? encryptedRefresh.encryptedToken : null,
        tokenIv: encryptedAccess.iv,
        tokenAuthTag: encryptedAccess.authTag,
        expiresAt: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : null,
        scopes: tokens.scopes || [],
      });
    }

    // Initial data synchronization
    await socialSyncService.syncSocialAccount(socialAccountId);

    // Log audit event
    await logAuditEvent({
      userId,
      action: "OAUTH_ACCOUNT_CONNECTED",
      details: JSON.stringify({ platform, username: profile.username, externalAccountId: profile.externalAccountId }),
    });

    const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5000";
    res.redirect(`${clientUrl}/dashboard/influencer?connected=true&platform=${platform}`);
  } catch (error: any) {
    console.error("[SOCIAL CALLBACK ERROR]", error);
    res.status(500).json({ error: "Failed to verify social account via OAuth." });
  }
});

// 3. GET /api/social/accounts (Authenticated creator's connected accounts)
router.get("/social/accounts", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;

  try {
    const accounts = await db
      .select()
      .from(socialAccountsTable)
      .where(eq(socialAccountsTable.userId, userId))
      .orderBy(socialAccountsTable.connectedAt);

    const formatted = await Promise.all(
      accounts.map(async (acc) => {
        const [latestSnapshot] = await db
          .select()
          .from(socialMetricSnapshotsTable)
          .where(eq(socialMetricSnapshotsTable.socialAccountId, acc.id))
          .orderBy(desc(socialMetricSnapshotsTable.snapshotDate))
          .limit(1);

        return {
          id: acc.id,
          platform: acc.platform,
          externalAccountId: acc.externalAccountId,
          username: acc.username,
          displayName: acc.displayName,
          profileUrl: acc.profileUrl,
          avatarUrl: acc.avatarUrl,
          verificationStatus: acc.verificationStatus,
          isOfficialOAuth: acc.isOfficialOAuth,
          followers: latestSnapshot?.followers || 0,
          following: latestSnapshot?.following ?? null,
          totalContent: latestSnapshot?.totalContent || 0,
          avgViews: latestSnapshot?.avgViews || 0,
          avgLikes: latestSnapshot?.avgLikes || 0,
          avgComments: latestSnapshot?.avgComments || 0,
          engagementRate: latestSnapshot?.engagementRate || "0.00",
          lastSyncedAt: acc.lastSyncedAt ? acc.lastSyncedAt.toISOString() : null,
          connectedAt: acc.connectedAt.toISOString(),
        };
      })
    );

    res.json(formatted);
  } catch (error) {
    console.error("[GET SOCIAL ACCOUNTS ERROR]", error);
    res.status(500).json({ error: "Failed to retrieve connected social accounts." });
  }
});

// 4. GET /api/social/accounts/:id/analytics (Telemetry & Content List)
router.get("/social/accounts/:id/analytics", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const accountId = parseInt(rawId, 10);

  if (isNaN(accountId)) {
    res.status(400).json({ error: "Invalid social account ID." });
    return;
  }

  try {
    const [account] = await db.select().from(socialAccountsTable).where(eq(socialAccountsTable.id, accountId)).limit(1);
    if (!account) {
      res.status(404).json({ error: "Social account not found." });
      return;
    }

    const snapshots = await db
      .select()
      .from(socialMetricSnapshotsTable)
      .where(eq(socialMetricSnapshotsTable.socialAccountId, accountId))
      .orderBy(socialMetricSnapshotsTable.snapshotDate)
      .limit(90);

    const content = await db
      .select()
      .from(socialContentTable)
      .where(eq(socialContentTable.socialAccountId, accountId))
      .orderBy(desc(socialContentTable.publishedAt))
      .limit(20);

    const [latestSnapshot] = snapshots.length > 0 ? [snapshots[snapshots.length - 1]] : [null];

    res.json({
      account: {
        id: account.id,
        platform: account.platform,
        username: account.username,
        displayName: account.displayName,
        profileUrl: account.profileUrl,
        avatarUrl: account.avatarUrl,
        verificationStatus: account.verificationStatus,
        lastSyncedAt: account.lastSyncedAt ? account.lastSyncedAt.toISOString() : null,
      },
      currentMetrics: {
        followers: latestSnapshot?.followers || 0,
        following: latestSnapshot?.following ?? null,
        totalContent: latestSnapshot?.totalContent || 0,
        totalViews: latestSnapshot?.totalViews || "0",
        avgViews: latestSnapshot?.avgViews || 0,
        avgLikes: latestSnapshot?.avgLikes || 0,
        avgComments: latestSnapshot?.avgComments || 0,
        engagementRate: latestSnapshot?.engagementRate || "0.00",
      },
      historicalSnapshots: snapshots.map((s) => ({
        id: s.id,
        date: s.snapshotDate.toISOString(),
        followers: s.followers,
        totalViews: s.totalViews,
        engagementRate: s.engagementRate,
        avgViews: s.avgViews,
      })),
      recentContent: content.map((c) => ({
        id: c.id,
        externalContentId: c.externalContentId,
        contentType: c.contentType,
        caption: c.caption,
        permalink: c.permalink,
        thumbnailUrl: c.thumbnailUrl,
        publishedAt: c.publishedAt ? c.publishedAt.toISOString() : null,
        views: c.views,
        likes: c.likes,
        comments: c.comments,
        shares: c.shares,
      })),
    });
  } catch (error) {
    console.error("[GET SOCIAL ANALYTICS ERROR]", error);
    res.status(500).json({ error: "Failed to retrieve social analytics data." });
  }
});

// 5. DELETE /api/social/:platform/disconnect (Deliberate Disconnect & Credential Erasure)
router.delete("/social/:platform/disconnect", requireAuth, requireRole(["influencer"]), async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const platformRaw = req.params.platform;
  const platform = (Array.isArray(platformRaw) ? platformRaw[0] : platformRaw).toLowerCase();

  try {
    const [account] = await db
      .select()
      .from(socialAccountsTable)
      .where(and(eq(socialAccountsTable.userId, userId), eq(socialAccountsTable.platform, platform as any)))
      .limit(1);

    if (!account) {
      res.status(404).json({ error: `No connected '${platform}' account found.` });
      return;
    }

    // 1. Permanently delete encrypted tokens (credential destruction)
    await db.delete(socialTokensTable).where(eq(socialTokensTable.socialAccountId, account.id));

    // 2. Mark account status as DISCONNECTED (retaining account record for historical analytics & attribution)
    await db
      .update(socialAccountsTable)
      .set({
        verificationStatus: "DISCONNECTED",
        updatedAt: new Date(),
      })
      .where(eq(socialAccountsTable.id, account.id));

    // Historical media (social_content) and metric snapshots (social_metric_snapshots) are deliberately RETAINED

    await logAuditEvent({
      userId,
      action: "OAUTH_ACCOUNT_DISCONNECTED",
      details: JSON.stringify({ platform, username: account.username, credentialErased: true }),
    });

    res.json({ success: true, message: `Successfully disconnected ${platform} account @${account.username}. OAuth credentials erased; historical metrics retained.` });
  } catch (error) {
    console.error("[DISCONNECT SOCIAL ERROR]", error);
    res.status(500).json({ error: "Failed to disconnect social account." });
  }
});

// 6. POST /api/social/:platform/sync
router.post("/social/:platform/sync", requireAuth, requireRole(["influencer"]), async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;
  const platformRaw = req.params.platform;
  const platform = (Array.isArray(platformRaw) ? platformRaw[0] : platformRaw).toLowerCase();

  try {
    const [account] = await db
      .select()
      .from(socialAccountsTable)
      .where(and(eq(socialAccountsTable.userId, userId), eq(socialAccountsTable.platform, platform as any)))
      .limit(1);

    if (!account) {
      res.status(404).json({ error: `No connected '${platform}' account found to sync.` });
      return;
    }

    if (account.verificationStatus === "DISCONNECTED") {
      res.status(400).json({ error: `Cannot sync disconnected ${platform} account @${account.username}. Re-authorization required.` });
      return;
    }

    const result = await socialSyncService.syncSocialAccount(account.id);
    res.json(result);
  } catch (error: any) {
    console.error("[SYNC SOCIAL ERROR]", error);
    res.status(500).json({ error: error.message || "Failed to synchronize social account data." });
  }
});

// 7. POST /api/social/privacy/gdpr-delete-user-data (Full Right-To-Be-Forgotten Privacy Erasure)
router.post("/social/privacy/gdpr-delete-user-data", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.userId!;

  try {
    const userAccounts = await db
      .select()
      .from(socialAccountsTable)
      .where(eq(socialAccountsTable.userId, userId));

    for (const acc of userAccounts) {
      // Full cascading hard deletion of account, tokens, snapshots, and media content for privacy compliance
      await db.delete(socialAccountsTable).where(eq(socialAccountsTable.id, acc.id));
    }

    await logAuditEvent({
      userId,
      action: "PRIVACY_DATA_ERASURE",
      details: JSON.stringify({ count: userAccounts.length }),
    });

    res.json({ success: true, message: `Successfully deleted all social account data and history for user.` });
  } catch (error) {
    console.error("[GDPR DELETE ERROR]", error);
    res.status(500).json({ error: "Failed to process privacy data erasure." });
  }
});

export default router;
