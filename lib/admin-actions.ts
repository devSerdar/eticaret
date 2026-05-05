"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin-auth";
import { getSession } from "@/lib/session";
import { getPool } from "@/lib/db";

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
