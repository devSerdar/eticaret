import { randomBytes } from "crypto";
import { getPool } from "@/lib/db";
import { insertLedger } from "@/lib/demo-auth-store";
import { createMockOrderRef } from "@/lib/mock-order";

type ListingLockRow = {
  id: string;
  title: string;
  price: number;
  seller_user_id: string | null;
  hidden_by_admin: boolean;
};

export type OrderDetail = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  priceTl: number;
  createdAt: string;
  cancelledAt: string | null;
  buyerDisplayName: string;
  sellerDisplayName: string;
};

export function userCanAccessOrder(sessionUserId: string, order: OrderDetail): boolean {
  return sessionUserId === order.buyerId || sessionUserId === order.sellerId;
}

export async function getOrderDetailById(orderId: string): Promise<OrderDetail | undefined> {
  const pool = await getPool();
  const { rows } = await pool.query<{
    id: string;
    listing_id: string;
    buyer_id: string;
    seller_id: string;
    price_tl: number;
    created_at: Date;
    cancelled_at: Date | null;
    buyer_display_name: string;
    seller_display_name: string;
  }>(
    `SELECT o.id, o.listing_id, o.buyer_id, o.seller_id, o.price_tl, o.created_at, o.cancelled_at,
            b.display_name AS buyer_display_name,
            s.display_name AS seller_display_name
     FROM orders o
     JOIN users b ON b.id = o.buyer_id
     JOIN users s ON s.id = o.seller_id
     WHERE o.id = $1`,
    [orderId],
  );
  const r = rows[0];
  if (!r) return undefined;
  const raw = r.created_at;
  const created =
    raw instanceof Date ? raw.toISOString().replace("T", " ").slice(0, 19) : String(raw);
  const cancelledRaw = r.cancelled_at;
  const cancelledAt =
    cancelledRaw == null
      ? null
      : cancelledRaw instanceof Date
        ? cancelledRaw.toISOString().replace("T", " ").slice(0, 19)
        : String(cancelledRaw);
  return {
    id: r.id,
    listingId: r.listing_id,
    buyerId: r.buyer_id,
    sellerId: r.seller_id,
    priceTl: Number(r.price_tl),
    createdAt: created,
    cancelledAt,
    buyerDisplayName: r.buyer_display_name,
    sellerDisplayName: r.seller_display_name,
  };
}

/** Tamamlanma talebi onaylanmis siparis (yonetici iptali engellenir). */
export async function isOrderSaleCompleted(orderId: string): Promise<boolean> {
  const pool = await getPool();
  const { rows } = await pool.query<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM order_action_requests ar
       WHERE ar.order_id = $1
         AND ar.kind = 'complete_sale'
         AND ar.status = 'approved'
     ) AS ok`,
    [orderId],
  );
  return Boolean(rows[0]?.ok);
}

/**
 * Bakiye dusumu, deftere yazim, siparis ve ilk satici mesajini tek islemde olusturur.
 */
export async function createOrderFromPurchase(input: {
  buyerId: string;
  listingId: string;
}): Promise<{ ok: true; orderId: string } | { ok: false; error: string }> {
  const pool = await getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: lr } = await client.query<ListingLockRow>(
      `SELECT id, title, price::int AS price, seller_user_id, COALESCE(hidden_by_admin, false) AS hidden_by_admin
       FROM listings WHERE id = $1 FOR UPDATE`,
      [input.listingId],
    );
    const listing = lr[0];
    if (!listing) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Ilan bulunamadi." };
    }
    if (listing.hidden_by_admin) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Bu ilan yonetici tarafindan yayından kaldirilmistir." };
    }
    if (!listing.seller_user_id) {
      await client.query("ROLLBACK");
      return {
        ok: false,
        error: "Ilan saticisi hesapla eslesmemis. Lutfen `npm run seed:listings` veya destek ile iletisime gecin.",
      };
    }
    const sellerId = listing.seller_user_id;
    const price = Number(listing.price);
    if (sellerId === input.buyerId) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Kendi ilaninizi satin alamazsiniz." };
    }

    const { rows: sr } = await client.query<{ banned_at: Date | null }>(
      `SELECT banned_at FROM users WHERE id = $1 FOR UPDATE`,
      [sellerId],
    );
    const sellerRow = sr[0];
    if (!sellerRow) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Satici bulunamadi." };
    }
    if (sellerRow.banned_at) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Satici hesabi su an aktif degil." };
    }

    const { rows: br } = await client.query<{
      balance_tl: number;
      display_name: string;
      banned_at: Date | null;
    }>(`SELECT balance_tl, display_name, banned_at FROM users WHERE id = $1 FOR UPDATE`, [input.buyerId]);
    const buyer = br[0];
    if (!buyer) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Hesap bulunamadi." };
    }
    if (buyer.banned_at) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Hesabiniz yasakli; satin alma yapamazsiniz." };
    }
    const bal = Number(buyer.balance_tl);
    if (bal < price) {
      await client.query("ROLLBACK");
      return { ok: false, error: "Yetersiz bakiye. Once bakiye yuklemelisiniz." };
    }

    const orderId = createMockOrderRef();

    await client.query(`UPDATE users SET balance_tl = balance_tl - $1 WHERE id = $2`, [price, input.buyerId]);
    const { rows: ar } = await client.query<{ balance_tl: number }>(`SELECT balance_tl FROM users WHERE id = $1`, [
      input.buyerId,
    ]);
    const after = Number(ar[0]!.balance_tl);

    await insertLedger(client, input.buyerId, "purchase", -price, after, {
      listingId: listing.id,
      title: listing.title,
      orderId,
    });

    await client.query(`UPDATE users SET balance_tl = balance_tl + $1 WHERE id = $2`, [price, sellerId]);
    const { rows: sellerBalRows } = await client.query<{ balance_tl: number }>(
      `SELECT balance_tl FROM users WHERE id = $1`,
      [sellerId],
    );
    const sellerAfter = Number(sellerBalRows[0]!.balance_tl);
    await insertLedger(client, sellerId, "sale_proceeds", price, sellerAfter, {
      listingId: listing.id,
      title: listing.title,
      orderId,
      buyerId: input.buyerId,
    });

    await client.query(
      `INSERT INTO orders (id, listing_id, buyer_id, seller_id, price_tl)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, listing.id, input.buyerId, sellerId, price],
    );

    const welcomeBody = `Merhaba ${buyer.display_name}, "${listing.title}" icin teslimata hazirim. Karakter adi ve teslim saatini buradan yazabilirsiniz.`;
    const msgId = randomBytes(12).toString("hex");
    await client.query(`INSERT INTO messages (id, order_id, sender_id, body) VALUES ($1, $2, $3, $4)`, [
      msgId,
      orderId,
      sellerId,
      welcomeBody,
    ]);

    await client.query("COMMIT");
    return { ok: true, orderId };
  } catch (e: unknown) {
    await client.query("ROLLBACK").catch(() => {});
    if (typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "23505") {
      return { ok: false, error: "Siparis olusturulamadi; tekrar deneyin." };
    }
    throw e;
  } finally {
    client.release();
  }
}

