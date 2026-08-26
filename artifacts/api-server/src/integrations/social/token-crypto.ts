import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const DEFAULT_KEY = "influencerhub-social-secret-key-32b"; // 32 bytes fallback key

function getSecretKey(): Buffer {
  const envSecret = process.env.SOCIAL_TOKEN_SECRET || DEFAULT_KEY;
  // Ensure exactly 32 bytes for AES-256
  return crypto.createHash("sha256").update(envSecret).digest();
}

export interface EncryptedTokenResult {
  encryptedToken: string;
  iv: string;
  authTag: string;
}

export function encryptSocialToken(plaintextToken: string): EncryptedTokenResult {
  const key = getSecretKey();
  const iv = crypto.randomBytes(12); // 12 bytes IV for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintextToken, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    encryptedToken: encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

export function decryptSocialToken(encryptedToken: string, ivHex: string, authTagHex: string): string {
  const key = getSecretKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedToken, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
