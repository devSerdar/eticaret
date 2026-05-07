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
  title: "Hesabım | OyunTicaret",
};

const KIND_TR: Record<BalanceLedgerKind, string> = {
  initial_balance: "Başlangıç bakiyesi",
  topup_simulated: "Bakiye yükleme (sim.)",
  purchase: "Satın alma",
  demo_adjust: "Demo düzeltme",
  refund: "İptal iadesi",
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
  const orderSummaries = await listUserOrderSummaries(user.id, 200, "all");
  const balanceFmt = user.balanceTL.toLocaleString("tr-TR");
  const memberSinceLabel = user.memberSince
    ? user.memberSince.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const activeListings = ownListings.filter((l) => l.online);
  const pastListings = ownListings.filter((l) => !l.online);

  return (
    <div className="hesabim-page">
      {/* Ambient background blobs */}
      <div className="hesabim-bg-blob hesabim-bg-blob--1" aria-hidden />
      <div className="hesabim-bg-blob hesabim-bg-blob--2" aria-hidden />
      <div className="hesabim-bg-blob hesabim-bg-blob--3" aria-hidden />

      <div className="hesabim-inner">

        {/* ── HERO HEADER ── */}
        <header className="hesabim-hero">
          <div className="hesabim-hero__left">
            <div className="hesabim-avatar">
              {accountInitial(user.displayName, user.email)}
              <span className="hesabim-avatar__ring" aria-hidden />
            </div>
            <div>
              <p className="hesabim-hero__eyebrow">Hesap Paneli</p>
              <h1 className="hesabim-hero__name">{user.displayName}</h1>
              <p className="hesabim-hero__email">{user.email}</p>
              {memberSinceLabel && (
                <p className="hesabim-hero__since">
                  <span className="hesabim-badge hesabim-badge--muted">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                    Üye: {memberSinceLabel}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="hesabim-hero__actions">
            <Link href="/ilanlar" scroll={false} className="hesabim-btn hesabim-btn--ghost">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 3h2l.4 2M7 13h10l4-8H5.4"/><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
              İlanlar
            </Link>
            <Link href="/bakiye/yukle" scroll={false} className="hesabim-btn hesabim-btn--primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 5v14M5 12l7-7 7 7"/></svg>
              Bakiye Yükle
            </Link>
          </div>
        </header>

        {/* ── STAT CARDS ── */}
        <section className="hesabim-stats" aria-label="Özet istatistikler">
          {/* Bakiye */}
          <article className="hesabim-stat hesabim-stat--balance">
            <div className="hesabim-stat__icon hesabim-stat__icon--gold">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 6v2m0 8v2m-4-6h8"/></svg>
            </div>
            <div>
              <p className="hesabim-stat__label">Bakiye</p>
              <p className="hesabim-stat__value hesabim-stat__value--gold">{balanceFmt} <span className="hesabim-stat__unit">TL</span></p>
              <p className="hesabim-stat__sub">Kullanılabilir bakiye</p>
            </div>
          </article>

          {/* İlanlar */}
          <article className="hesabim-stat hesabim-stat--listings">
            <div className="hesabim-stat__icon hesabim-stat__icon--indigo">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            </div>
            <div>
              <p className="hesabim-stat__label">İlanlarım</p>
              <p className="hesabim-stat__value">{ownListings.length}</p>
              <p className="hesabim-stat__sub">
                <span className="hesabim-dot hesabim-dot--green" /> {activeListings.length} aktif
                &nbsp;·&nbsp;
                <span className="hesabim-dot hesabim-dot--muted" /> {pastListings.length} geçmiş
              </p>
            </div>
          </article>

          {/* Siparişler */}
          <article className="hesabim-stat hesabim-stat--orders">
            <div className="hesabim-stat__icon hesabim-stat__icon--teal">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>
            </div>
            <div>
              <p className="hesabim-stat__label">Siparişler</p>
              <p className="hesabim-stat__value">{orderSummaries.length}</p>
              <p className="hesabim-stat__sub">Aktif & geçmiş kayıtlar</p>
            </div>
          </article>

          {/* Hareket */}
          <article className="hesabim-stat hesabim-stat--ledger">
            <div className="hesabim-stat__icon hesabim-stat__icon--violet">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div>
              <p className="hesabim-stat__label">İşlemler</p>
              <p className="hesabim-stat__value">{ledger.length}</p>
              <p className="hesabim-stat__sub">Son 25 hareket kaydı</p>
            </div>
          </article>
        </section>

        {/* ── AKTİF SİPARİŞLER ── */}
        <section className="hesabim-panel" aria-labelledby="orders-heading">
          <div className="hesabim-panel__header">
            <div>
              <div className="hesabim-panel__title-row">
                <span className="hesabim-panel__dot hesabim-panel__dot--blue" aria-hidden />
                <h2 id="orders-heading" className="hesabim-panel__title">Siparişlerim</h2>
                <span className="hesabim-badge hesabim-badge--count">{orderSummaries.length}</span>
              </div>
              <p className="hesabim-panel__desc">Aktif, tamamlanan ve iptal edilmiş siparişleriniz.</p>
            </div>
            <Link href="/siparislerim" scroll={false} className="hesabim-btn hesabim-btn--ghost hesabim-btn--sm">
              Tümünü gör →
            </Link>
          </div>
          <div className="hesabim-panel__body">
            <HesabimActiveOrdersPanel
              orders={orderSummaries}
              currentUserId={session.userId}
              currentUserDisplayName={session.displayName}
              defaultTab="active"
            />
          </div>
        </section>

        {/* ── İLANLARIM ── */}
        <section className="hesabim-panel" aria-labelledby="listings-heading">
          <div className="hesabim-panel__header">
            <div>
              <div className="hesabim-panel__title-row">
                <span className="hesabim-panel__dot hesabim-panel__dot--indigo" aria-hidden />
                <h2 id="listings-heading" className="hesabim-panel__title">İlanlarım</h2>
                <span className="hesabim-badge hesabim-badge--count">{ownListings.length}</span>
              </div>
              <p className="hesabim-panel__desc">Aktif ve geçmiş ilanlarınızı buradan yönetin.</p>
            </div>
            <Link href="/ilanlar/yeni" scroll={false} className="hesabim-btn hesabim-btn--primary hesabim-btn--sm">
              + Yeni İlan
            </Link>
          </div>
          <div className="hesabim-panel__body">
            <div className="hesabim-listings-grid">
              {/* Aktif */}
              <div className="hesabim-listings-col hesabim-listings-col--active">
                <div className="hesabim-listings-col__head">
                  <span className="hesabim-dot hesabim-dot--green" />
                  <span className="hesabim-listings-col__label">Aktif İlanlar</span>
                  <span className="hesabim-badge hesabim-badge--green">{activeListings.length}</span>
                </div>
                {activeListings.length === 0 ? (
                  <div className="hesabim-empty">
                    <p className="hesabim-empty__text">Henüz aktif ilanın yok.</p>
                    <Link href="/ilanlar/yeni" scroll={false} className="hesabim-btn hesabim-btn--ghost hesabim-btn--xs">İlan Oluştur</Link>
                  </div>
                ) : (
                  <ul className="hesabim-listing-list">
                    {activeListings.map((l) => (
                      <li key={l.id} className="hesabim-listing-item hesabim-listing-item--active">
                        <Link href={`/ilanlar/${l.id}`} scroll={false} className="hesabim-listing-item__title">
                          {l.title}
                        </Link>
                        <p className="hesabim-listing-item__meta">
                          {l.serverSlug} / {l.marketSlug}
                        </p>
                        <div className="hesabim-listing-item__footer">
                          <span className="hesabim-listing-item__price">{l.price.toLocaleString("tr-TR")} TL</span>
                          {l.hiddenByAdmin && (
                            <span className="hesabim-badge hesabim-badge--warn">Yönetici gizledi</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Geçmiş */}
              <div className="hesabim-listings-col hesabim-listings-col--past">
                <div className="hesabim-listings-col__head">
                  <span className="hesabim-dot hesabim-dot--muted" />
                  <span className="hesabim-listings-col__label">Geçmiş İlanlar</span>
                  <span className="hesabim-badge hesabim-badge--muted">{pastListings.length}</span>
                </div>
                {pastListings.length === 0 ? (
                  <div className="hesabim-empty">
                    <p className="hesabim-empty__text">Geçmiş ilanın yok.</p>
                  </div>
                ) : (
                  <ul className="hesabim-listing-list">
                    {pastListings.map((l) => (
                      <li key={l.id} className="hesabim-listing-item hesabim-listing-item--past">
                        <p className="hesabim-listing-item__title hesabim-listing-item__title--muted">{l.title}</p>
                        <p className="hesabim-listing-item__meta">
                          {l.serverSlug} / {l.marketSlug}
                        </p>
                        <div className="hesabim-listing-item__footer">
                          <span className="hesabim-listing-item__price hesabim-listing-item__price--muted">
                            {l.price.toLocaleString("tr-TR")} TL
                          </span>
                          {l.hiddenByAdmin && (
                            <span className="hesabim-badge hesabim-badge--warn">Yönetici gizledi</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── HAREKET GEÇMİŞİ ── */}
        <section className="hesabim-panel" aria-labelledby="ledger-heading">
          <div className="hesabim-panel__header">
            <div>
              <div className="hesabim-panel__title-row">
                <span className="hesabim-panel__dot hesabim-panel__dot--violet" aria-hidden />
                <h2 id="ledger-heading" className="hesabim-panel__title">Hareket Geçmişi</h2>
                <span className="hesabim-badge hesabim-badge--count">{ledger.length}</span>
              </div>
              <p className="hesabim-panel__desc">Kronolojik kayıtlar; tutar ve bakiye sonrası.</p>
            </div>
          </div>
          <div className="hesabim-panel__body">
            <HesabimLedger ledger={ledger} kindTr={KIND_TR} />
          </div>
        </section>

        {/* ── DEMO ARAÇ ── */}
        {demoTopUp && (
          <section className="hesabim-panel hesabim-panel--demo" aria-labelledby="demo-heading">
            <div className="hesabim-panel__header">
              <div>
                <div className="hesabim-panel__title-row">
                  <span className="hesabim-panel__dot hesabim-panel__dot--amber" aria-hidden />
                  <h2 id="demo-heading" className="hesabim-panel__title">Geliştirici Aracı</h2>
                  <span className="hesabim-badge hesabim-badge--warn">DEMO</span>
                </div>
                <p className="hesabim-panel__desc">Yalnızca demo ortamında geçerlidir; gerçek ödeme yok.</p>
              </div>
            </div>
            <div className="hesabim-panel__body">
              <DemoBalanceTopUp />
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
