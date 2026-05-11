import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/listings";
import type { PvpMarketSlug } from "@/lib/ko-pvp-catalog";
import { getKoJobLabel } from "@/lib/ko-jobs";

type ListingCardProps = {
  listing: Listing;
  gameName: string;
  serverName: string;
  marketLabel: string;
};

const marketAccent: Record<PvpMarketSlug, { bar: string; icon: string; glow: string }> = {
  item: {
    bar: "from-violet-500 via-fuchsia-500 to-pink-500",
    icon: "from-violet-600 to-fuchsia-600",
    glow: "shadow-violet-500/20",
  },
  css: {
    bar: "from-sky-500 via-cyan-500 to-teal-400",
    icon: "from-sky-600 to-cyan-600",
    glow: "shadow-cyan-500/20",
  },
  goldbar: {
    bar: "from-amber-500 via-orange-500 to-yellow-400",
    icon: "from-amber-600 to-orange-600",
    glow: "shadow-amber-500/25",
  },
};

export default function ListingCard({ listing, gameName, serverName, marketLabel }: ListingCardProps) {
  const accent = marketAccent[listing.marketSlug];

  return (
    <Link
      href={`/ilanlar/${listing.id}`}
      scroll={false}
      className="block h-full min-h-0 w-full max-w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
    >
      <article
        className={`group relative flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-[var(--shadow-sm)] ring-1 ring-slate-900/[0.04] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${accent.glow}`}
      >
      <div className={`h-1.5 shrink-0 bg-gradient-to-r ${accent.bar}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex min-h-0 flex-1 gap-4">
          <div
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${accent.icon} text-lg font-black text-white shadow-lg`}
            aria-hidden
          >
            {listing.imageUrl ? (
              <Image src={listing.imageUrl} alt={listing.title} fill sizes="56px" className="object-cover" />
            ) : listing.marketSlug === "goldbar" ? (
              "G"
            ) : listing.marketSlug === "css" ? (
              "C"
            ) : (
              "I"
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex min-w-0 items-start justify-between gap-2">
              <p className="min-w-0 flex-1 text-[11px] font-semibold uppercase leading-snug tracking-wider text-slate-500 break-words [overflow-wrap:anywhere] line-clamp-2">
                {gameName}
                <span className="text-slate-300"> · </span>
                {serverName}
                {listing.job ? (
                  <>
                    <span className="text-slate-300"> · </span>
                    <span className="text-indigo-600">{getKoJobLabel(listing.job)}</span>
                  </>
                ) : null}
              </p>
              <span className="shrink-0 rounded-full bg-slate-900/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-900/5">
                {marketLabel}
              </span>
            </div>
            <h3
              className="mt-2 line-clamp-3 min-h-0 w-full text-base font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere] break-words sm:text-lg"
              title={listing.title}
            >
              {listing.title}
            </h3>

            <div className="mt-auto border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Fiyat</p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900">
                    {listing.price}
                    <span className="ml-1 text-base font-semibold text-slate-500">TL</span>
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    listing.online
                      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                      : "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80"
                  }`}
                >
                  {listing.online ? "Cevrimici" : "Cevrimdisi"}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 text-sm text-[var(--text-muted)]">
                <span className="min-w-0 truncate">
                  Satici: <span className="font-medium text-slate-700">{listing.seller}</span>
                </span>
                <span className="shrink-0 text-slate-500">{listing.createdAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </article>
    </Link>
  );
}
