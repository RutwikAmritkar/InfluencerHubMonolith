import { Router, type IRouter, type Response } from "express";
import {
  db,
  creatorPortfolioMediaTable,
  influencersTable,
  type CreatorPortfolioMedia,
} from "@workspace/db";
import { eq, and, asc, ne, inArray, sql } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import {
  storageService,
  validatePresignRequest,
  generateStorageKey,
  validateStorageKeyOwnership,
} from "../services/storage.service";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * Helper to resolve authenticated creator profile from req.userId
 */
async function getAuthenticatedCreator(userId: string) {
  const [creator] = await db
    .select()
    .from(influencersTable)
    .where(eq(influencersTable.userId, String(userId)))
    .limit(1);
  return creator || null;
}

/**
 * Helper to format portfolio DTO with resolved public media URLs
 */
function formatPortfolioItem(item: CreatorPortfolioMedia) {
  return {
    id: item.id,
    creatorId: item.creatorId,
    mediaType: item.mediaType,
    storageKey: item.storageKey,
    mediaUrl: storageService.getObjectUrl(item.storageKey),
    thumbnailStorageKey: item.thumbnailStorageKey,
    thumbnailUrl: item.thumbnailStorageKey
      ? storageService.getObjectUrl(item.thumbnailStorageKey)
      : null,
    mimeType: item.mimeType,
    fileSizeBytes: item.fileSizeBytes,
    durationSeconds: item.durationSeconds,
    width: item.width,
    height: item.height,
    sortOrder: item.sortOrder,
    isFeatured: item.isFeatured,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/**
 * GET /api/portfolio
 * Lists all active portfolio media items for the authenticated creator,
 * ordered by sortOrder ASC, with derived completeness metadata.
 */
router.get("/portfolio", requireAuth, async (req, res): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;

    const creator = await getAuthenticatedCreator(userId);
    if (!creator) {
      res.status(404).json({ error: "Creator profile not found for authenticated user." });
      return;
    }

    const items = await db
      .select()
      .from(creatorPortfolioMediaTable)
      .where(
        and(
          eq(creatorPortfolioMediaTable.creatorId, creator.id),
          ne(creatorPortfolioMediaTable.status, "deleted")
        )
      )
      .orderBy(asc(creatorPortfolioMediaTable.sortOrder), asc(creatorPortfolioMediaTable.id));

    const formattedItems = items.map(formatPortfolioItem);
    const activeCount = formattedItems.filter((i) => i.status === "ready").length;

    res.json({
      items: formattedItems,
      count: activeCount,
      minimumTarget: 6,
      maximumAllowed: 9,
      isComplete: activeCount >= 6,
      isFull: activeCount >= 9,
    });
  } catch (error: any) {
    logger.error({ category: "PORTFOLIO", event: "LIST_FAILED", error: error.message });
    res.status(500).json({ error: "Failed to fetch portfolio media items." });
  }
});

/**
 * GET /api/influencers/:id/portfolio
 * Public / Brand-facing read-only endpoint that returns ready portfolio items for a creator.
 */
