import { Request, Response, NextFunction } from "express";
import { getSession } from "../lib/session";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.["session"];
  if (!token) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }
  const session = getSession(token);
  if (!session) {
    res.status(401).json({ error: "Session expired" });
    return;
  }
  (req as Request & { userId: number }).userId = session.userId;
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
