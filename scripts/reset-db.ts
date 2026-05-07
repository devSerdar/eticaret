import "dotenv/config";

import { randomBytes, scryptSync } from "crypto";
import { getPool } from "../lib/db";
import { insertLedger } from "../lib/demo-auth-store";

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
  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      TRUNCATE TABLE
        moderation_reports,
        order_action_requests,
        messages,
        orders,
        balance_ledger,
        listings,
        users
      RESTART IDENTITY CASCADE
    `);
    await client.query("COMMIT");
  } catch (e: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }

  const email = resolveAdminEmail();
  const password = resolveAdminPassword();
  const displayName = (process.env.ADMIN_SEED_DISPLAY_NAME ?? "Admin").trim() || "Admin";
  const initialBalanceTL = resolveInitialBalance();
  const id = randomBytes(12).toString("hex");
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  const saltHex = salt.toString("hex");
  const hashHex = hash.toString("hex");

  const clientAdmin = await pool.connect();
  try {
    await clientAdmin.query("BEGIN");
    const { rows } = await clientAdmin.query<{ id: string }>(
      `INSERT INTO users (id, email, display_name, password_salt_hex, password_hash_hex, balance_tl, banned_at, ban_reason)
       VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL)
       ON CONFLICT (email)
       DO UPDATE SET
         display_name = EXCLUDED.display_name,
         password_salt_hex = EXCLUDED.password_salt_hex,
         password_hash_hex = EXCLUDED.password_hash_hex,
         banned_at = NULL,
         ban_reason = NULL
       RETURNING id`,
      [id, email, displayName, saltHex, hashHex, initialBalanceTL],
    );
    const row = rows[0];
    if (!row) throw new Error("Admin kaydi olusturulamadi.");
    if (initialBalanceTL > 0) {
      await insertLedger(clientAdmin, row.id, "initial_balance", initialBalanceTL, initialBalanceTL, {
        source: "ADMIN_SEED_INITIAL_BALANCE_TL",
      });
    }
    await clientAdmin.query("COMMIT");
  } catch (e: unknown) {
    await clientAdmin.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    clientAdmin.release();
  }

  console.log("=".repeat(64));
  console.log("DB SIFIRLAMA TAMAMLANDI");
  console.log("Admin hesabi otomatik olusturuldu:");
  console.log(`Kullanici adi (email): ${email}`);
  console.log(`Sifre: ${password}`);
  console.log(`Gorunen ad: ${displayName}`);
  console.log(`Baslangic bakiye: ${initialBalanceTL} TL`);
  console.log(`Admin paneli icin ADMIN_EMAILS degeri: ${email}`);
  console.log("=".repeat(64));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