async function fetchCreatorPortfolio(
  rawIdParam: string | string[] | undefined,
  res: Response
): Promise<void> {
  try {
    const rawId = Array.isArray(rawIdParam) ? rawIdParam[0] : rawIdParam;
    const creatorId = parseInt(rawId || "", 10);

    if (isNaN(creatorId)) {
      res.status(400).json({ error: "Invalid creator ID." });
      return;
    }

    // Verify creator exists (check by influencer.id or influencer.userId)
    let [creator] = await db
      .select()
      .from(influencersTable)
      .where(eq(influencersTable.id, creatorId))
      .limit(1);

    if (!creator) {
      const [byUserId] = await db
        .select()
        .from(influencersTable)
        .where(eq(influencersTable.userId, String(creatorId)))
        .limit(1);
      creator = byUserId;
    }

    if (!creator) {
      res.status(404).json({ error: "Creator profile not found." });
      return;
    }

    // Query ready portfolio items for this creator
    const items = await db
      .select()
      .from(creatorPortfolioMediaTable)
      .where(
        and(
          eq(creatorPortfolioMediaTable.creatorId, creator.id),
          eq(creatorPortfolioMediaTable.status, "ready")
        )
      )
      .orderBy(asc(creatorPortfolioMediaTable.sortOrder), asc(creatorPortfolioMediaTable.id));

    const formattedItems = items.map((item) => ({
      id: item.id,
      mediaType: item.mediaType,
      mediaUrl: storageService.getObjectUrl(item.storageKey),
      thumbnailUrl: item.thumbnailStorageKey
        ? storageService.getObjectUrl(item.thumbnailStorageKey)
        : null,
      mimeType: item.mimeType,
      durationSeconds: item.durationSeconds,
      width: item.width,
      height: item.height,
      sortOrder: item.sortOrder,
      isFeatured: item.isFeatured,
    }));

    res.json({
      items: formattedItems,
      count: formattedItems.length,
    });
  } catch (error: any) {
    logger.error({ category: "PORTFOLIO", event: "PUBLIC_FETCH_FAILED", error: error.message });
    res.status(500).json({ error: "Failed to fetch creator portfolio." });
  }
}

router.get("/influencers/:id/portfolio", async (req, res): Promise<void> => {
  await fetchCreatorPortfolio(req.params.id, res);
});

// Alias route: GET /api/creators/:creatorId/portfolio
router.get("/creators/:creatorId/portfolio", async (req, res): Promise<void> => {
  await fetchCreatorPortfolio(req.params.creatorId, res);
});

/**
 * POST /api/portfolio/presign-upload
 * Requests a presigned R2 upload URL for a new portfolio video.
 * Enforces portfolio item count < 9 limit.
 */
router.post("/portfolio/presign-upload", requireAuth, async (req, res): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;

    const creator = await getAuthenticatedCreator(userId);
    if (!creator) {
      res.status(404).json({ error: "Creator profile not found for authenticated user." });
      return;
    }

    // Check portfolio limit (maximum 9 active items)
    const existingItems = await db
      .select()
      .from(creatorPortfolioMediaTable)
      .where(
        and(
          eq(creatorPortfolioMediaTable.creatorId, creator.id),
          ne(creatorPortfolioMediaTable.status, "deleted")
        )
      );

    if (existingItems.length >= 9) {
      res.status(409).json({
        error: "Portfolio limit reached. Maximum 9 portfolio media items allowed per creator.",
      });
      return;
    }

    const { fileName, contentType, contentLength } = req.body || {};

    const validation = validatePresignRequest({
      purpose: "portfolio",
      contentType,
      contentLength: Number(contentLength),
      fileName,
    });

    if (!validation.valid) {
      res.status(validation.statusCode || 400).json({ error: validation.error });
      return;
    }

    const storageKey = generateStorageKey({
      userId,
      purpose: "portfolio",
      contentType,
      originalFileName: fileName,
    });

    const presigned = await storageService.createPresignedUpload({
      storageKey,
      contentType,
      contentLength: Number(contentLength),
      expiresInSeconds: 900,
    });

    logger.info(
      {
        category: "PORTFOLIO",
        event: "PRESIGN_CREATED",
        creatorId: creator.id,
        storageKey,
      },
      `[PORTFOLIO] Created presigned upload for creator ${creator.id}`
    );

    res.json({
      uploadUrl: presigned.uploadUrl,
      objectKey: presigned.objectKey,
      expiresIn: presigned.expiresIn,
      contentType: presigned.contentType,
    });
  } catch (error: any) {
    logger.error({ category: "PORTFOLIO", event: "PRESIGN_ERROR", error: error.message });
    res.status(500).json({ error: error.message || "Failed to generate presigned upload URL." });
  }
});

/**
 * POST /api/portfolio/confirm
 * Confirms an uploaded portfolio video, verifies object in storage,
 * and creates the creator_portfolio_media database record.
 */
