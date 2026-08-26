import { Request, Response, NextFunction } from "express";
import { auth } from "../auth/index";
import { logAuditEvent } from "../auth/audit";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: "influencer" | "creator" | "brand" | "admin";
  avatarUrl?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  userId?: string;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionData = await auth.api.getSession({
      headers: req.headers,
    });

    if (sessionData && sessionData.user) {
      const userRole = (sessionData.user.role as AuthenticatedUser["role"]) || "influencer";
      const authUser: AuthenticatedUser = {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name,
        role: userRole,
        avatarUrl: sessionData.user.image,
      };
      (req as AuthenticatedRequest).user = authUser;
      (req as AuthenticatedRequest).userId = sessionData.user.id;
      return next();
    }

    // Demo/Development session cookie fallback for existing frontend mock session tokens
    const legacySessionToken = req.cookies?.["session"];
    if (legacySessionToken) {
      const authUser: AuthenticatedUser = {
        id: "demo-user-1",
        email: "demo@influencerhub.demo",
        name: "Demo User",
        role: "influencer",
        avatarUrl: "https://i.pravatar.cc/150?img=47",
      };
      (req as AuthenticatedRequest).user = authUser;
      (req as AuthenticatedRequest).userId = authUser.id;
      return next();
    }

    res.status(401).json({ error: "Unauthorized access. Valid session or bearer token required." });
    return;
  } catch (error) {
    console.error("[AUTH MIDDLEWARE ERROR]", error);
    res.status(401).json({ error: "Invalid session or authentication token." });
    return;
  }
}

export function requireRole(allowedRoles: ("influencer" | "creator" | "brand" | "admin")[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user) {
      res.status(401).json({ error: "Authentication required before authorization check." });
      return;
    }

    const normalizedRole = authReq.user.role === "creator" ? "influencer" : authReq.user.role;
    const normalizedAllowed = allowedRoles.map((r) => (r === "creator" ? "influencer" : r));

    if (!normalizedAllowed.includes(normalizedRole)) {
      await logAuditEvent({
        userId: authReq.user.id,
        action: "UNAUTHORIZED_ROLE_ACCESS_ATTEMPT",
        details: JSON.stringify({ requiredRoles: allowedRoles, actualRole: authReq.user.role, path: req.path }),
      });
      res.status(403).json({
        error: `Forbidden. Role '${authReq.user.role}' is not authorized to access this resource. Required role: ${allowedRoles.join(" or ")}`,
      });
      return;
    }

    next();
  };
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionData = await auth.api.getSession({
      headers: req.headers,
    });

    if (sessionData && sessionData.user) {
      const userRole = (sessionData.user.role as AuthenticatedUser["role"]) || "influencer";
      (req as AuthenticatedRequest).user = {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name,
        role: userRole,
        avatarUrl: sessionData.user.image,
      };
      (req as AuthenticatedRequest).userId = sessionData.user.id;
    }
  } catch (_err) {
    // Optional auth - continue even if session check fails
  }
  next();
}
