import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import HesabimActiveOrdersPanel from "@/components/HesabimActiveOrdersPanel";
import DemoBalanceTopUp from "@/components/DemoBalanceTopUp";
import HesabimLedger from "@/components/HesabimLedger";
import { findUserById, getBalanceLedger } from "@/lib/demo-auth-store";
import type { BalanceLedgerKind } from "@/lib/db";
import { listListingsBySellerUserId } from "@/lib/listings";
import { listUserOrderSummaries } from "@/lib/orders";
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
  const ownListings = await listListingsBySellerUserId(user.id, 400);
  const activeOrders = await listUserOrderSummaries(user.id, 50);
  const balanceFmt = user.balanceTL.toLocaleString("tr-TR");
  const memberSinceLabel = user.memberSince
    ? user.memberSince.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const lastTx = ledger[0];
  const creditCount = ledger.filter((r) => r.delta_tl > 0).length;
  const debitCount = ledger.filter((r) => r.delta_tl < 0).length;
  const activeListings = ownListings.filter((l) => l.online);
  const pastListings = ownListings.filter((l) => !l.online);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-12">
      <header className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hesap paneli</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Hesabim</h1>
            <p className="mt-2 text-sm text-slate-600">Ilanlariniz, siparisleriniz ve bakiye hareketleriniz.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/ilanlar"
              scroll={false}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ilanlar
            </Link>
            <Link
              href="/bakiye/yukle"
              scroll={false}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Bakiye yukle
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Profil</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              {accountInitial(user.displayName, user.email)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900">{user.displayName}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          {memberSinceLabel ? <p className="mt-3 text-xs text-slate-500">Uye: {memberSinceLabel}</p> : null}
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bakiye</p>
          <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-slate-900">{balanceFmt} TL</p>
          <p className="mt-2 text-xs text-slate-500">Satin alma islemleri bu bakiyeden duser.</p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ilanlarim</p>
          <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">{ownListings.length}</p>
          <p className="mt-2 text-xs text-slate-500">
            {activeListings.length} aktif · {pastListings.length} gecmis
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Siparisler</p>
          <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">{activeOrders.length}</p>
          <p className="mt-2 text-xs text-slate-500">Mesajlasma kayitlariyla birlikte.</p>
        </article>
      </section>

      <section className="mt-10 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Aktif siparisler</h2>
            <p className="mt-1 text-sm text-slate-600">Karsilikli mesajlasma ve siparis takibi (son 50 kayit).</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {activeOrders.length} kayit
          </span>
        </div>

        <HesabimActiveOrdersPanel
          orders={activeOrders}
          currentUserId={session.userId}
          currentUserDisplayName={session.displayName}
        />
      </section>

      <section className="mt-10 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Ilanlarim</h2>
            <p className="mt-1 text-sm text-slate-600">Aktif ve gecmis ilanlarinizi bu alandan takip edebilirsiniz.</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {ownListings.length} toplam ilan
          </span>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Aktif ilanlar</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-900">{activeListings.length}</p>
            {activeListings.length === 0 ? (
              <p className="mt-3 text-sm text-emerald-900/80">Aktif ilanin yok.</p>
            ) : (
              <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {activeListings.map((l) => (
                  <li key={l.id} className="rounded-lg border border-emerald-200/70 bg-white/90 px-3 py-2">
                    <Link href={`/ilanlar/${l.id}`} scroll={false} className="font-semibold text-slate-900 hover:text-indigo-700 hover:underline">
                      {l.title}
                    </Link>
                    <p className="mt-1 text-xs text-slate-600">
                      {l.serverSlug} / {l.marketSlug} · {l.price.toLocaleString("tr-TR")} TL
                    </p>
                    {l.hiddenByAdmin ? (
                      <p className="mt-1 text-[11px] font-semibold text-amber-700">Yonetici tarafindan gizli</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Gecmis ilanlar</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{pastListings.length}</p>
            {pastListings.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">Gecmis ilanin yok.</p>
            ) : (
              <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {pastListings.map((l) => (
                  <li key={l.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <p className="font-medium text-slate-800">{l.title}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {l.serverSlug} / {l.marketSlug} · {l.price.toLocaleString("tr-TR")} TL · {l.createdAt}
                    </p>
                    {l.hiddenByAdmin ? (
                      <p className="mt-1 text-[11px] font-semibold text-amber-700">Yonetici tarafindan gizli</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="mt-10">
        <HesabimLedger ledger={ledger} kindTr={KIND_TR} />
      </section>

      {demoTopUp ? (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Gelistirici araci</h2>
          <p className="mt-1 text-sm text-slate-600">Yalnizca demo ortaminda; gercek odeme yok.</p>
          <div className="mt-4">
            <DemoBalanceTopUp />
          </div>
        </section>
      ) : null}
    </div>
  );
}
