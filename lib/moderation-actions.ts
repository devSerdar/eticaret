"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin-auth";
import { resolveModerationReport } from "@/lib/moderation";
import { getSession } from "@/lib/session";

export async function resolveModerationAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !isAdminEmail(session.email)) redirect("/");

  const reportId = String(formData.get("reportId") ?? "").trim();
  const adminNote = String(formData.get("adminNote") ?? "").trim();
  if (!reportId) redirect("/admin/moderasyon");

  const r = await resolveModerationReport(reportId, adminNote || "(not yok)");
  if (!r.ok) redirect(`/admin/moderasyon?hata=${encodeURIComponent(r.error)}`);

  revalidatePath("/admin/moderasyon");
  redirect("/admin/moderasyon");
}
