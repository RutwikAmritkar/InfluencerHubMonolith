import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { influencersTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/ai/suggestions", async (req, res): Promise<void> => {
  const { type } = req.query as { type?: string };

  const suggestions = [
    { id: 1, type: "audience", title: "Your audience is strongest in India", body: "62% of your engaged followers are based in India, peaking between 7PM-10PM IST. Consider scheduling content during this window.", confidence: 0.94, action: "Optimize posting schedule" },
    { id: 2, type: "timing", title: "Post between 6PM and 8PM for maximum reach", body: "Data from your last 90 days shows 3.4x higher engagement when you post in the early evening window.", confidence: 0.91, action: "Schedule next post" },
    { id: 3, type: "match", title: "This creator matches 92% with your campaign", body: "Based on audience demographics, engagement patterns, and category alignment, @maya_creates is an ideal fit for your Summer Collection campaign.", confidence: 0.92, action: "View profile" },
    { id: 4, type: "growth", title: "Reels drive 2.8x more follower growth", body: "Your Reels content averages 2.8x more new followers per post vs static images. Increasing Reel frequency could add 3,200 followers this month.", confidence: 0.88, action: "Create a Reel" },
    { id: 5, type: "revenue", title: "You could earn $2,400 more this month", body: "3 active campaigns match your niche and audience. Applying to all three within the next 48 hours maximizes your booking rate.", confidence: 0.85, action: "Browse campaigns" },
    { id: 6, type: "engagement", title: "Engagement drops after 5 posts per week", body: "Your audience shows fatigue signals when post frequency exceeds 5/week. Quality over quantity is the pattern here.", confidence: 0.82, action: null },
    { id: 7, type: "brand", title: "Beauty brands convert 40% better for your audience", body: "Your audience has a strong purchase intent for beauty and skincare products. Beauty brand partnerships yield 40% higher conversion for profiles like yours.", confidence: 0.87, action: "Browse beauty campaigns" },
  ];

  const filtered = type ? suggestions.filter(s => s.type === type) : suggestions;
  res.json(filtered);
});

router.get("/ai/match", async (req, res): Promise<void> => {
  const rows = await db
    .select({ influencer: influencersTable, name: usersTable.name })
    .from(influencersTable)
    .leftJoin(usersTable, eq(usersTable.id, influencersTable.userId))
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
    matchScore: parseFloat((0.94 - i * 0.04).toFixed(2)),
    matchReasons: [
      "Audience demographics align 94%",
      "Category expertise matches campaign niche",
      "High engagement rate for follower count",
      "Prior brand collaboration experience",
    ].slice(0, 3 - (i % 2)),
  }));

  res.json(matches);
});

export default router;
