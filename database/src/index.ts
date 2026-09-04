import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || "local").toLowerCase();
const isProductionLike = ["production", "qa", "uat"].includes(appEnv);

const databaseUrl = process.env.DATABASE_URL;

if (isProductionLike && (!databaseUrl || databaseUrl.trim() === "")) {
  throw new Error(`[FATAL] DATABASE_URL environment variable is missing for environment '${appEnv}'. Application failing fast.`);
}

const connectionString = databaseUrl || "postgres://postgres:IloveIndia%401234@localhost:5432/influencer_hub";

// Safe logging: log ONLY environment name, NEVER credentials or connection strings
console.log(`[DATABASE] Connected to environment: ${appEnv.toUpperCase()}`);

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
export { pg, Pool };

export * from "./schema";