export type AdminOrderRow = {
  id: string;
  createdAt: string;
  priceTl: number;
  listingId: string;
  listingTitle: string;
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  sellerId: string;
  sellerEmail: string;
  sellerName: string;
  messageCount: number;
};

export type UserOrderSummary = {
  id: string;
  createdAt: string;
  listingId: string;
  listingTitle: string;
  priceTl: number;
  status: "active" | "completed" | "cancelled";
  role: "buyer" | "seller";
  counterpartyName: string;
  messageCount: number;
  unreadCount: number;
};

export async function listOrdersForAdmin(limit = 100): Promise<AdminOrderRow[]> {
  const pool = await getPool();
  const lim = Math.min(200, Math.max(1, Math.floor(limit)));
  const { rows } = await pool.query<{
    id: string;
    created_at: Date;
    price_tl: number;
    listing_id: string;
    listing_title: string;
    buyer_id: string;
    buyer_email: string;
    buyer_name: string;
    seller_id: string;
    seller_email: string;
    seller_name: string;
    message_count: string;
  }>(
    `SELECT o.id, o.created_at, o.price_tl, o.listing_id,
            l.title AS listing_title,
            o.buyer_id, b.email AS buyer_email, b.display_name AS buyer_name,
            o.seller_id, s.email AS seller_email, s.display_name AS seller_name,
            (SELECT COUNT(*)::text FROM messages m WHERE m.order_id = o.id) AS message_count
     FROM orders o
     JOIN listings l ON l.id = o.listing_id
     JOIN users b ON b.id = o.buyer_id
     JOIN users s ON s.id = o.seller_id
     ORDER BY o.created_at DESC
     LIMIT $1`,
    [lim],
  );
  return rows.map((r) => {
    const raw = r.created_at;
    const createdAt =
      raw instanceof Date ? raw.toISOString().replace("T", " ").slice(0, 19) : String(raw);
    return {
      id: r.id,
      createdAt,
      priceTl: Number(r.price_tl),
      listingId: r.listing_id,
      listingTitle: r.listing_title,
      buyerId: r.buyer_id,
      buyerEmail: r.buyer_email,
      buyerName: r.buyer_name,
      sellerId: r.seller_id,
      sellerEmail: r.seller_email,
      sellerName: r.seller_name,
      messageCount: Number.parseInt(r.message_count, 10) || 0,
    };
  });
}

