import { getPool } from "@/lib/db";

export type ThreadMessage = {
  id: string;
  orderId: string;
  senderId: string;
  senderDisplayName: string;
  body: string;
  createdAt: string;
  seenByViewer: boolean;
  seenByOther: boolean;
};

export async function markOrderMessagesSeen(orderId: string, userId: string): Promise<void> {
  const pool = await getPool();
  await pool.query(
    `INSERT INTO message_reads (message_id, user_id)
     SELECT m.id, $2
     FROM messages m
     WHERE m.order_id = $1
       AND m.sender_id <> $2
       AND NOT EXISTS (
         SELECT 1
         FROM message_reads mr
         WHERE mr.message_id = m.id AND mr.user_id = $2
       )`,
    [orderId, userId],
  );
}

export async function listMessagesForOrder(orderId: string, viewerUserId: string): Promise<ThreadMessage[]> {
  const pool = await getPool();
  const { rows } = await pool.query<{
    id: string;
    order_id: string;
    sender_id: string;
    body: string;
    created_at: Date;
    sender_display_name: string;
    seen_by_viewer: boolean;
    seen_by_other: boolean;
  }>(
    `SELECT m.id, m.order_id, m.sender_id, m.body, m.created_at, u.display_name AS sender_display_name,
            mr_viewer.message_id IS NOT NULL AS seen_by_viewer,
            CASE WHEN m.sender_id = $2 THEN mr_other.message_id IS NOT NULL ELSE false END AS seen_by_other
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     JOIN orders o ON o.id = m.order_id
     LEFT JOIN message_reads mr_viewer
       ON mr_viewer.message_id = m.id
      AND mr_viewer.user_id = $2
     LEFT JOIN message_reads mr_other
       ON mr_other.message_id = m.id
      AND mr_other.user_id = CASE
        WHEN o.buyer_id = $2 THEN o.seller_id
        ELSE o.buyer_id
      END
     WHERE m.order_id = $1
     ORDER BY m.created_at ASC`,
    [orderId, viewerUserId],
  );
  return rows.map((r) => {
    const raw = r.created_at;
    const created =
      raw instanceof Date ? raw.toISOString().replace("T", " ").slice(0, 19) : String(raw);
    return {
      id: r.id,
      orderId: r.order_id,
      senderId: r.sender_id,
      senderDisplayName: r.sender_display_name,
      body: r.body,
      createdAt: created,
      seenByViewer: Boolean(r.seen_by_viewer),
      seenByOther: Boolean(r.seen_by_other),
    };
  });
}
