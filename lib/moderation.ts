import { randomBytes } from "crypto";
import { getPool } from "@/lib/db";

export type ModerationKind = "user_message" | "off_channel" | "payment_suspicion" | "other";

export type ModerationReportListItem = {
  id: string;
  createdAt: string;
  status: "open" | "resolved";
  kind: ModerationKind;
  reporterId: string | null;
  reporterEmail: string | null;
  orderId: string | null;
  messageId: string | null;
  listingId: string | null;
  note: string;
  adminNote: string | null;
  resolvedAt: string | null;
  messageSnippet: string | null;
};

export async function createModerationReport(input: {
  kind: ModerationKind;
  reporterId: string;
  orderId: string;
  messageId: string;
  listingId: string;
  note: string;
}): Promise<void> {
  const pool = await getPool();
  const id = randomBytes(10).toString("hex");
  await pool.query(
    `INSERT INTO moderation_reports (id, kind, reporter_id, order_id, message_id, listing_id, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      id,
      input.kind,
      input.reporterId,
      input.orderId,
      input.messageId,
      input.listingId,
      input.note.trim().slice(0, 2000) || "Bildirim",
    ],
  );
}

export async function listOpenModerationReports(): Promise<ModerationReportListItem[]> {
  const pool = await getPool();
  const { rows } = await pool.query<{
    id: string;
    created_at: Date;
    status: string;
    kind: string;
    reporter_id: string | null;
    reporter_email: string | null;
    order_id: string | null;
    message_id: string | null;
    listing_id: string | null;
    note: string;
    admin_note: string | null;
    resolved_at: Date | null;
    message_snippet: string | null;
  }>(
    `SELECT r.id, r.created_at, r.status, r.kind, r.reporter_id, r.order_id, r.message_id, r.listing_id,
            r.note, r.admin_note, r.resolved_at,
            LEFT(m.body, 220) AS message_snippet,
            ru.email AS reporter_email
     FROM moderation_reports r
     LEFT JOIN messages m ON m.id = r.message_id
     LEFT JOIN users ru ON ru.id = r.reporter_id
     WHERE r.status = 'open'
     ORDER BY r.created_at DESC`,
  );
  return rows.map((r) => {
    const c = r.created_at;
    const createdAt = c instanceof Date ? c.toISOString().replace("T", " ").slice(0, 19) : String(c);
    const res = r.resolved_at;
    const resolvedAt =
      res == null ? null : res instanceof Date ? res.toISOString().replace("T", " ").slice(0, 19) : String(res);
    return {
      id: r.id,
      createdAt,
      status: r.status as "open" | "resolved",
      kind: r.kind as ModerationKind,
      reporterId: r.reporter_id,
      reporterEmail: r.reporter_email,
      orderId: r.order_id,
      messageId: r.message_id,
      listingId: r.listing_id,
      note: r.note,
      adminNote: r.admin_note,
      resolvedAt,
      messageSnippet: r.message_snippet,
    };
  });
}

export async function resolveModerationReport(
  reportId: string,
  adminNote: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const pool = await getPool();
  const note = adminNote.trim().slice(0, 4000) || "(not yok)";
  const { rowCount } = await pool.query(
    `UPDATE moderation_reports
     SET status = 'resolved', admin_note = $2, resolved_at = now()
     WHERE id = $1 AND status = 'open'`,
    [reportId, note],
  );
  if (!rowCount) return { ok: false, error: "Kayit bulunamadi veya zaten cozuldu." };
  return { ok: true };
}
