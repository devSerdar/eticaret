"use client";

import { useState } from "react";
import type { BalanceLedgerKind, BalanceLedgerRow } from "@/lib/db";

type Props = {
  ledger: BalanceLedgerRow[];
  kindTr: Record<BalanceLedgerKind, string>;
};

export default function HesabimLedger({ ledger, kindTr }: Props) {
  const [view, setView] = useState<"timeline" | "table">("timeline");

  const seg = "inline-flex min-w-0 flex-1 items-center justify-center rounded-md px-3 py-2 text-xs font-semibold transition sm:text-sm";
  const segOn = "bg-white text-slate-900 shadow-sm";
  const segOff = "text-slate-600 hover:text-slate-900";

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Hareket gecmisi</h2>
          <p className="mt-1 text-sm text-slate-600">Kronolojik kayitlar; tutar ve bakiye sonrasi.</p>
        </div>
        <div
          className="flex shrink-0 rounded-xl border border-slate-200/90 bg-slate-100/90 p-1 shadow-inner"
          role="tablist"
          aria-label="Gorunum"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "timeline"}
            className={`${seg} ${view === "timeline" ? segOn : segOff}`}
            onClick={() => setView("timeline")}
          >
            Zaman cizelgesi
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "table"}
            className={`${seg} ${view === "table" ? segOn : segOff}`}
            onClick={() => setView("table")}
          >
            Tablo
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-6">
        {ledger.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/80">
              Bos
            </span>
            <p className="text-sm font-medium text-slate-800">Henuz hareket yok</p>
            <p className="max-w-sm text-xs text-slate-600">
              Bakiye yuklediginizde veya satin aldiginizda burada gorunecek.
            </p>
          </div>
        ) : view === "timeline" ? (
          <ul className="space-y-0">
            {ledger.map((row, i) => {
              const isOut = row.delta_tl < 0;
              const title = kindTr[row.kind] ?? row.kind;
              return (
                <li key={row.id} className="relative flex gap-4 pb-8 last:pb-0">
                  {i < ledger.length - 1 ? (
                    <span
                      className="absolute left-[5px] top-3 h-[calc(100%-0.25rem)] w-px bg-slate-200"
                      aria-hidden
                    />
                  ) : null}
                  <div className="relative z-10 flex shrink-0 flex-col items-center pt-1">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ring-4 ring-white ${isOut ? "bg-rose-500" : "bg-emerald-500"}`}
                      aria-hidden
                    />
                  </div>
                  <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{title}</p>
                        <p className="mt-1 text-xs tabular-nums text-slate-500">{row.created_at}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                        <span
                          className={`text-base font-bold tabular-nums sm:text-lg ${
                            isOut ? "text-rose-700" : "text-emerald-700"
                          }`}
                        >
                          {row.delta_tl > 0 ? "+" : ""}
                          {row.delta_tl.toLocaleString("tr-TR")} TL
                        </span>
                        <span className="text-xs font-medium tabular-nums text-slate-500">
                          Sonra: {row.balance_after_tl.toLocaleString("tr-TR")} TL
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[340px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 pl-5 sm:pl-6">Tarih</th>
                  <th className="px-4 py-3">Islem</th>
                  <th className="px-4 py-3 text-right">Tutar</th>
                  <th className="hidden px-4 py-3 pr-5 text-right sm:table-cell sm:pr-6">Bakiye (sonra)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-4 py-3 pl-5 text-xs tabular-nums text-slate-600 sm:pl-6">
                      {row.created_at}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{kindTr[row.kind] ?? row.kind}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        row.delta_tl < 0 ? "text-rose-700" : "text-emerald-700"
                      }`}
                    >
                      {row.delta_tl > 0 ? "+" : ""}
                      {row.delta_tl.toLocaleString("tr-TR")} TL
                    </td>
                    <td className="hidden px-4 py-3 pr-5 text-right text-xs font-medium tabular-nums text-slate-500 sm:table-cell sm:pr-6">
                      {row.balance_after_tl.toLocaleString("tr-TR")} TL
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
