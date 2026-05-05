"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { getPool } from "@/lib/db";
import { createModerationReport } from "@/lib/moderation";
import { findUserById } from "@/lib/demo-auth-store";
import { getOrderDetailById, userCanAccessOrder } from "@/lib/orders";
import { getSession } from "@/lib/session";

export async function sendOrderMessageAction(orderId: string, body: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Oturum gerekli." };
  const me = await findUserById(session.userId);
  if (me?.bannedAt) return { error: "Hesabiniz yasakli; mesaj gonderemezsiniz." };
  const order = await getOrderDetailById(orderId);
  if (!order || !userCanAccessOrder(session.userId, order)) return { error: "Erisim yok." };
  const t = body.trim();
  if (!t) return { error: "Mesaj bos olamaz." };
  if (t.length > 4000) return { error: "Mesaj en fazla 4000 karakter olabilir." };
  const pool = await getPool();
  const id = randomBytes(12).toString("hex");
  await pool.query(`INSERT INTO messages (id, order_id, sender_id, body) VALUES ($1, $2, $3, $4)`, [
    id,
    orderId,
    session.userId,
    t,
  ]);
  revalidatePath(`/mesajlar/${encodeURIComponent(orderId)}`);
  return {};
}

export async function reportOrderMessageAction(input: {
  orderId: string;
  messageId: string;
  listingId: string;
  note: string;
}): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Oturum gerekli." };
  const me = await findUserById(session.userId);
  if (me?.bannedAt) return { error: "Hesabiniz yasakli." };
  const order = await getOrderDetailById(input.orderId);
  if (!order || !userCanAccessOrder(session.userId, order)) return { error: "Erisim yok." };
  const pool = await getPool();
  const { rows } = await pool.query<{ id: string; sender_id: string }>(
    `SELECT id, sender_id FROM messages WHERE id = $1 AND order_id = $2`,
    [input.messageId, input.orderId],
  );
  const msg = rows[0];
  if (!msg) return { error: "Mesaj bulunamadi." };
  if (msg.sender_id === session.userId) return { error: "Kendi mesajinizi bildiremezsiniz." };
  await createModerationReport({
    kind: "user_message",
    reporterId: session.userId,
    orderId: input.orderId,
    messageId: input.messageId,
    listingId: input.listingId,
    note: input.note.trim() || "Kullanici bildirimi",
  });
  revalidatePath("/admin/moderasyon");
  return {};
}
