import {
  db,
  socialAccountsTable,
  socialTokensTable,
  socialMetricSnapshotsTable,
  socialContentTable,
  SocialAccountRecord,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { SocialPlatformProvider } from "../integrations/social/base.provider";
import { InstagramProvider } from "../integrations/social/instagram.provider";
import { YouTubeProvider } from "../integrations/social/youtube.provider";
import { encryptSocialToken, decryptSocialToken } from "../integrations/social/token-crypto";
import { calculateVerifiedAnalytics } from "../integrations/social/analytics-calculator";

import { logSocialSyncEvent } from "../lib/logger";

export interface SyncResult {
  success: boolean;
  socialAccountId: number;
  platform: string;
  username: string;
  followers: number;
  engagementRate: string;
  lastSyncedAt: string;
  error?: string;
}

export class SocialSyncService {
  private providers = new Map<string, SocialPlatformProvider>();

  constructor() {
    this.registerProvider(new InstagramProvider());
    this.registerProvider(new YouTubeProvider());
  }

  registerProvider(provider: SocialPlatformProvider) {
    this.providers.set(provider.platform, provider);
  }

  getProvider(platform: string): SocialPlatformProvider | undefined {
    return this.providers.get(platform.toLowerCase());
  }

  /**
   * Synchronize a specific connected social account by ID.
   * Performs automated token decryption, token refresh if expired, profile fetch,
   * metric snapshot insertion, and media content upsert.
   */
  async syncSocialAccount(socialAccountId: number): Promise<SyncResult> {
    const [account] = await db
      .select()
      .from(socialAccountsTable)
      .where(eq(socialAccountsTable.id, socialAccountId))
      .limit(1);

    if (!account) {
      throw new Error(`Social account ID ${socialAccountId} not found.`);
    }

    const provider = this.getProvider(account.platform);
    if (!provider) {
      throw new Error(`Provider for platform '${account.platform}' is not supported.`);
    }

    const [tokenRecord] = await db
      .select()
      .from(socialTokensTable)
      .where(eq(socialTokensTable.socialAccountId, socialAccountId))
      .limit(1);

    let accessToken = `${account.platform}_demo_token`;
    let refreshToken: string | undefined;

    if (tokenRecord) {
      try {
        accessToken = decryptSocialToken(
          tokenRecord.accessTokenEncrypted,
          tokenRecord.tokenIv,
          tokenRecord.tokenAuthTag
        );
        if (tokenRecord.refreshTokenEncrypted) {
          refreshToken = decryptSocialToken(
            tokenRecord.refreshTokenEncrypted,
            tokenRecord.tokenIv,
            tokenRecord.tokenAuthTag
          );
        }
      } catch (err: any) {
        logSocialSyncEvent("DECRYPT_WARNING", { platform: account.platform, socialAccountId, username: account.username, success: false, error: err.message });
      }

      // Auto-refresh token if expired
      if (tokenRecord.expiresAt && new Date(tokenRecord.expiresAt) <= new Date() && refreshToken) {
        try {
          logSocialSyncEvent("TOKEN_REFRESH_ATTEMPT", { platform: account.platform, socialAccountId, username: account.username, success: true });
          const refreshed = await provider.refreshAccessToken(refreshToken);
          accessToken = refreshed.accessToken;
          const encryptedAccess = encryptSocialToken(accessToken);
          const encryptedRefresh = refreshed.refreshToken ? encryptSocialToken(refreshed.refreshToken) : null;

          await db
            .update(socialTokensTable)
            .set({
              accessTokenEncrypted: encryptedAccess.encryptedToken,
              refreshTokenEncrypted: encryptedRefresh ? encryptedRefresh.encryptedToken : tokenRecord.refreshTokenEncrypted,
              tokenIv: encryptedAccess.iv,
              tokenAuthTag: encryptedAccess.authTag,
              expiresAt: refreshed.expiresIn ? new Date(Date.now() + refreshed.expiresIn * 1000) : null,
              updatedAt: new Date(),
            })
            .where(eq(socialTokensTable.id, tokenRecord.id));
        } catch (refreshErr: any) {
          logSocialSyncEvent("TOKEN_REFRESH_FAILED", { platform: account.platform, socialAccountId, username: account.username, success: false, error: refreshErr.message });
          await db
            .update(socialAccountsTable)
            .set({ verificationStatus: "REAUTH_REQUIRED", updatedAt: new Date() })
            .where(eq(socialAccountsTable.id, socialAccountId));

          return {
            success: false,
            socialAccountId,
            platform: account.platform,
            username: account.username,
            followers: 0,
            engagementRate: "0.00",
            lastSyncedAt: new Date().toISOString(),
            error: "Token expired and refresh failed. Re-authorization required.",
          };
        }
      }
    }

    try {
      // 1. Fetch normalized profile
      const profile = await provider.getProfile(accessToken);

      // 2. Fetch recent content
      const contentList = await provider.getContent(accessToken, profile.externalAccountId, 10);

      // 3. Calculate verified telemetry analytics
      const analytics = calculateVerifiedAnalytics(profile, contentList);

      const now = new Date();

      // 4. Update account metadata
      await db
        .update(socialAccountsTable)
        .set({
          externalAccountId: profile.externalAccountId,
          username: profile.username,
          displayName: profile.displayName || account.displayName,
          profileUrl: profile.profileUrl || account.profileUrl,
          avatarUrl: profile.avatarUrl || account.avatarUrl,
          verificationStatus: "VERIFIED",
          lastSyncedAt: now,
          updatedAt: now,
        })
        .where(eq(socialAccountsTable.id, socialAccountId));

      // 5. Append historical snapshot in social_metric_snapshots
      await db.insert(socialMetricSnapshotsTable).values({
        socialAccountId,
        platform: account.platform,
        followers: profile.followers,
        following: profile.following ?? null,
        totalContent: profile.totalContent,
        totalViews: String(profile.totalViews || 0),
        totalLikes: String(profile.totalLikes || 0),
        avgViews: analytics.avgViews,
        avgLikes: analytics.avgLikes,
        avgComments: analytics.avgComments,
        engagementRate: analytics.engagementRate,
        snapshotDate: now,
      });

      // 6. Idempotent content upsert
      for (const item of contentList) {
        const [existing] = await db
          .select()
          .from(socialContentTable)
          .where(
            and(
              eq(socialContentTable.socialAccountId, socialAccountId),
              eq(socialContentTable.externalContentId, item.externalContentId)
            )
          )
          .limit(1);

        if (existing) {
          await db
            .update(socialContentTable)
            .set({
              title: item.title || existing.title,
              caption: item.caption || existing.caption,
              permalink: item.permalink || existing.permalink,
              thumbnailUrl: item.thumbnailUrl || existing.thumbnailUrl,
              views: item.views,
              likes: item.likes,
              comments: item.comments,
              shares: item.shares,
              updatedAt: now,
            })
            .where(eq(socialContentTable.id, existing.id));
        } else {
          await db.insert(socialContentTable).values({
            socialAccountId,
            platform: account.platform,
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

      logSocialSyncEvent("SYNC_SUCCESS", { platform: account.platform, socialAccountId, username: profile.username, followers: profile.followers, success: true });

      return {
        success: true,
        socialAccountId,
        platform: account.platform,
        username: profile.username,
        followers: profile.followers,
        engagementRate: analytics.engagementRate,
        lastSyncedAt: now.toISOString(),
      };
    } catch (error: any) {
      logSocialSyncEvent("SYNC_ERROR", { platform: account.platform, socialAccountId, username: account.username, success: false, error: error.message });

      await db
        .update(socialAccountsTable)
        .set({ verificationStatus: "SYNC_ERROR", updatedAt: new Date() })
        .where(eq(socialAccountsTable.id, socialAccountId));

      return {
        success: false,
        socialAccountId,
        platform: account.platform,
        username: account.username,
        followers: 0,
        engagementRate: "0.00",
        lastSyncedAt: new Date().toISOString(),
        error: error.message || "Failed to synchronize social data from provider API.",
      };
    }
  }


  /**
   * Synchronize all active social accounts belonging to a user ID.
   */
  async syncUserAccounts(userId: string): Promise<SyncResult[]> {
    const accounts = await db
      .select()
      .from(socialAccountsTable)
      .where(eq(socialAccountsTable.userId, userId));

    const results: SyncResult[] = [];
    for (const acc of accounts) {
      try {
        const res = await this.syncSocialAccount(acc.id);
        results.push(res);
      } catch (err: any) {
        results.push({
          success: false,
          socialAccountId: acc.id,
          platform: acc.platform,
          username: acc.username,
          followers: 0,
          engagementRate: "0.00",
          lastSyncedAt: new Date().toISOString(),
          error: err.message,
        });
      }
    }
    return results;
  }
}

export const socialSyncService = new SocialSyncService();
