import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { influencersTable, usersTable, type SocialAccount } from "@workspace/db";
import { UpdateInfluencerBody } from "@workspace/api-zod";
import { eq, and, gte, lte, ilike, sql } from "drizzle-orm";
import { socialVerificationService } from "../services/social-verification.service";
import { requireAuth, optionalAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Simple in-memory rate limiting map for verification attempts: accountId -> timestamp
const verificationCooldowns = new Map<string, number>();
const VERIFY_COOLDOWN_MS = 3000; // 3 seconds cooldown between verify clicks

const inMemoryStore: Record<number, any> = {
  1: {
    id: 1,
    userId: 1,
    name: "Alex Rivera",
    bio: "Digital creator and lifestyle influencer based in Los Angeles.",
    category: "Lifestyle",
    country: "US",
    followers: 125000,
    engagementRate: 4.2,
    avgViews: 45000,
    collaborationCost: 1500,
    platforms: ["instagram", "youtube", "tiktok", "facebook"],
    languages: ["English"],
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    coverUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200",
    profileCompletion: 90,
    monthlyEarnings: 8500,
    isVerified: true,
    socialAccounts: [
      {
        id: "soc_init_1",
        creatorId: 1,
        platform: "instagram",
        username: "alexrivera",
        profileUrl: "https://instagram.com/alexrivera",
        inputType: "username",
        status: "VERIFIED",
        verificationType: "PROFILE_EXISTS",
        verifiedAt: "2026-08-17T20:00:00.000Z",
        createdAt: "2026-08-17T20:00:00.000Z",
        updatedAt: "2026-08-17T20:00:00.000Z"
      },
      {
        id: "soc_init_2",
        creatorId: 1,
        platform: "youtube",
        username: "alexriveracreator",
        profileUrl: "https://youtube.com/@alexriveracreator",
        inputType: "url",
        status: "VERIFIED",
        verificationType: "PROFILE_EXISTS",
        verifiedAt: "2026-08-18T14:30:00.000Z",
        createdAt: "2026-08-17T20:00:00.000Z",
        updatedAt: "2026-08-18T14:30:00.000Z"
      },
      {
        id: "soc_init_3",
        creatorId: 1,
        platform: "tiktok",
        username: "alexrivera_official",
        profileUrl: "https://tiktok.com/@alexrivera_official",
        inputType: "username",
        status: "UNVERIFIED",
        createdAt: "2026-08-19T09:15:00.000Z",
        updatedAt: "2026-08-19T09:15:00.000Z"
      },
      {
        id: "soc_init_4",
        creatorId: 1,
        platform: "facebook",
        username: "alexriverapage",
        profileUrl: "https://facebook.com/alexriverapage",
        inputType: "url",
        status: "UNVERIFIED",
        createdAt: "2026-08-19T11:00:00.000Z",
        updatedAt: "2026-08-19T11:00:00.000Z"
      },
      {
        id: "soc_init_5",
        creatorId: 1,
        platform: "pinterest",
        username: "invalid user profile link",
        profileUrl: "invalid_url",
        inputType: "url",
        status: "FAILED",
        errorMessage: "Invalid Pinterest profile URL format.",
        createdAt: "2026-08-19T12:00:00.000Z",
        updatedAt: "2026-08-19T12:00:00.000Z"
      }
    ],
  }
};

router.get("/influencers", async (req, res): Promise<void> => {
  const { platform, category, country, minFollowers, maxFollowers, search } = req.query as Record<string, string>;

  try {
    const conditions = [];
    if (category) conditions.push(ilike(influencersTable.category, `%${category}%`));
    if (country) conditions.push(eq(influencersTable.country, country));
    if (minFollowers) conditions.push(gte(influencersTable.followers, parseInt(minFollowers)));
    if (maxFollowers) conditions.push(lte(influencersTable.followers, parseInt(maxFollowers)));

    let rows = await db
      .select({
        influencer: influencersTable,
        userName: usersTable.name,
      })
      .from(influencersTable)
      .leftJoin(usersTable, eq(usersTable.id, influencersTable.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    if (platform) {
      rows = rows.filter(r => r.influencer.platforms.includes(platform));
    }
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.userName?.toLowerCase().includes(q) ||
        r.influencer.category.toLowerCase().includes(q) ||
        r.influencer.country.toLowerCase().includes(q)
      );
    }

    res.json(rows.map(r => ({
      id: r.influencer.id,
      userId: r.influencer.userId,
      name: r.userName ?? "Unknown",
      bio: r.influencer.bio,
      category: r.influencer.category,
      country: r.influencer.country,
      followers: r.influencer.followers,
      engagementRate: r.influencer.engagementRate,
      avgViews: r.influencer.avgViews,
      collaborationCost: r.influencer.collaborationCost,
      platforms: r.influencer.platforms,
      languages: r.influencer.languages,
      avatarUrl: r.influencer.avatarUrl,
      coverUrl: r.influencer.coverUrl,
      profileCompletion: r.influencer.profileCompletion,
      monthlyEarnings: r.influencer.monthlyEarnings,
      isVerified: r.influencer.isVerified,
      socialAccounts: r.influencer.socialAccounts || [],
    })));
    return;
  } catch (_e) {
    res.json(Object.values(inMemoryStore));
  }
});

router.get("/influencers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10) || 1;

  try {
    const [row] = await db
      .select({ influencer: influencersTable, userName: usersTable.name })
      .from(influencersTable)
      .leftJoin(usersTable, eq(usersTable.id, influencersTable.userId))
      .where(eq(influencersTable.id, id))
      .limit(1);

    if (row) {
      res.json({
        id: row.influencer.id,
        userId: row.influencer.userId,
        name: row.userName ?? "Unknown",
        bio: row.influencer.bio,
        category: row.influencer.category,
        country: row.influencer.country,
        followers: row.influencer.followers,
        engagementRate: row.influencer.engagementRate,
        avgViews: row.influencer.avgViews,
        collaborationCost: row.influencer.collaborationCost,
        platforms: row.influencer.platforms,
        languages: row.influencer.languages,
        avatarUrl: row.influencer.avatarUrl,
        coverUrl: row.influencer.coverUrl,
        profileCompletion: row.influencer.profileCompletion,
        monthlyEarnings: row.influencer.monthlyEarnings,
        isVerified: row.influencer.isVerified,
        availability: row.influencer.availability,
        portfolio: row.influencer.portfolio,
        socialAccounts: row.influencer.socialAccounts || [],
        previousCollaborations: [
          { id: 1, brandName: "Nike", campaignTitle: "Summer Collection", year: 2024 },
          { id: 2, brandName: "Spotify", campaignTitle: "Launch Campaign", year: 2023 },
        ],
        reviews: [
          { id: 1, brandName: "Nike", rating: 4.8, comment: "Excellent creator with strong engagement. Delivered on time.", createdAt: "2024-06-01" },
          { id: 2, brandName: "Spotify", rating: 4.5, comment: "Great collaboration. Very professional.", createdAt: "2023-11-15" },
        ],
      });
      return;
    }
  } catch (_e) {
    // Fallback to in-memory store
  }

  const memData = inMemoryStore[id] || inMemoryStore[1];
  res.json({
    ...memData,
    previousCollaborations: [
      { id: 1, brandName: "Nike", campaignTitle: "Summer Collection", year: 2024 },
      { id: 2, brandName: "Spotify", campaignTitle: "Launch Campaign", year: 2023 },
    ],
    reviews: [
      { id: 1, brandName: "Nike", rating: 4.8, comment: "Excellent creator with strong engagement. Delivered on time.", createdAt: "2024-06-01" },
      { id: 2, brandName: "Spotify", rating: 4.5, comment: "Great collaboration. Very professional.", createdAt: "2023-11-15" },
    ],
  });
});

