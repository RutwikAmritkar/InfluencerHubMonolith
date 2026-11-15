import { Router, type IRouter } from "express";
import fs from "node:fs";
import path from "node:path";
import { db, influencersTable, user as userTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import {
  storageService,
  validatePresignRequest,
  generateStorageKey,
  validateStorageKeyOwnership,
} from "../services/storage.service";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * POST /api/upload/avatar/presign
 * Generates a presigned R2 upload URL for a new avatar/profile image.
 * Tenant isolation is strictly enforced via server-side req.userId session context.
 */
router.post("/upload/avatar/presign", requireAuth, async (req, res): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;

    if (!userId) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    const { fileName, contentType, contentLength } = req.body || {};

    const validation = validatePresignRequest({
      purpose: "avatar",
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
      purpose: "avatar",
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
        category: "STORAGE",
        event: "AVATAR_PRESIGN_CREATED",
        userId,
        storageKey,
      },
      `[AVATAR] Presigned upload generated for user ${userId}`
    );

    res.json({
      uploadUrl: presigned.uploadUrl,
      objectKey: presigned.objectKey,
      expiresIn: presigned.expiresIn,
      contentType: presigned.contentType,
    });
  } catch (error: any) {
    logger.error({ category: "STORAGE", event: "AVATAR_PRESIGN_FAILED", error: error.message });
    res.status(500).json({ error: error.message || "Failed to generate avatar upload URL." });
  }
});

/**
 * POST /api/upload/avatar/confirm
 * Confirms uploaded R2 avatar object, updates database (influencers.avatarUrl & user.image),
 * deletes previous R2 avatar object safely, and returns the resolved public URL.
 */
router.post("/upload/avatar/confirm", requireAuth, async (req, res): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;

    const { storageKey } = req.body || {};

    if (!storageKey || typeof storageKey !== "string") {
      res.status(400).json({ error: "Missing required 'storageKey'." });
      return;
    }

    const safeUserId = String(userId).replace(/[^a-zA-Z0-9_\-]/g, "");
    const expectedAvatarPrefix = `creators/${safeUserId}/avatar/`;

    // Verify tenant ownership & purpose prefix
    if (
      !validateStorageKeyOwnership(storageKey, userId) ||
      !storageKey.startsWith(expectedAvatarPrefix)
    ) {
      res
        .status(403)
        .json({ error: "Forbidden. Invalid storage key or unauthorized media purpose." });
      return;
    }

    // Verify object exists in storage (in production)
    const exists = await storageService.objectExists(storageKey);
    if (!exists && process.env.NODE_ENV === "production") {
      res.status(400).json({ error: "Uploaded avatar image object was not found in storage." });
      return;
    }

    // Fetch existing creator profile to get old avatar key
    const [existingCreator] = await db
      .select()
      .from(influencersTable)
      .where(eq(influencersTable.userId, String(userId)))
      .limit(1);

    const oldAvatarKey = existingCreator?.avatarUrl;

    // Update database (influencersTable and userTable)
    if (existingCreator) {
      await db
        .update(influencersTable)
        .set({ avatarUrl: storageKey })
        .where(eq(influencersTable.id, existingCreator.id));
    }

    await db
      .update(userTable)
      .set({ image: storageKey })
      .where(eq(userTable.id, String(userId)))
      .catch(() => {});

    // Safe deletion of old avatar if it was an R2 object owned by this user
    if (
      oldAvatarKey &&
      oldAvatarKey !== storageKey &&
      oldAvatarKey.startsWith("creators/") &&
      validateStorageKeyOwnership(oldAvatarKey, userId)
    ) {
      try {
        await storageService.deleteObject(oldAvatarKey);
        logger.info(
          {
            category: "STORAGE",
            event: "OLD_AVATAR_CLEANED",
            userId,
            oldAvatarKey,
          },
          `[AVATAR] Deleted previous avatar object ${oldAvatarKey}`
        );
      } catch (cleanErr: any) {
        logger.warn(
          {
            category: "STORAGE",
            event: "OLD_AVATAR_CLEANUP_FAILED",
            userId,
            oldAvatarKey,
            error: cleanErr.message,
          },
          "[AVATAR] Failed to delete old avatar R2 object"
        );
      }
    }

    const publicUrl = storageService.getObjectUrl(storageKey);

    logger.info(
      {
        category: "STORAGE",
        event: "AVATAR_CONFIRM_SUCCESS",
        userId,
        storageKey,
        publicUrl,
      },
      `[AVATAR] Confirmed avatar upload for user ${userId}`
    );

    res.json({
      ok: true,
      url: publicUrl,
      storageKey,
    });
  } catch (error: any) {
    logger.error({ category: "STORAGE", event: "AVATAR_CONFIRM_FAILED", error: error.message });
    res.status(500).json({ error: error.message || "Failed to confirm avatar upload." });
  }
});

