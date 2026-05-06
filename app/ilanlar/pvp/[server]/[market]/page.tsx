import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ListingCard from "@/components/ListingCard";
import MarketListingFilterForm from "@/components/MarketListingFilterForm";
import MarketListingPagination from "@/components/MarketListingPagination";
import { GAME_MARKET_PLANS } from "@/lib/market-data";
import { isKoJobSlug, type KoJobSlug } from "@/lib/ko-jobs";
import { getPvpMarketBySlug, getPvpServerBySlug, isPvpMarketSlug } from "@/lib/ko-pvp-catalog";
import type { Listing } from "@/lib/listings";
import { listListingsByServerAndMarket } from "@/lib/listings";
import {
  MARKET_LISTINGS_PAGE_SIZE,
  marketListingHref,
  parseListingPage,
  type MarketListingQueryState,
} from "@/lib/market-listing-query";

type MarketListProps = {
  params: Promise<{ server: string; market: string }>;
  searchParams: Promise<{
    q?: string;
    min?: string;
    max?: string;
    job?: string;
    sort?: string;
    page?: string;
  }>;
};

function parsePriceBound(raw: string | undefined): number | undefined {
  if (raw === undefined || raw.trim() === "") return undefined;
  const n = Number(raw.trim());
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

function applyListingFilters(
  listings: Listing[],
  opts: {
    q: string;
    minPrice?: number;
    maxPrice?: number;
    job?: KoJobSlug;
    isItemMarket: boolean;
    sort: "price_asc" | "price_desc" | "default";
  },
): Listing[] {
  let out = listings.filter((l) => {
    const q = opts.q.trim().toLowerCase();
    if (q) {
      const hay = `${l.title} ${l.seller}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (opts.minPrice !== undefined && l.price < opts.minPrice) return false;
    if (opts.maxPrice !== undefined && l.price > opts.maxPrice) return false;
    if (opts.isItemMarket && opts.job) {
      if (l.job !== opts.job) return false;
    }
    return true;
  });

  if (opts.sort === "price_asc") {
    out = [...out].sort((a, b) => a.price - b.price);
  } else if (opts.sort === "price_desc") {
    out = [...out].sort((a, b) => b.price - a.price);
  }

  return out;
}

const marketHero: Record<string, string> = {
  item: "from-violet-600 via-fuchsia-600 to-pink-500",
  css: "from-sky-600 via-cyan-600 to-teal-500",
  goldbar: "from-amber-500 via-orange-500 to-yellow-400",
};

export default async function PvpMarketListPage({ params, searchParams }: MarketListProps) {
  const { server: serverParam, market: marketParam } = await params;
  const query = await searchParams;

  const serverSlug = serverParam.trim().toLowerCase();
  const marketSlug = marketParam.trim().toLowerCase();

  const server = getPvpServerBySlug(serverSlug);
  if (!server) {
    console.warn("[pvp-market] server_not_found", { serverParam, serverSlug, marketParam, marketSlug });
    notFound();
  }
  if (!isPvpMarketSlug(marketSlug)) {
    console.warn("[pvp-market] market_slug_invalid", { serverParam, serverSlug, marketParam, marketSlug });
    notFound();
  }

  const market = getPvpMarketBySlug(marketSlug);
  if (!market) {
    console.warn("[pvp-market] market_not_found", { marketParam, marketSlug });
    notFound();
  }

  const gameName = GAME_MARKET_PLANS.find((g) => g.slug === "knight-online")?.name ?? "Knight Online";

  const baseListings = await listListingsByServerAndMarket(server.slug, market.slug);

  const q = query.q ?? "";
  const minPrice = parsePriceBound(query.min);
  const maxPrice = parsePriceBound(query.max);
  const sortRaw = query.sort?.trim() ?? "default";
  const sort: "price_asc" | "price_desc" | "default" =
    sortRaw === "price_asc" || sortRaw === "price_desc" ? sortRaw : "default";

  const isItemMarket = market.slug === "item";
  let jobFilter: KoJobSlug | undefined;
  if (isItemMarket && query.job && query.job !== "all" && isKoJobSlug(query.job)) {
    jobFilter = query.job;
  }

  const filtered = applyListingFilters(baseListings, {
    q,
    minPrice,
    maxPrice,
    job: jobFilter,
    isItemMarket,
    sort,
  });

  const actionPath = `/ilanlar/pvp/${server.slug}/${market.slug}`;
  const heroGradient = marketHero[market.slug] ?? marketHero.item;

  const sortForQuery: MarketListingQueryState["sort"] =
    sortRaw === "price_asc" || sortRaw === "price_desc" ? sortRaw : "default";
  const jobForQuery = query.job && query.job !== "" ? query.job : "all";

  const listingQueryBase: Omit<MarketListingQueryState, "page"> = {
    q,
    min: query.min ?? "",
    max: query.max ?? "",
    job: jobForQuery,
    sort: sortForQuery,
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / MARKET_LISTINGS_PAGE_SIZE));
  const requestedPage = parseListingPage(query.page);
  const currentPage = Math.min(requestedPage, totalPages);

  if (
    filtered.length > 0 &&
    query.page !== undefined &&
    query.page !== "" &&
    requestedPage !== currentPage
  ) {
    redirect(marketListingHref(actionPath, { ...listingQueryBase, page: currentPage }));
  }

  const pageOffset = (currentPage - 1) * MARKET_LISTINGS_PAGE_SIZE;
  const pageListings = filtered.slice(pageOffset, pageOffset + MARKET_LISTINGS_PAGE_SIZE);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-14">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
        <Link
          href="/ilanlar"
          className="rounded-full bg-white/90 px-3 py-1 font-medium text-indigo-700 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-indigo-50"
        >
          Sunucu ara
        </Link>
        <span className="text-slate-300">/</span>
        <Link
          href={`/ilanlar/pvp/${server.slug}`}
          className="rounded-full bg-white/90 px-3 py-1 font-medium text-indigo-700 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-indigo-50"
        >
          {server.name}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="rounded-full bg-slate-900/[0.04] px-3 py-1 font-medium text-slate-800 ring-1 ring-slate-900/5">
          {market.label}
        </span>
      </nav>

      <div className="relative mt-8 overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-[var(--shadow-lg)] ring-1 ring-slate-900/5">
        <div className={`absolute inset-0 bg-gradient-to-br ${heroGradient} opacity-[0.12]`} />
        <div className="relative flex flex-col gap-4 border-b border-slate-200/60 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">{gameName}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {server.name}
              <span className="text-slate-300"> — </span>
              {market.label}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)] sm:text-base">
              {filtered.length} ilan
              {filtered.length > 0 ? (
                <>
                  {" "}
                  · sayfa basina {MARKET_LISTINGS_PAGE_SIZE}
                  {totalPages > 1 ? (
                    <>
                      {" "}
                      · sayfa {currentPage}/{totalPages}
                    </>
                  ) : null}
                </>
              ) : null}
              {baseListings.length !== filtered.length ? (
                <span className="text-slate-400"> ({baseListings.length} bu pazarda)</span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80">
              Filtre: URL ile paylasilabilir
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,300px)_1fr] lg:items-stretch lg:gap-10">
        <aside className="min-h-0 lg:flex lg:flex-col">
          <section className="rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-[var(--shadow-sm)] ring-1 ring-slate-900/[0.03] backdrop-blur-sm lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">Filtreler</h2>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                GET
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
              Sonuclari daralt; linki kopyalayip paylasabilirsin.
            </p>

            <MarketListingFilterForm
              basePath={actionPath}
              isItemMarket={isItemMarket}
              initial={{
                q,
                min: query.min ?? "",
                max: query.max ?? "",
                job: jobForQuery,
                sort: sortForQuery,
              }}
            />
          </section>
        </aside>

        <div
          className={`flex min-h-0 flex-col lg:h-full ${
            filtered.length > 0 && totalPages > 1 ? "max-lg:min-h-[50svh]" : ""
          }`}
        >
          {filtered.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/90 bg-white/80 p-12 text-center shadow-[var(--shadow-sm)]">
              <p className="text-sm font-semibold text-slate-800">Sonuc yok</p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Filtreleri yumusatmayi dene.</p>
            </div>
          ) : (
            <>
              <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:items-stretch">
                {pageListings.map((listing) => (
                  <div key={listing.id} className="flex min-h-0 h-full min-w-0">
                    <ListingCard
                      listing={listing}
                      gameName={gameName}
                      serverName={server.name}
                      marketLabel={market.label}
                    />
                  </div>
                ))}
              </div>
              {totalPages > 1 ? (
                <>
                  <div className="min-h-0 flex-1" aria-hidden />
                  <div className="shrink-0 border-t border-slate-100/90 pt-6">
                    <MarketListingPagination
                      basePath={actionPath}
                      query={listingQueryBase}
                      currentPage={currentPage}
                      totalPages={totalPages}
                    />
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
