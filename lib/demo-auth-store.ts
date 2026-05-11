import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { Pool, PoolClient } from "pg";
import { getPool, type BalanceLedgerKind, type BalanceLedgerRow } from "@/lib/db";

export type DemoUser = {
  id: string;
  email: string;
  displayName: string;
  passwordSaltHex: string;
  passwordHashHex: string;
  balanceTL: number;
  /** Veritabani created_at; yoksa undefined */
  memberSince?: Date;
  /** Yasakli hesap; giris engellenir */
  bannedAt?: Date;
  banReason?: string | null;
};

type UserRow = {
  id: string;
  email: string;
  display_name: string;
  password_salt_hex: string;
  password_hash_hex: string;
  balance_tl: number;
  created_at?: Date;
  banned_at?: Date | null;
  ban_reason?: string | null;
};

function parseMemberSince(raw: unknown): Date | undefined {
  if (raw == null) return undefined;
  const d = raw instanceof Date ? raw : new Date(String(raw));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function rowToUser(r: UserRow): DemoUser {
  return {
    id: r.id,
    email: r.email,
    displayName: r.display_name,
    passwordSaltHex: r.password_salt_hex,
    passwordHashHex: r.password_hash_hex,
    balanceTL: Number(r.balance_tl),
    memberSince: parseMemberSince(r.created_at),
    bannedAt: parseMemberSince(r.banned_at),
    banReason: r.ban_reason ?? null,
  };
}

function isPgUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "23505";
}

/** Sifre hash; db:reset / kayit ile ayni algoritma */
export function hashPassword(password: string): { saltHex: string; hashHex: string } {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return { saltHex: salt.toString("hex"), hashHex: hash.toString("hex") };
}

function verifyPassword(password: string, saltHex: string, hashHex: string): boolean {
  const salt = Buffer.from(saltHex, "hex");
  const got = scryptSync(password, salt, 64);
  const want = Buffer.from(hashHex, "hex");
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function insertLedger(
  executor: Pool | PoolClient,
  userId: string,
  kind: BalanceLedgerKind,
  deltaTl: number,
  balanceAfter: number,
  meta?: Record<string, unknown>,
) {
  const id = randomBytes(10).toString("hex");
  const metaJson = meta && Object.keys(meta).length > 0 ? JSON.stringify(meta) : null;
  await executor.query(
    `INSERT INTO balance_ledger (id, user_id, kind, delta_tl, balance_after_tl, meta_json)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, userId, kind, deltaTl, balanceAfter, metaJson],
  );
}

export async function findUserByEmail(email: string): Promise<DemoUser | undefined> {
  const pool = await getPool();
  const { rows } = await pool.query<UserRow>(`SELECT * FROM users WHERE lower(email) = lower($1)`, [email.trim()]);
  const r = rows[0];
  return r ? rowToUser(r) : undefined;
}

export async function findUserById(id: string): Promise<DemoUser | undefined> {
  const pool = await getPool();
  const { rows } = await pool.query<UserRow>(`SELECT * FROM users WHERE id = $1`, [id]);
  const r = rows[0];
  return r ? rowToUser(r) : undefined;
}

export async function registerDemoUser(input: {
  email: string;
  password: string;
  displayName: string;
  initialBalanceTL: number;
}): Promise<{ ok: true; user: DemoUser } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Gecerli bir e-posta girin." };
  if (input.password.length < 8) return { ok: false, error: "Sifre en az 8 karakter olmali." };
  const displayName = input.displayName.trim() || email.split("@")[0]!;
  if (displayName.length < 2) return { ok: false, error: "Gorunen ad en az 2 karakter olmali." };

  const id = randomBytes(12).toString("hex");
  const { saltHex, hashHex } = hashPassword(input.password);
  const initial = Math.max(0, Math.floor(input.initialBalanceTL));
  const pool = await getPool();

  try {
    await pool.query(
      `INSERT INTO users (id, email, display_name, password_salt_hex, password_hash_hex, balance_tl)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, email, displayName, saltHex, hashHex, initial],
    );
  } catch (e: unknown) {
    if (isPgUniqueViolation(e)) return { ok: false, error: "Bu e-posta ile kayit zaten var." };
    throw e;
  }

  if (initial > 0) {
    await insertLedger(pool, id, "initial_balance", initial, initial, { source: "MOCK_INITIAL_BALANCE_TL" });
  }

  const user = await findUserById(id);
  if (!user) return { ok: false, error: "Kayit olusturulamadi." };
  return { ok: true, user };
}

/** Sifre yanlis: null; hesap yasakli (sifre dogru): 'banned' */
export async function verifyDemoLogin(
  email: string,
  password: string,
): Promise<DemoUser | null | "banned"> {
  const user = await findUserByEmail(email.trim());
  if (!user) return null;
  if (!verifyPassword(password.trim(), user.passwordSaltHex, user.passwordHashHex)) return null;
  if (user.bannedAt) return "banned";
  return user;
}

