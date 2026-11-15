import { logger } from "../lib/logger.js";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// In-memory store for development test inspection
let devLatestResetLink: { email: string; url: string; token: string; timestamp: number } | null =
  null;
let devLatestVerificationLink: {
  email: string;
  url: string;
  token: string;
  timestamp: number;
} | null = null;

export function getLatestDevResetLink() {
  return devLatestResetLink;
}

export function getLatestDevVerificationLink() {
  return devLatestVerificationLink;
}

export function clearDevEmailStore() {
  devLatestResetLink = null;
  devLatestVerificationLink = null;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const fromAddress = process.env.EMAIL_FROM || "CreatorsBrand <notifications@creatorsbrand.in>";

  // 1. Resend API Integration (Preferred cloud transactional provider)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (res.ok) {
        logger.info({ to: options.to }, "[EMAIL SERVICE] Dispatched via Resend");
        return true;
      } else {
        const errJson = await res.json().catch(() => ({}));
        logger.error({ error: errJson, to: options.to }, "[EMAIL SERVICE RESEND ERROR]");
      }
    } catch (error) {
      logger.error({ error, to: options.to }, "[EMAIL SERVICE RESEND EXCEPTION]");
    }
  }

  // 2. SMTP Transport Integration
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const nodemailerModule = await import("nodemailer" as any).catch(() => null);
      if (nodemailerModule && nodemailerModule.createTransport) {
        const transporter = nodemailerModule.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });

        logger.info({ to: options.to }, "[EMAIL SERVICE] Dispatched via SMTP");
        return true;
      }
    } catch (error) {
      logger.error(
        { error, to: options.to },
        "[EMAIL SERVICE ERROR] Failed to send email via SMTP"
      );
    }
  }

  // Development Fallback Logging (non-production only)
  if (process.env.NODE_ENV !== "production") {
    logger.debug(
      { to: options.to, subject: options.subject },
      "[EMAIL SERVICE] Dev fallback logged"
    );
  }
  return true;
}

export async function sendPasswordResetEmail({
  email,
  url,
  token,
}: {
  email: string;
  url: string;
  token: string;
}): Promise<void> {
  const clientBase = process.env.CLIENT_URL || "http://localhost:5000";
  const resetUrl = `${clientBase}/reset-password?token=${encodeURIComponent(token)}`;

  // Save to dev store for automated test inspection
  devLatestResetLink = { email, url: resetUrl, token, timestamp: Date.now() };

  const subject = "Reset your CreatorsBrand password";
  const text = `A password reset was requested for your CreatorsBrand account. Click the following link to reset your password: ${resetUrl}\n\nThis link is valid for a limited time. If you did not request a password reset, please ignore this email.`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d111d; color: #ffffff; margin: 0; padding: 40px 20px; }
          .container { max-width: 560px; margin: 0 auto; background: #141a2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .logo { font-size: 24px; font-weight: 800; color: #ffffff; margin-bottom: 24px; text-align: center; }
          .logo-accent { color: #3b82f6; }
          h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 16px; }
          p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); }
          .footer { font-size: 12px; color: #64748b; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px; text-align: center; }
          .url-fallback { word-break: break-all; color: #3b82f6; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Creators<span class="logo-accent">Brand</span></div>
          <h1>Reset your password</h1>
          <p>We received a request to reset the password for your CreatorsBrand account (<strong>${email}</strong>). Click the button below to set up a new password:</p>
          <div class="btn-container">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p class="url-fallback">${resetUrl}</p>
          <p>This password reset link is valid for a limited time and can only be used once. If you did not request a password reset, you can safely ignore this email.</p>
          <div class="footer">
            &copy; CreatorsBrand. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({ to: email, subject, text, html });
}

export async function sendVerificationEmailService({
  email,
  url,
  token,
}: {
  email: string;
  url: string;
  token: string;
}): Promise<void> {
  devLatestVerificationLink = { email, url, token, timestamp: Date.now() };

  const verifyUrl = url.includes("token=") ? url : `${url}?token=${encodeURIComponent(token)}`;

  const subject = "Verify your CreatorsBrand email address";
  const text = `Welcome to CreatorsBrand! Please verify your email address by clicking the link below: ${verifyUrl}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0d111d; color: #ffffff; margin: 0; padding: 40px 20px; }
          .container { max-width: 560px; margin: 0 auto; background: #141a2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; }
          .logo { font-size: 24px; font-weight: 800; color: #ffffff; margin-bottom: 24px; text-align: center; }
          .logo-accent { color: #3b82f6; }
          h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 16px; }
          p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 9999px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">Creators<span class="logo-accent">Brand</span></div>
          <h1>Verify your email</h1>
          <p>Please click the button below to verify your email address and complete your signup:</p>
          <div class="btn-container">
            <a href="${verifyUrl}" class="btn" target="_blank">Verify Email</a>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({ to: email, subject, text, html });
}
