import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Giris | OyunTicaret",
  description: "OyunTicaret hesabiniza girin",
};

function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/ilanlar";
  return next;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const sp = await searchParams;
  const nextPath = safeNext(sp.next);
  const banner =
    sp.reason === "yasakli"
      ? "Hesabiniz yasaklanmistir. Gerekirse destek ile iletisime gecin."
      : undefined;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-14 sm:py-16">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Giris yap</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Satin alma ve bakiye islemleri icin hesabiniza girin. Kayitli degilseniz{" "}
        <Link href={`/register?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-indigo-700 hover:underline">
          kayit olun
        </Link>
        .
      </p>
      <div className="mt-8 rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-[var(--shadow-md)] ring-1 ring-slate-900/[0.04] sm:p-8">
        <LoginForm nextPath={nextPath} banner={banner} />
      </div>
    </div>
  );
}
