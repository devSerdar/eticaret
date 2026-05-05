import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GAME_MARKET_PLANS } from "@/lib/market-data";
import { RESERVED_LISTING_ROUTE_IDS } from "@/lib/listing-route-guards";
import { getPvpMarketBySlug, getPvpServerBySlug } from "@/lib/ko-pvp-catalog";
import { findUserById } from "@/lib/demo-auth-store";
import { getListingById } from "@/lib/listings";
import { getSession } from "@/lib/session";
import MockCheckoutFlow from "@/components/MockCheckoutFlow";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  if (RESERVED_LISTING_ROUTE_IDS.has(id)) return { title: "Ilanlar" };
  const listing = await getListingById(id);
  if (!listing) return { title: "Ilan bulunamadi" };
  return { title: `Satin al (mock) | ${listing.title}` };
}

export default async function MockCheckoutPage({ params }: PageProps) {
  const { id } = await params;
  if (RESERVED_LISTING_ROUTE_IDS.has(id)) redirect("/ilanlar");

  const listing = await getListingById(id);
  if (!listing) notFound();

  const server = getPvpServerBySlug(listing.serverSlug);
  const market = getPvpMarketBySlug(listing.marketSlug);
  if (!server || !market) notFound();

  const gameName = GAME_MARKET_PLANS.find((g) => g.slug === listing.gameSlug)?.name ?? "Knight Online";
  const detailHref = `/ilanlar/${listing.id}`;

  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/ilanlar/${listing.id}/satin-al`)}`);
  }
  const account = await findUserById(session.userId);
  const balanceTL = account?.balanceTL ?? 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-14">
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
          href={detailHref}
          scroll={false}
          className="rounded-full bg-white/90 px-3 py-1 font-medium text-indigo-700 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-indigo-50"
        >
          Ilan
        </Link>
        <span className="text-slate-300">/</span>
        <span className="rounded-full bg-slate-900/[0.04] px-3 py-1 font-medium text-slate-800 ring-1 ring-slate-900/5">
          Satin al (mock)
        </span>
      </nav>

      <header className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{gameName}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Mock satin alma</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Tutar onceden yuklediginiz platform bakiyesinden dusulur. Teslimat bilgisi saticiyla acilan mesajda
          netlesir; siparis kaydi su an kalici veritabaninda tutulmaz (demo).
        </p>
      </header>

      <div className="mt-10">
        <MockCheckoutFlow
          listing={{
            id: listing.id,
            title: listing.title,
            price: listing.price,
            seller: listing.seller,
            serverName: server.name,
            marketLabel: market.label,
          }}
          backHref={detailHref}
          balanceTL={balanceTL}
        />
      </div>
    </div>
  );
}
