import "dotenv/config";

import { getPool } from "../lib/db";
import { KO_JOB_SLUGS } from "../lib/ko-jobs";
import type { PvpMarketSlug } from "../lib/ko-pvp-catalog";

const SERVER = "ko4fun";
const TOTAL = 100;
const MARKETS: PvpMarketSlug[] = ["goldbar", "css", "item"];

type SeedSeller = { id: string; display_name: string };

async function loadSeedSellers(): Promise<SeedSeller[]> {
  const pool = await getPool();
  const { rows } = await pool.query<SeedSeller>(
    `SELECT id, display_name FROM users WHERE email LIKE 'seed%@oyunticaret.local' ORDER BY email`,
  );
  return rows;
}

function titleFor(i: number, market: PvpMarketSlug): string {
  if (market === "goldbar") return `KO4FUN ${5 + (i % 20)} GB Paket #${i + 1}`;
  if (market === "css") return `KO4FUN KC / CSS ${800 + (i % 40) * 25} #${i + 1}`;
  return `KO4FUN Item Lot #${i + 1}`;
}

function priceFor(i: number, market: PvpMarketSlug): number {
  const base = market === "item" ? 400 : market === "css" ? 200 : 150;
  return base + ((i * 37) % 4800);
}

async function main() {
  const pool = await getPool();
  const sellers = await loadSeedSellers();
  if (sellers.length === 0) {
    console.warn("Uyari: seed kullanici yok. Once: npm run seed:users");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const del = await client.query(`DELETE FROM listings WHERE server_slug = $1`, [SERVER]);
    console.log(`Silinen (ko4fun): ${del.rowCount ?? 0} ilan`);

    for (let i = 0; i < TOTAL; i++) {
      const market = MARKETS[i % MARKETS.length]!;
      const id = `ko4fun-${market}-${String(i + 1).padStart(4, "0")}`;
      const sellerRow = sellers[i % Math.max(sellers.length, 1)] ?? null;
      const sellerDisplay = sellerRow?.display_name ?? `Satici ${(i % 10) + 1}`;
      const sellerUserId = sellerRow?.id ?? null;
      const job = market === "item" ? KO_JOB_SLUGS[i % KO_JOB_SLUGS.length]! : null;
      const desc =
        i < 8
          ? "Seed verisi. Teslimat icin satin alma sonrasi mesajlasin. PSP / siparis kaydi sonraki adimlar."
          : null;
      await client.query(
        `INSERT INTO listings (id, game_slug, server_slug, market_slug, title, price, seller, seller_user_id, online, job, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          "knight-online",
          SERVER,
          market,
          titleFor(i, market),
          priceFor(i, market),
          sellerDisplay,
          sellerUserId,
          i % 5 !== 0,
          job,
          desc,
        ],
      );
    }
    await client.query("COMMIT");
    console.log(`Eklendi: ${TOTAL} ilan (${SERVER}, pazarlar: goldbar/css/item).`);
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
