import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import BakiyeYukleForm from "@/components/BakiyeYukleForm";
import { findUserById } from "@/lib/demo-auth-store";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Bakiye yukle | OyunTicaret",
  description: "Platform bakiyesi yukleme (simulasyon)",
};

export default async function BakiyeYuklePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=%2Fbakiye%2Fyukle");

  const user = await findUserById(session.userId);
  if (!user) redirect("/login?next=%2Fbakiye%2Fyukle");

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-14 sm:py-16">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bakiye yukle</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Gercek odeme entegrasyonu (PSP) sonraki adimda eklenecek. Simdi yalnizca <strong>simule yukleme</strong> ile
        bakiyeniz artar; islem SQLite defterine yazilir.
      </p>
      <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
        Mevcut bakiye: <span className="font-bold text-emerald-800">{user.balanceTL} TL</span>
      </p>

      <div className="mt-8 rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-[var(--shadow-md)] ring-1 ring-slate-900/[0.04] sm:p-8">
        <BakiyeYukleForm />
      </div>

      <p className="mt-8 text-center text-sm">
        <Link href="/hesabim" scroll={false} className="font-semibold text-indigo-700 hover:underline">
          Hesabima don
        </Link>
      </p>
    </div>
  );
}
