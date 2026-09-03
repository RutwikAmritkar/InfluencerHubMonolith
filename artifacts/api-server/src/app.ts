import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const getHealthStatus = async () => {
  const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || "local").toLowerCase();
  let dbStatus = "unavailable";

  try {
    await db.execute(sql`SELECT 1`);
    await db.execute(sql`ALTER TABLE "influencers" ADD COLUMN IF NOT EXISTS "city" text;`);
    await db.execute(sql`ALTER TABLE "influencers" ADD COLUMN IF NOT EXISTS "state" text;`);
    await db.execute(sql`ALTER TABLE "influencers" ADD COLUMN IF NOT EXISTS "country" text DEFAULT 'India';`);
    await db.execute(sql`ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "city" text;`);
    await db.execute(sql`ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "monthly_budget" integer DEFAULT 50000;`);
    await db.execute(sql`ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "country" text DEFAULT 'India';`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "country" text DEFAULT 'India';`);
    await db.execute(sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'en';`);
    await db.execute(sql`
      UPDATE "influencers"
      SET "audience_data" = jsonb_set(
        "audience_data",
        '{age}',
        CASE
          WHEN "audience_data"->>'age' LIKE '%18 - 24%' THEN '"Gen Z"'
          WHEN "audience_data"->>'age' LIKE '%25 - 34%' THEN '"Millennials"'
          WHEN "audience_data"->>'age' LIKE '%35 - 44%' THEN '"Adults"'
          WHEN "audience_data"->>'age' LIKE '%45+%' THEN '"Mature"'
          ELSE "audience_data"->'age'
        END
      )
      WHERE "audience_data" IS NOT NULL AND "audience_data"->>'age' IS NOT NULL;
    `);
    dbStatus = "connected";
  } catch (error) {
    console.error("[DB HEALTH CHECK ERROR]", error);
    dbStatus = "unavailable";
  }

  const isHealthy = dbStatus === "connected";

  return {
    status: isHealthy ? "ok" : "error",
    api: "healthy",
    database: dbStatus,
    environment: appEnv,
  };
};

app.get("/health", async (_req, res) => {
  const health = await getHealthStatus();
  const statusCode = health.status === "ok" ? 200 : 503;
  res.status(statusCode).json(health);
});

app.get("/healthz", async (_req, res) => {
  const health = await getHealthStatus();
  const statusCode = health.status === "ok" ? 200 : 503;
  res.status(statusCode).json(health);
});

app.use("/api", router);

export default app;