router.patch("/influencers/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10) || 1;
  const authUserId = (req as typeof req & { userId: number }).userId;

  const parsed = UpdateInfluencerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { availability, coverUrl, avatarUrl, socialAccounts, ...rest } = parsed.data as any;
  const updateData: Record<string, unknown> = { ...rest };
  if (availability !== undefined) updateData.availability = availability;
  if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
  if (socialAccounts !== undefined) {
    updateData.socialAccounts = socialAccounts;
    const derivedPlatforms = Array.from(new Set(socialAccounts.map((a: any) => a.platform)));
    if (derivedPlatforms.length > 0) {
      updateData.platforms = derivedPlatforms;
    }
    if (socialAccounts.length > 0) {
      updateData.profileCompletion = 95;
    }
  }

  try {
    const [updated] = await db
      .update(influencersTable)
      .set(updateData)
      .where(eq(influencersTable.id, id))
      .returning();

    if (updated) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId)).limit(1);

      res.json({
        id: updated.id,
        userId: updated.userId,
        name: user?.name ?? "Unknown",
        bio: updated.bio,
        category: updated.category,
        country: updated.country,
        followers: updated.followers,
        engagementRate: updated.engagementRate,
        avgViews: updated.avgViews,
        collaborationCost: updated.collaborationCost,
        platforms: updated.platforms,
        languages: updated.languages,
        avatarUrl: updated.avatarUrl,
        coverUrl: updated.coverUrl,
        profileCompletion: updated.profileCompletion,
        monthlyEarnings: updated.monthlyEarnings,
        isVerified: updated.isVerified,
        socialAccounts: updated.socialAccounts || [],
      });
      return;
    }
  } catch (_e) {
    // Fallback to in-memory update
  }

  const currentMem = inMemoryStore[id] || { ...inMemoryStore[1], id };
  const updatedMem = {
    ...currentMem,
    ...updateData,
  };
  inMemoryStore[id] = updatedMem;

  res.json(updatedMem);
});

