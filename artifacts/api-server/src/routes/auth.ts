import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { createSession, deleteSession, hashPassword } from "../lib/session";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password, role, name } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash: hashPassword(password),
    role,
    name,
  }).returning();

  const token = createSession(user.id);
  res.cookie("session", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" });
  res.status(201).json({
    user: { id: user.id, email: user.email, role: user.role, name: user.name, avatarUrl: user.avatarUrl, profileId: null },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = createSession(user.id);
  res.cookie("session", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" });
  res.json({
    user: { id: user.id, email: user.email, role: user.role, name: user.name, avatarUrl: user.avatarUrl, profileId: null },
  });
});

router.post("/auth/logout", (req, res): void => {
  const token = req.cookies?.["session"];
  if (token) deleteSession(token);
  res.clearCookie("session");
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const token = req.cookies?.["session"];
  if (!token) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const { getSession } = await import("../lib/session");
  const session = getSession(token);
  if (!session) {
    res.status(401).json({ error: "Session expired" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    user: { id: user.id, email: user.email, role: user.role, name: user.name, avatarUrl: user.avatarUrl, profileId: null },
  });
});

export default router;