/**
 * POST /api/upload/cover/presign
 * Generates a presigned R2 upload URL for a new creator profile cover image.
 * Tenant isolation is strictly enforced via server-side req.userId session context.
 */
router.post("/upload/cover/presign", requireAuth, async (req, res): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;

    if (!userId) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    const { fileName, contentType, contentLength } = req.body || {};

    const validation = validatePresignRequest({
      purpose: "cover",
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
      purpose: "cover",
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
        category: "STORAGE",
        event: "COVER_PRESIGN_CREATED",
        userId,
        storageKey,
      },
      `[COVER] Presigned upload generated for user ${userId}`
    );

    res.json({
      uploadUrl: presigned.uploadUrl,
      objectKey: presigned.objectKey,
      expiresIn: presigned.expiresIn,
      contentType: presigned.contentType,
    });
  } catch (error: any) {
    logger.error({ category: "STORAGE", event: "COVER_PRESIGN_FAILED", error: error.message });
    res.status(500).json({ error: error.message || "Failed to generate cover upload URL." });
  }
});

/**
 * POST /api/upload/cover/confirm
 * Confirms uploaded R2 cover object, updates database (influencers.coverUrl),
 * deletes previous R2 cover object safely, and returns the resolved public URL.
 */
router.post("/upload/cover/confirm", requireAuth, async (req, res): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;

    const { storageKey } = req.body || {};

    if (!storageKey || typeof storageKey !== "string") {
      res.status(400).json({ error: "Missing required 'storageKey'." });
      return;
    }

    const safeUserId = String(userId).replace(/[^a-zA-Z0-9_\-]/g, "");
    const expectedCoverPrefix = `creators/${safeUserId}/cover/`;

    // Verify tenant ownership & purpose prefix
    if (
      !validateStorageKeyOwnership(storageKey, userId) ||
      !storageKey.startsWith(expectedCoverPrefix)
    ) {
      res
        .status(403)
        .json({ error: "Forbidden. Invalid storage key or unauthorized media purpose." });
      return;
    }

    // Verify object exists in storage (in production)
    const exists = await storageService.objectExists(storageKey);
    if (!exists && process.env.NODE_ENV === "production") {
      res.status(400).json({ error: "Uploaded cover image object was not found in storage." });
      return;
    }

    // Fetch existing creator profile to get old cover key
    const [existingCreator] = await db
      .select()
      .from(influencersTable)
      .where(eq(influencersTable.userId, String(userId)))
      .limit(1);

    const oldCoverKey = existingCreator?.coverUrl;

    // Update database (influencersTable)
    if (existingCreator) {
      await db
        .update(influencersTable)
        .set({ coverUrl: storageKey })
        .where(eq(influencersTable.id, existingCreator.id));
    }

    // Safe deletion of old cover if it was an R2 object owned by this user
    if (
      oldCoverKey &&
      oldCoverKey !== storageKey &&
      oldCoverKey.startsWith("creators/") &&
      oldCoverKey.includes("/cover/") &&
      validateStorageKeyOwnership(oldCoverKey, userId)
    ) {
      try {
        await storageService.deleteObject(oldCoverKey);
        logger.info(
          {
            category: "STORAGE",
            event: "OLD_COVER_CLEANED",
            userId,
            oldCoverKey,
          },
          `[COVER] Deleted previous cover object ${oldCoverKey}`
        );
      } catch (cleanErr: any) {
        logger.warn(
          {
            category: "STORAGE",
            event: "OLD_COVER_CLEANUP_FAILED",
            userId,
            oldCoverKey,
            error: cleanErr.message,
          },
          "[COVER] Failed to delete old cover R2 object"
        );
      }
    }

    const publicUrl = storageService.getObjectUrl(storageKey);

    logger.info(
      {
        category: "STORAGE",
        event: "COVER_CONFIRM_SUCCESS",
        userId,
        storageKey,
        publicUrl,
      },
      `[COVER] Confirmed cover upload for user ${userId}`
    );

    res.json({
      ok: true,
      url: publicUrl,
      storageKey,
    });
  } catch (error: any) {
    logger.error({ category: "STORAGE", event: "COVER_CONFIRM_FAILED", error: error.message });
    res.status(500).json({ error: error.message || "Failed to confirm cover upload." });
  }
});

