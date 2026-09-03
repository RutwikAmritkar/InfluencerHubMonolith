CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"influencer_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text,
	"country" text DEFAULT 'United States',
	"language" text DEFAULT 'en',
	"onboarding_step" text,
	"onboarding_status" text DEFAULT 'in_progress',
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"industry" text DEFAULT 'Technology' NOT NULL,
	"country" text DEFAULT 'US' NOT NULL,
	"city" text,
	"description" text,
	"logo_url" text DEFAULT '' NOT NULL,
	"website" text,
	"categories" text[] DEFAULT '{}' NOT NULL,
	"target_audience" jsonb,
	"campaign_goals" text[] DEFAULT '{}' NOT NULL,
	"campaign_preferences" jsonb,
	"social_accounts" jsonb DEFAULT '[]'::jsonb,
	"onboarding_step" text DEFAULT 'B1',
	"onboarding_status" text DEFAULT 'pending',
	"profile_completion" integer DEFAULT 70 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"budget" integer NOT NULL,
	"platform" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"deliverables" text,
	"target_audience" text,
	"timeline" text,
	"deadline" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user1_id" integer NOT NULL,
	"user2_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"platform" text NOT NULL,
	"external_account_id" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text,
	"profile_url" text,
	"avatar_url" text,
	"verification_status" text DEFAULT 'CONNECTED' NOT NULL,
	"is_official_oauth" boolean DEFAULT true NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"social_account_id" integer NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text,
	"token_iv" text NOT NULL,
	"token_auth_tag" text NOT NULL,
	"expires_at" timestamp with time zone,
	"scopes" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_metric_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"social_account_id" integer NOT NULL,
	"platform" text NOT NULL,
	"snapshot_date" timestamp with time zone DEFAULT now() NOT NULL,
	"followers" integer DEFAULT 0 NOT NULL,
	"following" integer,
	"total_content" integer DEFAULT 0 NOT NULL,
	"total_views" text DEFAULT '0' NOT NULL,
	"total_likes" text DEFAULT '0' NOT NULL,
	"avg_views" integer DEFAULT 0 NOT NULL,
	"avg_likes" integer DEFAULT 0 NOT NULL,
	"avg_comments" integer DEFAULT 0 NOT NULL,
	"engagement_rate" text DEFAULT '0.00' NOT NULL,
	"follower_growth_24h" integer DEFAULT 0,
	"follower_growth_7d" integer DEFAULT 0,
	"follower_growth_30d" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"social_account_id" integer NOT NULL,
	"platform" text NOT NULL,
	"external_content_id" text NOT NULL,
	"content_type" text NOT NULL,
	"title" text,
	"caption" text,
	"permalink" text,
	"thumbnail_url" text,
	"published_at" timestamp with time zone,
	"views" integer DEFAULT 0 NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"shares" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "influencers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"bio" text,
	"category" text DEFAULT 'Lifestyle' NOT NULL,
	"country" text DEFAULT 'US' NOT NULL,
	"followers" integer DEFAULT 0 NOT NULL,
	"engagement_rate" real DEFAULT 0 NOT NULL,
	"avg_views" integer DEFAULT 0 NOT NULL,
	"collaboration_cost" integer DEFAULT 0 NOT NULL,
	"platforms" text[] DEFAULT '{}' NOT NULL,
	"languages" text[] DEFAULT '{}' NOT NULL,
	"avatar_url" text DEFAULT '' NOT NULL,
	"cover_url" text,
	"profile_completion" integer DEFAULT 70 NOT NULL,
	"monthly_earnings" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"availability" text DEFAULT 'available',
	"portfolio" text[] DEFAULT '{}' NOT NULL,
	"social_accounts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"creator_type" text DEFAULT 'Micro Creator',
	"niches" text[] DEFAULT '{}' NOT NULL,
	"audience_data" jsonb,
	"collaboration_preferences" jsonb,
	"goals" text[] DEFAULT '{}' NOT NULL,
	"onboarding_step" text DEFAULT 'C1',
	"onboarding_status" text DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_tokens" ADD CONSTRAINT "social_tokens_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_metric_snapshots" ADD CONSTRAINT "social_metric_snapshots_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_content" ADD CONSTRAINT "social_content_social_account_id_social_accounts_id_fk" FOREIGN KEY ("social_account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;