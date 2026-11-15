import { Router, type IRouter } from "express";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import {
  storageService,
  validatePresignRequest,
  generateStorageKey,
  type StoragePurpose,
} from "../services/storage.service";
import { logger } from "../lib/logger";

const router: IRouter = Router();

/**
 * POST /api/storage/presign-upload
 * Creates a short-lived presigned upload URL for direct browser PUT upload.
 * Tenant isolation is strictly enforced via server-side req.userId session context.
 */
router.post("/storage/presign-upload", requireAuth, async (req, res): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;

    if (!userId) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }

    const { fileName, contentType, contentLength, purpose } = req.body || {};

    const validation = validatePresignRequest({
      purpose: purpose as StoragePurpose,
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
      purpose: purpose as StoragePurpose,
      contentType,
      originalFileName: fileName,
    });

    const presigned = await storageService.createPresignedUpload({
      storageKey,
      contentType,
      contentLength: Number(contentLength),
      expiresInSeconds: 900, // 15 minutes
    });

    logger.info(
      {
        category: "STORAGE",
        event: "PRESIGNED_UPLOAD_CREATED",
        userId,
        purpose,
        storageKey,
        contentType,
      },
      `[STORAGE] Created presigned upload for user ${userId} (${purpose})`
    );

    res.json({
      uploadUrl: presigned.uploadUrl,
      objectKey: presigned.objectKey,
      expiresIn: presigned.expiresIn,
      contentType: presigned.contentType,
    });
  } catch (error: any) {
    logger.error(
      {
        category: "STORAGE",
        event: "PRESIGN_FAILED",
        error: error.message,
      },
      "[STORAGE ERROR] Presign upload failed"
    );

    res
      .status(500)
      .json({ error: error.message || "Failed to generate storage presigned upload URL." });
  }
});

/**
 * GET /api/storage/public-url
 * Resolves a storage key to its full public media URL.
 */
router.get("/storage/public-url", (req, res): void => {
  const { key } = req.query;

  if (!key || typeof key !== "string") {
    res.status(400).json({ error: "Missing required query parameter 'key'." });
    return;
  }

  // Prevent path traversal & unauthorized private key lookups
  if (
    key.includes("..") ||
    key.startsWith("/") ||
    key.includes("\\") ||
    (!key.startsWith("creators/") && !key.startsWith("uploads/") && !key.startsWith("brands/"))
  ) {
    res.status(403).json({ error: "Invalid or unauthorized storage key parameter." });
    return;
  }

  const url = storageService.getObjectUrl(key);
  res.json({ key, url });
});

export default router;
