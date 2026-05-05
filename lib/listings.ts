import { getPool } from "@/lib/db";
import { isKoJobSlug, type KoJobSlug } from "@/lib/ko-jobs";
import { isPvpMarketSlug, type PvpMarketSlug } from "@/lib/ko-pvp-catalog";

export type Listing = {
  id: string;
  title: string;
  gameSlug: string;
  serverSlug: string;
  marketSlug: PvpMarketSlug;
  price: number;
  seller: string;
  /** Ilan sahibi kullanici; satin alma ve mesaj icin zorunlu */
  sellerUserId?: string | null;
  /** Yonetici gizledi; halka acik listelerde gorunmez */
  hiddenByAdmin?: boolean;
  online: boolean;
  createdAt: string;
  job?: KoJobSlug;
  description?: string;
};

type ListingRow = {
  id: string;
  game_slug: string;
  server_slug: string;
  market_slug: string;
  title: string;
  price: string | number;
  seller: string;
  seller_user_id: string | null;
  hidden_by_admin: boolean;
  online: boolean;
  job: string | null;
  description: string | null;
  created_at: Date;
};

function formatCreatedAt(d: Date): string {
  try {
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return String(d);
  }
}

function mapRow(r: ListingRow): Listing | null {
  if (!isPvpMarketSlug(r.market_slug)) return null;
  const job = r.job && isKoJobSlug(r.job) ? r.job : undefined;
  const createdRaw = r.created_at;
  const createdDate =
    createdRaw instanceof Date ? createdRaw : new Date(typeof createdRaw === "string" ? createdRaw : String(createdRaw));
  return {
    id: r.id,
    title: r.title,
    gameSlug: r.game_slug,
    serverSlug: r.server_slug,
    marketSlug: r.market_slug,
    price: Number(r.price),
    seller: r.seller,
    sellerUserId: r.seller_user_id ?? null,
    hiddenByAdmin: Boolean(r.hidden_by_admin),
    online: Boolean(r.online),
    createdAt: formatCreatedAt(createdDate),
    job,
    description: r.description ?? undefined,
  };
}

export async function getListingById(id: string): Promise<Listing | undefined> {
  const pool = await getPool();
  const { rows } = await pool.query<ListingRow>(
    `SELECT * FROM listings WHERE id = $1 AND NOT COALESCE(hidden_by_admin, false)`,
    [id],
  );
  const mapped = rows[0] ? mapRow(rows[0]) : null;
  return mapped ?? undefined;
}

/** Yonetim: gizli ilanlar dahil */
export async function adminGetListingById(id: string): Promise<Listing | undefined> {
  const pool = await getPool();
  const { rows } = await pool.query<ListingRow>(`SELECT * FROM listings WHERE id = $1`, [id]);
  const mapped = rows[0] ? mapRow(rows[0]) : null;
  return mapped ?? undefined;
}

export async function listListingsByServerAndMarket(
  serverSlug: string,
  marketSlug: PvpMarketSlug,
): Promise<Listing[]> {
  const pool = await getPool();
  const { rows } = await pool.query<ListingRow>(
    `SELECT id, game_slug, server_slug, market_slug, title, price, seller, seller_user_id, hidden_by_admin, online, job, description, created_at
     FROM listings
     WHERE server_slug = $1 AND market_slug = $2 AND NOT COALESCE(hidden_by_admin, false)
     ORDER BY created_at DESC, id DESC`,
    [serverSlug, marketSlug],
  );
  return rows.map((r) => mapRow(r)).filter((x): x is Listing => x !== null);
}

export async function countListingsByServerAndMarket(
  serverSlug: string,
  marketSlug: PvpMarketSlug,
): Promise<number> {
  const pool = await getPool();
  const { rows } = await pool.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM listings WHERE server_slug = $1 AND market_slug = $2 AND NOT COALESCE(hidden_by_admin, false)`,
    [serverSlug, marketSlug],
  );
  return Number.parseInt(rows[0]?.c ?? "0", 10) || 0;
}

/** Yonetim: tum ilanlar (gizliler dahil) */
export async function adminListAllListings(limit = 150): Promise<Listing[]> {
  const pool = await getPool();
  const lim = Math.min(400, Math.max(1, Math.floor(limit)));
  const { rows } = await pool.query<ListingRow>(
    `SELECT id, game_slug, server_slug, market_slug, title, price, seller, seller_user_id, hidden_by_admin, online, job, description, created_at
     FROM listings
     ORDER BY created_at DESC, id DESC
     LIMIT $1`,
    [lim],
  );
  return rows.map((r) => mapRow(r)).filter((x): x is Listing => x !== null);
}
