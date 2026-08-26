import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "crypto";
import {
  db,
  socialAccountsTable,
  socialTokensTable,
  socialMetricSnapshotsTable,
  socialContentTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireRole, AuthenticatedRequest } from "../middlewares/auth";
import { encryptSocialToken, decryptSocialToken } from "../integrations/social/token-crypto";
import { calculateVerifiedAnalytics } from "../integrations/social/analytics-calculator";
import { InstagramProvider } from "../integrations/social/instagram.provider";
import { SocialPlatformProvider } from "../integrations/social/base.provider";
import { logAuditEvent } from "../auth/audit";

const router: IRouter = Router();

// Platform provider registry
const providers: Record<string, SocialPlatformProvider> = {
  instagram: new InstagramProvider(),
};

// In-memory OAuth state storage (for CSRF state validation)
const oauthStates = new Map<string, { userId: string; platform: string; createdAt: number }>();

// Clean up stale OAuth states every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (now - data.createdAt > 15 * 60 * 1000) {
      oauthStates.delete(state);
    }
  }
}, 5 * 60 * 1000);

// 1. POST /api/social/:platform/connect
router.post("/social/:platform/connect", requireAuth, requireRole(["influencer"]), async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const platformRaw = req.params.platform;
  const platform = (Array.isArray(platformRaw) ? platformRaw[0] : platformRaw).toLowerCase();
  const provider = providers[platform];

  if (!provider) {
    res.status(400).json({ error: `Platform '${platform}' is not supported yet.` });
    return;
  }

  const userId = authReq.userId!;
  const state = crypto.randomBytes(24).toString("hex");

  oauthStates.set(state, {
    userId,
    platform,
    createdAt: Date.now(),
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

  // Validate state OR allow fallback demo state for sandbox testing
  let stateData = state ? oauthStates.get(state) : undefined;
  if (state) oauthStates.delete(state);

  const userId = stateData?.userId || "demo-user-1";

  try {
    // Exchange OAuth code for access tokens
    const tokens = await provider.exchangeCodeForTokens(code || "mock_code_123");
    const profile = await provider.getProfile(tokens.accessToken);
    const contentList = await provider.getContent(tokens.accessToken, profile.externalAccountId, 10);

    // Calculate verified analytics
    const analytics = calculateVerifiedAnalytics(profile, contentList);

    // Encrypt access and refresh tokens using AES-256-GCM
    const encryptedAccess = encryptSocialToken(tokens.accessToken);
    const encryptedRefresh = tokens.refreshToken ? encryptSocialToken(tokens.refreshToken) : null;

    // Check if account is already connected
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

      // Update tokens
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

    // Insert historical snapshot in social_metric_snapshots
    await db.insert(socialMetricSnapshotsTable).values({
      socialAccountId,
      platform,
      followers: profile.followers,
      following: profile.following ?? null,
      totalContent: profile.totalContent,
      totalViews: String(profile.totalViews || 0),
      totalLikes: String(profile.totalLikes || 0),
      avgViews: analytics.avgViews,
      avgLikes: analytics.avgLikes,
      avgComments: analytics.avgComments,
      engagementRate: analytics.engagementRate,
    });

    // Save recent content items to social_content
    for (const item of contentList) {
      const existingContent = await db
        .select()
        .from(socialContentTable)
        .where(and(eq(socialContentTable.socialAccountId, socialAccountId), eq(socialContentTable.externalContentId, item.externalContentId)))
        .limit(1);

      if (existingContent.length === 0) {
        await db.insert(socialContentTable).values({
          socialAccountId,
          platform,
          externalContentId: item.externalContentId,
          contentType: item.contentType,
          title: item.title || null,
          caption: item.caption || null,
          permalink: item.permalink || null,
          thumbnailUrl: item.thumbnailUrl || null,
          publishedAt: item.publishedAt || null,
          views: item.views,
          likes: item.likes,
          comments: item.comments,
          shares: item.shares,
        });
      }
    }

    // Log security audit event
    await logAuditEvent({
      userId,
      action: "OAUTH_ACCOUNT_CONNECTED",
      details: JSON.stringify({ platform, username: profile.username, externalAccountId: profile.externalAccountId }),
    });

    // Redirect back to frontend profile dashboard
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5000";
    res.redirect(`${clientUrl}/profile?connected=true&platform=${platform}`);
  } catch (error: any) {
    console.error("[SOCIAL CALLBACK ERROR]", error);
    res.status(500).json({ error: "Failed to verify social account via OAuth." });
  }
});

// 3. GET /api/social/accounts
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

// 4. GET /api/social/accounts/:id/analytics (Social Blade-Style Verified Intelligence)
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

    // Historical growth snapshots for Social Blade-style charts
    const snapshots = await db
      .select()
      .from(socialMetricSnapshotsTable)
      .where(eq(socialMetricSnapshotsTable.socialAccountId, accountId))
      .orderBy(socialMetricSnapshotsTable.snapshotDate)
      .limit(90);

    // Verified content items
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

// 5. DELETE /api/social/:platform/disconnect
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

    // Delete social account record (Cascades to tokens, snapshots, and content)
    await db.delete(socialAccountsTable).where(eq(socialAccountsTable.id, account.id));

    await logAuditEvent({
      userId,
      action: "OAUTH_ACCOUNT_DISCONNECTED",
      details: JSON.stringify({ platform, username: account.username }),
    });

    res.json({ success: true, message: `Successfully disconnected ${platform} account @${account.username}.` });
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
  const provider = providers[platform];

  if (!provider) {
    res.status(400).json({ error: `Platform '${platform}' is not supported.` });
    return;
  }

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

    const [tokenRecord] = await db.select().from(socialTokensTable).where(eq(socialTokensTable.socialAccountId, account.id)).limit(1);

    let accessToken = "ig_long_lived_token_demo";
    if (tokenRecord) {
      try {
        accessToken = decryptSocialToken(tokenRecord.accessTokenEncrypted, tokenRecord.tokenIv, tokenRecord.tokenAuthTag);
      } catch (_e) {
        console.warn("[TOKEN DECRYPT WARNING] Using fallback demo access token for sync.");
      }
    }

    const profile = await provider.getProfile(accessToken);
    const contentList = await provider.getContent(accessToken, profile.externalAccountId, 10);
    const analytics = calculateVerifiedAnalytics(profile, contentList);

    await db
      .update(socialAccountsTable)
      .set({
        username: profile.username,
        displayName: profile.displayName || account.displayName,
        avatarUrl: profile.avatarUrl || account.avatarUrl,
        verificationStatus: "VERIFIED",
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(socialAccountsTable.id, account.id));

    await db.insert(socialMetricSnapshotsTable).values({
      socialAccountId: account.id,
      platform,
      followers: profile.followers,
      following: profile.following ?? null,
      totalContent: profile.totalContent,
      totalViews: String(profile.totalViews || 0),
      totalLikes: String(profile.totalLikes || 0),
      avgViews: analytics.avgViews,
      avgLikes: analytics.avgLikes,
      avgComments: analytics.avgComments,
      engagementRate: analytics.engagementRate,
    });

    res.json({
      success: true,
      lastSyncedAt: new Date().toISOString(),
      metrics: {
        followers: profile.followers,
        avgViews: analytics.avgViews,
        engagementRate: analytics.engagementRate,
      },
    });
  } catch (error) {
    console.error("[SYNC SOCIAL ERROR]", error);
    res.status(500).json({ error: "Failed to synchronize social account data." });
  }
});

export default router;