// ─── Social Accounts Dedicated CRUD & Verification Endpoints ────────────────

router.get("/influencers/:id/social-accounts", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10) || 1;

  try {
    const [row] = await db.select().from(influencersTable).where(eq(influencersTable.id, id)).limit(1);
    if (row) {
      res.json(row.socialAccounts || []);
      return;
    }
  } catch (_e) {
    // Fallback
  }

  const mem = inMemoryStore[id] || inMemoryStore[1];
  res.json(mem?.socialAccounts || []);
});

router.post("/influencers/:id/social-accounts", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10) || 1;
  const authUserId = (req as typeof req & { userId: number }).userId;

  const { platform, username, profileUrl, inputType } = req.body || {};

  if (!platform || !inputType) {
    res.status(400).json({ error: "Platform and inputType are required." });
    return;
  }

  const supportedPlatforms = ["instagram", "youtube", "tiktok", "facebook", "x", "twitch", "linkedin", "snapchat", "pinterest", "other"];
  const normalizedPlatform = platform.toLowerCase().trim();
  if (!supportedPlatforms.includes(normalizedPlatform)) {
    res.status(400).json({ error: `Unsupported platform: ${platform}` });
    return;
  }

  let currentAccounts: SocialAccount[] = [];
  let influencerUserId = 1;
  try {
    const [row] = await db.select().from(influencersTable).where(eq(influencersTable.id, id)).limit(1);
    if (row) {
      currentAccounts = row.socialAccounts || [];
      influencerUserId = row.userId;
    }
  } catch (_e) {
    const mem = inMemoryStore[id] || inMemoryStore[1];
    currentAccounts = mem?.socialAccounts || [];
    influencerUserId = mem?.userId || 1;
  }

  // Prevent duplicate platforms per creator
  if (currentAccounts.some((a) => a.platform.toLowerCase() === normalizedPlatform)) {
    res.status(400).json({ error: `${platform} profile has already been added.` });
    return;
  }

  const now = new Date().toISOString();
  const cleanUsername = username ? username.replace(/^@+/, "").trim() : undefined;
  
  const newAccount: SocialAccount = {
    id: `soc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    creatorId: id,
    platform: normalizedPlatform,
    username: cleanUsername,
    profileUrl: profileUrl ? profileUrl.trim() : undefined,
    inputType: inputType === "url" ? "url" : "username",
    status: "UNVERIFIED",
    createdAt: now,
    updatedAt: now,
  };

  const updatedAccounts = [...currentAccounts, newAccount];
  const derivedPlatforms = Array.from(new Set(updatedAccounts.map((a) => a.platform)));

  try {
    await db
      .update(influencersTable)
      .set({
        socialAccounts: updatedAccounts,
        platforms: derivedPlatforms,
      })
      .where(eq(influencersTable.id, id));
  } catch (_e) {
    const mem = inMemoryStore[id] || { ...inMemoryStore[1], id };
    mem.socialAccounts = updatedAccounts;
    mem.platforms = derivedPlatforms;
    inMemoryStore[id] = mem;
  }

  res.status(201).json(newAccount);
});

router.put("/influencers/:id/social-accounts/:accountId", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10) || 1;
  const accountId = Array.isArray(req.params.accountId) ? req.params.accountId[0] : req.params.accountId;
  const { platform, username, profileUrl, inputType } = req.body || {};

  let currentAccounts: SocialAccount[] = [];
  try {
    const [row] = await db.select().from(influencersTable).where(eq(influencersTable.id, id)).limit(1);
    if (row) currentAccounts = row.socialAccounts || [];
  } catch (_e) {
    const mem = inMemoryStore[id] || inMemoryStore[1];
    currentAccounts = mem?.socialAccounts || [];
  }

  const index = currentAccounts.findIndex((a) => a.id === accountId);
  if (index === -1) {
    res.status(404).json({ error: "Social account not found" });
    return;
  }

  const now = new Date().toISOString();
  const cleanUsername = username !== undefined ? username.replace(/^@+/, "").trim() : currentAccounts[index].username;

  const updatedAccount: SocialAccount = {
    ...currentAccounts[index],
    platform: platform ? platform.toLowerCase().trim() : currentAccounts[index].platform,
    username: cleanUsername,
    profileUrl: profileUrl !== undefined ? profileUrl.trim() : currentAccounts[index].profileUrl,
    inputType: inputType || currentAccounts[index].inputType,
    status: "UNVERIFIED",
    verificationType: undefined,
    verifiedAt: undefined,
    errorMessage: undefined,
    updatedAt: now,
  };

  currentAccounts[index] = updatedAccount;
  const derivedPlatforms = Array.from(new Set(currentAccounts.map((a) => a.platform)));

  try {
    await db
      .update(influencersTable)
      .set({
        socialAccounts: currentAccounts,
        platforms: derivedPlatforms,
      })
      .where(eq(influencersTable.id, id));
  } catch (_e) {
    const mem = inMemoryStore[id] || { ...inMemoryStore[1], id };
    mem.socialAccounts = currentAccounts;
    mem.platforms = derivedPlatforms;
    inMemoryStore[id] = mem;
  }

  res.json(updatedAccount);
});

router.delete("/influencers/:id/social-accounts/:accountId", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10) || 1;
  const accountId = Array.isArray(req.params.accountId) ? req.params.accountId[0] : req.params.accountId;

  let currentAccounts: SocialAccount[] = [];
  try {
    const [row] = await db.select().from(influencersTable).where(eq(influencersTable.id, id)).limit(1);
    if (row) currentAccounts = row.socialAccounts || [];
  } catch (_e) {
    const mem = inMemoryStore[id] || inMemoryStore[1];
    currentAccounts = mem?.socialAccounts || [];
  }

  const updatedAccounts = currentAccounts.filter((a) => a.id !== accountId);
  const derivedPlatforms = Array.from(new Set(updatedAccounts.map((a) => a.platform)));

  try {
    await db
      .update(influencersTable)
      .set({
        socialAccounts: updatedAccounts,
        platforms: derivedPlatforms,
      })
      .where(eq(influencersTable.id, id));
  } catch (_e) {
    const mem = inMemoryStore[id] || { ...inMemoryStore[1], id };
    mem.socialAccounts = updatedAccounts;
    mem.platforms = derivedPlatforms;
    inMemoryStore[id] = mem;
  }

  res.json({ success: true });
});

router.post("/influencers/:id/social-accounts/:accountId/verify", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10) || 1;
  const accountId = Array.isArray(req.params.accountId) ? req.params.accountId[0] : req.params.accountId;

  // Rate Limiting Cooldown Check
  const lastVerify = verificationCooldowns.get(accountId);
  const nowMs = Date.now();
  if (lastVerify && nowMs - lastVerify < VERIFY_COOLDOWN_MS) {
    res.status(429).json({ error: "Please wait a moment before re-verifying this account." });
    return;
  }
  verificationCooldowns.set(accountId, nowMs);

  let currentAccounts: SocialAccount[] = [];
  try {
    const [row] = await db.select().from(influencersTable).where(eq(influencersTable.id, id)).limit(1);
    if (row) currentAccounts = row.socialAccounts || [];
  } catch (_e) {
    const mem = inMemoryStore[id] || inMemoryStore[1];
    currentAccounts = mem?.socialAccounts || [];
  }

  const index = currentAccounts.findIndex((a) => a.id === accountId);
  if (index === -1) {
    res.status(404).json({ error: "Social account not found" });
    return;
  }

  const acc = currentAccounts[index];

  // Perform Verification via SocialVerificationService
  const verificationResult = await socialVerificationService.verifyAccount(acc);
  const nowIso = new Date().toISOString();

  const updatedAccount: SocialAccount = {
    ...acc,
    status: verificationResult.status,
    verificationType: verificationResult.verificationType,
    verifiedAt: verificationResult.verifiedAt,
    errorMessage: verificationResult.errorMessage,
    updatedAt: nowIso,
  };

  currentAccounts[index] = updatedAccount;

  try {
    await db
      .update(influencersTable)
      .set({
        socialAccounts: currentAccounts,
      })
      .where(eq(influencersTable.id, id));
  } catch (_e) {
    const mem = inMemoryStore[id] || { ...inMemoryStore[1], id };
    mem.socialAccounts = currentAccounts;
    inMemoryStore[id] = mem;
  }

  res.json(updatedAccount);
});

export default router;

