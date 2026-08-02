import { db } from "@workspace/db";
import {
  usersTable, influencersTable, brandsTable, campaignsTable,
  applicationsTable, notificationsTable, conversationsTable, messagesTable,
} from "@workspace/db";
import crypto from "crypto";

function hashPassword(password: string): string {
  const secret = process.env.SESSION_SECRET ?? "influencer-hub-secret";
  return crypto.createHmac("sha256", secret).update(password).digest("hex");
}

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(messagesTable);
  await db.delete(conversationsTable);
  await db.delete(notificationsTable);
  await db.delete(applicationsTable);
  await db.delete(campaignsTable);
  await db.delete(influencersTable);
  await db.delete(brandsTable);
  await db.delete(usersTable);

  // ── Influencer users ─────────────────────────────────────────────────────────
  const influencerData = [
    { name: "Maya Chen", email: "maya@influencerhub.demo", category: "Beauty & Fashion", country: "US", followers: 892000, engagement: 4.8, avgViews: 320000, cost: 4500, platforms: ["Instagram", "TikTok"], languages: ["English", "Mandarin"], avatar: "https://i.pravatar.cc/150?img=47", monthly: 18000, verified: true },
    { name: "Carlos Rivera", email: "carlos@influencerhub.demo", category: "Fitness & Health", country: "MX", followers: 1240000, engagement: 3.9, avgViews: 480000, cost: 6200, platforms: ["YouTube", "Instagram"], languages: ["Spanish", "English"], avatar: "https://i.pravatar.cc/150?img=12", monthly: 24000, verified: true },
    { name: "Aisha Patel", email: "aisha@influencerhub.demo", category: "Technology", country: "IN", followers: 445000, engagement: 6.2, avgViews: 180000, cost: 2800, platforms: ["YouTube", "TikTok"], languages: ["Hindi", "English"], avatar: "https://i.pravatar.cc/150?img=32", monthly: 12000, verified: true },
    { name: "Liam O'Brien", email: "liam@influencerhub.demo", category: "Travel & Lifestyle", country: "AU", followers: 678000, engagement: 5.1, avgViews: 245000, cost: 3400, platforms: ["Instagram", "YouTube"], languages: ["English"], avatar: "https://i.pravatar.cc/150?img=51", monthly: 15000, verified: false },
    { name: "Yuki Tanaka", email: "yuki@influencerhub.demo", category: "Food & Cooking", country: "JP", followers: 523000, engagement: 7.3, avgViews: 195000, cost: 2600, platforms: ["Instagram", "TikTok"], languages: ["Japanese", "English"], avatar: "https://i.pravatar.cc/150?img=44", monthly: 9800, verified: true },
    { name: "Sofia Andersen", email: "sofia@influencerhub.demo", category: "Sustainable Living", country: "DK", followers: 312000, engagement: 8.4, avgViews: 142000, cost: 1900, platforms: ["Instagram"], languages: ["Danish", "English"], avatar: "https://i.pravatar.cc/150?img=25", monthly: 7200, verified: false },
    { name: "Marcus Williams", email: "marcus@influencerhub.demo", category: "Gaming", country: "US", followers: 2100000, engagement: 2.8, avgViews: 720000, cost: 9800, platforms: ["YouTube", "TikTok"], languages: ["English"], avatar: "https://i.pravatar.cc/150?img=68", monthly: 42000, verified: true },
    { name: "Priya Sharma", email: "priya@influencerhub.demo", category: "Education", country: "IN", followers: 387000, engagement: 5.9, avgViews: 163000, cost: 2200, platforms: ["YouTube", "Instagram"], languages: ["Hindi", "English", "Marathi"], avatar: "https://i.pravatar.cc/150?img=38", monthly: 8900, verified: true },
    { name: "Jake Thompson", email: "jake@influencerhub.demo", category: "Fitness & Health", country: "CA", followers: 756000, engagement: 4.4, avgViews: 287000, cost: 4100, platforms: ["Instagram", "TikTok"], languages: ["English", "French"], avatar: "https://i.pravatar.cc/150?img=59", monthly: 17500, verified: true },
    { name: "Amara Diallo", email: "amara@influencerhub.demo", category: "Fashion", country: "NG", followers: 228000, engagement: 9.1, avgViews: 98000, cost: 1400, platforms: ["Instagram", "TikTok"], languages: ["English", "Yoruba", "French"], avatar: "https://i.pravatar.cc/150?img=29", monthly: 5400, verified: false },
    { name: "Elena Vasquez", email: "elena@influencerhub.demo", category: "Beauty & Fashion", country: "ES", followers: 945000, engagement: 4.6, avgViews: 356000, cost: 5100, platforms: ["Instagram", "YouTube"], languages: ["Spanish", "English", "Catalan"], avatar: "https://i.pravatar.cc/150?img=23", monthly: 21000, verified: true },
    { name: "Ravi Krishnan", email: "ravi@influencerhub.demo", category: "Finance & Business", country: "IN", followers: 612000, engagement: 3.7, avgViews: 225000, cost: 3800, platforms: ["YouTube", "Instagram"], languages: ["English", "Tamil", "Hindi"], avatar: "https://i.pravatar.cc/150?img=14", monthly: 16000, verified: true },
    { name: "Isabelle Martin", email: "isabelle@influencerhub.demo", category: "Art & Design", country: "FR", followers: 189000, engagement: 10.2, avgViews: 87000, cost: 1200, platforms: ["Instagram", "TikTok"], languages: ["French", "English"], avatar: "https://i.pravatar.cc/150?img=48", monthly: 4100, verified: false },
    { name: "Noah Jackson", email: "noah@influencerhub.demo", category: "Music & Entertainment", country: "US", followers: 3400000, engagement: 2.3, avgViews: 1100000, cost: 14500, platforms: ["YouTube", "TikTok", "Instagram"], languages: ["English"], avatar: "https://i.pravatar.cc/150?img=60", monthly: 65000, verified: true },
    { name: "Fatima Al-Hassan", email: "fatima@influencerhub.demo", category: "Parenting & Family", country: "AE", followers: 434000, engagement: 6.8, avgViews: 178000, cost: 2900, platforms: ["Instagram", "YouTube"], languages: ["Arabic", "English"], avatar: "https://i.pravatar.cc/150?img=45", monthly: 11000, verified: true },
    { name: "Lucas Oliveira", email: "lucas@influencerhub.demo", category: "Sports", country: "BR", followers: 1890000, engagement: 3.4, avgViews: 645000, cost: 8700, platforms: ["Instagram", "YouTube", "TikTok"], languages: ["Portuguese", "English", "Spanish"], avatar: "https://i.pravatar.cc/150?img=64", monthly: 38000, verified: true },
    { name: "Mei Lin Zhou", email: "mei@influencerhub.demo", category: "Food & Cooking", country: "CN", followers: 765000, engagement: 5.6, avgViews: 298000, cost: 4200, platforms: ["TikTok", "Instagram"], languages: ["Mandarin", "English"], avatar: "https://i.pravatar.cc/150?img=41", monthly: 19000, verified: true },
    { name: "Dmitri Volkov", email: "dmitri@influencerhub.demo", category: "Technology", country: "RU", followers: 298000, engagement: 7.8, avgViews: 124000, cost: 1700, platforms: ["YouTube"], languages: ["Russian", "English"], avatar: "https://i.pravatar.cc/150?img=15", monthly: 6800, verified: false },
    { name: "Zara Ahmed", email: "zara@influencerhub.demo", category: "Wellness & Mindfulness", country: "PK", followers: 543000, engagement: 6.1, avgViews: 210000, cost: 3200, platforms: ["Instagram", "YouTube"], languages: ["Urdu", "English"], avatar: "https://i.pravatar.cc/150?img=35", monthly: 13500, verified: true },
    { name: "Tyler Brooks", email: "tyler@influencerhub.demo", category: "Comedy & Entertainment", country: "US", followers: 4200000, engagement: 2.1, avgViews: 1450000, cost: 18000, platforms: ["TikTok", "YouTube", "Instagram"], languages: ["English"], avatar: "https://i.pravatar.cc/150?img=70", monthly: 78000, verified: true },
  ];

  // ── Brand users ──────────────────────────────────────────────────────────────
  const brandData = [
    { name: "NovaTech Solutions", email: "nova@influencerhub.demo", industry: "Technology", country: "US", logo: "https://logo.clearbit.com/apple.com", desc: "Enterprise software solutions for modern businesses.", website: "https://novatech.demo" },
    { name: "Lumière Beauty", email: "lumiere@influencerhub.demo", industry: "Beauty & Cosmetics", country: "FR", logo: "https://logo.clearbit.com/sephora.com", desc: "Premium skincare and makeup for the conscious consumer.", website: "https://lumiere.demo" },
    { name: "Peak Performance Co.", email: "peak@influencerhub.demo", industry: "Sports & Fitness", country: "US", logo: "https://logo.clearbit.com/nike.com", desc: "Athletic apparel and gear for elite and everyday athletes.", website: "https://peakperformance.demo" },
    { name: "WanderLux Travel", email: "wanderlux@influencerhub.demo", industry: "Travel & Tourism", country: "UK", logo: "https://logo.clearbit.com/airbnb.com", desc: "Curated travel experiences for the modern explorer.", website: "https://wanderlux.demo" },
    { name: "Harvest Kitchen", email: "harvest@influencerhub.demo", industry: "Food & Beverage", country: "CA", logo: "https://logo.clearbit.com/wholefoodsmarket.com", desc: "Artisanal food products made from farm-fresh ingredients.", website: "https://harvestkitchen.demo" },
    { name: "Pixelforge Games", email: "pixelforge@influencerhub.demo", industry: "Gaming", country: "US", logo: "https://logo.clearbit.com/ea.com", desc: "Independent game studio creating immersive worlds.", website: "https://pixelforge.demo" },
    { name: "EduSpark Learning", email: "eduspark@influencerhub.demo", industry: "Education", country: "IN", logo: "https://logo.clearbit.com/coursera.org", desc: "Online learning platform for professional skill development.", website: "https://eduspark.demo" },
    { name: "Verdant Eco", email: "verdant@influencerhub.demo", industry: "Sustainability", country: "DK", logo: "https://logo.clearbit.com/patagonia.com", desc: "Sustainable lifestyle products made with zero-waste processes.", website: "https://verdant.demo" },
    { name: "FinFlow Capital", email: "finflow@influencerhub.demo", industry: "Finance & Fintech", country: "SG", logo: "https://logo.clearbit.com/stripe.com", desc: "Next-gen payment infrastructure for global businesses.", website: "https://finflow.demo" },
    { name: "Aria Music Group", email: "aria@influencerhub.demo", industry: "Music & Entertainment", country: "US", logo: "https://logo.clearbit.com/spotify.com", desc: "Independent music label and streaming consultancy.", website: "https://aria.demo" },
  ];

  // Insert brand users and profiles
  const brandUsers = await db.insert(usersTable).values(
    brandData.map(b => ({ email: b.email, passwordHash: hashPassword("demo123"), role: "brand" as const, name: b.name }))
  ).returning();

  const brands = await db.insert(brandsTable).values(
    brandData.map((b, i) => ({ userId: brandUsers[i].id, name: b.name, industry: b.industry, country: b.country, description: b.desc, logoUrl: b.logo, website: b.website }))
  ).returning();

  // Insert influencer users and profiles
  const infUsers = await db.insert(usersTable).values(
    influencerData.map(inf => ({ email: inf.email, passwordHash: hashPassword("demo123"), role: "influencer" as const, name: inf.name, avatarUrl: inf.avatar }))
  ).returning();

  const influencers = await db.insert(influencersTable).values(
    influencerData.map((inf, i) => ({
      userId: infUsers[i].id,
      bio: `${inf.name} is a ${inf.category} creator with a passionate community. Known for authentic storytelling and high engagement.`,
      category: inf.category,
      country: inf.country,
      followers: inf.followers,
      engagementRate: inf.engagement,
      avgViews: inf.avgViews,
      collaborationCost: inf.cost,
      platforms: inf.platforms,
      languages: inf.languages,
      avatarUrl: inf.avatar,
      coverUrl: `https://picsum.photos/seed/${inf.name.replace(" ", "")}/1200/400`,
      profileCompletion: 85 + (i % 15),
      monthlyEarnings: inf.monthly,
      isVerified: inf.verified,
      availability: i % 4 === 0 ? "busy" : "available",
      portfolio: [
        `https://picsum.photos/seed/${inf.name}1/400/400`,
        `https://picsum.photos/seed/${inf.name}2/400/400`,
        `https://picsum.photos/seed/${inf.name}3/400/400`,
      ],
    }))
  ).returning();

  // ── Campaigns ────────────────────────────────────────────────────────────────
  const campaignsData = [
    { brandIdx: 0, title: "NovaTech Product Launch", desc: "Promote our flagship AI productivity suite to tech-savvy audiences. Looking for authentic reviews and demo content.", budget: 25000, platform: "YouTube", status: "active" as const, deliverables: "3 YouTube videos, 5 Instagram posts", audience: "Tech professionals 25-40", deadline: "2026-09-15" },
    { brandIdx: 1, title: "Lumière Summer Glow Campaign", desc: "Showcase our new summer skincare line with before/after content and tutorial formats.", budget: 18000, platform: "Instagram", status: "active" as const, deliverables: "8 Instagram Reels, 15 Stories", audience: "Women 18-35 interested in skincare", deadline: "2026-08-31" },
    { brandIdx: 2, title: "Peak Performance Fall Collection", desc: "Launch our new athletic wear line for the fall season. Looking for fitness creators with strong engagement.", budget: 32000, platform: "Instagram", status: "active" as const, deliverables: "6 Instagram posts, 4 Reels, 2 YouTube videos", audience: "Fitness enthusiasts 20-45", deadline: "2026-09-30" },
    { brandIdx: 3, title: "WanderLux Southeast Asia Tour", desc: "Authentic travel content showcasing our curated Southeast Asia packages.", budget: 15000, platform: "YouTube", status: "active" as const, deliverables: "2 YouTube vlogs, 10 Instagram posts, Stories", audience: "Travel enthusiasts 25-45", deadline: "2026-10-15" },
    { brandIdx: 4, title: "Harvest Kitchen Recipe Series", desc: "Create authentic recipe content featuring our new organic product line.", budget: 8500, platform: "TikTok", status: "active" as const, deliverables: "12 TikTok videos, 6 Instagram Reels", audience: "Home cooks and food enthusiasts", deadline: "2026-08-20" },
    { brandIdx: 5, title: "Pixelforge Galaxy Quest Launch", desc: "Generate buzz for our new mobile RPG game launch with gameplay content and reviews.", budget: 42000, platform: "YouTube", status: "active" as const, deliverables: "4 YouTube let's play videos, 20 TikTok clips", audience: "Gamers 18-35", deadline: "2026-10-01" },
    { brandIdx: 6, title: "EduSpark Professional Skills Course", desc: "Promote our new Data Science and AI course to working professionals.", budget: 12000, platform: "YouTube", status: "active" as const, deliverables: "3 YouTube videos, 6 Instagram posts", audience: "Working professionals 22-40", deadline: "2026-09-20" },
    { brandIdx: 7, title: "Verdant Eco Sustainable Fashion", desc: "Showcase our zero-waste clothing collection to eco-conscious audiences.", budget: 9000, platform: "Instagram", status: "active" as const, deliverables: "8 Instagram Reels, 12 Stories", audience: "Eco-conscious consumers 20-40", deadline: "2026-09-10" },
    { brandIdx: 8, title: "FinFlow Global Payment Launch", desc: "Educate business audiences on our new payment infrastructure with informative content.", budget: 28000, platform: "YouTube", status: "active" as const, deliverables: "4 YouTube explainer videos, 6 LinkedIn posts", audience: "Business owners and entrepreneurs", deadline: "2026-10-30" },
    { brandIdx: 9, title: "Aria Music Summer Playlist", desc: "Promote our summer compilation featuring emerging artists to music lovers.", budget: 14000, platform: "TikTok", status: "active" as const, deliverables: "15 TikTok videos, 8 Instagram Reels", audience: "Music lovers 16-30", deadline: "2026-08-15" },
    { brandIdx: 1, title: "Lumière Holiday Gifting Campaign", desc: "Early holiday gifting campaign for our premium makeup sets.", budget: 22000, platform: "Instagram", status: "draft" as const, deliverables: "10 Instagram posts, 5 YouTube videos", audience: "Gift shoppers 25-55", deadline: "2026-11-15" },
    { brandIdx: 2, title: "Peak Marathon Season Campaign", desc: "Inspire runners with our new performance shoe line ahead of marathon season.", budget: 19500, platform: "Instagram", status: "active" as const, deliverables: "5 Instagram posts, 3 YouTube training videos", audience: "Runners and athletes 25-50", deadline: "2026-09-01" },
    { brandIdx: 0, title: "NovaTech Developer Conference Promo", desc: "Build awareness for our annual developer conference among tech communities.", budget: 11000, platform: "YouTube", status: "completed" as const, deliverables: "2 YouTube videos, 8 Twitter posts", audience: "Software developers 22-45", deadline: "2026-07-30" },
    { brandIdx: 4, title: "Harvest Kitchen Holiday Recipes", desc: "Festive recipe content showcasing our premium spice collections.", budget: 7800, platform: "TikTok", status: "paused" as const, deliverables: "10 TikTok videos, 5 Instagram Reels", audience: "Home cooks and food enthusiasts", deadline: "2026-12-01" },
    { brandIdx: 6, title: "EduSpark Language Learning Push", desc: "Drive sign-ups for our new language learning courses with authentic learner stories.", budget: 9500, platform: "Instagram", status: "active" as const, deliverables: "6 Instagram posts, 3 Reels, 2 YouTube videos", audience: "Language learners 18-40", deadline: "2026-10-20" },
  ];

  const campaigns = await db.insert(campaignsTable).values(
    campaignsData.map(c => ({
      brandId: brands[c.brandIdx].id,
      title: c.title,
      description: c.desc,
      budget: c.budget,
      platform: c.platform,
      status: c.status,
      deliverables: c.deliverables,
      targetAudience: c.audience,
      timeline: "6 weeks",
      deadline: c.deadline,
    }))
  ).returning();

  // ── Applications ────────────────────────────────────────────────────────────
  const appPairs = [
    { campIdx: 0, infIdx: 2 }, { campIdx: 0, infIdx: 7 }, { campIdx: 0, infIdx: 11 },
    { campIdx: 1, infIdx: 0 }, { campIdx: 1, infIdx: 10 }, { campIdx: 1, infIdx: 12 },
    { campIdx: 2, infIdx: 1 }, { campIdx: 2, infIdx: 8 }, { campIdx: 2, infIdx: 15 },
    { campIdx: 3, infIdx: 3 }, { campIdx: 3, infIdx: 16 }, { campIdx: 4, infIdx: 4 },
    { campIdx: 4, infIdx: 16 }, { campIdx: 5, infIdx: 6 }, { campIdx: 5, infIdx: 17 },
    { campIdx: 6, infIdx: 2 }, { campIdx: 6, infIdx: 7 }, { campIdx: 7, infIdx: 5 },
    { campIdx: 8, infIdx: 11 }, { campIdx: 9, infIdx: 13 }, { campIdx: 11, infIdx: 1 },
  ];

  await db.insert(applicationsTable).values(
    appPairs.map((p, i) => ({
      campaignId: campaigns[p.campIdx].id,
      influencerId: influencers[p.infIdx].id,
      status: i % 5 === 0 ? "accepted" as const : i % 7 === 0 ? "rejected" as const : "pending" as const,
      message: "I'd love to collaborate on this campaign! My audience aligns perfectly with your target demographic.",
    }))
  );

  // ── Notifications ────────────────────────────────────────────────────────────
  await db.insert(notificationsTable).values([
    { userId: infUsers[0].id, type: "application", title: "Application Accepted", body: "Peak Performance Co. accepted your application for the Fall Collection campaign.", isRead: false },
    { userId: infUsers[0].id, type: "invite", title: "New Campaign Invitation", body: "Lumière Beauty has invited you to collaborate on their Summer Glow campaign.", isRead: false },
    { userId: infUsers[0].id, type: "message", title: "New Message from Harvest Kitchen", body: "Hey! We'd love to discuss the recipe series collaboration.", isRead: true },
    { userId: brandUsers[0].id, type: "application", title: "3 New Applications", body: "3 influencers applied to your NovaTech Product Launch campaign.", isRead: false },
    { userId: brandUsers[0].id, type: "message", title: "New Message from Aisha Patel", body: "Thank you for considering me for the campaign!", isRead: false },
  ]);

  // ── Seed conversations ────────────────────────────────────────────────────────
  const [conv1] = await db.insert(conversationsTable).values({ user1Id: brandUsers[1].id, user2Id: infUsers[0].id }).returning();
  await db.insert(messagesTable).values([
    { conversationId: conv1.id, senderId: brandUsers[1].id, content: "Hi Maya! We love your content and think you'd be perfect for our Summer Glow campaign.", isRead: true },
    { conversationId: conv1.id, senderId: infUsers[0].id, content: "Thank you so much! I've been a Lumière fan for years. Would love to hear more details.", isRead: true },
    { conversationId: conv1.id, senderId: brandUsers[1].id, content: "We're looking for 8 Reels and 15 Stories. Budget is $18k. Does that work for you?", isRead: false },
  ]);

  console.log(`Seeded: ${brandUsers.length} brands, ${infUsers.length} influencers, ${campaigns.length} campaigns`);
  console.log("Demo login: maya@influencerhub.demo / demo123 (influencer)");
  console.log("Demo login: nova@influencerhub.demo / demo123 (brand)");
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
