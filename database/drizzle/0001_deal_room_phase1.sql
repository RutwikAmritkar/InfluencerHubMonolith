-- Migration: 0001_deal_room_phase1.sql
-- Strictly NEW tables only. ZERO ALTER TABLE statements on existing tables.

CREATE TABLE IF NOT EXISTS "collaboration_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer NOT NULL REFERENCES "brands"("id") ON DELETE CASCADE,
	"influencer_id" integer NOT NULL REFERENCES "influencers"("id") ON DELETE CASCADE,
	"status" text DEFAULT 'pending' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"deliverables" jsonb NOT NULL,
	"budget_min_paise" integer,
	"budget_max_paise" integer,
	"currency" text DEFAULT 'INR' NOT NULL,
	"proposed_timeline" text,
	"message" text,
	"decline_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_collab_requests_brand_creator_pending" 
ON "collaboration_requests" ("brand_id", "influencer_id") WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS "idx_collab_requests_influencer_status" ON "collaboration_requests" ("influencer_id", "status");
CREATE INDEX IF NOT EXISTS "idx_collab_requests_brand_status" ON "collaboration_requests" ("brand_id", "status");

CREATE TABLE IF NOT EXISTS "deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer NOT NULL REFERENCES "brands"("id") ON DELETE CASCADE,
	"influencer_id" integer NOT NULL REFERENCES "influencers"("id") ON DELETE CASCADE,
	"collaboration_request_id" integer REFERENCES "collaboration_requests"("id") ON DELETE SET NULL,
	"application_id" integer REFERENCES "applications"("id") ON DELETE SET NULL,
	"campaign_id" integer REFERENCES "campaigns"("id") ON DELETE SET NULL,
	"conversation_id" integer REFERENCES "conversations"("id") ON DELETE SET NULL,
	"title" text NOT NULL,
	"agreement_status" text DEFAULT 'TERMS_PROPOSED' NOT NULL,
	"payment_status" text DEFAULT 'UNFUNDED' NOT NULL,
	"execution_status" text DEFAULT 'NOT_STARTED' NOT NULL,
	"active_proposal_id" integer,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_deals_collab_request_id" ON "deals" ("collaboration_request_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_deals_application_id" ON "deals" ("application_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_deals_conversation_id" ON "deals" ("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_deals_brand_id" ON "deals" ("brand_id");
CREATE INDEX IF NOT EXISTS "idx_deals_influencer_id" ON "deals" ("influencer_id");
CREATE INDEX IF NOT EXISTS "idx_deals_agreement_status" ON "deals" ("agreement_status");

CREATE TABLE IF NOT EXISTS "deal_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL REFERENCES "deals"("id") ON DELETE CASCADE,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"party" text NOT NULL,
	"role" text DEFAULT 'primary_owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_deal_participants_deal_user" ON "deal_participants" ("deal_id", "user_id");

CREATE TABLE IF NOT EXISTS "deal_terms_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL REFERENCES "deals"("id") ON DELETE CASCADE,
	"version" integer DEFAULT 1 NOT NULL,
	"base_version" integer,
	"proposed_by_party" text NOT NULL,
	"proposed_by_user_id" text NOT NULL,
	"deliverables" jsonb NOT NULL,
	"price_paise" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"content_deadline" timestamp with time zone NOT NULL,
	"posting_date" timestamp with time zone NOT NULL,
	"usage_rights_days" integer DEFAULT 30 NOT NULL,
	"exclusivity_days" integer DEFAULT 0 NOT NULL,
	"revision_count" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_deal_terms_versions_deal_ver" ON "deal_terms_versions" ("deal_id", "version");

CREATE TABLE IF NOT EXISTS "deal_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL REFERENCES "deals"("id") ON DELETE CASCADE,
	"proposal_id" integer NOT NULL REFERENCES "deal_terms_versions"("id") ON DELETE CASCADE,
	"proposal_version" integer NOT NULL,
	"user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"party" text NOT NULL,
	"terms_hash" text NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_deal_approvals_deal_ver_party" ON "deal_approvals" ("deal_id", "proposal_version", "party");

CREATE TABLE IF NOT EXISTS "deal_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL REFERENCES "deals"("id") ON DELETE CASCADE,
	"actor_id" text NOT NULL,
	"actor_party" text NOT NULL,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_deal_activity_deal_id" ON "deal_activity" ("deal_id");
