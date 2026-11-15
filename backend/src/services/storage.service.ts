import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";
import { logger } from "../lib/logger";

export interface PresignedUploadOptions {
  storageKey: string;
  contentType: string;
  contentLength?: number;
  expiresInSeconds?: number;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
  contentType: string;
}

export type StoragePurpose =
  "portfolio" | "avatar" | "cover" | "brand-asset" | "campaign-deliverable" | "deal-document";

export interface PresignValidationInput {
  purpose: StoragePurpose;
  contentType: string;
  contentLength: number;
  fileName?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
}

export interface StorageProvider {
  createPresignedUpload(options: PresignedUploadOptions): Promise<PresignedUploadResult>;
  deleteObject(storageKey: string): Promise<boolean>;
  getObjectUrl(storageKey: string): string;
  objectExists(storageKey: string): Promise<boolean>;
}

export interface StorageConfig {
  provider: string;
  endpoint?: string;
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicBaseUrl?: string;
}

export class R2StorageProvider implements StorageProvider {
  private s3Client: S3Client | null = null;

  constructor(private customConfig?: Partial<StorageConfig>) {}

  private getConfig(): StorageConfig {
    return {
      provider: this.customConfig?.provider || process.env.STORAGE_PROVIDER || "r2",
      endpoint: this.customConfig?.endpoint || process.env.STORAGE_ENDPOINT,
      bucket: this.customConfig?.bucket || process.env.STORAGE_BUCKET,
      region: this.customConfig?.region || process.env.STORAGE_REGION || "auto",
      accessKeyId: this.customConfig?.accessKeyId || process.env.STORAGE_ACCESS_KEY_ID,
      secretAccessKey: this.customConfig?.secretAccessKey || process.env.STORAGE_SECRET_ACCESS_KEY,
      publicBaseUrl:
        this.customConfig?.publicBaseUrl ||
        process.env.STORAGE_PUBLIC_BASE_URL ||
        "http://localhost:5001/uploads",
    };
  }

  private getClient(): { client: S3Client; bucket: string } {
    const config = this.getConfig();

    if (!config.endpoint || !config.bucket || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error(
        "Storage service error: Storage credentials or bucket endpoint are not configured."
      );
    }

    if (!this.s3Client) {
      this.s3Client = new S3Client({
        region: config.region || "auto",
        endpoint: config.endpoint,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
    }

    return { client: this.s3Client, bucket: config.bucket };
  }

  async createPresignedUpload(options: PresignedUploadOptions): Promise<PresignedUploadResult> {
    const { client, bucket } = this.getClient();
    const expiresIn = options.expiresInSeconds ?? 900; // 15 minutes

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: options.storageKey,
      ContentType: options.contentType,
      ...(options.contentLength ? { ContentLength: options.contentLength } : {}),
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn });

    return {
      uploadUrl,
      objectKey: options.storageKey,
      expiresIn,
      contentType: options.contentType,
    };
  }

  async deleteObject(storageKey: string): Promise<boolean> {
    try {
      const { client, bucket } = this.getClient();
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      });
      await client.send(command);
      return true;
    } catch (err: any) {
      logger.error({ category: "STORAGE", event: "DELETE_FAILED", error: err.message });
      return false;
    }
  }

  async objectExists(storageKey: string): Promise<boolean> {
    try {
      const { client, bucket } = this.getClient();
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: storageKey,
      });
      await client.send(command);
      return true;
    } catch (_err) {
      return false;
    }
  }

  getObjectUrl(storageKey: string): string {
    const config = this.getConfig();
    const baseUrl = (config.publicBaseUrl || "http://localhost:5001/uploads").replace(/\/+$/, "");
    const cleanKey = storageKey.replace(/^\/+/, "");
    return `${baseUrl}/${cleanKey}`;
  }
}

// Global storage provider instance
export const storageService: StorageProvider = new R2StorageProvider();

/**
 * Server-side validation for presign upload requests
 */