/**
 * DELETE /api/upload/avatar & DELETE /upload/avatar
 * Removes creator's custom profile image:
 * 1. Authenticates request via server-side session context.
 * 2. Fetches database records for current creator profile and user.
 * 3. Clears database references (influencersTable.avatarUrl = "", userTable.image = null).
 * 4. Deletes custom R2 object safely if present and owned by creator.
 */
const handleAvatarDelete = async (req: any, res: any): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;

    if (!userId) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    let [existingCreator] = await db
      .select()
      .from(influencersTable)
      .where(eq(influencersTable.userId, String(userId)))
      .limit(1);

    if (!existingCreator && authReq.user?.profileId) {
      [existingCreator] = await db
        .select()
        .from(influencersTable)
        .where(eq(influencersTable.id, authReq.user.profileId))
        .limit(1);
    }

    const [existingUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, String(userId)))
      .limit(1);

    // Step 1: Clear database references FIRST to prevent display of deleted image
    if (existingCreator) {
      await db
        .update(influencersTable)
        .set({ avatarUrl: "" })
        .where(eq(influencersTable.id, existingCreator.id));
    }

    await db
      .update(userTable)
      .set({ image: null })
      .where(eq(userTable.id, String(userId)))
      .catch(() => {});

    const currentAvatarKey = existingCreator?.avatarUrl || existingUser?.image || null;

    // Step 2: Attempt safe R2 object deletion if a custom R2 key exists
    if (
      currentAvatarKey &&
      typeof currentAvatarKey === "string" &&
      currentAvatarKey.startsWith("creators/") &&
      currentAvatarKey.includes("/avatar/") &&
      validateStorageKeyOwnership(currentAvatarKey, userId)
    ) {
      try {
        await storageService.deleteObject(currentAvatarKey);
        logger.info(
          {
            category: "STORAGE",
            event: "AVATAR_REMOVED",
            userId,
            storageKey: currentAvatarKey,
          },
          `[AVATAR] Deleted avatar R2 object ${currentAvatarKey} for user ${userId}`
        );
      } catch (cleanErr: any) {
        logger.warn(
          {
            category: "STORAGE",
            event: "AVATAR_CLEANUP_FAILED",
            userId,
            storageKey: currentAvatarKey,
            error: cleanErr.message,
          },
          "[AVATAR] Failed to delete avatar R2 object during removal"
        );
      }
    }

    res.json({
      ok: true,
      avatarUrl: "",
      message: "Profile image removed successfully.",
    });
  } catch (error: any) {
    logger.error({ category: "STORAGE", event: "AVATAR_DELETE_FAILED", error: error.message });
    res.status(500).json({ error: error.message || "Failed to remove profile image." });
  }
};

router.delete("/upload/avatar", requireAuth, handleAvatarDelete);
router.delete("/api/upload/avatar", requireAuth, handleAvatarDelete);

