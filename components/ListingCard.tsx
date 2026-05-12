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

const marketTheme: Record<PvpMarketSlug, { bg: string; text: string }> = {
  item: { bg: "bg-indigo-50", text: "text-indigo-700" },
  css: { bg: "bg-sky-50", text: "text-sky-700" },
  goldbar: { bg: "bg-amber-50", text: "text-amber-700" },
};

export default function ListingCard({ listing, gameName, serverName, marketLabel }: ListingCardProps) {
  const theme = marketTheme[listing.marketSlug] || marketTheme.item;

  return (
    <Link
      href={`/ilanlar/${listing.id}`}
      scroll={false}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:ring-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex gap-4">
          <div
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl ${theme.bg} ${theme.text} text-xl font-bold ring-1 ring-inset ring-black/5`}
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
          
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${theme.bg} ${theme.text} ring-black/10`}>
                {marketLabel}
              </span>
              {listing.job && (
                <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 ring-1 ring-inset ring-slate-200">
                  {getKoJobLabel(listing.job)}
                </span>
              )}
            </div>
            <p className="mt-2 truncate text-[11px] font-medium text-slate-400 uppercase tracking-wide">
              {gameName} <span className="mx-1">·</span> {serverName}
            </p>
          </div>
        </div>

        <h3 className="mt-5 line-clamp-2 min-h-[3rem] text-base font-semibold leading-relaxed text-slate-900" title={listing.title}>
          {listing.title}
        </h3>

        <div className="mt-auto pt-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fiyat</p>
              <div className="mt-0.5 flex items-baseline gap-1">
                <span className="text-2xl font-black tracking-tight text-slate-900">{listing.price}</span>
                <span className="text-sm font-bold text-slate-500">TL</span>
              </div>
            </div>
            
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                listing.online
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                  : "bg-slate-50 text-slate-600 ring-slate-500/20"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${listing.online ? "bg-emerald-500" : "bg-slate-400"}`} />
              {listing.online ? "Çevrimiçi" : "Çevrimdışı"}
            </span>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] font-medium text-slate-500">
            <span className="truncate pr-2">
              Satıcı: <span className="text-slate-700">{listing.seller}</span>
            </span>
            <span className="shrink-0">{listing.createdAt}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
