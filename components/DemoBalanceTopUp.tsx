"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addDemoBalanceAction } from "@/lib/auth-actions";

export default function DemoBalanceTopUp() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setMsg(null);
        start(async () => {
          const r = await addDemoBalanceAction(fd);
          if (r.error) setMsg(r.error);
          else {
            setMsg(`Bakiye guncellendi: ${r.balanceTL != null ? r.balanceTL.toLocaleString("tr-TR") : ""} TL`);
            router.refresh();
          }
        });
      }}
      className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-8"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Demo bakiye</h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-600">
            Yalnizca <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-slate-800">
              MOCK_BAKIYE_DEMOSU=1
            </span>{" "}
            iken. Gercek odeme yok.
          </p>
        </div>
      </div>
      <input type="hidden" name="amount" value="1000" />
      <button
        type="submit"
        disabled={pending}
        className="mt-5 rounded-xl border border-amber-300/80 bg-amber-500 px-5 py-2.5 text-sm font-semibold text-amber-950 shadow-sm transition hover:bg-amber-400 disabled:opacity-60"
      >
        {pending ? "Yukleniyor…" : "+1000 TL (mock)"}
      </button>
      {msg ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800" role="status">
          {msg}
        </p>
      ) : null}
    </form>
  );
}
