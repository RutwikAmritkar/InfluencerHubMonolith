import crypto from "crypto";

interface SessionData {
  userId: number;
  expires: Date;
}

const sessions = new Map<string, SessionData>();
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createSession(userId: number): string {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {
    userId,
    expires: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export function getSession(token: string): SessionData | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expires < new Date()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}

export function hashPassword(password: string): string {
  const secret = process.env.SESSION_SECRET ?? "influencer-hub-secret";
  return crypto.createHmac("sha256", secret).update(password).digest("hex");
}
