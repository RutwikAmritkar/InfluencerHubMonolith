-- CreatorsBrand Super Admin & Platform Control Center (Phase 2 Additive Migration)
-- Strictly additive: Zero alterations, drops, or modifications to existing tables or columns.

CREATE TABLE IF NOT EXISTS "admin_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_system_role" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_roles_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "admin_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"module" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_permissions_slug_unique" UNIQUE("slug")
);

CREATE TABLE IF NOT EXISTS "admin_role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_role_permissions_role_id_admin_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "admin_roles"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "admin_role_permissions_permission_id_admin_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "admin_permissions"("id") ON DELETE cascade ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"assigned_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "admin_users_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "admin_users_role_id_admin_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "admin_roles"("id") ON DELETE restrict ON UPDATE no action,
	CONSTRAINT "admin_users_assigned_by_user_id_user_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" text NOT NULL,
	"action" text NOT NULL,
	"target_entity_type" text NOT NULL,
	"target_entity_id" text NOT NULL,
	"reason" text NOT NULL,
	"before_state" jsonb,
	"after_state" jsonb,
	"ip_address" text,
	"user_agent" text,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_audit_logs_admin_user_id_user_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "user"("id") ON DELETE restrict ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "platform_activity_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_user_id" text,
	"actor_party" text,
	"event_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"summary" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_activity_events_actor_user_id_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "moderation_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_user_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution_notes" text,
	"assigned_admin_user_id" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "moderation_reports_reporter_user_id_user_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "moderation_reports_assigned_admin_user_id_user_id_fk" FOREIGN KEY ("assigned_admin_user_id") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action
);

CREATE TABLE IF NOT EXISTS "platform_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"value_type" text DEFAULT 'string' NOT NULL,
	"description" text,
	"is_encrypted" boolean DEFAULT false NOT NULL,
	"updated_by_user_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_settings_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("id") ON DELETE set null ON UPDATE no action
);

-- Unique & Performance Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "idx_admin_role_perm_unique" ON "admin_role_permissions" ("role_id", "permission_id");
CREATE INDEX IF NOT EXISTS "idx_admin_role_perm_role_id" ON "admin_role_permissions" ("role_id");
CREATE INDEX IF NOT EXISTS "idx_admin_role_perm_perm_id" ON "admin_role_permissions" ("permission_id");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_admin_users_user_id" ON "admin_users" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_admin_users_role_id" ON "admin_users" ("role_id");
CREATE INDEX IF NOT EXISTS "idx_admin_users_is_active" ON "admin_users" ("is_active");

CREATE INDEX IF NOT EXISTS "idx_admin_audit_admin_id" ON "admin_audit_logs" ("admin_user_id");
CREATE INDEX IF NOT EXISTS "idx_admin_audit_action" ON "admin_audit_logs" ("action");
CREATE INDEX IF NOT EXISTS "idx_admin_audit_target" ON "admin_audit_logs" ("target_entity_type", "target_entity_id");
CREATE INDEX IF NOT EXISTS "idx_admin_audit_created_at" ON "admin_audit_logs" ("created_at");

CREATE INDEX IF NOT EXISTS "idx_activity_events_actor" ON "platform_activity_events" ("actor_user_id");
CREATE INDEX IF NOT EXISTS "idx_activity_events_type" ON "platform_activity_events" ("event_type");
CREATE INDEX IF NOT EXISTS "idx_activity_events_entity" ON "platform_activity_events" ("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "idx_activity_events_created_at" ON "platform_activity_events" ("created_at");

CREATE INDEX IF NOT EXISTS "idx_reports_status" ON "moderation_reports" ("status");
CREATE INDEX IF NOT EXISTS "idx_reports_target" ON "moderation_reports" ("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "idx_reports_reporter" ON "moderation_reports" ("reporter_user_id");
CREATE INDEX IF NOT EXISTS "idx_reports_assigned_admin" ON "moderation_reports" ("assigned_admin_user_id");

CREATE INDEX IF NOT EXISTS "idx_platform_settings_updated_at" ON "platform_settings" ("updated_at");

CREATE INDEX IF NOT EXISTS "idx_user_created_at" ON "user" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_user_onboarding_status" ON "user" ("onboarding_status");
