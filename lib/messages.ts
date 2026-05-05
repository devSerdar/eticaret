import { getPool } from "@/lib/db";

export type ThreadMessage = {
  id: string;
  orderId: string;
  senderId: string;
  senderDisplayName: string;
  body: string;
  createdAt: string;
};

export async function listMessagesForOrder(orderId: string): Promise<ThreadMessage[]> {
  const pool = await getPool();
  const { rows } = await pool.query<{
    id: string;
    order_id: string;
    sender_id: string;
    body: string;
    created_at: Date;
    sender_display_name: string;
  }>(
    `SELECT m.id, m.order_id, m.sender_id, m.body, m.created_at, u.display_name AS sender_display_name
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.order_id = $1
     ORDER BY m.created_at ASC`,
    [orderId],
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
    };
  });
}
