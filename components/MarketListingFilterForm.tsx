"use client";

import { type FormEvent, useState, useRef, useEffect } from "react";
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

// Custom Select Component for a premium look
function CustomSelect({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: { value: string; label: string }[];
  defaultValue: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [prevDefault, setPrevDefault] = useState(defaultValue);
  const ref = useRef<HTMLDivElement>(null);

  if (defaultValue !== prevDefault) {
    setValue(defaultValue);
    setPrevDefault(defaultValue);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-1.5 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all hover:bg-slate-100 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
      >
        <span className="truncate">{selectedOption.label}</span>
        <svg
          className={`ml-3 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full origin-top overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-200/40">
          <div className="max-h-56 overflow-y-auto p-1">
            {options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setValue(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-indigo-50 font-semibold text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <svg className="ml-2 h-4 w-4 shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

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

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-all hover:bg-slate-100 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const labelClass = "text-[11px] font-bold uppercase tracking-wider text-slate-500";

  return (
    <form className="space-y-6" onSubmit={applyFilters}>
      <div>
        <label htmlFor="filter-q" className={labelClass}>
          İlan Başlığı veya Satıcı
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 pt-1.5">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            id="filter-q"
            type="text"
            name="q"
            defaultValue={initial.q}
            placeholder="Arama yapın..."
            className={`${inputClass} pl-10`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="filter-min" className={labelClass}>
            Min Fiyat (TL)
          </label>
          <input
            id="filter-min"
            type="number"
            name="min"
            min={0}
            step={1}
            defaultValue={initial.min}
            placeholder="En az"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="filter-max" className={labelClass}>
            Max Fiyat (TL)
          </label>
          <input
            id="filter-max"
            type="number"
            name="max"
            min={0}
            step={1}
            defaultValue={initial.max}
            placeholder="En çok"
            className={inputClass}
          />
        </div>
      </div>

      {isItemMarket ? (
        <div>
          <label className={labelClass}>Sınıf (Job)</label>
          <CustomSelect
            name="job"
            defaultValue={initial.job && initial.job !== "" ? initial.job : "all"}
            options={[
              { value: "all", label: "Tüm Sınıflar" },
              ...KO_JOBS.map((j) => ({ value: j.slug, label: j.label })),
            ]}
          />
        </div>
      ) : null}

      <div>
        <label className={labelClass}>Sıralama</label>
        <CustomSelect
          name="sort"
          defaultValue={initial.sort}
          options={[
            { value: "default", label: "Önerilen" },
            { value: "price_asc", label: "Fiyat: Önce En Düşük" },
            { value: "price_desc", label: "Fiyat: Önce En Yüksek" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
        <button
          type="submit"
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Sonuçları Göster
        </button>
        <Link
          href={basePath}
          scroll={false}
          className="w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:text-indigo-600"
        >
          Filtreleri Temizle
        </Link>
      </div>
    </form>
  );
}
