import {
  pgTable,
  serial,
  timestamp,
  integer,
  text,
  jsonb,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { brandsTable } from "./brands";
import { influencersTable } from "./influencers";
import { collaborationRequestsTable } from "./collaboration-requests";
import { applicationsTable } from "./applications";
import { campaignsTable } from "./campaigns";
import { conversationsTable } from "./conversations";
import { user } from "./auth-schema";

export const dealsTable = pgTable(
  "deals",
  {
    id: serial("id").primaryKey(),
    brandId: integer("brand_id")
      .notNull()
      .references(() => brandsTable.id, { onDelete: "cascade" }),
    influencerId: integer("influencer_id")
      .notNull()
      .references(() => influencersTable.id, { onDelete: "cascade" }),
    collaborationRequestId: integer("collaboration_request_id").references(
      () => collaborationRequestsTable.id,
      { onDelete: "set null" }
    ),
    applicationId: integer("application_id").references(() => applicationsTable.id, {
      onDelete: "set null",
    }),
    campaignId: integer("campaign_id").references(() => campaignsTable.id, {
      onDelete: "set null",
    }),
    conversationId: integer("conversation_id").references(() => conversationsTable.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    agreementStatus: text("agreement_status").notNull().default("TERMS_PROPOSED"),
    paymentStatus: text("payment_status").notNull().default("UNFUNDED"),
    executionStatus: text("execution_status").notNull().default("NOT_STARTED"),
    activeProposalId: integer("active_proposal_id"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_deals_collab_request_id").on(table.collaborationRequestId),
    uniqueIndex("idx_deals_application_id").on(table.applicationId),
    uniqueIndex("idx_deals_conversation_id").on(table.conversationId),
    index("idx_deals_brand_id").on(table.brandId),
    index("idx_deals_influencer_id").on(table.influencerId),
    index("idx_deals_agreement_status").on(table.agreementStatus),
  ]
);

export type Deal = typeof dealsTable.$inferSelect;

export const dealParticipantsTable = pgTable(
  "deal_participants",
  {
    id: serial("id").primaryKey(),
    dealId: integer("deal_id")
      .notNull()
      .references(() => dealsTable.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    party: text("party").notNull(), // 'brand' | 'creator'
    role: text("role").notNull().default("primary_owner"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("idx_deal_participants_deal_user").on(table.dealId, table.userId)]
);

export type DealParticipant = typeof dealParticipantsTable.$inferSelect;

export const dealTermsVersionsTable = pgTable(
  "deal_terms_versions",
  {
    id: serial("id").primaryKey(),
    dealId: integer("deal_id")
      .notNull()
      .references(() => dealsTable.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    baseVersion: integer("base_version"),
    proposedByParty: text("proposed_by_party").notNull(), // 'brand' | 'creator'
    proposedByUserId: text("proposed_by_user_id").notNull(),
    deliverables: jsonb("deliverables")
      .$type<Array<{ title: string; count: number; description?: string }>>()
      .notNull(),
    pricePaise: integer("price_paise").notNull(),
    currency: text("currency").notNull().default("INR"),
    contentDeadline: timestamp("content_deadline", { withTimezone: true }).notNull(),
    postingDate: timestamp("posting_date", { withTimezone: true }).notNull(),
    usageRightsDays: integer("usage_rights_days").notNull().default(30),
    exclusivityDays: integer("exclusivity_days").notNull().default(0),
    revisionCount: integer("revision_count").notNull().default(1),
    notes: text("notes"),
    dealTitle: text("deal_title"),
    collabType: text("collab_type").default("paid"), // 'paid' | 'barter' | 'hybrid'
    barterDetails: jsonb("barter_details").$type<{
      productDescription: string;
      quantity: number;
      estimatedValuePaise: number;
      shippingBy: "brand" | "creator";
    } | null>(),
    timelines: jsonb("timelines").$type<{
      startDate?: string;
      productDeliveryDate?: string;
      contentSubmissionDate?: string;
      publishingDate?: string;
      finalApprovalDate?: string;
    } | null>(),
    paidAdsPermission: boolean("paid_ads_permission").default(false),
    cancellationTerms: text("cancellation_terms"),
    status: text("status").notNull().default("pending"), // 'pending' | 'accepted' | 'superceded' | 'withdrawn' | 'rejected'
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("idx_deal_terms_versions_deal_ver").on(table.dealId, table.version)]
);

export type DealTermsVersion = typeof dealTermsVersionsTable.$inferSelect;

export const dealApprovalsTable = pgTable(
  "deal_approvals",
  {
    id: serial("id").primaryKey(),
    dealId: integer("deal_id")
      .notNull()
      .references(() => dealsTable.id, { onDelete: "cascade" }),
    proposalId: integer("proposal_id")
      .notNull()
      .references(() => dealTermsVersionsTable.id, { onDelete: "cascade" }),
    proposalVersion: integer("proposal_version").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    party: text("party").notNull(), // 'brand' | 'creator'
    termsHash: text("terms_hash").notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
  },
  (table) => [
    uniqueIndex("idx_deal_approvals_deal_ver_party").on(
      table.dealId,
      table.proposalVersion,
      table.party
    ),
  ]
);

export type DealApproval = typeof dealApprovalsTable.$inferSelect;

export const dealActivityTable = pgTable(
  "deal_activity",
  {
    id: serial("id").primaryKey(),
    dealId: integer("deal_id")
      .notNull()
      .references(() => dealsTable.id, { onDelete: "cascade" }),
    actorId: text("actor_id").notNull(),
    actorParty: text("actor_party").notNull(),
    action: text("action").notNull(),
    description: text("description").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_deal_activity_deal_id").on(table.dealId)]
);

export type DealActivity = typeof dealActivityTable.$inferSelect;
