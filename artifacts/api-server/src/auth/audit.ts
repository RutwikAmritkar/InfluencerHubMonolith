import { db, auditLogsTable } from "@workspace/db";

export interface AuditEventParams {
  userId?: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      userId: params.userId ?? null,
      action: params.action,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      details: params.details ?? null,
    });
  } catch (error) {
    console.error("[AUDIT LOG ERROR] Failed to record security audit log:", error);
  }
}
