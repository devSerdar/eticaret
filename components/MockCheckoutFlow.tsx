"use client";

import { useTransition, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { completeMockPurchaseAction } from "@/lib/purchase-actions";

export type MockCheckoutListing = {
  id: string;
  title: string;
  price: number;
  seller: string;
  serverName: string;
  marketLabel: string;
};

const STEPS = ["Ozet", "Onay"] as const;

type MockCheckoutFlowProps = {
  listing: MockCheckoutListing;
  backHref: string;
  balanceTL: number;
};

export default function MockCheckoutFlow({ listing, backHref, balanceTL }: MockCheckoutFlowProps) {
  const [step, setStep] = useState(0);
  const [acceptedBalance, setAcceptedBalance] = useState(false);
  const [acceptedMessages, setAcceptedMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const canPay = balanceTL >= listing.price;
  const canAdvanceToConfirm = canPay && acceptedBalance;
  const canSubmit = acceptedMessages && acceptedBalance && canPay;

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, []);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const complete = useCallback(() => {
    setError(null);
    start(async () => {
      try {
        const r = await completeMockPurchaseAction({ listingId: listing.id });
        if (r && "error" in r) setError(r.error);
      } catch (e: unknown) {
        if (
          typeof e === "object" &&
          e !== null &&
          "digest" in e &&
          typeof (e as { digest: string }).digest === "string" &&
          (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
        ) {
          return;
        }
        setError("Beklenmeyen bir hata olustu.");
      }
    });
  }, [listing.id]);

  const stepCopy = useMemo(
    () =>
      `Tutar onaylaninca bakiyenizden ${listing.price} TL dusulecek. Teslimat detaylarini saticiyla bu siparise bagli mesajda konusacaksiniz.`,
    [listing.price],
  );

  return (
    <div className="space-y-8">
      <ol className="flex flex-wrap gap-2" aria-label="Adimlar">
        {STEPS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <li
              key={label}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                active
                  ? "bg-indigo-600 text-white ring-indigo-600"
                  : done
                    ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
                    : "bg-slate-100 text-slate-500 ring-slate-200/80"
              }`}
            >
              <span className="tabular-nums opacity-80">{i + 1}</span>
              {label}
            </li>
          );
        })}
      </ol>

      {step === 0 ? (
        <section className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-[var(--shadow-sm)] ring-1 ring-slate-900/[0.04] sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">Siparis ozeti</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Odeme adimi yok: tutar onceden yuklediginiz platform bakiyesinden duser. Teslimat, satin alma sonrasi saticiyla acilan mesajda netlesir.
          </p>
          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-indigo-950 ring-1 ring-indigo-100">
            <p>
              <span className="font-semibold">Bakiyeniz:</span> {balanceTL} TL
            </p>
            {!canPay ? (
              <p className="mt-2 font-medium text-rose-800">
                Bu ilan icin bakiye yetersiz. Once bakiye yukleyin ({" "}
                <Link href="/hesabim" className="underline">
                  Hesabim
                </Link>
                ).
              </p>
            ) : null}
          </div>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Ilan</dt>
              <dd className="max-w-[65%] text-right font-medium text-slate-900 [overflow-wrap:anywhere]">{listing.title}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Sunucu / Pazar</dt>
              <dd className="text-right font-medium text-slate-800">
                {listing.serverName} · {listing.marketLabel}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Satici</dt>
              <dd className="text-right font-medium text-slate-800">{listing.seller}</dd>
            </div>
            <div className="flex justify-between gap-4 pt-1">
              <dt className="text-slate-500">Tutar</dt>
              <dd className="text-right text-lg font-bold text-slate-900">
                {listing.price} <span className="text-base font-semibold text-slate-500">TL</span>
              </dd>
            </div>
          </dl>
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-800 ring-1 ring-slate-200/80">
            <input
              type="checkbox"
              checked={acceptedBalance}
              onChange={(e) => setAcceptedBalance(e.target.checked)}
              disabled={!canPay}
              className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
            />
            <span>
              <span className="font-semibold">Bakiyemden {listing.price} TL dusulmesini onayliyorum.</span> Kalan:{" "}
              {Math.max(0, balanceTL - listing.price)} TL olacak (mock).
            </span>
          </label>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-[var(--shadow-sm)] ring-1 ring-slate-900/[0.04] sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">Son onay</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{stepCopy}</p>
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-violet-200/90 bg-violet-50/50 p-4 text-sm text-violet-950 ring-1 ring-violet-100">
            <input
              type="checkbox"
              checked={acceptedMessages}
              onChange={(e) => setAcceptedMessages(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-violet-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>
              <span className="font-semibold">Teslimat bilgisini saticiyla mesajda gorusecegimi</span> ve sahte IBAN /
              dolandiricilik konusunda dikkatli olacagimi kabul ediyorum.
            </span>
          </label>
        </section>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Link
          href={backHref}
          scroll={false}
          className="rounded-xl border border-slate-200/90 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-slate-50"
        >
          Iptal
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-slate-200/90 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Geri
            </button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canAdvanceToConfirm}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Devam
            </button>
          ) : (
            <button
              type="button"
              onClick={complete}
              disabled={!canSubmit || pending}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Isleniyor…" : "Siparisi olustur"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
