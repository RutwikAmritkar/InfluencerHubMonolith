CREATE TABLE "collaboration_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer NOT NULL,
	"influencer_id" integer NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "creator_portfolio_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" integer NOT NULL,
	"media_type" text DEFAULT 'video' NOT NULL,
	"storage_key" text NOT NULL,
	"thumbnail_storage_key" text,
	"mime_type" text NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"duration_seconds" integer,
	"width" integer,
	"height" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'ready' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creator_portfolio_media_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "deal_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL,
	"actor_id" text NOT NULL,
	"actor_party" text NOT NULL,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL,
	"proposal_id" integer NOT NULL,
	"proposal_version" integer NOT NULL,
	"user_id" text NOT NULL,
	"party" text NOT NULL,
	"terms_hash" text NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "deal_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"party" text NOT NULL,
	"role" text DEFAULT 'primary_owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deal_terms_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer NOT NULL,
	"influencer_id" integer NOT NULL,
	"collaboration_request_id" integer,
	"application_id" integer,
	"campaign_id" integer,
	"conversation_id" integer,
	"title" text NOT NULL,
	"agreement_status" text DEFAULT 'TERMS_PROPOSED' NOT NULL,
	"payment_status" text DEFAULT 'UNFUNDED' NOT NULL,
	"execution_status" text DEFAULT 'NOT_STARTED' NOT NULL,
	"active_proposal_id" integer,
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"state" text NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "social_media_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"social_account_id" integer NOT NULL,
	"external_content_id" text,
	"metric" text NOT NULL,
	"value" text NOT NULL,
	"period" text,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text DEFAULT 'instagram_graph_api' NOT NULL,
	"metadata" text
);
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "country" SET DEFAULT 'India';--> statement-breakpoint
ALTER TABLE "brands" ALTER COLUMN "country" SET DEFAULT 'India';--> statement-breakpoint
ALTER TABLE "influencers" ALTER COLUMN "country" SET DEFAULT 'India';--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "issuer" text;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "monthly_budget" integer DEFAULT 50000;--> statement-breakpoint
ALTER TABLE "social_metric_snapshots" ADD COLUMN "reach" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "influencers" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "influencers" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "collaboration_requests" ADD CONSTRAINT "collaboration_requests_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaboration_requests" ADD CONSTRAINT "collaboration_requests_influencer_id_influencers_id_fk" FOREIGN KEY ("influencer_id") REFERENCES "public"."influencers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_portfolio_media" ADD CONSTRAINT "creator_portfolio_media_creator_id_influencers_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."influencers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_activity" ADD CONSTRAINT "deal_activity_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_approvals" ADD CONSTRAINT "deal_approvals_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_approvals" ADD CONSTRAINT "deal_approvals_proposal_id_deal_terms_versions_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."deal_terms_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_approvals" ADD CONSTRAINT "deal_approvals_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_participants" ADD CONSTRAINT "deal_participants_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_participants" ADD CONSTRAINT "deal_participants_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_terms_versions" ADD CONSTRAINT "deal_terms_versions_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_influencer_id_influencers_id_fk" FOREIGN KEY ("influencer_id") REFERENCES "public"."influencers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_collaboration_request_id_collaboration_requests_id_fk" FOREIGN KEY ("collaboration_request_id") REFERENCES "public"."collaboration_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_states" ADD CONSTRAINT "oauth_states_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_media_insights" ADD CONSTRAINT "social_media_insights_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_collab_requests_brand_creator_pending" ON "collaboration_requests" USING btree ("brand_id","influencer_id");--> statement-breakpoint
CREATE INDEX "idx_collab_requests_influencer_status" ON "collaboration_requests" USING btree ("influencer_id","status");--> statement-breakpoint
CREATE INDEX "idx_collab_requests_brand_status" ON "collaboration_requests" USING btree ("brand_id","status");--> statement-breakpoint
CREATE INDEX "idx_creator_portfolio_creator_sort" ON "creator_portfolio_media" USING btree ("creator_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_creator_portfolio_creator_status" ON "creator_portfolio_media" USING btree ("creator_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_creator_portfolio_featured_unique" ON "creator_portfolio_media" USING btree ("creator_id") WHERE is_featured = true;--> statement-breakpoint
CREATE INDEX "idx_deal_activity_deal_id" ON "deal_activity" USING btree ("deal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_deal_approvals_deal_ver_party" ON "deal_approvals" USING btree ("deal_id","proposal_version","party");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_deal_participants_deal_user" ON "deal_participants" USING btree ("deal_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_deal_terms_versions_deal_ver" ON "deal_terms_versions" USING btree ("deal_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_deals_collab_request_id" ON "deals" USING btree ("collaboration_request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_deals_application_id" ON "deals" USING btree ("application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_deals_conversation_id" ON "deals" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "idx_deals_brand_id" ON "deals" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_deals_influencer_id" ON "deals" USING btree ("influencer_id");--> statement-breakpoint
CREATE INDEX "idx_deals_agreement_status" ON "deals" USING btree ("agreement_status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_oauth_states_state" ON "oauth_states" USING btree ("state");--> statement-breakpoint
CREATE INDEX "idx_oauth_states_user_id" ON "oauth_states" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_social_insights_account" ON "social_media_insights" USING btree ("social_account_id");--> statement-breakpoint
CREATE INDEX "idx_social_insights_metric" ON "social_media_insights" USING btree ("social_account_id","metric");--> statement-breakpoint
CREATE INDEX "idx_social_insights_content" ON "social_media_insights" USING btree ("social_account_id","external_content_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_social_accounts_platform_external" ON "social_accounts" USING btree ("platform","external_account_id");--> statement-breakpoint
CREATE INDEX "idx_social_accounts_user_id" ON "social_accounts" USING btree ("user_id");