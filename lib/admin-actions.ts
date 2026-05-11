"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin-auth";
import { findUserById, insertLedger } from "@/lib/demo-auth-store";
import { getPool } from "@/lib/db";
import { getOrderDetailById, isOrderSaleCompleted } from "@/lib/orders";
import { getSession } from "@/lib/session";

async function requireAdminSession() {
  const s = await getSession();
  if (!s || !isAdminEmail(s.email)) redirect("/");
  return s;
}

export async function adminBanUserAction(formData: FormData): Promise<void> {
  const admin = await requireAdminSession();
  const userId = String(formData.get("userId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!userId) redirect("/admin/kullanicilar?hata=id");
  if (userId === admin.userId) redirect("/admin/kullanicilar?hata=self");
  if (reason.length < 4) redirect(`/admin/kullanicilar/${encodeURIComponent(userId)}?hata=not`);

  const pool = await getPool();
  await pool.query(`UPDATE users SET banned_at = now(), ban_reason = $2 WHERE id = $1`, [
    userId,
    reason.slice(0, 2000),
  ]);
  revalidatePath("/admin/kullanicilar");
  revalidatePath(`/admin/kullanicilar/${userId}`);
  redirect(`/admin/kullanicilar/${encodeURIComponent(userId)}?ok=yasak`);
}

export async function adminUnbanUserAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) redirect("/admin/kullanicilar?hata=id");
  const pool = await getPool();
  await pool.query(`UPDATE users SET banned_at = NULL, ban_reason = NULL WHERE id = $1`, [userId]);
  revalidatePath("/admin/kullanicilar");
  revalidatePath(`/admin/kullanicilar/${userId}`);
  redirect(`/admin/kullanicilar/${encodeURIComponent(userId)}?ok=yasak_kaldir`);
}

export async function adminSetListingHiddenAction(formData: FormData): Promise<void> {
  await requireAdminSession();
  const listingId = String(formData.get("listingId") ?? "").trim();
  const hidden = String(formData.get("hidden") ?? "") === "1";
  if (!listingId) redirect("/admin/ilanlar?hata=id");
  const pool = await getPool();
  await pool.query(`UPDATE listings SET hidden_by_admin = $2 WHERE id = $1`, [listingId, hidden]);
  revalidatePath("/admin/ilanlar");
  revalidatePath(`/ilanlar/${listingId}`);
  redirect(`/admin/ilanlar?ok=1`);
}

/** Siparis konusmasina yonetim mesaji (alici/satici /mesajlar ve Hesabimda gorur) */
export async function sendAdminOrderMessageAction(orderId: string, body: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session || !isAdminEmail(session.email)) return { error: "Yetki yok." };
  const me = await findUserById(session.userId);
  if (me?.bannedAt) return { error: "Hesabiniz yasakli." };
  const order = await getOrderDetailById(orderId.trim());
  if (!order) return { error: "Siparis bulunamadi." };
  const t = body.trim();
  if (!t) return { error: "Mesaj bos olamaz." };
  if (t.length > 4000) return { error: "Mesaj en fazla 4000 karakter olabilir." };
  const pool = await getPool();
  const id = randomBytes(12).toString("hex");
  await pool.query(`INSERT INTO messages (id, order_id, sender_id, body) VALUES ($1, $2, $3, $4)`, [
    id,
    order.id,
    session.userId,
    t,
  ]);
  const enc = encodeURIComponent(order.id);
  revalidatePath(`/mesajlar/${enc}`);
  revalidatePath("/hesabim");
  revalidatePath(`/admin/siparisler/${enc}`);
  revalidatePath("/admin/siparisler");
  return {};
}

/**
 * Tamamlanmamis siparisi (iptal + iade + satici clawback) yonetici gerekcesiyle kapatir.
 * Sohbete otomatik bir yonetim mesaji eklenir.
 */
