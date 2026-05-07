import { randomBytes } from "crypto";
import { getPool } from "@/lib/db";
import { getOrderDetailById } from "@/lib/orders";
import { insertLedger } from "@/lib/demo-auth-store";

export type OrderActionKind = "complete_sale" | "cancel_by_seller" | "cancel_by_buyer";
export type OrderActionStatus = "pending" | "approved" | "rejected";

export type OrderActionRequest = {
  id: string;
  orderId: string;
  kind: OrderActionKind;
  requestedBy: string;
  reason: string;
  status: OrderActionStatus;
  respondedBy: string | null;
  responseReason: string | null;
  createdAt: string;
  respondedAt: string | null;
};

type OrderActionRow = {
  id: string;
  order_id: string;
  kind: OrderActionKind;
  requested_by: string;
  reason: string;
  status: OrderActionStatus;
  responded_by: string | null;
  response_reason: string | null;
  created_at: Date | string;
  responded_at: Date | string | null;
};

function fmt(raw: Date | string | null): string | null {
  if (raw == null) return null;
  return raw instanceof Date ? raw.toISOString().replace("T", " ").slice(0, 19) : String(raw);
}

function mapRow(r: OrderActionRow): OrderActionRequest {
  return {
    id: r.id,
    orderId: r.order_id,
    kind: r.kind,
    requestedBy: r.requested_by,
    reason: r.reason,
    status: r.status,
    respondedBy: r.responded_by,
    responseReason: r.response_reason,
    createdAt: fmt(r.created_at) ?? "",
    respondedAt: fmt(r.responded_at),
  };
}

export async function listOrderActionRequests(orderId: string): Promise<OrderActionRequest[]> {
  const pool = await getPool();
  const { rows } = await pool.query<OrderActionRow>(
    `SELECT id, order_id, kind, requested_by, reason, status, responded_by, response_reason, created_at, responded_at
     FROM order_action_requests
     WHERE order_id = $1
     ORDER BY created_at ASC`,
    [orderId],
  );
  return rows.map((r) => mapRow(r));
}

