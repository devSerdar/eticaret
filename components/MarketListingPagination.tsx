import Link from "next/link";
import { marketListingHref, type MarketListingQueryState } from "@/lib/market-listing-query";

type MarketListingPaginationProps = {
  basePath: string;
  query: Omit<MarketListingQueryState, "page">;
  currentPage: number;
  totalPages: number;
};

function visiblePageNumbers(totalPages: number, current: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const set = new Set<number>();
  set.add(1);
  set.add(totalPages);
  for (let p = current - 2; p <= current + 2; p += 1) {
    if (p >= 1 && p <= totalPages) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev > 0 && p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

export default function MarketListingPagination({
  basePath,
  query,
  currentPage,
  totalPages,
}: MarketListingPaginationProps) {
  if (totalPages <= 1) return null;

  const state = (page: number): MarketListingQueryState => ({ ...query, page });
  const nums = visiblePageNumbers(totalPages, currentPage);

  return (
    <nav className="flex items-center justify-between px-4 sm:px-0 w-full" aria-label="Sayfalama">
      <div className="hidden sm:block">
        <p className="text-sm text-slate-700">
          Sayfa <span className="font-semibold">{currentPage}</span> / <span className="font-semibold">{totalPages}</span>
        </p>
      </div>

      <div className="flex flex-1 items-center justify-between sm:justify-end gap-2">
        <Link
          href={marketListingHref(basePath, state(currentPage - 1))}
          scroll={false}
          aria-disabled={currentPage <= 1}
          className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold ring-1 ring-inset transition-all ${
            currentPage <= 1
              ? "pointer-events-none bg-slate-50 text-slate-300 ring-slate-200"
              : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50 hover:text-indigo-600"
          }`}
        >
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Önceki
        </Link>

        <div className="hidden md:flex items-center gap-1 mx-4">
          {nums.map((item, idx) =>
            item === "ellipsis" ? (
              <span key={`e-${idx}`} className="px-2 text-slate-400">
                …
              </span>
            ) : (
              <Link
                key={item}
                href={marketListingHref(basePath, state(item))}
                scroll={false}
                className={`relative inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-semibold transition-all ${
                  item === currentPage
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item}
              </Link>
            ),
          )}
        </div>

        <Link
          href={marketListingHref(basePath, state(currentPage + 1))}
          scroll={false}
          aria-disabled={currentPage >= totalPages}
          className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold ring-1 ring-inset transition-all ${
            currentPage >= totalPages
              ? "pointer-events-none bg-slate-50 text-slate-300 ring-slate-200"
              : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-50 hover:text-indigo-600"
          }`}
        >
          Sonraki
          <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}
