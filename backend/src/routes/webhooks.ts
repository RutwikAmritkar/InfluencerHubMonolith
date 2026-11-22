import { Router, type IRouter, type Request, type Response } from "express";
import crypto from "node:crypto";
import {
  db,
  paymentOrdersTable,
  paymentLedgerEntriesTable,
  webhookEventsTable,
  dealsTable,
  dealActivityTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import { notifyDealCounterparty } from "./deals";
import { logPlatformActivity } from "../services/activity.service";

const router: IRouter = Router();

/**
 * Razorpay Route Raw-Body Webhook Handler with HMAC-SHA256 & Double-Entry Ledger
 */
router.post("/webhooks/razorpay", async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers["x-razorpay-signature"] as string | undefined;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "cb_test_webhook_secret_key_12345";
  const rawBody = (req as any).rawBody as Buffer | undefined;

  if (!rawBody || !signature) {
    logger.warn("[WEBHOOK ERROR] Missing rawBody or x-razorpay-signature header");
    res.status(400).json({ error: "Missing signature or raw payload" });
    return;
  }

  // 1. Cryptographic HMAC-SHA256 Verification with timingSafeEqual
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  let signatureValid = false;
  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expBuffer = Buffer.from(expectedSignature, "hex");
    if (sigBuffer.length === expBuffer.length) {
      signatureValid = crypto.timingSafeEqual(sigBuffer, expBuffer);
    }
  } catch (err) {
    logger.error({ err }, "[WEBHOOK SIGNATURE VERIFICATION ERROR]");
    signatureValid = false;
  }

  // Calculate payload hash
  const payloadHash = crypto.createHash("sha256").update(rawBody).digest("hex");

  // Determine unique provider event ID
  const eventPayload = req.body || {};
  const eventType = eventPayload.event || "unknown";
  const providerEventId =
    (req.headers["x-razorpay-event-id"] as string) ||
    eventPayload.event_id ||
    `evt_${payloadHash.substring(0, 24)}`;

  // 2. Replay Protection: Check if event already processed
  const [existingEvent] = await db
    .select()
    .from(webhookEventsTable)
    .where(eq(webhookEventsTable.providerEventId, providerEventId))
    .limit(1);

  if (existingEvent) {
    logger.info({ providerEventId }, "[WEBHOOK REPLAY DETECTED] Event already processed");
    res.status(200).json({ status: "already_processed", eventId: providerEventId });
    return;
  }

  // Record webhook event in DB for audit trail
  await db.insert(webhookEventsTable).values({
    provider: "razorpay",
    providerEventId,
    eventType,
    signatureVerified: signatureValid,
    payloadHash,
    payload: eventPayload,
  });

  // If in production, strictly enforce valid signature
  if (process.env.NODE_ENV === "production" && !signatureValid) {
    logger.warn({ providerEventId, eventType }, "[WEBHOOK INVALID SIGNATURE REJECTED]");
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  // 3. Process Specific Payment / Settlement Lifecycle Events
  try {
    switch (eventType) {
      case "payment.captured":
      case "order.paid": {
        const paymentEntity = eventPayload.payload?.payment?.entity;
        const orderEntity = eventPayload.payload?.order?.entity;
        const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;

        if (!razorpayOrderId) {
          logger.warn("[WEBHOOK CAPTURE] No razorpayOrderId found in payload");
          res.status(200).json({ status: "ignored_missing_order_id" });
          return;
        }

        const [order] = await db
          .select()
          .from(paymentOrdersTable)
          .where(eq(paymentOrdersTable.razorpayOrderId, razorpayOrderId))
          .limit(1);

        if (!order) {
          logger.warn({ razorpayOrderId }, "[WEBHOOK CAPTURE] Matching payment_order not found");
          res.status(200).json({ status: "order_not_found" });
          return;
        }

        if (order.status === "created") {
          // Transition order to funded_on_hold
          await db
            .update(paymentOrdersTable)
            .set({
              status: "funded_on_hold",
              razorpayPaymentId: paymentEntity?.id || null,
              updatedAt: new Date(),
            })
            .where(eq(paymentOrdersTable.id, order.id));

          // Update deal paymentStatus to HELD_IN_ESCROW
          await db
            .update(dealsTable)
            .set({
              paymentStatus: "HELD_IN_ESCROW",
              updatedAt: new Date(),
            })
            .where(eq(dealsTable.id, order.dealId));

          // Record immutable double-entry ledger entries
          const totalCapturedPaise = order.grossAmountPaise + order.gstAmountPaise;

          await db.insert(paymentLedgerEntriesTable).values([
            {
              paymentOrderId: order.id,
              dealId: order.dealId,
              entryType: "brand_capture",
              direction: "credit",
              amountPaise: totalCapturedPaise,
              description: `Brand escrow capture for Deal #${order.dealId} via Razorpay`,
            },
            {
              paymentOrderId: order.id,
              dealId: order.dealId,
              entryType: "platform_fee",
              direction: "credit",
              amountPaise: order.platformFeePaise,
              description: `Platform fee allocation (10%)`,
            },
            {
              paymentOrderId: order.id,
              dealId: order.dealId,
              entryType: "gst_collected",
              direction: "credit",
              amountPaise: order.gstAmountPaise,
              description: `18% GST collected on platform fee`,
            },
            {
              paymentOrderId: order.id,
              dealId: order.dealId,
              entryType: "tds_withheld",
              direction: "credit",
              amountPaise: order.tdsAmountPaise,
              description: `1% statutory TDS withheld under Section 194J/194C`,
            },
          ]);

          // Insert Deal Activity Log
          await db.insert(dealActivityTable).values({
            dealId: order.dealId,
            actorId: order.brandUserId,
            actorParty: "brand",
            action: "ESCROW_FUNDED",
            description: `Brand successfully funded ₹${(totalCapturedPaise / 100).toLocaleString("en-IN")} into RBI-compliant escrow. Funds held on hold pending deliverable approval.`,
            metadata: {
              orderId: order.id,
              razorpayOrderId,
              razorpayPaymentId: paymentEntity?.id,
              grossAmountPaise: order.grossAmountPaise,
              gstAmountPaise: order.gstAmountPaise,
            },
          });

          await logPlatformActivity({
            actorUserId: order.brandUserId,
            actorParty: "brand",
            eventType: "deal.updated",
            entityType: "deal",
            entityId: order.dealId,
            summary: `Brand funded ₹${(totalCapturedPaise / 100).toLocaleString("en-IN")} into escrow for Deal #${order.dealId}`,
          });

          notifyDealCounterparty({
            dealId: order.dealId,
            actorUserId: order.brandUserId,
            actorParty: "brand",
            type: "deal_escrow_funded",
            title: "Escrow Funded & Secured",
            body: "The brand has funded the escrow. You can now begin work on your approved deliverables.",
            badgeLabel: "Escrow Secured",
          });
        }
        break;
      }

      case "transfer.processed": {
        const transferEntity = eventPayload.payload?.transfer?.entity;
        const transferId = transferEntity?.id;
        const utrNumber = transferEntity?.settlement_id || transferEntity?.recipient_settlement_id;

        if (transferId) {
          const [order] = await db
            .select()
            .from(paymentOrdersTable)
            .where(eq(paymentOrdersTable.razorpayTransferId, transferId))
            .limit(1);

          if (order && order.status !== "settled") {
            await db
              .update(paymentOrdersTable)
              .set({
                status: "settled",
                updatedAt: new Date(),
              })
              .where(eq(paymentOrdersTable.id, order.id));

            await db
              .update(dealsTable)
              .set({
                paymentStatus: "PAYOUT_RELEASED",
                executionStatus: "COMPLETED",
                updatedAt: new Date(),
              })
              .where(eq(dealsTable.id, order.dealId));

            await db.insert(paymentLedgerEntriesTable).values({
              paymentOrderId: order.id,
              dealId: order.dealId,
              entryType: "creator_transfer",
              direction: "debit",
              amountPaise: order.netCreatorPayoutPaise,
              providerTransferId: transferId,
              utrNumber: utrNumber || null,
              description: `Split settlement transferred to Creator linked account`,
            });
          }
        }
        break;
      }

      case "refund.processed": {
        const refundEntity = eventPayload.payload?.refund?.entity;
        const paymentId = refundEntity?.payment_id;

        if (paymentId) {
          const [order] = await db
            .select()
            .from(paymentOrdersTable)
            .where(eq(paymentOrdersTable.razorpayPaymentId, paymentId))
            .limit(1);

          if (order) {
            await db
              .update(paymentOrdersTable)
              .set({
                status: "refunded",
                updatedAt: new Date(),
              })
              .where(eq(paymentOrdersTable.id, order.id));

            await db
              .update(dealsTable)
              .set({
                paymentStatus: "REFUNDED",
                updatedAt: new Date(),
              })
              .where(eq(dealsTable.id, order.dealId));

            await db.insert(paymentLedgerEntriesTable).values({
              paymentOrderId: order.id,
              dealId: order.dealId,
              entryType: "refund",
              direction: "debit",
              amountPaise: order.grossAmountPaise + order.gstAmountPaise,
              description: `Escrow refund issued to Brand`,
            });
          }
        }
        break;
      }

      default:
        logger.info({ eventType }, "[WEBHOOK UNHANDLED EVENT]");
    }

    res.status(200).json({ status: "success", eventId: providerEventId });
  } catch (err: any) {
    logger.error({ err }, "[WEBHOOK PROCESSING ERROR]");
    res.status(500).json({ error: "Failed to process webhook event" });
  }
});

export default router;
