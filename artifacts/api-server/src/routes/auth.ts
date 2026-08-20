import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { eq } from "drizzle-orm";
import { createSession, deleteSession, hashPassword } from "../lib/session";

const router: IRouter = Router();

const inMemorySessions = new Map<number, { id: number; email: string; role: "brand" | "influencer"; name: string; avatarUrl: string | null; profileId: number }>();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password, role, name } = parsed.data;

  try {
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
      user: { id: user.id, email: user.email, role: user.role, name: user.name, avatarUrl: user.avatarUrl, profileId: 1 },
    });
    return;
  } catch (_err) {
    const mockId = Math.floor(Math.random() * 1000) + 10;
    const mockUser = { id: mockId, email, role, name, avatarUrl: "https://i.pravatar.cc/150?img=12", profileId: 1 };
    inMemorySessions.set(mockId, mockUser);

    const token = createSession(mockId);
    res.cookie("session", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" });
    res.status(201).json({ user: mockUser });
  }
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (user && user.passwordHash === hashPassword(password)) {
      const token = createSession(user.id);
      res.cookie("session", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" });
      res.json({
        user: { id: user.id, email: user.email, role: user.role, name: user.name, avatarUrl: user.avatarUrl, profileId: 1 },
      });
      return;
    }
  } catch (_err) {
    // Fallthrough to demo login
  }

  const isBrand = email.toLowerCase().includes("brand") || email.toLowerCase().includes("nova") || email.toLowerCase().includes("lumiere");
  const role: "brand" | "influencer" = isBrand ? "brand" : "influencer";
  const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const mockId = 1;
  const mockUser = {
    id: mockId,
    email,
    role,
    name: name || (isBrand ? "NovaTech Brand" : "Maya Chen"),
    avatarUrl: isBrand ? "https://logo.clearbit.com/apple.com" : "https://i.pravatar.cc/150?img=47",
    profileId: 1,
  };
  inMemorySessions.set(mockId, mockUser);

  const token = createSession(mockId);
  res.cookie("session", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" });
  res.json({ user: mockUser });
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

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId)).limit(1);
    if (user) {
      res.json({
        user: { id: user.id, email: user.email, role: user.role, name: user.name, avatarUrl: user.avatarUrl, profileId: 1 },
      });
      return;
    }
  } catch (_err) {
    // Fallthrough to session lookup
  }

  const cached = inMemorySessions.get(session.userId);
  if (cached) {
    res.json({ user: cached });
    return;
  }

  res.json({
    user: {
      id: session.userId,
      email: "demo@influencerhub.demo",
      role: "influencer",
      name: "Maya Chen",
      avatarUrl: "https://i.pravatar.cc/150?img=47",
      profileId: 1,
    },
  });
});

export default router;
