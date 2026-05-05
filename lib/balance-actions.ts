"use server";

import { findUserById, simulateTopUp } from "@/lib/demo-auth-store";
import { getSession } from "@/lib/session";

export async function simulateTopUpAction(_prev: unknown, formData: FormData): Promise<{ error?: string; balanceTL?: number }> {
  const session = await getSession();
  if (!session) return { error: "Oturum gerekli." };
  const me = await findUserById(session.userId);
  if (me?.bannedAt) return { error: "Hesabiniz yasakli; bakiye yukleyemezsiniz." };
  const raw = String(formData.get("amount") ?? "");
  const amount = Number.parseInt(raw, 10);
  if (!Number.isFinite(amount)) return { error: "Gecerli bir tutar girin." };
  const consent = formData.get("consent") === "on";
  if (!consent) return { error: "Simulasyon kosullarini onaylamalisiniz." };
  const r = await simulateTopUp(session.userId, amount);
  if (!r.ok) return { error: r.error };
  return { balanceTL: r.balanceTL };
}
