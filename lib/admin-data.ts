import { getPool } from "@/lib/db";

export type AdminUserDetail = {
  id: string;
  email: string;
  displayName: string;
  balanceTl: number;
  createdAt: string;
  bannedAt: string | null;
  banReason: string | null;
};

export async function adminListUsers(limit = 300): Promise<AdminUserDetail[]> {
  const pool = await getPool();
  const lim = Math.min(500, Math.max(1, Math.floor(limit)));
  const { rows } = await pool.query<{
    id: string;
    email: string;
    display_name: string;
    balance_tl: number;
    created_at: Date;
    banned_at: Date | null;
    ban_reason: string | null;
  }>(
    `SELECT id, email, display_name, balance_tl, created_at, banned_at, ban_reason
     FROM users
     ORDER BY created_at DESC
     LIMIT $1`,
    [lim],
  );
  return rows.map((r) => {
    const c = r.created_at;
    const createdAt =
      c instanceof Date ? c.toISOString().replace("T", " ").slice(0, 19) : String(c);
    const b = r.banned_at;
    const bannedAt =
      b == null ? null : b instanceof Date ? b.toISOString().replace("T", " ").slice(0, 19) : String(b);
    return {
      id: r.id,
      email: r.email,
      displayName: r.display_name,
      balanceTl: Number(r.balance_tl),
      createdAt,
      bannedAt,
      banReason: r.ban_reason,
    };
  });
}

export async function adminGetUserById(userId: string): Promise<AdminUserDetail | undefined> {
  const pool = await getPool();
  const { rows } = await pool.query<{
    id: string;
    email: string;
    display_name: string;
    balance_tl: number;
    created_at: Date;
    banned_at: Date | null;
    ban_reason: string | null;
  }>(
    `SELECT id, email, display_name, balance_tl, created_at, banned_at, ban_reason FROM users WHERE id = $1`,
    [userId],
  );
  const r = rows[0];
  if (!r) return undefined;
  const c = r.created_at;
  const createdAt =
    c instanceof Date ? c.toISOString().replace("T", " ").slice(0, 19) : String(c);
  const b = r.banned_at;
  const bannedAt =
    b == null ? null : b instanceof Date ? b.toISOString().replace("T", " ").slice(0, 19) : String(b);
  return {
    id: r.id,
    email: r.email,
    displayName: r.display_name,
    balanceTl: Number(r.balance_tl),
    createdAt,
    bannedAt,
    banReason: r.ban_reason,
  };
}
