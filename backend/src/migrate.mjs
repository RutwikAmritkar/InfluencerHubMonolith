import pg from "pg";

const client = new pg.Client({
  connectionString: "postgres://postgres:IloveIndia%401234@localhost:5432/influencer_hub",
});

async function migrate() {
  await client.connect();
  console.log("Connected to PostgreSQL database for migration...");

  await client.query(`
    ALTER TABLE "influencers" ADD COLUMN IF NOT EXISTS "city" text;
    ALTER TABLE "influencers" ADD COLUMN IF NOT EXISTS "country" text DEFAULT 'India';
    ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "city" text;
    ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "monthly_budget" integer DEFAULT 50000;
    ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "country" text DEFAULT 'India';
    ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "country" text DEFAULT 'India';
    ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'en';
  `);

  console.log("Successfully migrated all PostgreSQL database table columns!");
  await client.end();
}

migrate().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
