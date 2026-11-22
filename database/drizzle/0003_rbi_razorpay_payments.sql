-- CreatorsBrand RBI-Compliant Razorpay Route & Split-Settlement Architecture (Additive Migration)
-- Strictly additive: Zero alterations, drops, or modifications to existing tables or columns.

CREATE TABLE IF NOT EXISTS "creator_payout_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"razorpay_account_id" text,
	"account_type" text DEFAULT 'bank_account' NOT NULL,
	"account_number_masked" text,
	"account_number_encrypted" text,
	"ifsc_code" text,
	"bank_name" text,
	"vpa_address" text,
	"beneficiary_name" text,
	"pan_number_masked" text,
	"kyc_status" text DEFAULT 'unverified' NOT NULL,
	"kyc_rejection_reason" text,
	"beneficiary_locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "creator_payout_accounts_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "creator_payout_accounts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "idx_creator_payout_accounts_kyc_status" ON "creator_payout_accounts" ("kyc_status");

CREATE TABLE IF NOT EXISTS "payment_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" integer NOT NULL,
	"terms_version_id" integer NOT NULL,
	"brand_user_id" text NOT NULL,
	"creator_user_id" text NOT NULL,
	"razorpay_order_id" text NOT NULL,
	"gross_amount_paise" bigint NOT NULL,
	"platform_fee_paise" bigint NOT NULL,
	"gst_amount_paise" bigint NOT NULL,
	"tds_amount_paise" bigint NOT NULL,
	"net_creator_payout_paise" bigint NOT NULL,
	"status" text DEFAULT 'created' NOT NULL,
	"auto_release_at" timestamp with time zone,
	"idempotency_key" text NOT NULL,
	"razorpay_payment_id" text,
	"razorpay_transfer_id" text,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_orders_razorpay_order_id_unique" UNIQUE("razorpay_order_id"),
	CONSTRAINT "payment_orders_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "payment_orders_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "payment_orders_terms_version_id_deal_terms_versions_id_fk" FOREIGN KEY ("terms_version_id") REFERENCES "deal_terms_versions"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "payment_orders_brand_user_id_user_id_fk" FOREIGN KEY ("brand_user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action,
	CONSTRAINT "payment_orders_creator_user_id_user_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "idx_payment_orders_deal_id" ON "payment_orders" ("deal_id");
CREATE INDEX IF NOT EXISTS "idx_payment_orders_status" ON "payment_orders" ("status");
CREATE INDEX IF NOT EXISTS "idx_payment_orders_auto_release" ON "payment_orders" ("auto_release_at");

CREATE TABLE IF NOT EXISTS "payment_ledger_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_order_id" integer NOT NULL,
	"deal_id" integer NOT NULL,
	"entry_type" text NOT NULL,
	"direction" text NOT NULL,
	"amount_paise" bigint NOT NULL,
	"provider_transfer_id" text,
	"utr_number" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_ledger_entries_provider_transfer_id_unique" UNIQUE("provider_transfer_id"),
	CONSTRAINT "payment_ledger_entries_payment_order_id_payment_orders_id_fk" FOREIGN KEY ("payment_order_id") REFERENCES "payment_orders"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "payment_ledger_entries_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE cascade ON UPDATE no action
);

CREATE INDEX IF NOT EXISTS "idx_payment_ledger_order_id" ON "payment_ledger_entries" ("payment_order_id");
CREATE INDEX IF NOT EXISTS "idx_payment_ledger_deal_id" ON "payment_ledger_entries" ("deal_id");
CREATE INDEX IF NOT EXISTS "idx_payment_ledger_entry_type" ON "payment_ledger_entries" ("entry_type");

CREATE TABLE IF NOT EXISTS "webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'razorpay' NOT NULL,
	"provider_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"signature_verified" boolean DEFAULT false NOT NULL,
	"payload_hash" text NOT NULL,
	"payload" jsonb,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_provider_event_unique" UNIQUE("provider", "provider_event_id")
);
