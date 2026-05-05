import type { Metadata } from "next";
import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Kayit Ol | OyunTicaret",
  description: "OyunTicaret hesabi olusturun",
};

function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/ilanlar";
  return next;
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const nextPath = safeNext(sp.next);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-14 sm:py-16">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Kayit ol</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Bakiye yukleme akisi sonraki adimda eklenecek. Kayit sonrasi bakiye{" "}
        <span className="font-semibold text-slate-800">{Number.parseInt(process.env.MOCK_INITIAL_BALANCE_TL ?? "0", 10) || 0} TL</span>{" "}
        (MOCK_INITIAL_BALANCE_TL) ile baslar. Gelistirme icin{" "}
        <span className="font-mono text-xs">MOCK_BAKIYE_DEMOSU=1</span> ile{" "}
        <Link href="/hesabim" className="font-semibold text-indigo-700 hover:underline">
          Hesabim
        </Link>{" "}
        uzerinden demo yukleme acilir.
      </p>
      <div className="mt-8 rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-[var(--shadow-md)] ring-1 ring-slate-900/[0.04] sm:p-8">
        <RegisterForm nextPath={nextPath} />
      </div>
    </div>
  );
}
