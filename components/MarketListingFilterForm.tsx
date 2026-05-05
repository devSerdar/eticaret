"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KO_JOBS } from "@/lib/ko-jobs";
import { marketListingHref, type MarketListingQueryState } from "@/lib/market-listing-query";

type MarketListingFilterFormProps = {
  basePath: string;
  initial: {
    q: string;
    min: string;
    max: string;
    job: string;
    sort: string;
  };
  isItemMarket: boolean;
};

export default function MarketListingFilterForm({ basePath, initial, isItemMarket }: MarketListingFilterFormProps) {
  const router = useRouter();

  function applyFilters(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const state: MarketListingQueryState = {
      q: String(fd.get("q") ?? ""),
      min: String(fd.get("min") ?? ""),
      max: String(fd.get("max") ?? ""),
      job: String(fd.get("job") ?? "all"),
      sort: String(fd.get("sort") ?? "default"),
      page: 1,
    };
    router.push(marketListingHref(basePath, state), { scroll: false });
  }

  return (
    <form className="mt-5 space-y-4" onSubmit={applyFilters}>
      <div>
        <label htmlFor="filter-q" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Metin
        </label>
        <input
          id="filter-q"
          type="text"
          name="q"
          defaultValue={initial.q}
          placeholder="Baslik veya satici"
          className="mt-1.5 w-full rounded-xl border border-slate-200/90 bg-white py-2.5 px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:shadow-[0_0_0_3px_var(--ring-focus)]"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="filter-min" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Min TL
          </label>
          <input
            id="filter-min"
            type="number"
            name="min"
            min={0}
            step={1}
            defaultValue={initial.min}
            placeholder="0"
            className="mt-1.5 w-full rounded-xl border border-slate-200/90 bg-white py-2.5 px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:shadow-[0_0_0_3px_var(--ring-focus)]"
          />
        </div>
        <div>
          <label htmlFor="filter-max" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Max TL
          </label>
          <input
            id="filter-max"
            type="number"
            name="max"
            min={0}
            step={1}
            defaultValue={initial.max}
            placeholder="∞"
            className="mt-1.5 w-full rounded-xl border border-slate-200/90 bg-white py-2.5 px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:shadow-[0_0_0_3px_var(--ring-focus)]"
          />
        </div>
      </div>

      {isItemMarket ? (
        <div>
          <label htmlFor="filter-job" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Job
          </label>
          <select
            id="filter-job"
            name="job"
            defaultValue={initial.job && initial.job !== "" ? initial.job : "all"}
            className="mt-1.5 w-full rounded-xl border border-slate-200/90 bg-white py-2.5 px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:shadow-[0_0_0_3px_var(--ring-focus)]"
          >
            <option value="all">Tum joblar</option>
            {KO_JOBS.map((j) => (
              <option key={j.slug} value={j.slug}>
                {j.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3 text-xs leading-relaxed text-[var(--text-muted)]">
          Job filtresi yalnizca <span className="font-semibold text-slate-600">Item</span> pazarinda.
        </div>
      )}

      <div>
        <label htmlFor="filter-sort" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Siralama
        </label>
        <select
          id="filter-sort"
          name="sort"
          defaultValue={initial.sort}
          className="mt-1.5 w-full rounded-xl border border-slate-200/90 bg-white py-2.5 px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:shadow-[0_0_0_3px_var(--ring-focus)]"
        >
          <option value="default">Varsayilan</option>
          <option value="price_asc">Fiyat: artan</option>
          <option value="price_desc">Fiyat: azalan</option>
        </select>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500"
        >
          Uygula
        </button>
        <Link
          href={basePath}
          scroll={false}
          className="w-full rounded-xl border border-slate-200/90 bg-white py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-slate-50"
        >
          Sifirla
        </Link>
      </div>
    </form>
  );
}