router.post("/portfolio/confirm", requireAuth, async (req, res): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;

    const creator = await getAuthenticatedCreator(userId);
    if (!creator) {
      res.status(404).json({ error: "Creator profile not found for authenticated user." });
      return;
    }

    const {
      storageKey,
      thumbnailStorageKey,
      mimeType,
      fileSizeBytes,
      durationSeconds,
      width,
      height,
      isFeatured,
    } = req.body || {};

    if (!storageKey || typeof storageKey !== "string") {
      res.status(400).json({ error: "Missing required 'storageKey'." });
      return;
    }

    const safeUserId = String(userId).replace(/[^a-zA-Z0-9_\-]/g, "");
    const expectedPortfolioPrefix = `creators/${safeUserId}/portfolio/`;

    // Verify storage key ownership & purpose prefix (tenant & purpose isolation)
    if (
      !validateStorageKeyOwnership(storageKey, userId) ||
      !storageKey.startsWith(expectedPortfolioPrefix)
    ) {
      res
        .status(403)
        .json({ error: "Forbidden. Invalid storage key or unauthorized media purpose." });
      return;
    }

    if (
      thumbnailStorageKey &&
      (!validateStorageKeyOwnership(thumbnailStorageKey, userId) ||
        !thumbnailStorageKey.startsWith(`creators/${safeUserId}/`))
    ) {
      res
        .status(403)
        .json({ error: "Forbidden. Invalid thumbnail storage key or unauthorized media purpose." });
      return;
    }

    // Verify portfolio limit again
    const existingItems = await db
      .select()
      .from(creatorPortfolioMediaTable)
      .where(
        and(
          eq(creatorPortfolioMediaTable.creatorId, creator.id),
          ne(creatorPortfolioMediaTable.status, "deleted")
        )
      );

    if (existingItems.length >= 9) {
      res.status(409).json({
        error: "Portfolio limit reached. Maximum 9 portfolio media items allowed per creator.",
      });
      return;
    }

    // Verify object exists in storage (if configured)
    const exists = await storageService.objectExists(storageKey);
    if (!exists && process.env.NODE_ENV === "production") {
      res.status(400).json({ error: "Uploaded media object was not found in storage." });
      return;
    }

    // Handle single featured item constraint atomically
    const shouldBeFeatured = Boolean(isFeatured);
    if (shouldBeFeatured) {
      await db
        .update(creatorPortfolioMediaTable)
        .set({ isFeatured: false, updatedAt: new Date() })
        .where(
          and(
            eq(creatorPortfolioMediaTable.creatorId, creator.id),
            eq(creatorPortfolioMediaTable.isFeatured, true)
          )
        );
    }

    // Calculate next sort order
    const maxSort = existingItems.reduce((max, item) => Math.max(max, item.sortOrder), -1);
    const nextSortOrder = maxSort + 1;

    const [newItem] = await db
      .insert(creatorPortfolioMediaTable)
      .values({
        creatorId: creator.id,
        mediaType: "video",
        storageKey,
        thumbnailStorageKey: thumbnailStorageKey || null,
        mimeType: mimeType || "video/mp4",
        fileSizeBytes: Number(fileSizeBytes) || 0,
        durationSeconds: durationSeconds ? Number(durationSeconds) : null,
        width: width ? Number(width) : null,
        height: height ? Number(height) : null,
        sortOrder: nextSortOrder,
        isFeatured: shouldBeFeatured,
        status: "ready",
      })
      .returning();

    logger.info(
      {
        category: "PORTFOLIO",
        event: "CONFIRM_SUCCESS",
        creatorId: creator.id,
        itemId: newItem.id,
        storageKey,
      },
      `[PORTFOLIO] Confirmed and created portfolio media record ${newItem.id}`
    );

    res.status(201).json(formatPortfolioItem(newItem));
  } catch (error: any) {
    logger.error({ category: "PORTFOLIO", event: "CONFIRM_ERROR", error: error.message });
    res.status(500).json({ error: error.message || "Failed to confirm portfolio upload." });
  }
});

/**
 * PATCH /api/portfolio/reorder
 * Atomically updates the sortOrder for authenticated creator's portfolio items.
 */
