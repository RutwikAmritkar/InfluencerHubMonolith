import { db, notificationsTable, user as userTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendEmail } from "./email.service";

export interface NotificationMetadata {
  dealId?: string | number;
  actionUrl?: string;
  badgeLabel?: string;
}

export async function sendNotification(
  userId: string | number,
  type: string,
  title: string,
  body: string,
  metadata?: NotificationMetadata
) {
  const textUserId = String(userId).trim();
  if (!textUserId || textUserId === "0") return;

  // 1. In-App Notification Record
  try {
    await db.insert(notificationsTable).values({
      userId: textUserId,
      type,
      title,
      body,
      isRead: false,
    });
  } catch (err) {
    console.error("[NOTIFICATION IN-APP ERROR]", err);
  }

  // 2. Transactional Email Dispatch for Critical Commercial Events
  try {
    const [recipient] = await db
      .select({ email: userTable.email, name: userTable.name })
      .from(userTable)
      .where(eq(userTable.id, textUserId))
      .limit(1);

    if (recipient?.email) {
      const appUrl = process.env.APP_URL || process.env.FRONTEND_URL || "http://localhost:5000";
      let actionLink = metadata?.actionUrl || `${appUrl}/dashboard`;
      let actionLabel = "View in CreatorsBrand Workspace";

      if (metadata?.dealId) {
        actionLink = `${appUrl}/deals/${metadata.dealId}`;
        actionLabel = "Open Commercial Deal Room";
      } else if (type.includes("payment") || type.includes("settlement")) {
        actionLink = `${appUrl}/payments`;
        actionLabel = "Open Payout Ledger";
      } else if (type.includes("application")) {
        actionLink = `${appUrl}/applications`;
        actionLabel = "Review Application";
      }

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 32px 16px; background-color: #FAF9F6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0A0A0A; }
    .card { max-width: 540px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E4DF; border-radius: 16px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; border-bottom: 1px solid #E5E4DF; padding-bottom: 16px; }
    .brand { font-size: 16px; font-weight: 700; color: #0A0A0A; letter-spacing: -0.02em; }
    .badge { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: #EFF6FF; color: #1D4ED8; padding: 4px 10px; border-radius: 9999px; }
    .title { font-size: 20px; font-weight: 700; color: #0A0A0A; margin: 0 0 12px 0; }
    .body-text { font-size: 14px; line-height: 1.6; color: #52525B; margin: 0 0 24px 0; }
    .cta-box { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #0A0A0A; color: #FFFFFF !important; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 10px; }
    .footer { font-size: 11px; color: #71717A; border-top: 1px solid #E5E4DF; padding-top: 16px; margin-top: 24px; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">CreatorsBrand</div>
      <div class="badge">${metadata?.badgeLabel || "Commercial Alert"}</div>
    </div>
    <h2 class="title">${title}</h2>
    <p class="body-text">Hi ${recipient.name || "there"},<br><br>${body}</p>
    <div class="cta-box">
      <a href="${actionLink}" class="btn">${actionLabel} &rarr;</a>
    </div>
    <div class="footer">
      This is a secure transactional alert from CreatorsBrand Commercial Engine.<br>
      Direct dual sign-off &amp; milestone protection enforced on all collaborations.
    </div>
  </div>
</body>
</html>`;

      const emailText = `${title}\n\nHi ${recipient.name || "there"},\n\n${body}\n\nAccess link: ${actionLink}\n\nCreatorsBrand Commercial Engine`;

      // Dispatch asynchronously without blocking API response
      sendEmail({
        to: recipient.email,
        subject: `[CreatorsBrand] ${title}`,
        html: emailHtml,
        text: emailText,
      }).catch((emailErr) => {
        console.error("[NOTIFICATION EMAIL DISPATCH ERROR]", emailErr);
      });
    }
  } catch (lookupErr) {
    console.error("[NOTIFICATION RECIPIENT LOOKUP ERROR]", lookupErr);
  }
}
