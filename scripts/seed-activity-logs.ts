import {
  db,
  platformActivityEventsTable,
  user as userTable,
  brandsTable,
  influencersTable,
  campaignsTable,
  dealsTable,
} from "../database/src/index";
import { desc } from "drizzle-orm";

async function seedActivityLogs() {
  console.log("Seeding realistic platform activity events for Brands & Creators...");

  const existingEvents = await db.select().from(platformActivityEventsTable).limit(5);
  if (existingEvents.length > 5) {
    console.log(`Activity events already populated (${existingEvents.length}+ found). Skipping.`);
    process.exit(0);
  }

  const users = await db.select().from(userTable);
  const brands = await db.select().from(brandsTable);
  const creators = await db.select().from(influencersTable);
  const campaigns = await db.select().from(campaignsTable);
  const deals = await db.select().from(dealsTable);

  const creatorsWithUser = users.filter((u) => u.role === "influencer");
  const brandsWithUser = users.filter((u) => u.role === "brand");

  const now = Date.now();
  const minutesAgo = (mins: number) => new Date(now - mins * 60 * 1000);
  const hoursAgo = (hrs: number) => new Date(now - hrs * 3600 * 1000);
  const daysAgo = (days: number) => new Date(now - days * 86400 * 1000);

  const events: any[] = [];

  // 1. Online creators & brands logging in
  if (creatorsWithUser[0]) {
    events.push({
      actorUserId: creatorsWithUser[0].id,
      actorParty: "creator",
      eventType: "user.login",
      entityType: "user",
      entityId: creatorsWithUser[0].id,
      summary: `Creator "${creatorsWithUser[0].name}" established active workspace session`,
      metadata: { role: "creator", client: "Web / Chrome 132" },
      createdAt: minutesAgo(4),
    });
  }

  if (brandsWithUser[0]) {
    events.push({
      actorUserId: brandsWithUser[0].id,
      actorParty: "brand",
      eventType: "user.login",
      entityType: "user",
      entityId: brandsWithUser[0].id,
      summary: `Brand "${brandsWithUser[0].name}" established active workspace session`,
      metadata: { role: "brand", client: "Web / macOS" },
      createdAt: minutesAgo(12),
    });
  }

  if (creatorsWithUser[1]) {
    events.push({
      actorUserId: creatorsWithUser[1].id,
      actorParty: "creator",
      eventType: "deal.counter_offer",
      entityType: "deal",
      entityId: deals[0]?.id || 101,
      summary: `Creator "${creatorsWithUser[1].name}" proposed revised commercial terms (v2) on Deal #${deals[0]?.id || 101}`,
      metadata: { version: 2, pricePaise: 4500000, revisionCount: 2 },
      createdAt: minutesAgo(28),
    });
  }

  if (brandsWithUser[1]) {
    events.push({
      actorUserId: brandsWithUser[1].id,
      actorParty: "brand",
      eventType: "campaign.created",
      entityType: "campaign",
      entityId: campaigns[0]?.id || 201,
      summary: `Brand "${brandsWithUser[1].name}" launched campaign brief: "${campaigns[0]?.title || 'Summer Lifestyle Showcase'}"`,
      metadata: { budgetPaise: 15000000, platform: "Instagram Reel" },
      createdAt: hoursAgo(1),
    });
  }

  if (creatorsWithUser[2]) {
    events.push({
      actorUserId: creatorsWithUser[2].id,
      actorParty: "creator",
      eventType: "application.submitted",
      entityType: "application",
      entityId: 301,
      summary: `Creator "${creatorsWithUser[2].name}" submitted pitch application for campaign #${campaigns[0]?.id || 201}`,
      metadata: { quotedRatePaise: 3500000, proposedTimeline: "7 business days" },
      createdAt: hoursAgo(2),
    });
  }

  if (brandsWithUser[0]) {
    events.push({
      actorUserId: brandsWithUser[0].id,
      actorParty: "brand",
      eventType: "deal.signed",
      entityType: "deal",
      entityId: deals[0]?.id || 101,
      summary: `Brand "${brandsWithUser[0].name}" digitally signed bilateral agreement on Deal #${deals[0]?.id || 101}`,
      metadata: { agreedVersion: 1, agreementStatus: "TERMS_SIGNED" },
      createdAt: hoursAgo(3),
    });
  }

  if (creatorsWithUser[0]) {
    events.push({
      actorUserId: creatorsWithUser[0].id,
      actorParty: "creator",
      eventType: "deliverable.submitted",
      entityType: "deal",
      entityId: deals[0]?.id || 101,
      summary: `Creator "${creatorsWithUser[0].name}" uploaded content draft package (Round 1) for brand review`,
      metadata: { round: 1, deliverablesCount: 2 },
      createdAt: hoursAgo(5),
    });
  }

  if (brandsWithUser[0]) {
    events.push({
      actorUserId: brandsWithUser[0].id,
      actorParty: "brand",
      eventType: "content.approved",
      entityType: "deal",
      entityId: deals[0]?.id || 101,
      summary: `Brand "${brandsWithUser[0].name}" approved deliverable package. Execution completed.`,
      metadata: { approvedAt: hoursAgo(6).toISOString() },
      createdAt: hoursAgo(6),
    });
  }

  if (brandsWithUser[1]) {
    events.push({
      actorUserId: brandsWithUser[1].id,
      actorParty: "brand",
      eventType: "payment.settled",
      entityType: "deal",
      entityId: deals[0]?.id || 101,
      summary: `Brand "${brandsWithUser[1].name}" authorized escrow release of ₹45,000 for milestone delivery`,
      metadata: { amountPaise: 4500000, utrReference: "UPI-CB-99482103" },
      createdAt: hoursAgo(8),
    });
  }

  if (creatorsWithUser[3]) {
    events.push({
      actorUserId: creatorsWithUser[3].id,
      actorParty: "creator",
      eventType: "user.login",
      entityType: "user",
      entityId: creatorsWithUser[3].id,
      summary: `Creator "${creatorsWithUser[3].name}" logged in from mobile device`,
      metadata: { client: "Mobile iOS 18" },
      createdAt: hoursAgo(11),
    });
  }

  if (creatorsWithUser[4]) {
    events.push({
      actorUserId: creatorsWithUser[4].id,
      actorParty: "creator",
      eventType: "application.submitted",
      entityType: "application",
      entityId: 302,
      summary: `Creator "${creatorsWithUser[4].name}" pitched for campaign brief: "Winter Wardrobe Drop"`,
      metadata: { quotedRatePaise: 5000000 },
      createdAt: hoursAgo(15),
    });
  }

  if (brandsWithUser[2]) {
    events.push({
      actorUserId: brandsWithUser[2].id,
      actorParty: "brand",
      eventType: "campaign.created",
      entityType: "campaign",
      entityId: 202,
      summary: `Brand "${brandsWithUser[2].name}" published new campaign brief: "Festive Season Collaboration"`,
      metadata: { budgetPaise: 25000000, platform: "YouTube Video" },
      createdAt: daysAgo(1),
    });
  }

  if (creatorsWithUser[5]) {
    events.push({
      actorUserId: creatorsWithUser[5].id,
      actorParty: "creator",
      eventType: "deal.counter_offer",
      entityType: "deal",
      entityId: 102,
      summary: `Creator "${creatorsWithUser[5].name}" countered with revised terms (v1) on Deal #102`,
      metadata: { version: 1, pricePaise: 6000000 },
      createdAt: daysAgo(2),
    });
  }

  for (const ev of events) {
    await db.insert(platformActivityEventsTable).values({
      actorUserId: ev.actorUserId,
      actorParty: ev.actorParty,
      eventType: ev.eventType,
      entityType: ev.entityType,
      entityId: String(ev.entityId),
      summary: ev.summary,
      metadata: ev.metadata,
      createdAt: ev.createdAt,
    });
  }

  console.log(`Successfully seeded ${events.length} realistic platform activity events!`);
  process.exit(0);
}

seedActivityLogs().catch((err) => {
  console.error("Seed activity logs error:", err);
  process.exit(1);
});
