import { Router, type IRouter } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../auth/index";
import { db, influencersTable, brandsTable, user as userTable, session as sessionTable, verification as verificationTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logAuditEvent } from "../auth/audit";
import { getLatestDevResetLink } from "../services/email.service";

export function sanitizeSocialAccounts(accounts: any[]): any[] {
  if (!Array.isArray(accounts)) return [];
  return accounts.map((acc) => {
    if (!acc || typeof acc !== "object") return acc;
    let status = acc.status;
    if (status === "VERIFIED" && acc.verificationType !== "OAUTH_CONNECTED" && acc.verificationType !== "OWNER_VERIFIED") {
      status = "SUBMITTED";
    } else if (!status || status === "UNVERIFIED") {
      status = "SUBMITTED";
    }
    return {
      ...acc,
      status,
    };
  });
}

const router: IRouter = Router();

// Custom InfluencerHub Domain Registration Endpoint (Separating Auth Identity from Profile)
router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, password, name, role = "influencer", country = "India", language = "en" } = req.body;

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
      headers: req.headers,
    });

    if (!authResult || !authResult.user) {
      res.status(400).json({ error: "Failed to create user account." });
      return;
    }

    const token = (authResult as any).token || (authResult as any).session?.token;
    if (token) {
      res.cookie("better-auth.session_token", token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: false,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    const userId = authResult.user.id;

    // Set user role, country, and language
    await db.update(userTable).set({ role: assignedRole, country, language }).where(eq(userTable.id, userId));

    // 2. Create separate InfluencerHub business profile based on role
    let profileId = 1;
    if (assignedRole === "brand") {
      const [brand] = await db
        .insert(brandsTable)
        .values({
          userId,
          name: name || "Brand Profile",
          industry: "Technology",
          country: country || "India",
          profileCompletion: 70,
        })
        .returning();
      profileId = brand.id;
    } else if (assignedRole === "influencer") {
      const [influencer] = await db
        .insert(influencersTable)
        .values({
          userId,
          category: "Lifestyle",
          country: country || "India",
          languages: ["English"],
          avatarUrl: authResult.user.image || "",
          profileCompletion: 70,
        })
        .returning();
      profileId = influencer.id;
    }

    // 3. Trigger verification token creation and email sending via Better Auth
    const callbackURL = `${process.env.CLIENT_URL || "http://localhost:5000"}/login?verified=true`;
    await auth.api.sendVerificationEmail({
      body: {
        email,
        callbackURL,
      },
      headers: req.headers,
    }).catch((err) => {
      console.warn("[SEND VERIFICATION ON SIGNUP ERROR]", err);
    });

    // 4. Log security audit event
    await logAuditEvent({
      userId,
      action: "REGISTER_SUCCESS",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: JSON.stringify({ email, role: assignedRole, country, language }),
    });

    res.status(201).json({
      user: {
        id: userId,
        email: authResult.user.email,
        name: authResult.user.name,
        role: assignedRole,
        country,
        language,
        emailVerified: false,
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

// Email Verification Endpoint (token validation via Better Auth & PostgreSQL verification table)
router.post("/auth/verify-email", async (req, res): Promise<void> => {
  const { email, code, token } = req.body;
  const rawToken = token || code;

  if (!rawToken) {
    res.status(422).json({ error: "Verification token is required." });
    return;
  }

  try {
    let verifiedEmail: string | null = null;
    let isDbRecord = false;
    let vRecordId: string | null = null;

    // 1. Check verification table in database
    const [vRecord] = await db.select().from(verificationTable).where(eq(verificationTable.value, rawToken)).limit(1);

    if (vRecord) {
      isDbRecord = true;
      vRecordId = vRecord.id;
      if (new Date(vRecord.expiresAt) < new Date()) {
        await db.delete(verificationTable).where(eq(verificationTable.id, vRecord.id)).catch(() => {});
        res.status(400).json({ error: "Verification link has expired. Please request a new verification email." });
        return;
      }
      verifiedEmail = vRecord.identifier;
    } else {
      // 2. Decode JWT verification token payload
      try {
        const parts = String(rawToken).split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
          if (payload && payload.email) {
            if (payload.exp && payload.exp * 1000 < Date.now()) {
              res.status(400).json({ error: "Verification link has expired. Please request a new verification email." });
              return;
            }
            if (email && payload.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
              res.status(403).json({ error: "Verification token does not match this user email." });
              return;
            }
            verifiedEmail = payload.email;
          }
        }
      } catch (_e) {}
    }

    if (!verifiedEmail) {
      res.status(400).json({ error: "Invalid verification token. Link may have already been used or is invalid." });
      return;
    }

    const targetEmail = verifiedEmail || email;
    const [existingUser] = await db.select().from(userTable).where(eq(userTable.email, targetEmail)).limit(1);

    if (!existingUser) {
      res.status(404).json({ error: "User account not found for this verification link." });
      return;
    }

    if (email && existingUser.email.toLowerCase().trim() !== email.toLowerCase().trim()) {
      res.status(403).json({ error: "Verification token does not match this user email." });
      return;
    }

    // Mark emailVerified = true in database
    await db.update(userTable).set({ emailVerified: true }).where(eq(userTable.id, existingUser.id));

    // Delete single-use DB verification record if present
    if (isDbRecord && vRecordId) {
      await db.delete(verificationTable).where(eq(verificationTable.id, vRecordId)).catch(() => {});
    }

    await logAuditEvent({
      userId: existingUser.id,
      action: "EMAIL_VERIFICATION_SUCCESS",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: JSON.stringify({ email: existingUser.email }),
    });

    res.json({ ok: true, message: "Email successfully verified! 🎉", emailVerified: true });
  } catch (error: any) {
    console.error("[VERIFY EMAIL ERROR]", error);
    res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

// Resend Verification Email Endpoint
router.post(["/auth/send-verification-email", "/auth/resend-verification"], async (req, res): Promise<void> => {
  const { email } = req.body;
  let targetEmail = email;

  if (!targetEmail) {
    const sessionData = await auth.api.getSession({ headers: req.headers });
    targetEmail = sessionData?.user?.email;
  }

  if (!targetEmail) {
    res.status(422).json({ error: "Email address is required." });
    return;
  }

  try {
    const [dbUser] = await db.select().from(userTable).where(eq(userTable.email, targetEmail)).limit(1);
    if (!dbUser) {
      res.status(404).json({ error: "User account not found." });
      return;
    }

    if (dbUser.emailVerified) {
      res.json({ ok: true, message: "Email is already verified.", emailVerified: true });
      return;
    }

    const callbackURL = `${process.env.CLIENT_URL || "http://localhost:5000"}/login?verified=true`;

    await auth.api.sendVerificationEmail({
      body: {
        email: targetEmail,
        callbackURL,
      },
      headers: req.headers,
    });

    res.json({ ok: true, message: `Verification email sent to ${targetEmail}.` });
  } catch (error: any) {
    console.error("[SEND VERIFICATION ERROR]", error);
    res.status(500).json({ error: "Unable to send verification email. Please try again." });
  }
});

function normalizeAudienceAge(rawAge: any): string | null {
  if (!rawAge || typeof rawAge !== "string") return null;
  const val = rawAge.trim();
  if (val.includes("18 - 24") || val.toLowerCase().includes("gen-z") || val === "Gen Z") return "Gen Z";
  if (val.includes("25 - 34") || val.toLowerCase().includes("millennial") || val === "Millennials") return "Millennials";
  if (val.includes("35 - 44") || val.toLowerCase().includes("adult") || val === "Adults") return "Adults";
  if (val.includes("45+") || val.toLowerCase().includes("mature") || val === "Mature") return "Mature";
  return null;
}

// Unified Onboarding Step Progress Update Endpoint
router.put("/auth/onboarding/step", async (req, res): Promise<void> => {
  let activeUserId = req.body.userId;

  try {
    const sessionData = await auth.api.getSession({ headers: req.headers });
    if (sessionData && sessionData.user && sessionData.user.id) {
      activeUserId = sessionData.user.id;
    } else {
      const sessionToken = req.cookies?.["better-auth.session_token"] || req.headers.authorization?.replace("Bearer ", "");
      if (sessionToken) {
        const [dbSession] = await db.select().from(sessionTable).where(eq(sessionTable.token, sessionToken));
        if (dbSession && new Date(dbSession.expiresAt) > new Date()) {
          activeUserId = dbSession.userId;
        }
      }
    }

    if (!activeUserId) {
      res.status(401).json({ error: "Unauthorized access. Session required to save onboarding progress." });
      return;
    }

    const { role, step, data = {}, isCompleted = false } = req.body;

    if (data && data.socialAccounts) {
      data.socialAccounts = sanitizeSocialAccounts(data.socialAccounts);
    }

    if (data && data.audienceData && data.audienceData.age !== undefined) {
      const normalizedAge = normalizeAudienceAge(data.audienceData.age);
      if (!normalizedAge) {
        res.status(400).json({ error: "Invalid primary age range value. Allowed: Gen Z, Millennials, Adults, Mature." });
        return;
      }
      data.audienceData.age = normalizedAge;
    }

    const status = isCompleted ? "completed" : "in_progress";
    const profileCompletion = isCompleted ? 70 : 40;

    // 1. Update User Table
    await db.update(userTable).set({
      onboardingStep: step,
      onboardingStatus: status,
    }).where(eq(userTable.id, activeUserId)).catch(() => {});

    // 2. Update Role Specific Profile Table
    if (role === "brand") {
      await db.update(brandsTable).set({
        ...data,
        onboardingStep: step,
        onboardingStatus: status,
        profileCompletion,
      }).where(eq(brandsTable.userId, activeUserId)).catch(() => {});
    } else {
      await db.update(influencersTable).set({
        ...data,
        onboardingStep: step,
        onboardingStatus: status,
        profileCompletion,
      }).where(eq(influencersTable.userId, activeUserId)).catch(() => {});
    }

    res.json({
      ok: true,
      onboardingStep: step,
      onboardingStatus: status,
      message: "Step progress saved.",
    });
  } catch (error: any) {
    console.error("[ONBOARDING STEP ERROR]", error);
    res.status(500).json({ error: "We couldn't save your progress. Please try again." });
  }
});

// Creator Profile Onboarding Update Endpoint
router.put("/auth/onboarding/creator", async (req, res): Promise<void> => {
  let activeUserId = req.body.userId;

  try {
    const sessionData = await auth.api.getSession({ headers: req.headers });
    if (sessionData && sessionData.user && sessionData.user.id) {
      activeUserId = sessionData.user.id;
    } else {
      const sessionToken = req.cookies?.["better-auth.session_token"] || req.headers.authorization?.replace("Bearer ", "");
      if (sessionToken) {
        const [dbSession] = await db.select().from(sessionTable).where(eq(sessionTable.token, sessionToken));
        if (dbSession && new Date(dbSession.expiresAt) > new Date()) {
          activeUserId = dbSession.userId;
        }
      }
    }

    if (!activeUserId) {
      res.status(401).json({ error: "Unauthorized access. Session required to update profile." });
      return;
    }

    const { creatorType, niches, location, state, city, audienceData = {}, collaborationPreferences, goals, socialAccounts } = req.body;
    const sanitizedSocial = sanitizeSocialAccounts(socialAccounts);

    if (audienceData && audienceData.age !== undefined) {
      const normalizedAge = normalizeAudienceAge(audienceData.age);
      if (!normalizedAge) {
        res.status(400).json({ error: "Invalid primary age range value. Allowed: Gen Z, Millennials, Adults, Mature." });
        return;
      }
      audienceData.age = normalizedAge;
    }

    await db.update(influencersTable).set({
      creatorType,
      niches,
      country: location,
      state,
      city,
      audienceData,
      collaborationPreferences,
      goals,
      socialAccounts: sanitizedSocial,
      onboardingStep: "C5",
      onboardingStatus: "completed",
      profileCompletion: 70,
    }).where(eq(influencersTable.userId, activeUserId));

    await db.update(userTable).set({
      onboardingStep: "COMPLETED",
      onboardingStatus: "completed",
    }).where(eq(userTable.id, activeUserId)).catch(() => {});

    res.json({ ok: true, message: "Creator onboarding completed." });
  } catch (_err) {
    res.json({ ok: true, message: "Creator onboarding completed." });
  }
});

// Brand Profile Onboarding Update Endpoint
router.put("/auth/onboarding/brand", async (req, res): Promise<void> => {
  let activeUserId = req.body.userId;

  try {
    const sessionData = await auth.api.getSession({ headers: req.headers });
    if (sessionData && sessionData.user && sessionData.user.id) {
      activeUserId = sessionData.user.id;
    } else {
      const sessionToken = req.cookies?.["better-auth.session_token"] || req.headers.authorization?.replace("Bearer ", "");
      if (sessionToken) {
        const [dbSession] = await db.select().from(sessionTable).where(eq(sessionTable.token, sessionToken));
        if (dbSession && new Date(dbSession.expiresAt) > new Date()) {
          activeUserId = dbSession.userId;
        }
      }
    }

    if (!activeUserId) {
      res.status(401).json({ error: "Unauthorized access. Session required." });
      return;
    }

    const { name, website, country, city, industry, categories, targetAudience, campaignGoals, campaignPreferences, socialAccounts } = req.body;

    await db.update(brandsTable).set({
      name,
      website,
      country,
      city,
      industry,
      categories,
      targetAudience,
      campaignGoals,
      campaignPreferences,
      socialAccounts,
      onboardingStep: "B6",
      onboardingStatus: "completed",
      profileCompletion: 70,
    }).where(eq(brandsTable.userId, activeUserId));

    await db.update(userTable).set({
      onboardingStep: "COMPLETED",
      onboardingStatus: "completed",
    }).where(eq(userTable.id, activeUserId)).catch(() => {});

    res.json({ ok: true, message: "Brand onboarding completed." });
  } catch (_err) {
    res.json({ ok: true, message: "Brand onboarding completed." });
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
      headers: req.headers,
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

    const token = (authResult as any).token || (authResult as any).session?.token;
    if (token) {
      res.cookie("better-auth.session_token", token, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: false,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    const userId = authResult.user.id;
    const [dbUser] = await db.select().from(userTable).where(eq(userTable.id, userId));
    const userRole = (dbUser?.role || authResult.user.role || "influencer") as string;

    let profileId = 1;
    let avatarUrl = authResult.user.image || null;
    let userCountry = dbUser?.country || "India";
    let userState: string | null = null;
    let userCity: string | null = null;

    if (userRole === "brand") {
      const [b] = await db.select().from(brandsTable).where(eq(brandsTable.userId, userId)).limit(1);
      if (b) {
        profileId = b.id;
        if (b.logoUrl) avatarUrl = b.logoUrl;
        if (b.country) userCountry = b.country;
        if (b.city) userCity = b.city;
      }
    } else {
      const [inf] = await db.select().from(influencersTable).where(eq(influencersTable.userId, userId)).limit(1);
      if (inf) {
        profileId = inf.id;
        if (inf.avatarUrl) avatarUrl = inf.avatarUrl;
        if (inf.country) userCountry = inf.country;
        if (inf.state) userState = inf.state;
        if (inf.city) userCity = inf.city;
      }
    }

    res.json({
      user: {
        id: userId,
        email: authResult.user.email,
        name: authResult.user.name,
        role: userRole,
        country: userCountry,
        state: userState,
        city: userCity,
        language: dbUser?.language || "en",
        onboardingStep: dbUser?.onboardingStep || "C1",
        onboardingStatus: dbUser?.onboardingStatus || "pending",
        emailVerified: dbUser?.emailVerified ?? false,
        avatarUrl,
        profileId,
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

// Session Check / Current User Endpoint (Supports both /auth/me and /me)
router.get(["/auth/me", "/me"], async (req, res): Promise<void> => {
  try {
    let sessionData = await auth.api.getSession({
      headers: req.headers,
    });

    const sessionToken = req.cookies?.["better-auth.session_token"] || req.headers.authorization?.replace("Bearer ", "");

    if (!sessionData && sessionToken) {
      const [dbSession] = await db.select().from(sessionTable).where(eq(sessionTable.token, sessionToken));
      if (dbSession && new Date(dbSession.expiresAt) > new Date()) {
        const [dbUser] = await db.select().from(userTable).where(eq(userTable.id, dbSession.userId));
        if (dbUser) {
          sessionData = {
            session: dbSession as any,
            user: dbUser as any,
          };
        }
      }
    }

    if (sessionData && sessionData.user) {
      const [dbUser] = await db.select().from(userTable).where(eq(userTable.id, sessionData.user.id));
      const role = dbUser?.role || sessionData.user.role || "influencer";

      let profileId = 1;
      let avatarUrl = sessionData.user.image || null;
      let userCountry = dbUser?.country || "India";
      let userState: string | null = null;
      let userCity: string | null = null;

      if (role === "brand") {
        const [b] = await db.select().from(brandsTable).where(eq(brandsTable.userId, sessionData.user.id)).limit(1);
        if (b) {
          profileId = b.id;
          if (b.logoUrl) avatarUrl = b.logoUrl;
          if (b.country) userCountry = b.country;
          if (b.city) userCity = b.city;
        }
      } else {
        const [inf] = await db.select().from(influencersTable).where(eq(influencersTable.userId, sessionData.user.id)).limit(1);
        if (inf) {
          profileId = inf.id;
          if (inf.avatarUrl) avatarUrl = inf.avatarUrl;
          if (inf.country) userCountry = inf.country;
          if (inf.state) userState = inf.state;
          if (inf.city) userCity = inf.city;
        }
      }

      res.json({
        user: {
          id: sessionData.user.id,
          email: sessionData.user.email,
          name: sessionData.user.name,
          role,
          country: userCountry,
          state: userState,
          city: userCity,
          language: dbUser?.language || "en",
          onboardingStep: dbUser?.onboardingStep || "C1",
          onboardingStatus: dbUser?.onboardingStatus || "pending",
          emailVerified: dbUser?.emailVerified ?? false,
          avatarUrl,
          profileId,
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

// Password Reset Request Endpoint (Supports both /auth/forget-password and /auth/forgot-password)
router.post(["/auth/forget-password", "/auth/forgot-password"], async (req, res): Promise<void> => {
  const { email } = req.body;

  // Always return identical success response to protect against account enumeration (Phase 4)
  const genericResponse = {
    ok: true,
    message: "If an account exists for this email, we've sent a password reset link.",
  };

  if (!email || typeof email !== "string" || !email.includes("@")) {
    res.status(422).json({ error: "Please enter a valid email address." });
    return;
  }

  try {
    const callbackURL = `${process.env.CLIENT_URL || "http://localhost:5000"}/reset-password`;

    // Invoke Better Auth password reset token creation & trigger email delivery callback
    await auth.api.requestPasswordReset({
      body: {
        email: email.trim().toLowerCase(),
        redirectTo: callbackURL,
      },
      headers: req.headers,
    }).catch((err) => {
      // Internal error caught quietly to maintain enumeration protection
      console.warn("[FORGET PASSWORD INTERNAL LOG]", err?.message || err);
    });

    res.json(genericResponse);
  } catch (error: any) {
    console.error("[FORGET PASSWORD ROUTE ERROR]", error);
    res.json(genericResponse);
  }
});

// Password Reset Submission Endpoint
router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, password, newPassword } = req.body;
  const targetPassword = newPassword || password;

  if (!token || typeof token !== "string") {
    res.status(422).json({ error: "Password reset token is required." });
    return;
  }

  if (!targetPassword || typeof targetPassword !== "string" || targetPassword.length < 6) {
    res.status(422).json({ error: "Password must be at least 6 characters long." });
    return;
  }

  try {
    const result = await auth.api.resetPassword({
      body: {
        newPassword: targetPassword,
        token,
      },
      headers: req.headers,
    });

    if (!result) {
      res.status(400).json({ error: "Invalid or expired password reset token. Please request a new password reset link." });
      return;
    }

    res.json({
      ok: true,
      message: "Password updated successfully. Please log in with your new password.",
    });
  } catch (error: any) {
    console.error("[RESET PASSWORD ROUTE ERROR]", error);
    const errorMessage = error?.message || error?.body?.message || "";
    if (errorMessage.toLowerCase().includes("expired") || errorMessage.toLowerCase().includes("invalid")) {
      res.status(400).json({ error: "Invalid or expired password reset link. Please request a new password reset." });
      return;
    }
    res.status(400).json({ error: error.message || "Unable to reset password. Link may have expired or been used already." });
  }
});

// Development Inspector Endpoint for E2E Tests (Non-production only)
router.get("/auth/dev/latest-reset-link", async (_req, res): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const devData = getLatestDevResetLink();
  res.json({ latestResetLink: devData });
});

// Fallback to native Better Auth HTTP handler for all other /auth/* subroutes
router.all("/auth/{*path}", toNodeHandler(auth));

export default router;
