"use client";

import { useState } from "react";
import type { BalanceLedgerKind, BalanceLedgerRow } from "@/lib/db";

type Props = {
  ledger: BalanceLedgerRow[];
  kindTr: Record<BalanceLedgerKind, string>;
};

export default function HesabimLedger({ ledger, kindTr }: Props) {
  const [view, setView] = useState<"timeline" | "table">("timeline");

  return (
    <>
      {/* Segmented control */}
      <div className="ledger-tabs" role="tablist" aria-label="Görünüm">
        <button
          type="button"
          role="tab"
          aria-selected={view === "timeline"}
          className={`ledger-tab ${view === "timeline" ? "ledger-tab--on" : ""}`}
          onClick={() => setView("timeline")}
        >
          Zaman Çizelgesi
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "table"}
          className={`ledger-tab ${view === "table" ? "ledger-tab--on" : ""}`}
          onClick={() => setView("table")}
        >
          Tablo
        </button>
      </div>

      <div className="ledger-body">
        {ledger.length === 0 ? (
          <div className="ledger-empty">
            <span className="ledger-empty__icon">⚡</span>
            <p className="ledger-empty__title">Henüz hareket yok</p>
            <p className="ledger-empty__sub">Bakiye yüklediğinizde veya satın aldığınızda burada görünecek.</p>
          </div>
        ) : view === "timeline" ? (
          <ul className="ledger-timeline">
            {ledger.map((row, i) => {
              const isOut = row.delta_tl < 0;
              const title = kindTr[row.kind] ?? row.kind;
              return (
                <li key={row.id} className="ledger-row">
                  {i < ledger.length - 1 && <span className="ledger-row__line" aria-hidden />}
                  <div className="ledger-row__dot-wrap">
                    <span className={`ledger-row__dot ${isOut ? "ledger-row__dot--out" : "ledger-row__dot--in"}`} aria-hidden />
                  </div>
                  <div className="ledger-row__card">
                    <div className="ledger-row__card-inner">
                      <div className="ledger-row__info">
                        <p className="ledger-row__title">{title}</p>
                        <p className="ledger-row__date">{row.created_at}</p>
                      </div>
                      <div className="ledger-row__amounts">
                        <span className={`ledger-row__delta ${isOut ? "ledger-row__delta--out" : "ledger-row__delta--in"}`}>
                          {row.delta_tl > 0 ? "+" : ""}{row.delta_tl.toLocaleString("tr-TR")} TL
                        </span>
                        <span className="ledger-row__after">
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
          <div className="ledger-table-wrap">
            <table className="ledger-table">
              <thead>
                <tr className="ledger-table__head-row">
                  <th className="ledger-table__th">Tarih</th>
                  <th className="ledger-table__th">İşlem</th>
                  <th className="ledger-table__th ledger-table__th--right">Tutar</th>
                  <th className="ledger-table__th ledger-table__th--right ledger-table__th--hide">Bakiye (sonra)</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((row) => (
                  <tr key={row.id} className="ledger-table__row">
                    <td className="ledger-table__td ledger-table__td--date">{row.created_at}</td>
                    <td className="ledger-table__td ledger-table__td--kind">{kindTr[row.kind] ?? row.kind}</td>
                    <td className={`ledger-table__td ledger-table__td--right ledger-table__td--amount ${row.delta_tl < 0 ? "ledger-table__td--out" : "ledger-table__td--in"}`}>
                      {row.delta_tl > 0 ? "+" : ""}{row.delta_tl.toLocaleString("tr-TR")} TL
                    </td>
                    <td className="ledger-table__td ledger-table__td--right ledger-table__td--after ledger-table__td--hide">
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
