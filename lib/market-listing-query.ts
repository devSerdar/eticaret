export type MarketListingQueryState = {
  q: string;
  min: string;
  max: string;
  job: string;
  sort: string;
  page: number;
};

/** Filtre + sayfa icin GET query string (basinda ? yok) */
export function buildMarketListingSearch(state: MarketListingQueryState): string {
  const sp = new URLSearchParams();
  const q = state.q.trim();
  if (q) sp.set("q", q);
  if (state.min.trim()) sp.set("min", state.min.trim());
  if (state.max.trim()) sp.set("max", state.max.trim());
  if (state.job && state.job !== "all") sp.set("job", state.job);
  if (state.sort && state.sort !== "default") sp.set("sort", state.sort);
  if (state.page > 1) sp.set("page", String(state.page));
  return sp.toString();
}

export function marketListingHref(basePath: string, state: MarketListingQueryState): string {
  const s = buildMarketListingSearch(state);
  return s ? `${basePath}?${s}` : basePath;
}

export const MARKET_LISTINGS_PAGE_SIZE = 4;

export function parseListingPage(raw: string | undefined): number {
  const n = Number(raw?.trim());
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}
