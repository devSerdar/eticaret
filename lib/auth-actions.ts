"use server";

import { redirect } from "next/navigation";
import { addMockBalance, findUserById, registerDemoUser, verifyDemoLogin } from "@/lib/demo-auth-store";
import { clearSessionCookie, getSession, setSessionCookie } from "@/lib/session";

function safeNextPath(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/ilanlar";
  return next;
}

export async function loginAction(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));
  const user = await verifyDemoLogin(email, password);
  if (user === "banned") return { error: "Hesabiniz yasaklanmistir. Destek ile iletisime gecin." };
  if (!user) return { error: "E-posta veya sifre hatali." };
  await setSessionCookie({ userId: user.id, email: user.email, displayName: user.displayName });
  redirect(next);
}

export async function registerAction(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));
  const initial = Number.parseInt(process.env.MOCK_INITIAL_BALANCE_TL ?? "0", 10);
  const initialBalanceTL = Number.isFinite(initial) ? initial : 0;

  const r = await registerDemoUser({ email, password, displayName, initialBalanceTL });
  if (!r.ok) return { error: r.error };
  await setSessionCookie({
    userId: r.user.id,
    email: r.user.email,
    displayName: r.user.displayName,
  });
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}

export async function addDemoBalanceAction(formData: FormData): Promise<{ error?: string; balanceTL?: number }> {
  if (process.env.MOCK_BAKIYE_DEMOSU !== "1") {
    return { error: "Demo bakiye yuklemesi kapali (MOCK_BAKIYE_DEMOSU=1 ile acilir)." };
  }
  const s = await getSession();
  if (!s) return { error: "Oturum yok." };
  const me = await findUserById(s.userId);
  if (me?.bannedAt) return { error: "Hesabiniz yasakli." };
  const amount = Number.parseInt(String(formData.get("amount") ?? "500"), 10);
  const r = await addMockBalance(s.userId, Number.isFinite(amount) ? amount : 500);
  if (!r.ok) return { error: r.error };
  return { balanceTL: r.balanceTL };
}
