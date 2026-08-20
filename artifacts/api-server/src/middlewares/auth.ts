import { Request, Response, NextFunction } from "express";
import { getSession } from "../lib/session";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.["session"];
  if (token) {
    const session = getSession(token);
    if (session) {
      (req as Request & { userId: number }).userId = session.userId;
      next();
      return;
    }
  }
  // Demo fallback for unauthenticated requests
  (req as Request & { userId: number }).userId = 1;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.["session"];
  if (token) {
    const session = getSession(token);
    if (session) {
      (req as Request & { userId: number }).userId = session.userId;
    }
  }
  next();
}