router.patch("/portfolio/reorder", requireAuth, async (req, res): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;

    const creator = await getAuthenticatedCreator(userId);
    if (!creator) {
      res.status(404).json({ error: "Creator profile not found for authenticated user." });
      return;
    }

    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      res
        .status(400)
        .json({ error: "Invalid request payload. 'items' must be a non-empty array." });
      return;
    }

    const itemIds = items.map((i: any) => Number(i.id));
    const sortOrders = items.map((i: any) => Number(i.sortOrder));

    // Check for duplicate IDs or invalid sort orders
    if (new Set(itemIds).size !== itemIds.length) {
      res.status(400).json({ error: "Duplicate item IDs found in reorder payload." });
      return;
    }

    if (
      new Set(sortOrders).size !== sortOrders.length ||
      sortOrders.some((s) => isNaN(s) || s < 0)
    ) {
      res.status(400).json({ error: "Invalid or duplicate sortOrder values provided." });
      return;
    }

    // Verify all requested IDs belong to the authenticated creator
    const existingItems = await db
      .select()
      .from(creatorPortfolioMediaTable)
      .where(
        and(
          eq(creatorPortfolioMediaTable.creatorId, creator.id),
          inArray(creatorPortfolioMediaTable.id, itemIds)
        )
      );

    if (existingItems.length !== itemIds.length) {
      res.status(403).json({
        error:
          "Forbidden. One or more portfolio item IDs do not belong to the authenticated creator.",
      });
      return;
    }

    // Transactionally update sort orders
    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .update(creatorPortfolioMediaTable)
          .set({ sortOrder: Number(item.sortOrder), updatedAt: new Date() })
          .where(
            and(
              eq(creatorPortfolioMediaTable.id, Number(item.id)),
              eq(creatorPortfolioMediaTable.creatorId, creator.id)
            )
          );
      }
    });

    const updatedList = await db
      .select()
      .from(creatorPortfolioMediaTable)
      .where(
        and(
          eq(creatorPortfolioMediaTable.creatorId, creator.id),
          ne(creatorPortfolioMediaTable.status, "deleted")
        )
      )
      .orderBy(asc(creatorPortfolioMediaTable.sortOrder), asc(creatorPortfolioMediaTable.id));

    res.json({ items: updatedList.map(formatPortfolioItem) });
  } catch (error: any) {
    logger.error({ category: "PORTFOLIO", event: "REORDER_ERROR", error: error.message });
    res.status(500).json({ error: error.message || "Failed to reorder portfolio items." });
  }
});

/**
 * PATCH /api/portfolio/:id
 * Updates metadata (such as isFeatured or sortOrder) for a specific portfolio item.
 */