/**
 * DELETE /api/upload/cover & DELETE /upload/cover
 * Removes creator's custom cover photo:
 * 1. Authenticates request via server-side session context.
 * 2. Fetches database records for current creator profile.
 * 3. Clears database reference (influencersTable.coverUrl = null).
 * 4. Deletes custom R2 cover object safely if present and owned by creator.
 */
const handleCoverDelete = async (req: any, res: any): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;

    if (!userId) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    let [existingCreator] = await db
      .select()
      .from(influencersTable)
      .where(eq(influencersTable.userId, String(userId)))
      .limit(1);

    if (!existingCreator && authReq.user?.profileId) {
      [existingCreator] = await db
        .select()
        .from(influencersTable)
        .where(eq(influencersTable.id, authReq.user.profileId))
        .limit(1);
    }

    if (!existingCreator) {
      res.json({
        ok: true,
        coverUrl: null,
        message: "No creator cover photo to remove.",
      });
      return;
    }

    const currentCoverKey = existingCreator.coverUrl;

    // Step 1: Clear database reference FIRST
    await db
      .update(influencersTable)
      .set({ coverUrl: null })
      .where(eq(influencersTable.id, existingCreator.id));

    // Step 2: Attempt safe R2 object deletion if a custom R2 cover key exists
    if (
      currentCoverKey &&
      typeof currentCoverKey === "string" &&
      currentCoverKey.startsWith("creators/") &&
      currentCoverKey.includes("/cover/") &&
      validateStorageKeyOwnership(currentCoverKey, userId)
    ) {
      try {
        await storageService.deleteObject(currentCoverKey);
        logger.info(
          {
            category: "STORAGE",
            event: "COVER_REMOVED",
            userId,
            storageKey: currentCoverKey,
          },
          `[COVER] Deleted cover R2 object ${currentCoverKey} for user ${userId}`
        );
      } catch (cleanErr: any) {
        logger.warn(
          {
            category: "STORAGE",
            event: "COVER_CLEANUP_FAILED",
            userId,
            storageKey: currentCoverKey,
            error: cleanErr.message,
          },
          "[COVER] Failed to delete cover R2 object during removal"
        );
      }
    }

    res.json({
      ok: true,
      coverUrl: null,
      message: "Cover photo removed successfully.",
    });
  } catch (error: any) {
    logger.error({ category: "STORAGE", event: "COVER_DELETE_FAILED", error: error.message });
    res.status(500).json({ error: error.message || "Failed to remove cover photo." });
  }
};

router.delete("/upload/cover", requireAuth, handleCoverDelete);
router.delete("/api/upload/cover", requireAuth, handleCoverDelete);

/**
 * Legacy compatibility endpoint: POST /api/upload/image
 * Preserved for backward compatibility. Saves binary data to local uploads directory
 * or wraps storage abstraction if configured.
 */
router.post("/upload/image", requireAuth, async (req, res): Promise<void> => {
  try {
    const { image, name } = req.body || {};

    if (!image || typeof image !== "string") {
      res.status(400).json({ error: "No valid image data provided." });
      return;
    }

    let buffer: Buffer;
    let ext = "png";

    if (image.startsWith("data:")) {
      const matches = image.match(/^data:image\/([a-zA-Z0-9\+\-]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        res.status(400).json({ error: "Invalid base64 image format." });
        return;
      }
      const rawExt = matches[1].toLowerCase();
      ext = rawExt === "jpeg" ? "jpg" : rawExt.replace("svg+xml", "svg");
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(image, "base64");
    }

    // Restrict max size to 10MB
    if (buffer.length > 10 * 1024 * 1024) {
      res.status(400).json({ error: "Image file exceeds 10MB size limit." });
      return;
    }

    const filename = `img_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;
    res.json({
      ok: true,
      url: publicUrl,
      filename,
    });
  } catch (error: any) {
    console.error("[UPLOAD ERROR]", error);
    res.status(500).json({ error: "Failed to save uploaded image." });
  }
});

export default router;
