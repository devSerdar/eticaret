"use server";

import { redirect } from "next/navigation";
import { createOrderFromPurchase } from "@/lib/orders";
import { getSession } from "@/lib/session";

export async function completeMockPurchaseAction(input: {
  listingId: string;
}): Promise<{ error: string } | void> {
  const session = await getSession();
  if (!session) return { error: "Satin almak icin giris yapmalisiniz." };

  const r = await createOrderFromPurchase({ buyerId: session.userId, listingId: input.listingId });
  if (!r.ok) return { error: r.error };

  redirect(`/siparis/${encodeURIComponent(r.orderId)}`);
}
