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
    <nav
      className="flex flex-col items-stretch gap-4 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-[var(--shadow-sm)] ring-1 ring-slate-900/[0.03] sm:flex-row sm:items-center sm:justify-between sm:px-5"
      aria-label="Sayfalama"
    >
      <p className="text-center text-sm text-[var(--text-muted)] sm:text-left">
        Sayfa <span className="font-semibold text-slate-800">{currentPage}</span> /{" "}
        <span className="font-semibold text-slate-800">{totalPages}</span>
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href={marketListingHref(basePath, state(currentPage - 1))}
          scroll={false}
          aria-disabled={currentPage <= 1}
          className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
            currentPage <= 1
              ? "pointer-events-none border-slate-100 bg-slate-50 text-slate-300"
              : "border-slate-200/90 bg-white text-slate-800 hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-800"
          }`}
        >
          Onceki
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-1">
          {nums.map((item, idx) =>
            item === "ellipsis" ? (
              <span key={`e-${idx}`} className="px-1.5 text-slate-400">
                …
              </span>
            ) : (
              <Link
                key={item}
                href={marketListingHref(basePath, state(item))}
                scroll={false}
                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold transition ${
                  item === currentPage
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
          className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
            currentPage >= totalPages
              ? "pointer-events-none border-slate-100 bg-slate-50 text-slate-300"
              : "border-slate-200/90 bg-white text-slate-800 hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-800"
          }`}
        >
          Sonraki
        </Link>
      </div>
    </nav>
  );
}
