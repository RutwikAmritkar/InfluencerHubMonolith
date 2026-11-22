import {
  pgTable,
  serial,
  timestamp,
  integer,
  bigint,
  text,
  boolean,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { dealsTable, dealTermsVersionsTable } from "./deals";

/**
 * 1. CREATOR PAYOUT ACCOUNTS
 * Holds linked bank accounts / UPI VPAs with mandatory 24-hour security lock-in
 * after edits to prevent account takeover and unauthorized fund diversion.
 */
export const creatorPayoutAccountsTable = pgTable(
  "creator_payout_accounts",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    razorpayAccountId: text("razorpay_account_id"), // Linked account ID e.g., 'acc_xxxx'
    accountType: text("account_type").notNull().default("bank_account"), // 'bank_account' | 'vpa'
    accountNumberMasked: text("account_number_masked"), // e.g. "••••••••5678"
    accountNumberEncrypted: text("account_number_encrypted"), // Encrypted/hashed for verification
    ifscCode: text("ifsc_code"),
    bankName: text("bank_name"),
    vpaAddress: text("vpa_address"), // UPI VPA e.g. "creator@okaxis"
    beneficiaryName: text("beneficiary_name"),
    panNumberMasked: text("pan_number_masked"), // e.g. "ABCDE••••F"
    kycStatus: text("kyc_status").notNull().default("unverified"), // 'unverified' | 'pending' | 'verified' | 'rejected'
    kycRejectionReason: text("kyc_rejection_reason"),
    beneficiaryLockedUntil: timestamp("beneficiary_locked_until", { withTimezone: true }), // 24h freeze
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_creator_payout_accounts_user_id").on(table.userId),
    index("idx_creator_payout_accounts_kyc_status").on(table.kycStatus),
  ]
);

export type CreatorPayoutAccount = typeof creatorPayoutAccountsTable.$inferSelect;
export type InsertCreatorPayoutAccount = typeof creatorPayoutAccountsTable.$inferInsert;

/**
 * 2. PAYMENT ORDERS
 * Server-computed order capturing gross, fee, GST, TDS, and net creator payout.
 * Zero client-side trust with deterministic idempotency keys and 72h auto-release SLA.
 */
export const paymentOrdersTable = pgTable(
  "payment_orders",
  {
    id: serial("id").primaryKey(),
    dealId: integer("deal_id")
      .notNull()
      .references(() => dealsTable.id, { onDelete: "cascade" }),
    termsVersionId: integer("terms_version_id")
      .notNull()
      .references(() => dealTermsVersionsTable.id, { onDelete: "cascade" }),
    brandUserId: text("brand_user_id")
      .notNull()
      .references(() => user.id),
    creatorUserId: text("creator_user_id")
      .notNull()
      .references(() => user.id),
    razorpayOrderId: text("razorpay_order_id").notNull().unique(),
    grossAmountPaise: bigint("gross_amount_paise", { mode: "number" }).notNull(),
    platformFeePaise: bigint("platform_fee_paise", { mode: "number" }).notNull(),
    gstAmountPaise: bigint("gst_amount_paise", { mode: "number" }).notNull(),
    tdsAmountPaise: bigint("tds_amount_paise", { mode: "number" }).notNull(),
    netCreatorPayoutPaise: bigint("net_creator_payout_paise", { mode: "number" }).notNull(),
    status: text("status").notNull().default("created"), // 'created' | 'funded_on_hold' | 'release_queued' | 'settled' | 'disputed' | 'refunded' | 'failed'
    autoReleaseAt: timestamp("auto_release_at", { withTimezone: true }), // 72-hour SLA upon submission
    idempotencyKey: text("idempotency_key").notNull().unique(),
    razorpayPaymentId: text("razorpay_payment_id"),
    razorpayTransferId: text("razorpay_transfer_id"),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_payment_orders_order_id").on(table.razorpayOrderId),
    uniqueIndex("idx_payment_orders_idempotency").on(table.idempotencyKey),
    index("idx_payment_orders_deal_id").on(table.dealId),
    index("idx_payment_orders_status").on(table.status),
    index("idx_payment_orders_auto_release").on(table.autoReleaseAt),
  ]
);

export type PaymentOrder = typeof paymentOrdersTable.$inferSelect;
export type InsertPaymentOrder = typeof paymentOrdersTable.$inferInsert;

/**
 * 3. PAYMENT LEDGER ENTRIES
 * Immutable double-entry financial ledger for all captures, fees, GST, TDS,
 * transfers, and refunds.
 */
export const paymentLedgerEntriesTable = pgTable(
  "payment_ledger_entries",
  {
    id: serial("id").primaryKey(),
    paymentOrderId: integer("payment_order_id")
      .notNull()
      .references(() => paymentOrdersTable.id, { onDelete: "cascade" }),
    dealId: integer("deal_id")
      .notNull()
      .references(() => dealsTable.id, { onDelete: "cascade" }),
    entryType: text("entry_type").notNull(), // 'brand_capture' | 'platform_fee' | 'gst_collected' | 'tds_withheld' | 'creator_transfer' | 'refund'
    direction: text("direction").notNull(), // 'credit' | 'debit'
    amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
    providerTransferId: text("provider_transfer_id").unique(), // unique nullable
    utrNumber: text("utr_number"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_payment_ledger_order_id").on(table.paymentOrderId),
    index("idx_payment_ledger_deal_id").on(table.dealId),
    index("idx_payment_ledger_entry_type").on(table.entryType),
  ]
);

export type PaymentLedgerEntry = typeof paymentLedgerEntriesTable.$inferSelect;
export type InsertPaymentLedgerEntry = typeof paymentLedgerEntriesTable.$inferInsert;

/**
 * 4. WEBHOOK EVENTS
 * Cryptographic replay protection and audit logging for inbound payment gateway events.
 */
export const webhookEventsTable = pgTable(
  "webhook_events",
  {
    id: serial("id").primaryKey(),
    provider: text("provider").notNull().default("razorpay"),
    providerEventId: text("provider_event_id").notNull().unique(),
    eventType: text("event_type").notNull(),
    signatureVerified: boolean("signature_verified").notNull().default(false),
    payloadHash: text("payload_hash").notNull(),
    payload: jsonb("payload"),
    processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_webhook_events_provider_event").on(table.provider, table.providerEventId),
  ]
);

export type WebhookEvent = typeof webhookEventsTable.$inferSelect;
export type InsertWebhookEvent = typeof webhookEventsTable.$inferInsert;
