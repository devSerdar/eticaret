import "dotenv/config";

import { randomBytes } from "crypto";
import { getPool } from "../lib/db";
import { hashPassword, insertLedger } from "../lib/demo-auth-store";

function resolveAdminEmail(): string {
  const fromSeed = (process.env.ADMIN_SEED_EMAIL ?? "").trim().toLowerCase();
  if (fromSeed) return fromSeed;
  const fromList = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)[0];
  if (fromList) return fromList;
  return "admin@oyunticaret.local";
}

function resolveAdminPassword(): string {
  const fromEnv = (process.env.ADMIN_SEED_PASSWORD ?? "").trim();
  if (fromEnv.length >= 8) return fromEnv;
  return `Admin!${randomBytes(5).toString("hex")}`;
}

function resolveInitialBalance(): number {
  const raw = Number.parseInt(process.env.ADMIN_SEED_INITIAL_BALANCE_TL ?? "0", 10);
  if (Number.isNaN(raw) || raw < 0) return 0;
  return raw;
}

async function main() {
  const email = resolveAdminEmail();
  const password = "12345678";
  const displayName = (process.env.ADMIN_SEED_DISPLAY_NAME ?? "Admin").trim() || "Admin";
  const initialBalanceTL = resolveInitialBalance();
  const id = randomBytes(12).toString("hex");
  const { saltHex, hashHex } = hashPassword(password);

  const pool = await getPool();
  const client = await pool.connect();
  let createdNow = false;
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ id: string; inserted: boolean }>(
      `INSERT INTO users (id, email, display_name, password_salt_hex, password_hash_hex, balance_tl, banned_at, ban_reason)
       VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL)
       ON CONFLICT (email)
       DO UPDATE SET
         display_name = EXCLUDED.display_name,
         password_salt_hex = EXCLUDED.password_salt_hex,
         password_hash_hex = EXCLUDED.password_hash_hex,
         banned_at = NULL,
         ban_reason = NULL
       RETURNING id, (xmax = 0) AS inserted`,
      [id, email, displayName, saltHex, hashHex, initialBalanceTL],
    );
    const row = rows[0];
    if (!row) throw new Error("Admin kaydi olusturulamadi.");
    createdNow = row.inserted;
    if (createdNow && initialBalanceTL > 0) {
      await insertLedger(client, row.id, "initial_balance", initialBalanceTL, initialBalanceTL, {
        source: "ADMIN_SEED_INITIAL_BALANCE_TL",
      });
    }
    await client.query("COMMIT");
  } catch (e: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  const listedAsAdmin = adminEmails.includes(email);

  console.log("=".repeat(64));
  console.log("ADMIN HESABI OLUSTURULDU");
  console.log(`Kullanici adi (email): ${email}`);
  console.log(`Sifre: ${password}`);
  console.log(`Gorunen ad: ${displayName}`);
  console.log(`Baslangic bakiye: ${initialBalanceTL} TL`);
  console.log(`Islem: ${createdNow ? "yeni admin olusturuldu" : "mevcut admin sifresi guncellendi"}`);
  if (!listedAsAdmin) {
    console.log(
      `UYARI: Bu e-posta ADMIN_EMAILS icinde degil. .env dosyaniza su degeri ekleyin: ADMIN_EMAILS=${email}`,
    );
  } else {
    console.log("ADMIN_EMAILS kontrolu: OK");
  }
  console.log("=".repeat(64));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
