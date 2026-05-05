"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { simulateTopUpAction } from "@/lib/balance-actions";

const PRESETS = [100, 250, 500, 1000, 2500] as const;

export default function BakiyeYukleForm() {
  const router = useRouter();
  const [amount, setAmount] = useState<string>("500");
  const [state, formAction, pending] = useActionState(simulateTopUpAction, undefined);

  useEffect(() => {
    if (state?.balanceTL != null) {
      router.refresh();
    }
  }, [state?.balanceTL, router]);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-slate-800">Hizli tutar</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAmount(String(n))}
              className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                amount === String(n)
                  ? "bg-indigo-600 text-white ring-indigo-600"
                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {n} TL
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="topup-amount" className="block text-sm font-semibold text-slate-800">
          Tutar (TL)
        </label>
        <input
          id="topup-amount"
          name="amount"
          type="number"
          min={50}
          step={10}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-inner outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
        />
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200/90 bg-amber-50/60 p-4 text-sm text-amber-950 ring-1 ring-amber-100">
        <input type="checkbox" name="consent" className="mt-1 size-4 rounded border-amber-300 text-indigo-600" required />
        <span>
          <span className="font-semibold">Odeme saglayicisi olmadan simule edildigini</span> biliyorum; gercek kart /
          havale alinmaz. Tutar yalnizca gelistirme ortaminda anlamlidir.
        </span>
      </label>
      {state?.error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.balanceTL != null ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900" role="status">
          Yukleme tamam. Guncel bakiye: {state.balanceTL} TL
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
      >
        {pending ? "Isleniyor…" : "Simule bakiye yuklemesini tamamla"}
      </button>
    </form>
  );
}
