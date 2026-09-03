import { defineConfig } from "drizzle-kit";

const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || "local").toLowerCase();
const isProductionLike = ["production", "qa", "uat"].includes(appEnv);

const databaseUrl = process.env.DATABASE_URL || "postgres://postgres:IloveIndia%401234@localhost:5432/influencer_hub";

if (isProductionLike && (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === "")) {
  throw new Error(`[FATAL] DATABASE_URL environment variable is missing for environment '${appEnv}'.`);
}

export default defineConfig({
  schema: "./src/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});