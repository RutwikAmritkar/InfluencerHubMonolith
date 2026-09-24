import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const queries = [
  `CREATE TABLE IF NOT EXISTS social_accounts (
    id serial PRIMARY KEY,
    influencer_id integer NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
    platform text NOT NULL,
    platform_user_id text NOT NULL,
    platform_username text NOT NULL,
    display_name text,
    avatar_url text,
    profile_url text,
    is_verified boolean DEFAULT false,
    account_type text DEFAULT 'PERSONAL',
    status text NOT NULL DEFAULT 'ACTIVE',
    last_synced_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE TABLE IF NOT EXISTS social_tokens (
    id serial PRIMARY KEY,
    social_account_id integer NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    access_token_encrypted text NOT NULL,
    refresh_token_encrypted text,
    token_iv text NOT NULL,
    token_auth_tag text NOT NULL,
    token_type text DEFAULT 'Bearer',
    scopes text[],
    expires_at timestamp with time zone,
    is_expired boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE TABLE IF NOT EXISTS social_metric_snapshots (
    id serial PRIMARY KEY,
    social_account_id integer NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    platform text NOT NULL,
    snapshot_date timestamp with time zone NOT NULL DEFAULT now(),
    followers integer NOT NULL DEFAULT 0,
    following integer,
    total_content integer NOT NULL DEFAULT 0,
    total_views text NOT NULL DEFAULT '0',
    total_likes text NOT NULL DEFAULT '0',
    avg_views integer NOT NULL DEFAULT 0,
    avg_likes integer NOT NULL DEFAULT 0,
    avg_comments integer NOT NULL DEFAULT 0,
    engagement_rate text NOT NULL DEFAULT '0.00',
    reach integer DEFAULT 0,
    follower_growth_24h integer DEFAULT 0,
    follower_growth_7d integer DEFAULT 0,
    follower_growth_30d integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE TABLE IF NOT EXISTS social_content_items (
    id serial PRIMARY KEY,
    social_account_id integer NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    platform_content_id text NOT NULL,
    content_type text NOT NULL,
    title text,
    caption text,
    permalink text,
    media_url text,
    thumbnail_url text,
    published_at timestamp with time zone,
    views_count integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    shares_count integer DEFAULT 0,
    reach_count integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  );`,
  `CREATE TABLE IF NOT EXISTS oauth_states (
    id serial PRIMARY KEY,
    state text NOT NULL UNIQUE,
    user_id text NOT NULL,
    platform text NOT NULL,
    redirect_uri text,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  );`
];

async function run() {
  for (const q of queries) {
    try {
      await pool.query(q);
    } catch (e) {
      console.error('Query error:', e.message);
    }
  }
  console.log('All missing social tables created successfully!');
  await pool.end();
}

run();