export async function adminCancelIncompleteOrderAction(
  orderId: string,
  reason: string,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session || !isAdminEmail(session.email)) return { error: "Yetki yok." };
  const me = await findUserById(session.userId);
  if (me?.bannedAt) return { error: "Hesabiniz yasakli." };

  const id = orderId.trim();
  const note = reason.trim();
  if (note.length < 8) return { error: "Aciklama en az 8 karakter olmalidir." };
  if (note.length > 2000) return { error: "Aciklama en fazla 2000 karakter olabilir." };

  const order = await getOrderDetailById(id);
  if (!order) return { error: "Siparis bulunamadi." };
  if (order.cancelledAt) return { error: "Siparis zaten iptal edilmis." };

  const saleDone = await isOrderSaleCompleted(id);
  if (saleDone) return { error: "Satis tamamlanmis siparis iptal edilemez." };

  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: orderLockRows } = await client.query<{
      cancelled_at: Date | null;
      price_tl: number;
      buyer_id: string;
      seller_id: string;
    }>(`SELECT cancelled_at, price_tl, buyer_id, seller_id FROM orders WHERE id = $1 FOR UPDATE`, [id]);
    const locked = orderLockRows[0];
    if (!locked) {
      await client.query("ROLLBACK");
      return { error: "Siparis bulunamadi." };
    }
    if (locked.cancelled_at) {
      await client.query("ROLLBACK");
      return { error: "Siparis zaten iptal edilmis." };
    }

    const { rows: doneRows } = await client.query<{ ok: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM order_action_requests ar
         WHERE ar.order_id = $1 AND ar.kind = 'complete_sale' AND ar.status = 'approved'
       ) AS ok`,
      [id],
    );
    if (doneRows[0]?.ok) {
      await client.query("ROLLBACK");
      return { error: "Satis tamamlanmis siparis iptal edilemez." };
    }

    await client.query(`UPDATE orders SET cancelled_at = now() WHERE id = $1`, [id]);

    const refundAmount = Number(locked.price_tl);
    const { rows: balRows } = await client.query<{ balance_tl: number }>(
      `SELECT balance_tl FROM users WHERE id = $1 FOR UPDATE`,
      [locked.buyer_id],
    );
    const buyerBal = Number(balRows[0]?.balance_tl ?? 0);
    const buyerNew = buyerBal + refundAmount;
    await client.query(`UPDATE users SET balance_tl = $1 WHERE id = $2`, [buyerNew, locked.buyer_id]);
    await insertLedger(client, locked.buyer_id, "refund", refundAmount, buyerNew, {
      orderId: id,
      reason: "admin_cancel",
      adminReason: note,
    });

    const { rows: sellerBalRows } = await client.query<{ balance_tl: number }>(
      `SELECT balance_tl FROM users WHERE id = $1 FOR UPDATE`,
      [locked.seller_id],
    );
    const sellerBal = Number(sellerBalRows[0]?.balance_tl ?? 0);
    if (sellerBal < refundAmount) {
      await client.query("ROLLBACK");
      return {
        error:
          "Satici bakiyesi bu iadeyi karsilayamiyor (tutar cekilmis olabilir). Manuel mudahale gerekir.",
      };
    }
    const sellerNew = sellerBal - refundAmount;
    await client.query(`UPDATE users SET balance_tl = $1 WHERE id = $2`, [sellerNew, locked.seller_id]);
    await insertLedger(client, locked.seller_id, "sale_clawback", -refundAmount, sellerNew, {
      orderId: id,
      reason: "admin_cancel",
      adminReason: note,
    });

    const rejectNote = `Yonetici iptali: ${note}`.slice(0, 2000);
    await client.query(
      `UPDATE order_action_requests
       SET status = 'rejected',
           responded_by = $2,
           response_reason = $3,
           responded_at = now()
       WHERE order_id = $1 AND status = 'pending'`,
      [id, session.userId, rejectNote],
    );

    const msgBody = `Bu siparis yonetici mudahalesiyle iptal edildi.\n\nGerekce: ${note}`;
    const msgId = randomBytes(12).toString("hex");
    await client.query(`INSERT INTO messages (id, order_id, sender_id, body) VALUES ($1, $2, $3, $4)`, [
      msgId,
      id,
      session.userId,
      msgBody.slice(0, 4000),
    ]);

    await client.query("COMMIT");
  } catch (e: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }

  const enc = encodeURIComponent(id);
  revalidatePath(`/mesajlar/${enc}`);
  revalidatePath("/hesabim");
  revalidatePath(`/admin/siparisler/${enc}`);
  revalidatePath("/admin/siparisler");
  revalidatePath("/siparislerim");
  return {};
}
