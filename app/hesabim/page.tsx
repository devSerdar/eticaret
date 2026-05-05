import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import DemoBalanceTopUp from "@/components/DemoBalanceTopUp";
import HesabimLedger from "@/components/HesabimLedger";
import HesabimSectionNav from "@/components/HesabimSectionNav";
import { findUserById, getBalanceLedger } from "@/lib/demo-auth-store";
import type { BalanceLedgerKind } from "@/lib/db";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Hesabim | OyunTicaret",
};

const KIND_TR: Record<BalanceLedgerKind, string> = {
  initial_balance: "Baslangic bakiyesi",
  topup_simulated: "Bakiye yukleme (sim.)",
  purchase: "Satin alma",
  demo_adjust: "Demo duzeltme",
};

function accountInitial(displayName: string, email: string): string {
  const c = displayName.trim().charAt(0) || email.trim().charAt(0) || "?";
  return c.toLocaleUpperCase("tr-TR");
}

export default async function HesabimPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=%2Fhesabim");

  const user = await findUserById(session.userId);
  if (!user) redirect("/login?next=%2Fhesabim");

  const demoTopUp = process.env.MOCK_BAKIYE_DEMOSU === "1";
  const ledger = await getBalanceLedger(user.id, 25);
  const balanceFmt = user.balanceTL.toLocaleString("tr-TR");
  const memberSinceLabel = user.memberSince
    ? user.memberSince.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const lastTx = ledger[0];
  const creditCount = ledger.filter((r) => r.delta_tl > 0).length;
  const debitCount = ledger.filter((r) => r.delta_tl < 0).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <header className="flex flex-col gap-6 border-b border-slate-200/90 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Hesap merkezi</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Hesabim</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            Bakiye, hareketler ve hesap bilgileriniz tek ekranda. Simule yukleme aktif; gercek odeme entegrasyonu
            sonraki adimda.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500" aria-label="Sayfa konumu">
          <Link href="/ilanlar" scroll={false} className="font-medium text-indigo-700 hover:text-indigo-900 hover:underline">
            Ilanlar
          </Link>
          <span className="text-slate-300" aria-hidden>
            /
          </span>
          <span className="font-medium text-slate-800">Hesabim</span>
        </nav>
      </header>

      <div className="mt-10 lg:grid lg:grid-cols-12 lg:gap-10 lg:items-start">
        <aside className="lg:col-span-3 lg:sticky lg:top-24 lg:self-start">
          <HesabimSectionNav showDemo={demoTopUp} />
        </aside>

        <div className="lg:col-span-9 space-y-12 lg:space-y-14">
          <section id="hesap-ozeti" className="scroll-mt-24">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <span
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-bold text-white shadow-lg"
                    aria-hidden
                  >
                    {accountInitial(user.displayName, user.email)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{user.displayName}</h2>
                      {memberSinceLabel ? (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                          Uye: {memberSinceLabel}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 truncate text-sm text-slate-600" title={user.email}>
                      {user.email}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-slate-600">
                      Gorunen adiniz ilan ve mesajlarda kullanilir. Sifre degisimi sonraki fazda eklenecek.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href="/bakiye/yukle"
                        scroll={false}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800"
                      >
                        Bakiye yukle
                      </Link>
                      <Link
                        href="/ilanlar"
                        scroll={false}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Ilanlara git
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3 lg:col-span-1 lg:grid-cols-1">
                <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 shadow-sm ring-1 ring-slate-900/[0.02]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Kayitli hareket</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{ledger.length}</p>
                  <p className="mt-1 text-xs text-slate-600">Son 25 kayit listelenir.</p>
                </div>
                <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 shadow-sm ring-1 ring-slate-900/[0.02]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Giris / Cikis</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-800">{creditCount}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    <span className="font-semibold text-rose-700">{debitCount}</span> dusus
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-5 shadow-sm ring-1 ring-slate-900/[0.02] sm:col-span-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Son islem</p>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-800">
                    {lastTx ? (KIND_TR[lastTx.kind as BalanceLedgerKind] ?? lastTx.kind) : "—"}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-slate-500">{lastTx ? lastTx.created_at : "Henuz yok"}</p>
                </div>
              </div>
            </div>
          </section>

          <section id="cuzdan" className="scroll-mt-24">
            <h2 className="sr-only">Cuzdan</h2>
            <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl ring-1 ring-slate-900/60">
              <div
                className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(52,211,153,0.35),transparent)]"
                aria-hidden
              />
              <div className="relative px-6 py-8 sm:px-10 sm:py-10">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400/90">Platform bakiyesi</p>
                    <p className="mt-3 flex flex-wrap items-baseline gap-2">
                      <span className="text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">{balanceFmt}</span>
                      <span className="text-lg font-semibold text-slate-400">TL</span>
                    </p>
                    <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-400">
                      Satin alma tutari onceden yuklediginiz bakiyeden dusulur. Hareketler asagida; PSP ile gercek yukleme
                      sirada.
                    </p>
                  </div>
                  <Link
                    href="/bakiye/yukle"
                    scroll={false}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:bg-emerald-50"
                  >
                    Bakiye yukle
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section id="hareketler" className="scroll-mt-24">
            <HesabimLedger ledger={ledger} kindTr={KIND_TR} />
          </section>

          {demoTopUp ? (
            <section id="demo-bakiye" className="scroll-mt-24">
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Gelistirici araci</h2>
              <p className="mt-1 text-sm text-slate-600">Yalnizca demo ortaminda; gercek odeme yok.</p>
              <div className="mt-4">
                <DemoBalanceTopUp />
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
