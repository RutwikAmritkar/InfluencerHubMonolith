import { Router, type IRouter, type Request, type Response } from "express";
import { db, influencersTable, user as userTable, campaignsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { llmService, type CreatorContext } from "../services/llm.js";

const router: IRouter = Router();

// GET /api/ai/suggestions - Existing suggestions endpoint
router.get("/ai/suggestions", async (req: Request, res: Response): Promise<void> => {
  const { type } = req.query as { type?: string };

  const suggestions = [
    { id: 1, type: "audience", title: "Your audience is strongest in India", body: "62% of your engaged followers are based in India, peaking between 7PM-10PM IST. Consider scheduling content during this window.", confidence: 94, action: "Optimize posting schedule →" },
    { id: 2, type: "timing", title: "Post between 6PM and 8PM for maximum reach", body: "Data from your last 90 days shows 3.4x higher engagement when you post in the early evening window.", confidence: 91, action: "Schedule next post →" },
    { id: 3, type: "match", title: "This creator matches 92% with your campaign", body: "Based on audience demographics, engagement patterns, and category alignment, @maya_creates is an ideal fit for your Summer Collection campaign.", confidence: 92, action: "View profile →" },
    { id: 4, type: "growth", title: "Reels drive 2.8x more follower growth", body: "Your Reels content averages 2.8x more new followers per post vs static images. Increasing Reel frequency could add 3,200 followers this month.", confidence: 88, action: "Create a Reel →" },
    { id: 5, type: "revenue", title: "You could earn $2,400 more this month", body: "3 active campaigns match your niche and audience. Applying to all three within the next 48 hours maximizes your booking rate.", confidence: 95, action: "Browse campaigns →" },
    { id: 6, type: "engagement", title: "Engagement drops after 5 posts per week", body: "Your audience shows fatigue signals when post frequency exceeds 5/week. Quality over quantity is the pattern here.", confidence: 89, action: "Adjust frequency →" },
  ];

  const filtered = type ? suggestions.filter(s => s.type === type) : suggestions;
  res.json(filtered);
});

// GET /api/ai/match - Existing match endpoint
router.get("/ai/match", async (req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select({ influencer: influencersTable, name: userTable.name })
    .from(influencersTable)
    .leftJoin(userTable, eq(userTable.id, influencersTable.userId))
    .limit(6);

  const matches = rows.map((r, i) => ({
    influencer: {
      id: r.influencer.id,
      userId: r.influencer.userId,
      name: r.name ?? "Unknown",
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
    },
    matchScore: 94 - i * 4,
    matchReasons: [
      "Audience demographics align 94%",
      "Category expertise matches campaign niche",
      "High engagement rate for follower count",
      "Prior brand collaboration experience",
    ].slice(0, 3 - (i % 2)),
  }));

  res.json(matches);
});

// POST /api/ai/generate - Production Server-Side LLM Integration
router.post("/ai/generate", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, language } = req.body as { prompt?: string; language?: string };

    // 1. Prompt Validation
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      res.status(400).json({ error: "Prompt is required and must be a non-empty string." });
      return;
    }

    if (prompt.trim().length > 500) {
      res.status(400).json({ error: "Prompt exceeds maximum allowed length of 500 characters." });
      return;
    }

    // 2. Identify Authenticated User from Session
    const userId = (req as Request & { userId: string | number }).userId;

    // 3. Fetch User & Influencer Data from Database
    const [user] = await db.select().from(userTable).where(eq(userTable.id, String(userId)));
    const [influencer] = await db.select().from(influencersTable).where(eq(influencersTable.userId, String(userId)));

    const activeCampaigns = await db.select().from(campaignsTable).limit(3);

    // 4. Build Structured Creator Context Object
    const context: CreatorContext = {
      creator: {
        name: user?.name || "Creator",
        category: influencer?.category || "Lifestyle & Fashion",
        country: influencer?.country || "US",
        followers: influencer?.followers || 125000,
        platforms: influencer?.platforms || ["instagram", "tiktok", "youtube"],
        isVerified: influencer?.isVerified ?? true,
      },
      performance: {
        engagementRate: influencer?.engagementRate || 4.2,
        avgViews: influencer?.avgViews || 85000,
        profileCompletion: influencer?.profileCompletion || 90,
      },
      earnings: {
        collaborationCost: influencer?.collaborationCost || 1500,
        monthlyEarnings: influencer?.monthlyEarnings || 8500,
      },
      campaigns: activeCampaigns.map((c) => ({
        title: c.title,
        brand: `Brand #${c.brandId}`,
        budget: c.budget,
        status: c.status,
      })),
    };

    // 5. Generate LLM Insights (with OpenAI or resilient fallback)
    const result = await llmService.generate(prompt.trim(), context, language || 'en');

    // 6. Return Structured Response
    res.json(result);
  } catch (error: any) {
    console.error("[POST /api/ai/generate] Server Error:", error?.message || error);
    res.status(500).json({ error: "An unexpected error occurred while generating insights." });
  }
});

export default router;
