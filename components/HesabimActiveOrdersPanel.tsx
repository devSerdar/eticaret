"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  getOrderActionRequestsAction,
  getOrderMessagesAction,
  requestOrderActionAction,
  respondOrderActionRequestAction,
  sendOrderMessageAction,
} from "@/lib/message-actions";
import type { ThreadMessage } from "@/lib/messages";
import type { OrderActionRequest } from "@/lib/order-action-requests";

type ActiveOrder = {
  id: string;
  createdAt: string;
  listingId: string;
  listingTitle: string;
  priceTl: number;
  role: "buyer" | "seller";
  counterpartyName: string;
  messageCount: number;
};

type Props = {
  orders: ActiveOrder[];
  currentUserId: string;
  currentUserDisplayName: string;
};

function actionLabel(kind: OrderActionRequest["kind"]): string {
  if (kind === "complete_sale") return "Satis tamamlama talebi";
  if (kind === "cancel_by_seller") return "Satici iptal talebi";
  return "Alici iptal talebi";
}

function statusTone(status: OrderActionRequest["status"]): string {
  if (status === "approved") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (status === "rejected") return "bg-rose-50 text-rose-800 ring-rose-200";
  return "bg-amber-50 text-amber-900 ring-amber-200";
}

export default function HesabimActiveOrdersPanel({ orders, currentUserId, currentUserDisplayName }: Props) {
  const [selected, setSelected] = useState<ActiveOrder | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [requests, setRequests] = useState<OrderActionRequest[]>([]);
  const [draft, setDraft] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showActions, setShowActions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [sending, startSending] = useTransition();
  const [acting, startActing] = useTransition();
  const scrollViewportRef = useRef<HTMLElement | null>(null);
  const selectedHref = selected
    ? `/mesajlar/${encodeURIComponent(selected.id)}?listingId=${encodeURIComponent(selected.listingId)}`
    : "";

  useEffect(() => {
    if (!selected) return;
    setError(null);
    setDraft("");
    setShowActions(false);
    startLoading(async () => {
      const [mr, ar] = await Promise.all([
        getOrderMessagesAction(selected.id),
        getOrderActionRequestsAction(selected.id),
      ]);
      if (mr.error) {
        setError(mr.error);
        setMessages([]);
      }
      if (ar.error) {
        setError(ar.error);
        setRequests([]);
      }
      setMessages(mr.messages ?? []);
      setRequests(ar.requests ?? []);
    });
  }, [selected]);

  useEffect(() => {
    const el = scrollViewportRef.current;
    if (!el || !selected) return;
    // Ilk acilista ve yeni mesajlarda sohbeti alta sabitle.
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages.length, requests.length, selected]);

  return (
    <>
      <div className="mt-6 overflow-x-auto">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">Henuz aktif siparisiniz yok.</p>
            <Link href="/ilanlar" scroll={false} className="mt-3 inline-block text-sm font-semibold text-indigo-700 hover:underline">
              Ilanlara git
            </Link>
          </div>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-2 py-3">Ilan</th>
                <th className="px-2 py-3">Rol</th>
                <th className="px-2 py-3">Karsi taraf</th>
                <th className="px-2 py-3 text-right">Tutar</th>
                <th className="px-2 py-3 text-center">Mesaj</th>
                <th className="px-2 py-3">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="transition hover:bg-slate-50/70">
                  <td className="px-2 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(o)}
                      className="text-left font-semibold text-slate-900 hover:text-indigo-700 hover:underline"
                    >
                      {o.listingTitle}
                    </button>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">{o.id}</p>
                  </td>
                  <td className="px-2 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {o.role === "buyer" ? "Alici" : "Satici"}
                    </span>
                  </td>
                  <td className="px-2 py-3 font-medium text-slate-700">{o.counterpartyName}</td>
                  <td className="px-2 py-3 text-right font-semibold tabular-nums text-slate-900">
                    {o.priceTl.toLocaleString("tr-TR")} TL
                  </td>
                  <td className="px-2 py-3 text-center font-semibold text-indigo-700">{o.messageCount}</td>
                  <td className="px-2 py-3 text-xs tabular-nums text-slate-500">{o.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-[2px] sm:p-6">
          <div className="grid h-[min(70vh,620px)] w-full max-w-xl grid-rows-[auto_1fr_auto] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.35)]">
            <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold tracking-tight text-slate-900">Siparis mesaji</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{selected.listingTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="shrink-0 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Kapat
                </button>
              </div>
            </div>

            <div className="grid min-h-0 grid-rows-[auto_1fr] bg-slate-50/40">
              <section className="border-b border-slate-200/80 bg-white px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => setShowActions((v) => !v)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-700"
                >
                  Siparis islemleri {showActions ? "▲" : "▼"}
                </button>
                {showActions ? (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {selected.role === "seller" ? (
                        <>
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() => {
                              startActing(async () => {
                                const r = await requestOrderActionAction({
                                  orderId: selected.id,
                                  kind: "complete_sale",
                                });
                                if (r.error) {
                                  setError(r.error);
                                  return;
                                }
                                const loaded = await getOrderActionRequestsAction(selected.id);
                                setRequests(loaded.requests ?? []);
                              });
                            }}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                          >
                            Satisi tamamla
                          </button>
                          <button
                            type="button"
                            disabled={acting || actionReason.trim().length < 4}
                            onClick={() => {
                              startActing(async () => {
                                const r = await requestOrderActionAction({
                                  orderId: selected.id,
                                  kind: "cancel_by_seller",
                                  reason: actionReason,
                                });
                                if (r.error) {
                                  setError(r.error);
                                  return;
                                }
                                setActionReason("");
                                const loaded = await getOrderActionRequestsAction(selected.id);
                                setRequests(loaded.requests ?? []);
                              });
                            }}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-60"
                          >
                            Ilani iptal et
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={acting || actionReason.trim().length < 4}
                          onClick={() => {
                            startActing(async () => {
                              const r = await requestOrderActionAction({
                                orderId: selected.id,
                                kind: "cancel_by_buyer",
                                reason: actionReason,
                              });
                              if (r.error) {
                                setError(r.error);
                                return;
                              }
                              setActionReason("");
                              const loaded = await getOrderActionRequestsAction(selected.id);
                              setRequests(loaded.requests ?? []);
                            });
                          }}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-60"
                        >
                          Iptal talebinde bulun
                        </button>
                      )}
                    </div>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      rows={2}
                      placeholder="Iptal gerekcesi (zorunlu)"
                      className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                ) : null}
              </section>

              <section ref={scrollViewportRef} className="min-h-0 space-y-3 overflow-y-auto px-4 py-4">
                {requests.length > 0 ? (
                  <div className="space-y-2">
                    {requests.map((r) => {
                      const waitingMyDecision = r.status === "pending" && r.requestedBy !== currentUserId;
                      const rejectVal = rejectReason[r.id] ?? "";
                      return (
                        <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900">{actionLabel(r.kind)}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statusTone(r.status)}`}>
                              {r.status === "pending" ? "Bekliyor" : r.status === "approved" ? "Onaylandi" : "Itiraz edildi"}
                            </span>
                          </div>
                          {r.reason ? <p className="mt-1 text-xs text-slate-600">Talep gerekcesi: {r.reason}</p> : null}
                          {r.responseReason ? (
                            <p className="mt-1 text-xs text-slate-600">Itiraz gerekcesi: {r.responseReason}</p>
                          ) : null}
                          <p className="mt-1 text-[11px] tabular-nums text-slate-500">{r.createdAt}</p>

                          {waitingMyDecision ? (
                            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={acting}
                                  onClick={() => {
                                    if (!selected) return;
                                    startActing(async () => {
                                      const res = await respondOrderActionRequestAction({
                                        requestId: r.id,
                                        orderId: selected.id,
                                        approve: true,
                                      });
                                      if (res.error) {
                                        setError(res.error);
                                        return;
                                      }
                                      const loaded = await getOrderActionRequestsAction(selected.id);
                                      setRequests(loaded.requests ?? []);
                                    });
                                  }}
                                  className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                                >
                                  Onayla
                                </button>
                                <button
                                  type="button"
                                  disabled={acting || rejectVal.trim().length < 4}
                                  onClick={() => {
                                    if (!selected) return;
                                    startActing(async () => {
                                      const res = await respondOrderActionRequestAction({
                                        requestId: r.id,
                                        orderId: selected.id,
                                        approve: false,
                                        responseReason: rejectVal,
                                      });
                                      if (res.error) {
                                        setError(res.error);
                                        return;
                                      }
                                      setRejectReason((prev) => ({ ...prev, [r.id]: "" }));
                                      const loaded = await getOrderActionRequestsAction(selected.id);
                                      setRequests(loaded.requests ?? []);
                                    });
                                  }}
                                  className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-60"
                                >
                                  Itiraz et
                                </button>
                              </div>
                              <textarea
                                value={rejectVal}
                                onChange={(e) =>
                                  setRejectReason((prev) => ({
                                    ...prev,
                                    [r.id]: e.target.value,
                                  }))
                                }
                                rows={2}
                                placeholder="Itiraz gerekcesi (zorunlu)"
                                className="mt-2 w-full resize-none rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
                              />
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {loading ? (
                  <p className="text-sm text-slate-600">Yukleniyor…</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-slate-600">Henuz mesaj yok.</p>
                ) : (
                  messages.map((m) => {
                    const mine = m.senderDisplayName === currentUserDisplayName;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                            mine
                              ? "bg-indigo-600 text-white"
                              : "bg-white text-slate-800 ring-1 ring-slate-200"
                          }`}
                        >
                          <p className="text-[10px] font-semibold opacity-80">{m.senderDisplayName}</p>
                          <p className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{m.body}</p>
                          <p className={`mt-1 text-[10px] ${mine ? "text-indigo-100" : "text-slate-500"}`}>{m.createdAt}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </section>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selected) return;
                const text = draft.trim();
                if (!text) return;
                setError(null);
                startSending(async () => {
                  const r = await sendOrderMessageAction(selected.id, text);
                  if (r.error) {
                    setError(r.error);
                    return;
                  }
                  setDraft("");
                  const loaded = await getOrderMessagesAction(selected.id);
                  if (loaded.error) {
                    setError(loaded.error);
                    return;
                  }
                  setMessages(loaded.messages ?? []);
                });
              }}
              className="border-t border-slate-200 bg-white px-4 py-3 sm:px-5"
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (sending) return;
                    const form = e.currentTarget.form;
                    if (form) form.requestSubmit();
                  }
                }}
                rows={2}
                placeholder="Mesaj yaz..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
              />
              <div className="mt-2 flex items-center justify-between">
                {error ? <p className="text-xs text-rose-700">{error}</p> : <span />}
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {sending ? "Gonderiliyor…" : "Gonder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
