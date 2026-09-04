import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

const getHealthStatus = async () => {
  const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || "local").toLowerCase();
  let dbStatus = "unavailable";

  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = "connected";
  } catch (error) {
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

router.get("/healthz", async (_req, res) => {
  const health = await getHealthStatus();
  const statusCode = health.status === "ok" ? 200 : 503;
  res.status(statusCode).json(health);
});

router.get("/health", async (_req, res) => {
  const health = await getHealthStatus();
  const statusCode = health.status === "ok" ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
