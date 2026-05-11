"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { getPool } from "@/lib/db";
import { createModerationReport } from "@/lib/moderation";
import { findUserById } from "@/lib/demo-auth-store";
import { listMessagesForOrder, markOrderMessagesSeen, type ThreadMessage } from "@/lib/messages";
import {
  createOrderActionRequest,
  listOrderActionRequests,
  respondOrderActionRequest,
  type OrderActionRequest,
} from "@/lib/order-action-requests";
import { isAdminEmail } from "@/lib/admin-auth";
import { getOrderDetailById, isOrderSaleCompleted, userCanAccessOrder } from "@/lib/orders";
import { getSession } from "@/lib/session";

export async function getOrderMessagesAction(
  orderId: string,
): Promise<{ error?: string; messages?: ThreadMessage[] }> {
  const session = await getSession();
  if (!session) return { error: "Oturum gerekli." };
  const order = await getOrderDetailById(orderId);
  if (!order || !userCanAccessOrder(session.userId, order)) return { error: "Erisim yok." };
  await markOrderMessagesSeen(orderId, session.userId);
  const messages = await listMessagesForOrder(orderId, session.userId);
  return { messages };
}

export async function getOrderActionRequestsAction(
  orderId: string,
): Promise<{ error?: string; requests?: OrderActionRequest[] }> {
  const session = await getSession();
  if (!session) return { error: "Oturum gerekli." };
  const order = await getOrderDetailById(orderId);
  if (!order || !userCanAccessOrder(session.userId, order)) return { error: "Erisim yok." };
  const requests = await listOrderActionRequests(orderId);
  return { requests };
}

export async function sendOrderMessageAction(orderId: string, body: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Oturum gerekli." };
  const me = await findUserById(session.userId);
  if (me?.bannedAt) return { error: "Hesabiniz yasakli; mesaj gonderemezsiniz." };
  const order = await getOrderDetailById(orderId);
  if (!order || !userCanAccessOrder(session.userId, order)) return { error: "Erisim yok." };
  if (order.cancelledAt) {
    return { error: "Iptal edilmis sipariste mesaj yazilamaz; yalnizca yonetim yazabilir." };
  }
  if (await isOrderSaleCompleted(orderId)) {
    return { error: "Tamamlanmis sipariste mesaj yazilamaz; yalnizca yonetim yazabilir." };
  }
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
  revalidatePath("/hesabim");
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
  const senderUser = await findUserById(msg.sender_id);
  if (senderUser && isAdminEmail(senderUser.email)) {
    return { error: "Yonetim mesajlari bildirilemez." };
  }
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

export async function requestOrderActionAction(input: {
  orderId: string;
  kind: "complete_sale" | "cancel_by_seller" | "cancel_by_buyer";
  reason?: string;
}): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Oturum gerekli." };
  const me = await findUserById(session.userId);
  if (me?.bannedAt) return { error: "Hesabiniz yasakli." };

  const r = await createOrderActionRequest({
    orderId: input.orderId,
    actorUserId: session.userId,
    kind: input.kind,
    reason: input.reason,
  });
  if (!r.ok) return { error: r.error };

  revalidatePath(`/mesajlar/${encodeURIComponent(input.orderId)}`);
  revalidatePath("/hesabim");
  return {};
}

export async function respondOrderActionRequestAction(input: {
  requestId: string;
  orderId: string;
  approve: boolean;
  responseReason?: string;
}): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "Oturum gerekli." };
  const me = await findUserById(session.userId);
  if (me?.bannedAt) return { error: "Hesabiniz yasakli." };

  const r = await respondOrderActionRequest({
    requestId: input.requestId,
    actorUserId: session.userId,
    approve: input.approve,
    responseReason: input.responseReason,
  });
  if (!r.ok) return { error: r.error };

  revalidatePath(`/mesajlar/${encodeURIComponent(input.orderId)}`);
  revalidatePath("/hesabim");
  return {};
}
