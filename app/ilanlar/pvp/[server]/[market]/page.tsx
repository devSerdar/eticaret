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
  item: "from-violet-500 to-fuchsia-500",
  css: "from-sky-500 to-cyan-500",
  goldbar: "from-amber-500 to-orange-500",
};

export default async function PvpMarketListPage({ params, searchParams }: MarketListProps) {
  const { server: serverParam, market: marketParam } = await params;
  const query = await searchParams;

  const serverSlug = serverParam.trim().toLowerCase();
  const marketSlug = marketParam.trim().toLowerCase();

  const server = getPvpServerBySlug(serverSlug);
  if (!server) {
    notFound();
  }
  if (!isPvpMarketSlug(marketSlug)) {
    notFound();
  }

  const market = getPvpMarketBySlug(marketSlug);
  if (!market) {
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
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Subtle Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/ilanlar" className="hover:text-indigo-600 transition-colors">
          Tüm Sunucular
        </Link>
        <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href={`/ilanlar/pvp/${server.slug}`} className="hover:text-indigo-600 transition-colors">
          {server.name}
        </Link>
        <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-semibold text-slate-900">{market.label}</span>
      </nav>

      {/* Professional Page Header */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className={`absolute inset-0 bg-gradient-to-r ${heroGradient} opacity-[0.08]`} />
        
        <div className="relative flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                {gameName}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {server.name} <span className="mx-2 font-light text-slate-300">/</span> {market.label}
            </h1>
            <p className="mt-3 text-base text-slate-500 max-w-xl">
              En güvenilir satıcılardan uygun fiyatlı ilanları keşfedin, güvenle alışveriş yapın.
            </p>
          </div>
          
          <div className="flex items-center gap-6 sm:border-l sm:border-slate-200 sm:pl-8">
            <div className="flex flex-col">
              <span className="text-3xl font-bold tracking-tight text-slate-900">{filtered.length}</span>
              <span className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">Aktif İlan</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:items-start lg:gap-8">
        {/* Sidebar Filters */}
        <aside className="mb-8 lg:sticky lg:top-8 lg:mb-0">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-semibold text-slate-900">Filtreler</h2>
              {filtered.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {filtered.length} Sonuç
                </span>
              )}
            </div>
            <div className="pt-6">
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
            </div>
          </div>
        </aside>

        {/* Listings Grid */}
        <div className="flex min-h-[400px] flex-col">
          {filtered.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">İlan Bulunamadı</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-sm">
                Arama kriterlerinize uygun aktif bir ilan yok. Lütfen filtrelerinizi esneterek tekrar deneyin.
              </p>
              <Link 
                href={actionPath}
                className="mt-6 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Filtreleri Temizle
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {pageListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    gameName={gameName}
                    serverName={server.name}
                    marketLabel={market.label}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-10 flex justify-center border-t border-slate-200 pt-8">
                  <MarketListingPagination
                    basePath={actionPath}
                    query={listingQueryBase}
                    currentPage={currentPage}
                    totalPages={totalPages}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
