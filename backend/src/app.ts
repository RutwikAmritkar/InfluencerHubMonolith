import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const app: Express = express();

function resolveStaticPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "frontend", "dist", "public"),
    path.join(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "../frontend/dist/public"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "index.html"))) {
      return c;
    }
  }
  return null;
}

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
  })
);

// Production Environment Security & CORS
const isProd = process.env.NODE_ENV === "production";
const allowedOrigins = [
  process.env.APP_URL,
  process.env.FRONTEND_URL,
  "https://creatorsbrand.in",
  "https://www.creatorsbrand.in",
  "http://localhost:5000",
  "http://localhost:5001",
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || !isProd) return callback(null, true);
      const isAllowed = allowedOrigins.some((o) => o && origin.startsWith(o));
      if (isAllowed) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);

// Security & Audit Headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  if (isProd) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const getHealthStatus = async () => {
  const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || "local").toLowerCase();
  let dbStatus = "unavailable";

  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = "connected";
  } catch (error) {
    logger.error({ error }, "[DB HEALTH CHECK ERROR]");
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

// Mount Core API Router
app.use("/api", router);

// Production Static Serving & SPA Fallback (Single Origin Hosting)
const staticDir = resolveStaticPath();
if (staticDir) {
  app.use(express.static(staticDir));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/health") ||
      req.path.startsWith("/healthz") ||
      req.path.startsWith("/uploads")
    ) {
      return next();
    }
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
