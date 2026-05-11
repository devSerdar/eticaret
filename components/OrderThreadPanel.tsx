"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { reportOrderMessageAction, sendOrderMessageAction } from "@/lib/message-actions";
import type { ThreadMessage } from "@/lib/messages";

type OrderThreadPanelProps = {
  orderId: string;
  listingId: string;
  listingTitle: string;
  currentUserId: string;
  buyerId: string;
  initialMessages: ThreadMessage[];
  /** Iptal / satis tamamlandi: uyeler yazamaz (sunucu da reddeder) */
  canUserSendMessages?: boolean;
};

export default function OrderThreadPanel({
  orderId,
  listingId,
  listingTitle,
  currentUserId,
  buyerId,
  initialMessages,
  canUserSendMessages = true,
}: OrderThreadPanelProps) {
  const router = useRouter();
  const [lines, setLines] = useState<ThreadMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reportNote, setReportNote] = useState("");
  const [reportMsg, setReportMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [reportPending, startReport] = useTransition();

  useEffect(() => {
    setLines(initialMessages);
  }, [initialMessages]);

  const isBuyer = currentUserId === buyerId;

  const counterpartyLabel = useMemo(() => (isBuyer ? "Satici" : "Alici"), [isBuyer]);

  function labelFor(m: ThreadMessage): string {
    if (m.fromStaff) return "Yonetim";
    if (m.senderId === currentUserId) return "Siz";
    return counterpartyLabel;
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    const t = draft.trim();
    if (!t) return;
    setMsg(null);
    start(async () => {
      const r = await sendOrderMessageAction(orderId, t);
      if (r.error) {
        setMsg(r.error);
        return;
      }
      setDraft("");
      router.refresh();
    });
  }

  function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reportFor) return;
    setReportMsg(null);
    startReport(async () => {
      const r = await reportOrderMessageAction({
        orderId,
        messageId: reportFor,
        listingId,
        note: reportNote,
      });
      if (r.error) {
        setReportMsg(r.error);
        return;
      }
      setReportFor(null);
      setReportNote("");
      setReportMsg("Bildiriminiz alindi. Yonetici kuyrugunda.");
    });
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200/90 bg-white/95 shadow-[var(--shadow-sm)] ring-1 ring-slate-900/[0.04]">
      <div className="border-b border-slate-100 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Siparis konusmasi</p>
        <p className="mt-1 font-mono text-xs text-slate-600 [overflow-wrap:anywhere]">{orderId}</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Ilan: <span className="font-semibold text-slate-800">{listingTitle}</span>
        </p>
      </div>
      <div className="max-h-[min(420px,50vh)] space-y-3 overflow-y-auto px-5 py-4">
        {lines.map((m) => {
          const mine = m.senderId === currentUserId;
          const staff = m.fromStaff;
          const bubbleClass = mine
            ? "bg-indigo-600 text-white"
            : staff
              ? "bg-amber-50 text-amber-950 ring-1 ring-amber-200/90"
              : "bg-slate-100 text-slate-800 ring-1 ring-slate-200/80";
          const timeClass = mine ? "text-indigo-100" : staff ? "text-amber-800/80" : "text-slate-500";
          return (
            <div key={m.id} className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
              <div className={`flex max-w-[85%] flex-col ${mine ? "items-end" : "items-start"}`}>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${bubbleClass}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wide opacity-80">{labelFor(m)}</p>
                  <p className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{m.body}</p>
                  <p className={`mt-1 text-[10px] tabular-nums ${timeClass}`}>{m.createdAt}</p>
                </div>
                {!mine && !staff ? (
                  <button
                    type="button"
                    onClick={() => {
                      setReportFor(m.id);
                      setReportNote("");
                      setReportMsg(null);
                    }}
                    className="mt-1 text-[11px] font-semibold text-rose-700/90 hover:underline"
                  >
                    Bildir
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {reportFor ? (
        <form onSubmit={submitReport} className="border-t border-rose-100 bg-rose-50/50 px-4 py-3">
          <p className="text-xs font-semibold text-rose-900">Mesaji bildir</p>
          <textarea
            value={reportNote}
            onChange={(e) => setReportNote(e.target.value)}
            rows={2}
            placeholder="Kisa aciklama (istege bagli)"
            className="mt-2 w-full resize-y rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={reportPending}
              className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
            >
              {reportPending ? "Gonderiliyor…" : "Moderasyona gonder"}
            </button>
            <button
              type="button"
              onClick={() => {
                setReportFor(null);
                setReportMsg(null);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              Vazgec
            </button>
          </div>
          {reportMsg ? <p className="mt-2 text-xs text-rose-900">{reportMsg}</p> : null}
        </form>
      ) : null}

      {canUserSendMessages ? (
        <form onSubmit={send} className="border-t border-slate-100 p-4">
          <label htmlFor="thread-input" className="sr-only">
            Mesaj yaz
          </label>
          <textarea
            id="thread-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Teslimat icin yazin… (veritabanina kaydedilir)"
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-3 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 sm:w-auto sm:px-6"
          >
            {pending ? "Gonderiliyor…" : "Gonder"}
          </button>
          {msg ? (
            <p className="mt-2 text-sm text-rose-700" role="alert">
              {msg}
            </p>
          ) : null}
        </form>
      ) : (
        <div className="border-t border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Bu siparis iptal edildi veya satis tamamlandi. Yeni mesaj yalnizca platform yonetimi tarafindan
          gonderilebilir; gecmis mesajlari okuyabilirsiniz.
        </div>
      )}
    </div>
  );
}