export async function deductBalance(
  userId: string,
  amountTL: number,
  meta?: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (amountTL <= 0) return { ok: false, error: "Gecersiz tutar." };
  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ balance_tl: number }>(
      `SELECT balance_tl FROM users WHERE id = $1 FOR UPDATE`,
      [userId],
    );
    const row = rows[0];
    if (!row) throw new Error("no_user");
    const bal = Number(row.balance_tl);
    if (bal < amountTL) throw new Error("insufficient");
    await client.query(`UPDATE users SET balance_tl = balance_tl - $1 WHERE id = $2`, [amountTL, userId]);
    const afterRes = await client.query<{ balance_tl: number }>(`SELECT balance_tl FROM users WHERE id = $1`, [userId]);
    const after = Number(afterRes.rows[0]!.balance_tl);
    await insertLedger(client, userId, "purchase", -amountTL, after, meta);
    await client.query("COMMIT");
    return { ok: true };
  } catch (e: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    const msg = e instanceof Error ? e.message : "";
    if (msg === "no_user") return { ok: false, error: "Kullanici bulunamadi." };
    if (msg === "insufficient") return { ok: false, error: "Yetersiz bakiye." };
    throw e;
  } finally {
    client.release();
  }
}

export async function addMockBalance(
  userId: string,
  amountTL: number,
): Promise<{ ok: true; balanceTL: number } | { ok: false; error: string }> {
  const n = Math.floor(amountTL);
  if (n <= 0) return { ok: false, error: "Gecersiz tutar." };
  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ balance_tl: number }>(
      `SELECT balance_tl FROM users WHERE id = $1 FOR UPDATE`,
      [userId],
    );
    if (!rows[0]) throw new Error("no_user");
    await client.query(`UPDATE users SET balance_tl = balance_tl + $1 WHERE id = $2`, [n, userId]);
    const afterRes = await client.query<{ balance_tl: number }>(`SELECT balance_tl FROM users WHERE id = $1`, [userId]);
    const after = Number(afterRes.rows[0]!.balance_tl);
    await insertLedger(client, userId, "demo_adjust", n, after, { source: "MOCK_BAKIYE_DEMOSU" });
    await client.query("COMMIT");
  } catch (e: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    if (e instanceof Error && e.message === "no_user") return { ok: false, error: "Kullanici bulunamadi." };
    throw e;
  } finally {
    client.release();
  }
  const u = await findUserById(userId);
  return { ok: true, balanceTL: u?.balanceTL ?? 0 };
}

/** Odeme saglayicisi olmadan bakiye artisi (simulasyon); kayit defterine yazilir */
export async function simulateTopUp(
  userId: string,
  amountTL: number,
): Promise<{ ok: true; balanceTL: number } | { ok: false; error: string }> {
  const n = Math.floor(amountTL);
  if (n <= 0) return { ok: false, error: "Gecersiz tutar." };
  const max = Number.parseInt(process.env.MOCK_MAX_TOPUP_TL ?? "100000", 10);
  const cap = Number.isFinite(max) && max > 0 ? max : 100000;
  if (n > cap) return { ok: false, error: `Tek seferde en fazla ${cap} TL.` };
  const min = Number.parseInt(process.env.MOCK_MIN_TOPUP_TL ?? "50", 10);
  const floor = Number.isFinite(min) && min > 0 ? min : 50;
  if (n < floor) return { ok: false, error: `En az ${floor} TL yukleyebilirsiniz.` };

  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ balance_tl: number }>(
      `SELECT balance_tl FROM users WHERE id = $1 FOR UPDATE`,
      [userId],
    );
    if (!rows[0]) throw new Error("no_user");
    await client.query(`UPDATE users SET balance_tl = balance_tl + $1 WHERE id = $2`, [n, userId]);
    const afterRes = await client.query<{ balance_tl: number }>(`SELECT balance_tl FROM users WHERE id = $1`, [userId]);
    const after = Number(afterRes.rows[0]!.balance_tl);
    await insertLedger(client, userId, "topup_simulated", n, after, { note: "PSP entegrasyonu sonraki adim" });
    await client.query("COMMIT");
  } catch (e: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    if (e instanceof Error && e.message === "no_user") return { ok: false, error: "Kullanici bulunamadi." };
    throw e;
  } finally {
    client.release();
  }
  const u = await findUserById(userId);
  return { ok: true, balanceTL: u?.balanceTL ?? 0 };
}

type LedgerQueryRow = {
  id: string;
  user_id: string;
  kind: BalanceLedgerKind;
  delta_tl: number;
  balance_after_tl: number;
  meta_json: string | null;
  created_at: Date | string;
};

function formatLedgerRow(r: LedgerQueryRow): BalanceLedgerRow {
  const raw = r.created_at;
  const created =
    raw instanceof Date ? raw.toISOString().replace("T", " ").slice(0, 19) : String(raw);
  return {
    id: r.id,
    user_id: r.user_id,
    kind: r.kind,
    delta_tl: Number(r.delta_tl),
    balance_after_tl: Number(r.balance_after_tl),
    meta_json: r.meta_json,
    created_at: created,
  };
}

export async function getBalanceLedger(userId: string, limit = 25): Promise<BalanceLedgerRow[]> {
  const pool = await getPool();
  const lim = Math.min(100, Math.max(1, Math.floor(limit)));
  const { rows } = await pool.query<LedgerQueryRow>(
    `SELECT id, user_id, kind, delta_tl, balance_after_tl, meta_json, created_at
     FROM balance_ledger WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [userId, lim],
  );
  return rows.map((r) => formatLedgerRow(r));
}