export async function listOrdersInvolvingUser(userId: string, limit = 40): Promise<AdminOrderRow[]> {
  const pool = await getPool();
  const lim = Math.min(100, Math.max(1, Math.floor(limit)));
  const { rows } = await pool.query<{
    id: string;
    created_at: Date;
    price_tl: number;
    listing_id: string;
    listing_title: string;
    buyer_id: string;
    buyer_email: string;
    buyer_name: string;
    seller_id: string;
    seller_email: string;
    seller_name: string;
    message_count: string;
  }>(
    `SELECT o.id, o.created_at, o.price_tl, o.listing_id,
            l.title AS listing_title,
            o.buyer_id, b.email AS buyer_email, b.display_name AS buyer_name,
            o.seller_id, s.email AS seller_email, s.display_name AS seller_name,
            (SELECT COUNT(*)::text FROM messages m WHERE m.order_id = o.id) AS message_count
     FROM orders o
     JOIN listings l ON l.id = o.listing_id
     JOIN users b ON b.id = o.buyer_id
     JOIN users s ON s.id = o.seller_id
     WHERE o.buyer_id = $1 OR o.seller_id = $1
     ORDER BY o.created_at DESC
     LIMIT $2`,
    [userId, lim],
  );
  return rows.map((r) => {
    const raw = r.created_at;
    const createdAt =
      raw instanceof Date ? raw.toISOString().replace("T", " ").slice(0, 19) : String(raw);
    return {
      id: r.id,
      createdAt,
      priceTl: Number(r.price_tl),
      listingId: r.listing_id,
      listingTitle: r.listing_title,
      buyerId: r.buyer_id,
      buyerEmail: r.buyer_email,
      buyerName: r.buyer_name,
      sellerId: r.seller_id,
      sellerEmail: r.seller_email,
      sellerName: r.seller_name,
      messageCount: Number.parseInt(r.message_count, 10) || 0,
    };
  });
}

/** Kullanici paneli: aktif siparis ozeti (en guncel kayitlar). */
export async function listUserOrderSummaries(
  userId: string,
  limit = 12,
  status: "active" | "completed" | "cancelled" | "all" = "active",
): Promise<UserOrderSummary[]> {
  const pool = await getPool();
  const lim = Math.min(50, Math.max(1, Math.floor(limit)));
  const { rows } = await pool.query<{
    id: string;
    created_at: Date;
    listing_id: string;
    listing_title: string;
    price_tl: number;
    buyer_id: string;
    buyer_name: string;
    seller_id: string;
    seller_name: string;
    message_count: string;
    unread_count: string;
    order_status: "active" | "completed" | "cancelled";
  }>(
    `SELECT o.id, o.created_at, o.listing_id, l.title AS listing_title, o.price_tl,
            o.buyer_id, b.display_name AS buyer_name,
            o.seller_id, s.display_name AS seller_name,
            CASE
              WHEN o.cancelled_at IS NOT NULL THEN 'cancelled'
              WHEN EXISTS (
                SELECT 1
                FROM order_action_requests ar
                WHERE ar.order_id = o.id
                  AND ar.kind = 'complete_sale'
                  AND ar.status = 'approved'
              ) THEN 'completed'
              ELSE 'active'
            END AS order_status,
            (SELECT COUNT(*)::text FROM messages m WHERE m.order_id = o.id) AS message_count,
            (
              SELECT COUNT(*)::text
              FROM messages m2
              WHERE m2.order_id = o.id
                AND m2.sender_id <> $1
                AND NOT EXISTS (
                  SELECT 1
                  FROM message_reads mr
                  WHERE mr.message_id = m2.id AND mr.user_id = $1
                )
            ) AS unread_count
     FROM orders o
     JOIN listings l ON l.id = o.listing_id
     JOIN users b ON b.id = o.buyer_id
     JOIN users s ON s.id = o.seller_id
     WHERE (o.buyer_id = $1 OR o.seller_id = $1)
       AND (
         $2::text = 'all'
         OR (
           $2::text = 'cancelled' AND o.cancelled_at IS NOT NULL
         )
         OR (
           $2::text = 'completed'
           AND o.cancelled_at IS NULL
           AND EXISTS (
             SELECT 1
             FROM order_action_requests ar2
             WHERE ar2.order_id = o.id
               AND ar2.kind = 'complete_sale'
               AND ar2.status = 'approved'
           )
         )
         OR (
           $2::text = 'active'
           AND o.cancelled_at IS NULL
           AND NOT EXISTS (
             SELECT 1
             FROM order_action_requests ar3
             WHERE ar3.order_id = o.id
               AND ar3.kind = 'complete_sale'
               AND ar3.status = 'approved'
           )
         )
       )
     ORDER BY o.created_at DESC
     LIMIT $3`,
    [userId, status, lim],
  );
  return rows.map((r) => {
    const raw = r.created_at;
    const createdAt =
      raw instanceof Date ? raw.toISOString().replace("T", " ").slice(0, 19) : String(raw);
    const role: "buyer" | "seller" = r.buyer_id === userId ? "buyer" : "seller";
    const counterpartyName = role === "buyer" ? r.seller_name : r.buyer_name;
    return {
      id: r.id,
      createdAt,
      listingId: r.listing_id,
      listingTitle: r.listing_title,
      priceTl: Number(r.price_tl),
      status: r.order_status,
      role,
      counterpartyName,
      messageCount: Number.parseInt(r.message_count, 10) || 0,
      unreadCount: Number.parseInt(r.unread_count, 10) || 0,
    };
  });
}