export async function createOrderActionRequest(input: {
  orderId: string;
  actorUserId: string;
  kind: OrderActionKind;
  reason?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const order = await getOrderDetailById(input.orderId);
  if (!order) return { ok: false, error: "Siparis bulunamadi." };
  if (order.cancelledAt) return { ok: false, error: "Bu siparis zaten iptal edilmis." };

  const isBuyer = order.buyerId === input.actorUserId;
  const isSeller = order.sellerId === input.actorUserId;
  if (!isBuyer && !isSeller) return { ok: false, error: "Erisim yok." };

  if (input.kind === "complete_sale" && !isSeller) {
    return { ok: false, error: "Satis tamamlama talebini yalnizca satici acabilir." };
  }
  if (input.kind === "cancel_by_seller" && !isSeller) {
    return { ok: false, error: "Iptal talebini yalnizca satici acabilir." };
  }
  if (input.kind === "cancel_by_buyer" && !isBuyer) {
    return { ok: false, error: "Iptal talebini yalnizca alici acabilir." };
  }

  const reason = (input.reason ?? "").trim().slice(0, 2000);
  if ((input.kind === "cancel_by_buyer" || input.kind === "cancel_by_seller") && reason.length < 4) {
    return { ok: false, error: "Iptal talebi icin en az 4 karakter gerekce girin." };
  }

  const pool = await getPool();
  const { rows: pendingRows } = await pool.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c
     FROM order_action_requests
     WHERE order_id = $1 AND kind = $2 AND status = 'pending'`,
    [input.orderId, input.kind],
  );
  const pending = Number.parseInt(pendingRows[0]?.c ?? "0", 10) || 0;
  if (pending > 0) return { ok: false, error: "Bu islem icin bekleyen bir talep zaten var." };

  const id = randomBytes(12).toString("hex");
  await pool.query(
    `INSERT INTO order_action_requests (id, order_id, kind, requested_by, reason, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')`,
    [id, input.orderId, input.kind, input.actorUserId, reason],
  );
  return { ok: true };
}

export async function respondOrderActionRequest(input: {
  requestId: string;
  actorUserId: string;
  approve: boolean;
  responseReason?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const pool = await getPool();
  const { rows } = await pool.query<OrderActionRow>(
    `SELECT id, order_id, kind, requested_by, reason, status, responded_by, response_reason, created_at, responded_at
     FROM order_action_requests
     WHERE id = $1`,
    [input.requestId],
  );
  const req = rows[0];
  if (!req) return { ok: false, error: "Talep bulunamadi." };
  if (req.status !== "pending") return { ok: false, error: "Bu talep zaten sonuclandi." };

  const order = await getOrderDetailById(req.order_id);
  if (!order) return { ok: false, error: "Siparis bulunamadi." };
  if (order.cancelledAt) return { ok: false, error: "Bu siparis zaten iptal edilmis." };
  const isBuyer = order.buyerId === input.actorUserId;
  const isSeller = order.sellerId === input.actorUserId;
  if (!isBuyer && !isSeller) return { ok: false, error: "Erisim yok." };
  if (req.requested_by === input.actorUserId) return { ok: false, error: "Kendi talebinizi yanitlayamazsiniz." };

  const responseReason = (input.responseReason ?? "").trim().slice(0, 2000);
  if (!input.approve && responseReason.length < 4) {
    return { ok: false, error: "Itiraz icin en az 4 karakter gerekce girin." };
  }

  const isCancel = req.kind === "cancel_by_buyer" || req.kind === "cancel_by_seller";

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Siparisi kilitle ve guncel iptal durumunu teyit et.
    const { rows: orderLockRows } = await client.query<{ cancelled_at: Date | null; price_tl: number; buyer_id: string }>(
      `SELECT cancelled_at, price_tl, buyer_id FROM orders WHERE id = $1 FOR UPDATE`,
      [req.order_id],
    );
    const lockedOrder = orderLockRows[0];
    if (!lockedOrder) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Siparis bulunamadi." };
    }
    if (lockedOrder.cancelled_at) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Bu siparis zaten iptal edilmis." };
    }

    // 1. Talep durumunu güncelle
    await client.query(
      `UPDATE order_action_requests
       SET status = $2,
           responded_by = $3,
           response_reason = $4,
           responded_at = now()
       WHERE id = $1`,
      [input.requestId, input.approve ? "approved" : "rejected", input.actorUserId, responseReason || null],
    );

    // 2. İptal onaylandıysa: siparişi iptal et + alıcıya iade
    if (input.approve && isCancel) {
      // Siparişi iptal et
      await client.query(
        `UPDATE orders SET cancelled_at = now() WHERE id = $1`,
        [req.order_id],
      );

      // Alıcının bakiyesini kilitle
      const { rows: balRows } = await client.query<{ balance_tl: number }>(
        `SELECT balance_tl FROM users WHERE id = $1 FOR UPDATE`,
        [lockedOrder.buyer_id],
      );
      const currentBalance = Number(balRows[0]?.balance_tl ?? 0);
      const refundAmount = Number(lockedOrder.price_tl);
      const newBalance = currentBalance + refundAmount;

      // Bakiyeyi güncelle
      await client.query(
        `UPDATE users SET balance_tl = $1 WHERE id = $2`,
        [newBalance, lockedOrder.buyer_id],
      );

      // Deftere iade kaydı
      await insertLedger(client, lockedOrder.buyer_id, "refund", refundAmount, newBalance, {
        orderId: req.order_id,
        reason: "iptal_onaylandi",
      });

      // Diger bekleyen iptal/tamamlama taleplerini kapanmis siparis nedeniyle reddet.
      await client.query(
        `UPDATE order_action_requests
         SET status = 'rejected',
             responded_by = $2,
             response_reason = COALESCE(response_reason, 'Siparis iptal edildigi icin otomatik kapatildi.'),
             responded_at = now()
         WHERE order_id = $1 AND status = 'pending' AND id <> $3`,
        [req.order_id, input.actorUserId, input.requestId],
      );
    }

    await client.query("COMMIT");
    return { ok: true };
  } catch (e: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
