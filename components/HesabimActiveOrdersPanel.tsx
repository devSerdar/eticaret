"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
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
  status: "active" | "completed" | "cancelled";
  role: "buyer" | "seller";
  counterpartyName: string;
  messageCount: number;
  unreadCount: number;
};

type Props = {
  orders: ActiveOrder[];
  currentUserId: string;
  currentUserDisplayName: string;
  defaultTab?: "active" | "completed" | "cancelled";
};

/** Mesaj önizlemesi için kırpma */
function truncate(str: string, n = 48) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

function actionLabel(kind: OrderActionRequest["kind"]): string {
  if (kind === "complete_sale") return "Satış tamamlama talebi";
  if (kind === "cancel_by_seller") return "Satıcı iptal talebi";
  return "Alıcı iptal talebi";
}

function statusInfo(status: OrderActionRequest["status"]): { label: string; cls: string } {
  if (status === "approved") return { label: "Onaylandı", cls: "order-req__badge--approved" };
  if (status === "rejected") return { label: "İtiraz edildi", cls: "order-req__badge--rejected" };
  return { label: "Bekliyor", cls: "order-req__badge--pending" };
}

function getInitial(name: string) {
  return name.trim().charAt(0).toLocaleUpperCase("tr-TR") || "?";
}

const POLL_INTERVAL_MS = 5000; // 5 saniyede bir yeni mesaj kontrolü

