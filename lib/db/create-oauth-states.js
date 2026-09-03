import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  connectionString: "postgres://postgres:IloveIndia%401234@localhost:5432/influencer_hub",
});

async function main() {
  const sql = `
    CREATE TABLE IF NOT EXISTS oauth_states (
      id SERIAL PRIMARY KEY,
      state TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states (state);
    CREATE INDEX IF NOT EXISTS idx_oauth_states_user_id ON oauth_states (user_id);
  `;
  await pool.query(sql);
  console.log("OAUTH_STATES TABLE AND INDEXES CREATED SUCCESSFULLY");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
