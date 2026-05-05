import pg from "pg";

export type BalanceLedgerKind = "initial_balance" | "topup_simulated" | "purchase" | "demo_adjust";

export type BalanceLedgerRow = {
  id: string;
  user_id: string;
  kind: BalanceLedgerKind;
  delta_tl: number;
  balance_after_tl: number;
  meta_json: string | null;
  created_at: string;
};

let pool: pg.Pool | null = null;
let migrateOnce: Promise<void> | null = null;

/** docker-compose.yml ile ayni; yalnizca DATABASE_URL yoksa ve production degilse */
const DEV_DEFAULT_DATABASE_URL =
  "postgresql://oyunticaret:oyunticaret_dev@localhost:5432/oyunticaret";

let loggedDevFallback = false;

function resolveConnectionString(): string {
  const fromEnv = process.env.DATABASE_URL?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "DATABASE_URL ortam degiskeni zorunludur (postgresql://...). Ornek: .env.example",
    );
  }
  if (!loggedDevFallback) {
    loggedDevFallback = true;
    console.warn(
      "[db] DATABASE_URL tanimli degil; gelistirme icin varsayilan kullaniliyor:",
      DEV_DEFAULT_DATABASE_URL,
      "| Uretimde .env ile DATABASE_URL ayarlayin.",
    );
  }
  return DEV_DEFAULT_DATABASE_URL;
}

async function runMigrations(p: pg.Pool) {
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_salt_hex TEXT NOT NULL,
      password_hash_hex TEXT NOT NULL,
      balance_tl INTEGER NOT NULL DEFAULT 0 CHECK (balance_tl >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS balance_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      delta_tl INTEGER NOT NULL,
      balance_after_tl INTEGER NOT NULL,
      meta_json TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_balance_ledger_user_created
      ON balance_ledger (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      game_slug TEXT NOT NULL DEFAULT 'knight-online',
      server_slug TEXT NOT NULL,
      market_slug TEXT NOT NULL,
      title TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price >= 0),
      seller TEXT NOT NULL,
      online BOOLEAN NOT NULL DEFAULT true,
      job TEXT,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_listings_server_market
      ON listings (server_slug, market_slug, created_at DESC);
  `);

  await p.query(`
    ALTER TABLE listings ADD COLUMN IF NOT EXISTS seller_user_id TEXT REFERENCES users(id);

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
      buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seller_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      price_tl INTEGER NOT NULL CHECK (price_tl >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT orders_buyer_not_seller CHECK (buyer_id <> seller_id)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_buyer_created ON orders (buyer_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_orders_seller_created ON orders (seller_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_orders_listing ON orders (listing_id);

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 4000),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_messages_order_created ON messages (order_id, created_at ASC);

    CREATE TABLE IF NOT EXISTS moderation_reports (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      status TEXT NOT NULL DEFAULT 'open',
      kind TEXT NOT NULL,
      reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
      message_id TEXT REFERENCES messages(id) ON DELETE SET NULL,
      listing_id TEXT REFERENCES listings(id) ON DELETE SET NULL,
      note TEXT NOT NULL DEFAULT '',
      admin_note TEXT,
      resolved_at TIMESTAMPTZ,
      CONSTRAINT moderation_reports_status CHECK (status IN ('open', 'resolved')),
      CONSTRAINT moderation_reports_kind CHECK (kind IN ('user_message', 'off_channel', 'payment_suspicion', 'other'))
    );

    CREATE INDEX IF NOT EXISTS idx_moderation_reports_open ON moderation_reports (created_at DESC)
      WHERE status = 'open';
  `);

  await p.query(`
    UPDATE listings l
    SET seller_user_id = u.id
    FROM users u
    WHERE l.seller_user_id IS NULL
      AND l.seller = u.display_name
      AND NOT EXISTS (
        SELECT 1 FROM users u2 WHERE u2.display_name = l.seller AND u2.id <> u.id
      );
  `);

  await p.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;

    ALTER TABLE listings ADD COLUMN IF NOT EXISTS hidden_by_admin BOOLEAN NOT NULL DEFAULT false;
  `);
}

/**
 * Paylasimli baglanti havuzu. Ilk cagrida sema olusturulur (CREATE IF NOT EXISTS).
 * `DATABASE_URL` tercih edilir; gelistirmede yoksa docker-compose varsayilir.
 * Uretimde `DATABASE_URL` zorunludur.
 */
export async function getPool(): Promise<pg.Pool> {
  const url = resolveConnectionString();
  if (!pool) {
    pool = new pg.Pool({
      connectionString: url,
      max: Number.parseInt(process.env.PG_POOL_MAX ?? "15", 10) || 15,
    });
  }
  if (!migrateOnce) {
    migrateOnce = runMigrations(pool);
  }
  await migrateOnce;
  return pool;
}