export default function HesabimActiveOrdersPanel({
  orders,
  currentUserId,
  currentUserDisplayName,
  defaultTab = "active",
}: Props) {
  const [tab, setTab] = useState<"active" | "completed" | "cancelled">(defaultTab);
  const [selected, setSelected] = useState<ActiveOrder | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [requests, setRequests] = useState<OrderActionRequest[]>([]);
  const [draft, setDraft] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showActions, setShowActions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tabloda canlı sayaçlar (orderId → total + unread + lastMsg)
  const [liveCounts, setLiveCounts] = useState<
    Record<string, { count: number; unread: number; lastMsg?: string }>
  >(() =>
    Object.fromEntries(orders.map((o) => [o.id, { count: o.messageCount, unread: o.unreadCount }]))
  );

  const [loading, startLoading] = useTransition();
  const [sending, startSending] = useTransition();
  const [acting, startActing] = useTransition();
  const scrollViewportRef = useRef<HTMLElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const counts = {
    active: orders.filter((o) => o.status === "active").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };
  const visibleOrders = orders.filter((o) => o.status === tab);

  // ── Mesajları yükle (ilk açılış + polling) ──
  const fetchMessages = useCallback(async (orderId: string) => {
    const [mr, ar] = await Promise.all([
      getOrderMessagesAction(orderId),
      getOrderActionRequestsAction(orderId),
    ]);
    if (!mr.error) setMessages(mr.messages ?? []);
    if (!ar.error) setRequests(ar.requests ?? []);
    // Tablodaki canlı sayacı güncelle
    const msgs = mr.messages ?? [];
    const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].body : undefined;
    const unread = msgs.filter((m) => m.senderId !== currentUserId && !m.seenByViewer).length;
    setLiveCounts((prev) => ({
      ...prev,
      [orderId]: { count: msgs.length, unread, lastMsg },
    }));
  }, [currentUserId]);

  // ── Modal açılınca ilk yükleme ──
  useEffect(() => {
    if (!selected) return;
    setError(null);
    setDraft("");
    setShowActions(false);
    startLoading(async () => {
      await fetchMessages(selected.id);
    });
  }, [selected, fetchMessages]);

  // ── Polling: modal açıkken 5 sn'de bir kontrol ──
  useEffect(() => {
    if (!selected) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      const [mr, ar] = await Promise.all([
        getOrderMessagesAction(selected.id),
        getOrderActionRequestsAction(selected.id),
      ]);
      if (!mr.error) {
        const msgs = mr.messages ?? [];
        if (msgs.length !== messages.length) {
          setMessages(msgs);
          const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].body : undefined;
          const unread = msgs.filter((m) => m.senderId !== currentUserId && !m.seenByViewer).length;
          setLiveCounts((prev) => ({
            ...prev,
            [selected.id]: { count: msgs.length, unread, lastMsg },
          }));
        }
      }
      if (!ar.error) {
        setRequests(ar.requests ?? []);
      }
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selected, messages.length]);

  // ── Scroll to bottom ──
  useLayoutEffect(() => {
    const el = scrollViewportRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
    });
    return () => cancelAnimationFrame(id);
  }, [messages.length, requests.length, selected]);

  const handleClose = () => setSelected(null);
  useEffect(() => {
    setLiveCounts((prev) => {
      const next: Record<string, { count: number; unread: number; lastMsg?: string }> = {};
      for (const o of orders) {
        const old = prev[o.id];
        next[o.id] = old ?? { count: o.messageCount, unread: o.unreadCount };
      }
      return next;
    });
  }, [orders]);
  useEffect(() => {
    if (!selected) return;
    if (!visibleOrders.some((o) => o.id === selected.id)) setSelected(null);
  }, [visibleOrders, selected]);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab("active")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === "active" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
        >
          Aktif ({counts.active})
        </button>
        <button
          type="button"
          onClick={() => setTab("completed")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === "completed" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
        >
          Tamamlanan ({counts.completed})
        </button>
        <button
          type="button"
          onClick={() => setTab("cancelled")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === "cancelled" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
        >
          İptal Edilmiş ({counts.cancelled})
        </button>
      </div>
      {/* ── Orders Table ── */}
      <div className="orders-table-wrap">
        {visibleOrders.length === 0 ? (
          <div className="orders-empty">
            <div className="orders-empty__icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
              </svg>
            </div>
            <p className="orders-empty__title">
              {tab === "active"
                ? "Henüz aktif siparişiniz yok"
                : tab === "completed"
                  ? "Henüz tamamlanan siparişiniz yok"
                  : "Henüz iptal edilmiş siparişiniz yok"}
            </p>
            <Link href="/ilanlar" scroll={false} className="orders-empty__link">
              İlanlara göz at →
            </Link>
          </div>
        ) : (
          <div className="orders-card-list">
            {visibleOrders.map((o) => {
              const live = liveCounts[o.id] ?? { count: o.messageCount, unread: o.unreadCount };
              const isActive = selected?.id === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelected(o)}
                  className={`orders-card ${isActive ? "orders-card--active" : ""}`}
                >
                  {/* Sol: avatar */}
                  <div className="orders-card__avatar">
                    {getInitial(o.counterpartyName)}
                  </div>

                  {/* Orta: bilgi */}
                  <div className="orders-card__body">
                    <div className="orders-card__top">
                      <span className="orders-card__title">{o.listingTitle}</span>
                      <span className={`orders-role ${o.role === "buyer" ? "orders-role--buyer" : "orders-role--seller"}`}>
                        {o.role === "buyer" ? "Alıcı" : "Satıcı"}
                      </span>
                    </div>
                    <div className="orders-card__mid">
                      <span className="orders-card__counterparty">{o.counterpartyName}</span>
                      <span className="orders-card__sep">·</span>
                      <span className="orders-card__price">{o.priceTl.toLocaleString("tr-TR")} TL</span>
                    </div>
                    {live.lastMsg && (
                      <p className="orders-card__preview">{truncate(live.lastMsg)}</p>
                    )}
                  </div>

                  {/* Sağ: mesaj sayacı + tarih */}
                  <div className="orders-card__right">
                    {live.unread > 0 && (
                      <span className={`orders-msg-count ${live.count > 0 ? "orders-msg-count--has" : ""}`}>
                        {live.unread}
                      </span>
                    )}
                    <span className="orders-card__date">{o.createdAt.slice(0, 10)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Chat Modal ── */}
      {selected && (
        <div
          className="chat-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Sipariş mesajlaşması"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="chat-modal">

            {/* Header */}
            <div className="chat-header">
              <div className="chat-header__info">
                <div className="chat-header__avatar">
                  {getInitial(selected.counterpartyName)}
                </div>
                <div className="chat-header__text">
                  <p className="chat-header__name">{selected.listingTitle}</p>
                  <p className="chat-header__sub">
                    <span className={`chat-header__role ${selected.role === "buyer" ? "chat-header__role--buyer" : "chat-header__role--seller"}`}>
                      {selected.role === "buyer" ? "Alıcı" : "Satıcı"}
                    </span>
                    <span className="chat-header__sep">·</span>
                    {selected.counterpartyName}
                    <span className="chat-header__sep">·</span>
                    <span className="chat-header__price">{selected.priceTl.toLocaleString("tr-TR")} TL</span>
                  </p>
                </div>
              </div>
              <div className="chat-header__actions">
                <span className="chat-poll-badge" title="Her 5 saniyede otomatik güncellenir">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <circle cx="12" cy="12" r="6"/>
                  </svg>
                  Canlı
                </span>
                <button type="button" onClick={handleClose} className="chat-close-btn" aria-label="Kapat">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Order actions accordion */}
            <div className="chat-actions-bar">
              <button
                type="button"
                onClick={() => setShowActions((v) => !v)}
                className="chat-actions-toggle"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                </svg>
                Sipariş İşlemleri
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  className={`chat-actions-chevron ${showActions ? "chat-actions-chevron--open" : ""}`}
                  aria-hidden
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>

              {showActions && (
                <div className="chat-actions-panel">
                  <div className="chat-actions-panel__btns">
                    {selected.role === "seller" ? (
                      <>
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() => {
                            startActing(async () => {
                              const r = await requestOrderActionAction({ orderId: selected.id, kind: "complete_sale" });
                              if (r.error) { setError(r.error); return; }
                              const loaded = await getOrderActionRequestsAction(selected.id);
                              setRequests(loaded.requests ?? []);
                            });
                          }}
                          className="chat-action-btn chat-action-btn--complete"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden><path d="M20 6 9 17l-5-5"/></svg>
                          Satışı Tamamla
                        </button>
                        <button
                          type="button"
                          disabled={acting || actionReason.trim().length < 4}
                          onClick={() => {
                            startActing(async () => {
                              const r = await requestOrderActionAction({ orderId: selected.id, kind: "cancel_by_seller", reason: actionReason });
                              if (r.error) { setError(r.error); return; }
                              setActionReason("");
                              const loaded = await getOrderActionRequestsAction(selected.id);
                              setRequests(loaded.requests ?? []);
                            });
                          }}
                          className="chat-action-btn chat-action-btn--cancel"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden><path d="M18 6 6 18M6 6l12 12"/></svg>
                          İlanı İptal Et
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={acting || actionReason.trim().length < 4}
                        onClick={() => {
                          startActing(async () => {
                            const r = await requestOrderActionAction({ orderId: selected.id, kind: "cancel_by_buyer", reason: actionReason });
                            if (r.error) { setError(r.error); return; }
                            setActionReason("");
                            const loaded = await getOrderActionRequestsAction(selected.id);
                            setRequests(loaded.requests ?? []);
                          });
                        }}
                        className="chat-action-btn chat-action-btn--cancel"
                      >
                        İptal Talebinde Bulun
                      </button>
                    )}
                  </div>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    rows={2}
                    placeholder="İptal gerekçesi yazın (zorunlu, min. 4 karakter)"
                    className="chat-action-textarea"
                  />
                </div>
              )}
            </div>

            {/* Mesaj alanı: mesajlar üstte, işlem talepleri en altta */}
            <section ref={scrollViewportRef} className="chat-messages">
              {/* Messages */}
              {loading ? (
                <div className="chat-loading">
                  <span className="chat-loading__dot"/><span className="chat-loading__dot"/><span className="chat-loading__dot"/>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-no-messages">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <p>Henüz mesaj yok.</p>
                  <p className="chat-no-messages__sub">İlk mesajı sen gönder!</p>
                </div>
              ) : (
                <div className="chat-bubble-list">
                  {messages.map((m) => {
                    const mine = m.senderDisplayName === currentUserDisplayName;
                    return (
                      <div key={m.id} className={`chat-bubble-row ${mine ? "chat-bubble-row--mine" : "chat-bubble-row--theirs"}`}>
                        {!mine && (
                          <div className="chat-bubble__avatar" aria-hidden>
                            {getInitial(m.senderDisplayName)}
                          </div>
                        )}
                        <div className={`chat-bubble ${mine ? "chat-bubble--mine" : "chat-bubble--theirs"}`}>
                          {!mine && <p className="chat-bubble__sender">{m.senderDisplayName}</p>}
                          <p className="chat-bubble__body">{m.body}</p>
                          <p className={`chat-bubble__time ${mine ? "chat-bubble__time--mine" : ""}`}>
                            {m.createdAt}
                            {mine ? (
                              <span className={`ml-1 inline-flex align-middle ${m.seenByOther ? "text-cyan-200" : "text-indigo-200"}`} aria-label={m.seenByOther ? "Goruldu" : "Gonderildi"}>
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                  <path d="m3 10 3 3 5-6" />
                                  <path d="m8 10 3 3 6-7" />
                                </svg>
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* İşlem talepleri — mesajların altında, en son gösterilen öğe */}
              {requests.length > 0 && (
                <div className="chat-requests">
                  {requests.map((r) => {
                    const waitingMyDecision = r.status === "pending" && r.requestedBy !== currentUserId;
                    const rejectVal = rejectReason[r.id] ?? "";
                    const si = statusInfo(r.status);
                    return (
                      <div key={r.id} className="order-req mt-4">
                        <div className="order-req__top">
                          <div className="order-req__icon" aria-hidden>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                          </div>
                          <p className="order-req__label">{actionLabel(r.kind)}</p>
                          <span className={`order-req__badge ${si.cls}`}>{si.label}</span>
                        </div>
                        {r.reason && <p className="order-req__note">Gerekçe: {r.reason}</p>}
                        {r.responseReason && <p className="order-req__note">İtiraz: {r.responseReason}</p>}
                        <p className="order-req__date">{r.createdAt}</p>
                        {waitingMyDecision && (
                          <div className="order-req__respond">
                            <div className="order-req__respond-btns">
                              <button
                                type="button"
                                disabled={acting}
                                onClick={() => {
                                  if (!selected) return;
                                  startActing(async () => {
                                    const res = await respondOrderActionRequestAction({ requestId: r.id, orderId: selected.id, approve: true });
                                    if (res.error) { setError(res.error); return; }
                                    const loaded = await getOrderActionRequestsAction(selected.id);
                                    setRequests(loaded.requests ?? []);
                                  });
                                }}
                                className="order-req__btn order-req__btn--approve"
                              >Onayla</button>
                              <button
                                type="button"
                                disabled={acting || rejectVal.trim().length < 4}
                                onClick={() => {
                                  if (!selected) return;
                                  startActing(async () => {
                                    const res = await respondOrderActionRequestAction({ requestId: r.id, orderId: selected.id, approve: false, responseReason: rejectVal });
                                    if (res.error) { setError(res.error); return; }
                                    setRejectReason((prev) => ({ ...prev, [r.id]: "" }));
                                    const loaded = await getOrderActionRequestsAction(selected.id);
                                    setRequests(loaded.requests ?? []);
                                  });
                                }}
                                className="order-req__btn order-req__btn--reject"
                              >İtiraz Et</button>
                            </div>
                            <textarea
                              value={rejectVal}
                              onChange={(e) => setRejectReason((prev) => ({ ...prev, [r.id]: e.target.value }))}
                              rows={2}
                              placeholder="İtiraz gerekçesi (zorunlu)"
                              className="chat-action-textarea"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Compose area */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selected) return;
                const text = draft.trim();
                if (!text) return;
                setError(null);
                startSending(async () => {
                  const r = await sendOrderMessageAction(selected.id, text);
                  if (r.error) { setError(r.error); return; }
                  setDraft("");
                  await fetchMessages(selected.id);
                });
              }}
              className="chat-compose"
            >
              {error && <p className="chat-compose__error">{error}</p>}
              <div className="chat-compose__inner">
                <textarea
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    // Otomatik yükseklik
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (sending) return;
                      const form = e.currentTarget.form;
                      if (form) form.requestSubmit();
                    }
                  }}
                  rows={3}
                  placeholder="Mesajınızı yazın… (Enter = gönder, Shift+Enter = yeni satır)"
                  className="chat-compose__textarea"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="chat-compose__send"
                  aria-label="Gönder"
                >
                  {sending ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden className="chat-compose__spin">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="m22 2-11 20-4-9-9-4 24-7z"/>
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
