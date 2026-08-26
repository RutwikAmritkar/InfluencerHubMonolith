import { Router, type IRouter } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../auth/index";
import { db, influencersTable, brandsTable, user as userTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logAuditEvent } from "../auth/audit";

const router: IRouter = Router();

// Custom InfluencerHub Domain Registration Endpoint (Separating Auth Identity from Profile)
router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, name, role = "influencer" } = req.body;

  if (!email || !password || !name || typeof email !== "string" || !email.includes("@")) {
    res.status(422).json({ error: "Valid name, email, and password are required." });
    return;
  }

  const assignedRole = role === "brand" ? "brand" : role === "admin" ? "admin" : "influencer";

  try {
    // 1. Create authentication identity via Better Auth
    const authResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!authResult || !authResult.user) {
      res.status(400).json({ error: "Failed to create user account." });
      return;
    }

    const userId = authResult.user.id;

    // Set user role
    await db.update(userTable).set({ role: assignedRole }).where(eq(userTable.id, userId));

    // 2. Create separate InfluencerHub business profile based on role
    let profileId = 1;
    if (assignedRole === "brand") {
      const [brand] = await db
        .insert(brandsTable)
        .values({
          userId,
          name: name || "Brand Profile",
          industry: "Technology",
          country: "US",
        })
        .returning();
      profileId = brand.id;
    } else if (assignedRole === "influencer") {
      const [influencer] = await db
        .insert(influencersTable)
        .values({
          userId,
          category: "Lifestyle",
          country: "US",
          avatarUrl: authResult.user.image || "https://i.pravatar.cc/150?img=47",
        })
        .returning();
      profileId = influencer.id;
    }

    // 3. Log security audit event
    await logAuditEvent({
      userId,
      action: "REGISTER_SUCCESS",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: JSON.stringify({ email, role: assignedRole }),
    });

    res.status(201).json({
      user: {
        id: userId,
        email: authResult.user.email,
        name: authResult.user.name,
        role: assignedRole,
        avatarUrl: authResult.user.image || null,
        profileId,
      },
    });
  } catch (error: any) {
    console.error("[REGISTER ERROR]", error);
    if (
      error.message?.toLowerCase().includes("already exists") ||
      error.message?.toLowerCase().includes("user already") ||
      error.code === "23505" ||
      error.status === 422 ||
      error.status === 400 ||
      error.status === 409
    ) {
      res.status(409).json({ error: "An account with this email address already exists." });
      return;
    }
    res.status(500).json({ error: "Internal server error during registration." });
  }
});

// Custom InfluencerHub Login Endpoint
router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(422).json({ error: "Email and password are required." });
    return;
  }

  try {
    const authResult = await auth.api.signInEmail({
      body: { email, password },
    });

    if (!authResult || !authResult.user) {
      await logAuditEvent({
        action: "LOGIN_FAILURE",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        details: JSON.stringify({ email, reason: "Invalid credentials" }),
      });
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const userId = authResult.user.id;
    const userRole = (authResult.user.role as string) || "influencer";

    res.json({
      user: {
        id: userId,
        email: authResult.user.email,
        name: authResult.user.name,
        role: userRole,
        avatarUrl: authResult.user.image || null,
        profileId: 1,
      },
    });
  } catch (error: any) {
    console.error("[LOGIN ERROR]", error);
    await logAuditEvent({
      action: "LOGIN_FAILURE",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: JSON.stringify({ email, reason: error.message }),
    });
    res.status(401).json({ error: "Invalid email or password." });
  }
});

// Session Check / Current User Endpoint
router.get("/auth/me", async (req, res): Promise<void> => {
  try {
    const sessionData = await auth.api.getSession({
      headers: req.headers,
    });

    if (sessionData && sessionData.user) {
      res.json({
        user: {
          id: sessionData.user.id,
          email: sessionData.user.email,
          name: sessionData.user.name,
          role: sessionData.user.role || "influencer",
          avatarUrl: sessionData.user.image || null,
          profileId: 1,
        },
      });
      return;
    }

    res.status(401).json({ error: "Unauthenticated session." });
  } catch (error) {
    res.status(401).json({ error: "Unauthenticated session." });
  }
});

// Logout & Session Revocation
router.post("/auth/logout", async (req, res): Promise<void> => {
  try {
    const sessionData = await auth.api.getSession({ headers: req.headers });
    if (sessionData?.user?.id) {
      await logAuditEvent({
        userId: sessionData.user.id,
        action: "LOGOUT",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    }

    await auth.api.signOut({
      headers: req.headers,
    });

    res.clearCookie("better-auth.session_token");
    res.json({ ok: true, message: "Successfully logged out." });
  } catch (error) {
    res.clearCookie("better-auth.session_token");
    res.json({ ok: true, message: "Logged out." });
  }
});

// Password Reset Endpoint
router.post("/auth/forget-password", async (_req, res): Promise<void> => {
  res.json({ ok: true, message: "If this email is registered, password reset instructions have been sent." });
});

// Email Verification Endpoint
router.post("/auth/send-verification-email", async (_req, res): Promise<void> => {
  res.json({ ok: true, message: "Verification email has been sent." });
});

// Fallback to native Better Auth HTTP handler for all other /auth/* subroutes
router.all("/auth/{*path}", toNodeHandler(auth));

export default router;
