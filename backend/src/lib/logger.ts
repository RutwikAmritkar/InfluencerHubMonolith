import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "password",
      "access_token",
      "accessToken",
      "refreshToken",
      "refresh_token",
      "accessTokenEncrypted",
      "refreshTokenEncrypted",
      "tokenIv",
      "token_iv",
      "tokenAuthTag",
      "token_auth_tag",
      "SOCIAL_TOKEN_SECRET",
      "BETTER_AUTH_SECRET",
      "DATABASE_URL",
      "META_CLIENT_SECRET",
      "INSTAGRAM_CLIENT_SECRET",
      "YOUTUBE_CLIENT_SECRET",
      "GOOGLE_CLIENT_SECRET",
    ],
    censor: "[REDACTED_SECRET]",
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        },
      }),
});

/**
 * Structured Auth Event Logging Helper
 */
export function logAuthEvent(event: string, details: { userId?: string; email?: string; role?: string; success: boolean; error?: string; requestId?: string }) {
  const level = details.success ? "info" : "warn";
  logger[level]({
    category: "AUTH",
    event,
    userId: details.userId || "anonymous",
    email: details.email,
    role: details.role,
    success: details.success,
    error: details.error,
    requestId: details.requestId,
  }, `[AUTH EVENT] ${event} - ${details.success ? "SUCCESS" : "FAILED"}`);
}

/**
 * Structured OAuth Event Logging Helper
 */
export function logOAuthEvent(event: string, details: { provider: string; userId?: string; state?: string; success: boolean; error?: string; requestId?: string }) {
  const level = details.success ? "info" : "warn";
  logger[level]({
    category: "OAUTH",
    event,
    provider: details.provider,
    userId: details.userId || "anonymous",
    success: details.success,
    error: details.error,
    requestId: details.requestId,
  }, `[OAUTH EVENT] ${details.provider.toUpperCase()} ${event} - ${details.success ? "SUCCESS" : "FAILED"}`);
}

/**
 * Structured Social Data Sync Event Logging Helper
 */
export function logSocialSyncEvent(event: string, details: { platform: string; socialAccountId?: number; username?: string; followers?: number; success: boolean; error?: string }) {
  const level = details.success ? "info" : "error";
  logger[level]({
    category: "SOCIAL_SYNC",
    event,
    platform: details.platform,
    socialAccountId: details.socialAccountId,
    username: details.username,
    followers: details.followers,
    success: details.success,
    error: details.error,
  }, `[SOCIAL SYNC] ${details.platform.toUpperCase()} @${details.username || details.socialAccountId} - ${details.success ? "SUCCESS" : "FAILED"}`);
}

/**
 * Structured Database Event Logging Helper
 */
export function logDatabaseEvent(event: string, details: { action: string; success: boolean; error?: string }) {
  const level = details.success ? "info" : "error";
  logger[level]({
    category: "DATABASE",
    event,
    action: details.action,
    success: details.success,
    error: details.error,
  }, `[DATABASE] ${event} - ${details.success ? "OK" : "ERROR"}`);
}
