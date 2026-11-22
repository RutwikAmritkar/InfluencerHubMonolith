import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import {
  db,
  adminUsersTable,
  adminRolesTable,
  adminRolePermissionsTable,
  adminPermissionsTable,
  adminAuditLogsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";

export interface AdminUserData {
  id: number;
  userId: string;
  roleId: number;
  roleSlug: string;
  roleName: string;
  permissions: string[];
}

export interface AdminRequest extends AuthenticatedRequest {
  adminUser?: AdminUserData;
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authReq = req as AdminRequest;
  if (!authReq.user || !authReq.user.id) {
    res
      .status(401)
      .json({ error: "Authentication required before accessing Admin Control Center." });
    return;
  }

  try {
    const [adminRecord] = await db
      .select({
        id: adminUsersTable.id,
        userId: adminUsersTable.userId,
        roleId: adminUsersTable.roleId,
        isActive: adminUsersTable.isActive,
        roleSlug: adminRolesTable.slug,
        roleName: adminRolesTable.name,
      })
      .from(adminUsersTable)
      .innerJoin(adminRolesTable, eq(adminRolesTable.id, adminUsersTable.roleId))
      .where(and(eq(adminUsersTable.userId, authReq.user.id), eq(adminUsersTable.isActive, true)))
      .limit(1);

    if (!adminRecord) {
      res.status(403).json({
        error: "Access denied. Your account does not possess active administrative credentials.",
      });
      return;
    }

    const permissions = await db
      .select({ slug: adminPermissionsTable.slug })
      .from(adminRolePermissionsTable)
      .innerJoin(
        adminPermissionsTable,
        eq(adminPermissionsTable.id, adminRolePermissionsTable.permissionId)
      )
      .where(eq(adminRolePermissionsTable.roleId, adminRecord.roleId));

    const permissionSlugs = permissions.map((p) => p.slug);

    authReq.adminUser = {
      id: adminRecord.id,
      userId: adminRecord.userId,
      roleId: adminRecord.roleId,
      roleSlug: adminRecord.roleSlug,
      roleName: adminRecord.roleName,
      permissions: permissionSlugs,
    };

    next();
  } catch (error) {
    console.error("[ADMIN AUTH ERROR]", error);
    res
      .status(500)
      .json({ error: "Internal server error verifying administrative authorization." });
  }
}

export function requirePermission(permissionSlug: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const adminReq = req as AdminRequest;
    if (!adminReq.adminUser) {
      res.status(403).json({ error: "Access denied. Administrative session not verified." });
      return;
    }

    // Super admin has all permissions
    if (adminReq.adminUser.roleSlug === "super_admin") {
      return next();
    }

    if (!adminReq.adminUser.permissions.includes(permissionSlug)) {
      res.status(403).json({
        error: `Insufficient privileges. Required permission: '${permissionSlug}'.`,
      });
      return;
    }

    next();
  };
}

export async function logAdminAction(options: {
  req: AdminRequest;
  action: string;
  targetEntityType: string;
  targetEntityId: string;
  reason: string;
  beforeState?: any;
  afterState?: any;
}) {
  try {
    const adminUserId = options.req.adminUser?.userId || options.req.user?.id || "system";
    const ipAddress =
      (options.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      options.req.socket?.remoteAddress ||
      options.req.ip ||
      "127.0.0.1";
    const userAgent = (options.req.headers["user-agent"] as string) || "Unknown";

    await db.insert(adminAuditLogsTable).values({
      adminUserId,
      action: options.action,
      targetEntityType: options.targetEntityType,
      targetEntityId: String(options.targetEntityId),
      reason: options.reason,
      beforeState: options.beforeState ?? null,
      afterState: options.afterState ?? null,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error("[ADMIN AUDIT LOGGING ERROR]", err);
  }
}
