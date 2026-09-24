import {
  db,
  socialAccountsTable,
  socialTokensTable,
  socialMetricSnapshotsTable,
  socialContentTable,
  socialMediaInsightsTable,
} from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

import { InstagramProvider } from "../integrations/social/instagram.provider";
import { decryptSocialToken } from "../integrations/social/token-crypto";
import { ProbedMetricResult } from "../integrations/social/base.provider";
import { logger } from "../lib/logger";

export interface InstagramAnalyticsPayload {
  account: {
    id: number;
    externalAccountId: string;
    username: string;
    displayName: string | null;
    followers: number;
    following: number | null;
    totalContent: number;
  };
  media: {
    count: number;
    items: Array<{
      externalContentId: string;
      contentType: string;
      caption: string;
      permalink: string;
      thumbnailUrl: string;
      publishedAt: string | null;
      likes: number;
      comments: number;
    }>;
  };
  insights: {
    available: boolean;
    metrics: ProbedMetricResult[];
  };
  fetchedAt: string;
}

export class InstagramDataPipelineService {
  private provider = new InstagramProvider();

  /**
   * Runs the complete Instagram Data Extraction Pipeline for a connected social account ID.
   * Decrypts token internally in memory.
   * Fetches profile, media, account insights, and media insights.
   * Persists normalized structures in PostgreSQL.
   * Returns sanitized analytics JSON object.
   */
  async runPipelineForAccount(socialAccountId: number): Promise<InstagramAnalyticsPayload> {
    const [account] = await db
      .select()
      .from(socialAccountsTable)
      .where(eq(socialAccountsTable.id, socialAccountId))
      .limit(1);

    if (!account) {
      throw new Error(`Social account ID ${socialAccountId} not found.`);
    }

    if (account.platform !== "instagram") {
      throw new Error(`Social account ID ${socialAccountId} is not an Instagram account.`);
    }

    const [tokenRecord] = await db
      .select()
      .from(socialTokensTable)
      .where(eq(socialTokensTable.socialAccountId, socialAccountId))
      .limit(1);

    if (!tokenRecord) {
      throw new Error(`OAuth credentials not found for Instagram account @${account.username}. Re-authorization required.`);
    }

    // Decrypt token strictly in memory
    const accessToken = decryptSocialToken(
      tokenRecord.accessTokenEncrypted,
      tokenRecord.tokenIv,
      tokenRecord.tokenAuthTag
    );

    const now = new Date();
    const nowIso = now.toISOString();

    // 1. PHASE 1 — PROFILE DATA
    const profile = await this.provider.getProfile(accessToken);

    // Update account record
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

    // Append snapshot
    await db.insert(socialMetricSnapshotsTable).values({
      socialAccountId,
      platform: "instagram",
      followers: profile.followers,
      following: profile.following ?? null,
      totalContent: profile.totalContent,
      snapshotDate: now,
    });

    // 2. PHASE 2 — MEDIA DATA
    const contentList = await this.provider.getContent(accessToken, profile.externalAccountId, 50);

    // Upsert media items into social_content
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
            caption: item.caption || existing.caption,
            permalink: item.permalink || existing.permalink,
            thumbnailUrl: item.thumbnailUrl || existing.thumbnailUrl,
            likes: item.likes,
            comments: item.comments,
            updatedAt: now,
          })
          .where(eq(socialContentTable.id, existing.id));
      } else {
        await db.insert(socialContentTable).values({
          socialAccountId,
          platform: "instagram",
          externalContentId: item.externalContentId,
          contentType: item.contentType,
          caption: item.caption || null,
          permalink: item.permalink || null,
          thumbnailUrl: item.thumbnailUrl || null,
          publishedAt: item.publishedAt || null,
          likes: item.likes,
          comments: item.comments,
        });
      }
    }

    // 3. PHASE 3 — ACCOUNT-LEVEL INSIGHTS
    const probedAccountInsights = await this.provider.probeAccountInsights(accessToken, profile.externalAccountId);

    for (const insight of probedAccountInsights) {
      if (insight.accepted && insight.value !== null) {
        await db.insert(socialMediaInsightsTable).values({
          socialAccountId,
          externalContentId: null,
          metric: insight.metric,
          value: String(insight.value),
          period: insight.period || "day",
          periodStart: insight.periodStart ? sql`${new Date(insight.periodStart).toISOString()}::timestamptz` : null,

          fetchedAt: now,
          source: "instagram_graph_api",
        });
      }
    }

    // 4. PHASE 4 — MEDIA-LEVEL INSIGHTS
    const mediaInsightsList: ProbedMetricResult[] = [];

    if (contentList.length > 0) {
      for (const item of contentList) {
        const probedMediaInsights = await this.provider.probeMediaInsights(
          accessToken,
          item.externalContentId,
          item.contentType
        );

        for (const insight of probedMediaInsights) {
          if (insight.accepted && insight.value !== null) {
            mediaInsightsList.push(insight);
            await db.insert(socialMediaInsightsTable).values({
              socialAccountId,
              externalContentId: item.externalContentId,
              metric: insight.metric,
              value: String(insight.value),
              period: insight.period || "lifetime",
              fetchedAt: now,
              source: "instagram_graph_api",
            });
          }
        }
      }
    }

    logger.info({
      category: "INSTAGRAM_PIPELINE",
      socialAccountId,
      username: profile.username,
      mediaCount: contentList.length,
      accountInsightsCount: probedAccountInsights.filter((i) => i.accepted).length,
      mediaInsightsCount: mediaInsightsList.length,
    }, "[INSTAGRAM PIPELINE COMPLETE] Successfully executed full Instagram extraction pipeline.");

    // 5. PHASE 6 — SANITIZED RESPONSE SHAPE
    return {
      account: {
        id: socialAccountId,
        externalAccountId: profile.externalAccountId,
        username: profile.username,
        displayName: profile.displayName || account.displayName || null,
        followers: profile.followers,
        following: profile.following ?? null,
        totalContent: profile.totalContent,
      },
      media: {
        count: contentList.length,
        items: contentList.map((item) => ({
          externalContentId: item.externalContentId,
          contentType: item.contentType,
          caption: item.caption || "",
          permalink: item.permalink || "",
          thumbnailUrl: item.thumbnailUrl || "",
          publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
          likes: item.likes,
          comments: item.comments,
        })),
      },
      insights: {
        available: probedAccountInsights.some((i) => i.accepted),
        metrics: probedAccountInsights,
      },
      fetchedAt: nowIso,
    };
  }
}

export const instagramDataPipelineService = new InstagramDataPipelineService();
