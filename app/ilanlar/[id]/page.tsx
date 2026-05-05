import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GAME_MARKET_PLANS } from "@/lib/market-data";
import { getPvpMarketBySlug, getPvpServerBySlug } from "@/lib/ko-pvp-catalog";
import { getKoJobLabel } from "@/lib/ko-jobs";
import { findUserById } from "@/lib/demo-auth-store";
import { RESERVED_LISTING_ROUTE_IDS } from "@/lib/listing-route-guards";
import { getListingById } from "@/lib/listings";
import { getSession } from "@/lib/session";

type ListingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ListingDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  if (RESERVED_LISTING_ROUTE_IDS.has(id)) return { title: "Ilanlar" };
  const listing = await getListingById(id);
  if (!listing) return { title: "Ilan bulunamadi" };
  return {
    title: `${listing.title} | OyunTicaret`,
    description: listing.description ?? listing.title,
  };
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;
  if (RESERVED_LISTING_ROUTE_IDS.has(id)) {
    redirect("/ilanlar");
  }

  const listing = await getListingById(id);
  if (!listing) notFound();

  const server = getPvpServerBySlug(listing.serverSlug);
  const market = getPvpMarketBySlug(listing.marketSlug);
  if (!server || !market) notFound();

  const gameName = GAME_MARKET_PLANS.find((g) => g.slug === listing.gameSlug)?.name ?? "Knight Online";
  const marketPath = `/ilanlar/pvp/${server.slug}/${market.slug}`;
  const session = await getSession();
  const account = session ? await findUserById(session.userId) : null;

  const bodyText =
    listing.description ??
    `${listing.title} — ${server.name} ${market.label} ilani. Tutar platform bakiyesinden; teslimat saticiyla mesajda.`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-14">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
        <Link
          href="/ilanlar"
          scroll={false}
          className="rounded-full bg-white/90 px-3 py-1 font-medium text-indigo-700 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-indigo-50"
        >
          Sunucu ara
        </Link>
        <span className="text-slate-300">/</span>
        <Link
          href={`/ilanlar/pvp/${server.slug}`}
          scroll={false}
          className="rounded-full bg-white/90 px-3 py-1 font-medium text-indigo-700 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-indigo-50"
        >
          {server.name}
        </Link>
        <span className="text-slate-300">/</span>
        <Link
          href={marketPath}
          scroll={false}
          className="rounded-full bg-white/90 px-3 py-1 font-medium text-indigo-700 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-indigo-50"
        >
          {market.label}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="rounded-full bg-slate-900/[0.04] px-3 py-1 font-medium text-slate-800 ring-1 ring-slate-900/5">
          Ilan
        </span>
      </nav>

      <article className="mt-8 overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 shadow-[var(--shadow-lg)] ring-1 ring-slate-900/[0.04]">
        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/60 px-6 py-8 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{gameName}</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-3xl">{listing.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/80">
              {server.name}
            </span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800 ring-1 ring-indigo-100">
              {market.label}
            </span>
            {listing.job ? (
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-900 ring-1 ring-violet-100">
                {getKoJobLabel(listing.job)}
              </span>
            ) : null}
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                listing.online
                  ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                  : "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80"
              }`}
            >
              {listing.online ? "Satici cevrimici" : "Satici cevrimdisi"}
            </span>
          </div>
        </div>

        <div className="space-y-6 px-6 py-8 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Fiyat</p>
              <p className="text-3xl font-bold text-slate-900">
                {listing.price}
                <span className="ml-1 text-lg font-semibold text-slate-500">TL</span>
              </p>
            </div>
            <div className="text-right text-sm text-[var(--text-muted)]">
              <p>
                Satici: <span className="font-semibold text-slate-800">{listing.seller}</span>
              </p>
              <p className="mt-1 text-xs">Yayin: {listing.createdAt}</p>
            </div>
          </div>

          <section>
            <h2 className="text-sm font-bold text-slate-900">Aciklama</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-muted)]">{bodyText}</p>
          </section>

          <div className="border-t border-slate-100 pt-6">
            {!session ? (
              <p className="mb-3 rounded-xl border border-amber-200/90 bg-amber-50/70 px-4 py-2 text-sm text-amber-950 ring-1 ring-amber-100">
                Satin almak icin giris yapmaniz ve yeterli platform bakiyeniz olmasi gerekir.
              </p>
            ) : account && account.balanceTL < listing.price ? (
              <p className="mb-3 rounded-xl border border-amber-200/90 bg-amber-50/70 px-4 py-2 text-sm text-amber-950 ring-1 ring-amber-100">
                Bakiyeniz ({account.balanceTL} TL) bu ilan icin yetersiz olabilir.{" "}
                <Link href="/bakiye/yukle" scroll={false} className="font-semibold text-indigo-800 underline">
                  Bakiye yukle
                </Link>{" "}
                veya{" "}
                <Link href="/hesabim" scroll={false} className="font-semibold text-indigo-800 underline">
                  Hesabim
                </Link>
                .
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/ilanlar/${listing.id}/satin-al`}
                scroll={false}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-center text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500"
              >
                Hemen satin al
              </Link>
              <Link
                href={marketPath}
                scroll={false}
                className="rounded-xl border border-slate-200/90 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-slate-50"
              >
                Listeye don
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