router.patch("/portfolio/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;

    const creator = await getAuthenticatedCreator(userId);
    if (!creator) {
      res.status(404).json({ error: "Creator profile not found for authenticated user." });
      return;
    }

    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const itemId = parseInt(rawId, 10);
    if (isNaN(itemId)) {
      res.status(400).json({ error: "Invalid portfolio item ID." });
      return;
    }

    // Scoped ownership check
    const [existing] = await db
      .select()
      .from(creatorPortfolioMediaTable)
      .where(
        and(
          eq(creatorPortfolioMediaTable.id, itemId),
          eq(creatorPortfolioMediaTable.creatorId, creator.id)
        )
      )
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Portfolio item not found or unauthorized." });
      return;
    }

    const { isFeatured, sortOrder, thumbnailStorageKey } = req.body || {};
    const updates: Partial<CreatorPortfolioMedia> = { updatedAt: new Date() };

    if (sortOrder !== undefined && !isNaN(Number(sortOrder))) {
      updates.sortOrder = Number(sortOrder);
    }

    if (thumbnailStorageKey !== undefined) {
      if (thumbnailStorageKey && !validateStorageKeyOwnership(thumbnailStorageKey, userId)) {
        res
          .status(403)
          .json({ error: "Forbidden. Invalid thumbnail storage key or unauthorized access." });
        return;
      }
      updates.thumbnailStorageKey = thumbnailStorageKey || null;
    }

    // Atomically handle single featured item requirement
    if (isFeatured === true) {
      await db.transaction(async (tx) => {
        await tx
          .update(creatorPortfolioMediaTable)
          .set({ isFeatured: false, updatedAt: new Date() })
          .where(
            and(
              eq(creatorPortfolioMediaTable.creatorId, creator.id),
              eq(creatorPortfolioMediaTable.isFeatured, true)
            )
          );

        updates.isFeatured = true;

        await tx
          .update(creatorPortfolioMediaTable)
          .set(updates)
          .where(
            and(
              eq(creatorPortfolioMediaTable.id, itemId),
              eq(creatorPortfolioMediaTable.creatorId, creator.id)
            )
          );
      });
    } else if (isFeatured === false) {
      updates.isFeatured = false;
      await db
        .update(creatorPortfolioMediaTable)
        .set(updates)
        .where(
          and(
            eq(creatorPortfolioMediaTable.id, itemId),
            eq(creatorPortfolioMediaTable.creatorId, creator.id)
          )
        );
    } else {
      await db
        .update(creatorPortfolioMediaTable)
        .set(updates)
        .where(
          and(
            eq(creatorPortfolioMediaTable.id, itemId),
            eq(creatorPortfolioMediaTable.creatorId, creator.id)
          )
        );
    }

    const [updated] = await db
      .select()
      .from(creatorPortfolioMediaTable)
      .where(
        and(
          eq(creatorPortfolioMediaTable.id, itemId),
          eq(creatorPortfolioMediaTable.creatorId, creator.id)
        )
      )
      .limit(1);

    res.json(formatPortfolioItem(updated));
  } catch (error: any) {
    logger.error({ category: "PORTFOLIO", event: "UPDATE_ERROR", error: error.message });
    res.status(500).json({ error: error.message || "Failed to update portfolio item." });
  }
});

/**
 * DELETE /api/portfolio/:id
 * Deletes a portfolio item from storage (R2 video & thumbnail) and PostgreSQL DB.
 */
router.delete("/portfolio/:id", requireAuth, async (req, res): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;

    const creator = await getAuthenticatedCreator(userId);
    if (!creator) {
      res.status(404).json({ error: "Creator profile not found for authenticated user." });
      return;
    }

    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const itemId = parseInt(rawId, 10);
    if (isNaN(itemId)) {
      res.status(400).json({ error: "Invalid portfolio item ID." });
      return;
    }

    // Scoped ownership check
    const [existing] = await db
      .select()
      .from(creatorPortfolioMediaTable)
      .where(
        and(
          eq(creatorPortfolioMediaTable.id, itemId),
          eq(creatorPortfolioMediaTable.creatorId, creator.id)
        )
      )
      .limit(1);

    if (!existing) {
      res.status(404).json({ error: "Portfolio item not found or unauthorized." });
      return;
    }

    // Delete associated storage objects
    if (existing.storageKey) {
      await storageService.deleteObject(existing.storageKey);
    }
    if (existing.thumbnailStorageKey) {
      await storageService.deleteObject(existing.thumbnailStorageKey);
    }

    // Delete database record
    await db
      .delete(creatorPortfolioMediaTable)
      .where(
        and(
          eq(creatorPortfolioMediaTable.id, itemId),
          eq(creatorPortfolioMediaTable.creatorId, creator.id)
        )
      );

    logger.info(
      {
        category: "PORTFOLIO",
        event: "DELETE_SUCCESS",
        creatorId: creator.id,
        itemId,
      },
      `[PORTFOLIO] Deleted portfolio item ${itemId} for creator ${creator.id}`
    );

    res.json({ success: true, deletedId: itemId });
  } catch (error: any) {
    logger.error({ category: "PORTFOLIO", event: "DELETE_ERROR", error: error.message });
    res.status(500).json({ error: error.message || "Failed to delete portfolio item." });
  }
});

export default router;