export function validatePresignRequest(input: PresignValidationInput): ValidationResult {
  const allowedPurposes: StoragePurpose[] = [
    "portfolio",
    "avatar",
    "cover",
    "brand-asset",
    "campaign-deliverable",
    "deal-document",
  ];
  if (!input.purpose || !allowedPurposes.includes(input.purpose)) {
    return {
      valid: false,
      statusCode: 400,
      error: `Invalid storage purpose. Allowed: ${allowedPurposes.join(", ")}`,
    };
  }

  if (!input.contentType || typeof input.contentType !== "string") {
    return { valid: false, statusCode: 400, error: "Missing required 'contentType'." };
  }

  if (
    typeof input.contentLength !== "number" ||
    input.contentLength <= 0 ||
    isNaN(input.contentLength)
  ) {
    return { valid: false, statusCode: 400, error: "Missing or invalid 'contentLength'." };
  }

  // Purpose-specific limits & MIME checks
  if (input.purpose === "portfolio") {
    const allowedPortfolioMimeTypes = ["video/mp4", "video/quicktime"];
    if (!allowedPortfolioMimeTypes.includes(input.contentType.toLowerCase())) {
      return {
        valid: false,
        statusCode: 415,
        error: `Unsupported media type '${input.contentType}' for portfolio video. Allowed: video/mp4, video/quicktime.`,
      };
    }

    const maxPortfolioSizeBytes = 100 * 1024 * 1024; // 100 MB
    if (input.contentLength > maxPortfolioSizeBytes) {
      return {
        valid: false,
        statusCode: 413,
        error: `Portfolio video size (${(input.contentLength / (1024 * 1024)).toFixed(1)}MB) exceeds maximum 100MB limit.`,
      };
    }
  } else if (input.purpose === "avatar") {
    const allowedAvatarMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedAvatarMimeTypes.includes(input.contentType.toLowerCase())) {
      return {
        valid: false,
        statusCode: 415,
        error: `Unsupported image type '${input.contentType}' for avatar. Allowed: JPG, PNG, WEBP, GIF.`,
      };
    }

    const maxAvatarSizeBytes = 10 * 1024 * 1024; // 10 MB
    if (input.contentLength > maxAvatarSizeBytes) {
      return {
        valid: false,
        statusCode: 413,
        error: `Avatar image size (${(input.contentLength / (1024 * 1024)).toFixed(1)}MB) exceeds maximum 10MB limit.`,
      };
    }
  } else if (input.purpose === "cover") {
    const allowedCoverMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedCoverMimeTypes.includes(input.contentType.toLowerCase())) {
      return {
        valid: false,
        statusCode: 415,
        error: `Unsupported image type '${input.contentType}' for cover photo. Allowed: JPG, PNG, WEBP.`,
      };
    }

    const maxCoverSizeBytes = 10 * 1024 * 1024; // 10 MB
    if (input.contentLength > maxCoverSizeBytes) {
      return {
        valid: false,
        statusCode: 413,
        error: `Cover photo size (${(input.contentLength / (1024 * 1024)).toFixed(1)}MB) exceeds maximum 10MB limit.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Server-side storage key generator with tenant isolation & sanitization
 */
export function generateStorageKey(params: {
  userId: string | number;
  purpose: StoragePurpose;
  contentType: string;
  originalFileName?: string;
}): string {
  // Sanitize userId to prevent path traversal
  const safeUserId = String(params.userId).replace(/[^a-zA-Z0-9_\-]/g, "");
  if (!safeUserId) {
    throw new Error("Invalid user identity for storage key generation.");
  }

  const extensionMap: Record<string, string> = {
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
  };

  const ext = extensionMap[params.contentType.toLowerCase()] || "bin";
  const uniqueId = crypto.randomUUID
    ? crypto.randomUUID()
    : `uuid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  switch (params.purpose) {
    case "portfolio":
      return `creators/${safeUserId}/portfolio/${uniqueId}.${ext}`;
    case "avatar":
      return `creators/${safeUserId}/avatar/${uniqueId}.${ext}`;
    case "cover":
      return `creators/${safeUserId}/cover/${uniqueId}.${ext}`;
    case "brand-asset":
      return `brands/${safeUserId}/assets/${uniqueId}.${ext}`;
    case "campaign-deliverable":
      return `deliverables/${safeUserId}/${uniqueId}.${ext}`;
    case "deal-document":
      return `deals/${safeUserId}/documents/${uniqueId}.${ext}`;
    default:
      return `uploads/${safeUserId}/${uniqueId}.${ext}`;
  }
}

/**
 * Validates whether a storage key belongs to the authenticated user context
 */
export function validateStorageKeyOwnership(storageKey: string, userId: string | number): boolean {
  if (!storageKey || typeof storageKey !== "string") return false;

  // Prevent path traversal
  if (storageKey.includes("..") || storageKey.startsWith("/") || storageKey.includes("\\")) {
    return false;
  }

  const safeUserId = String(userId).replace(/[^a-zA-Z0-9_\-]/g, "");
  const parts = storageKey.split("/");
  if (parts.length >= 2) {
    const ownerId = parts[1];
    return ownerId === safeUserId;
  }

  return false;
}
