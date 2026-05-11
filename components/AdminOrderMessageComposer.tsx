"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendAdminOrderMessageAction } from "@/lib/admin-actions";

export default function AdminOrderMessageComposer({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = body.trim();
    if (!t) return;
    setError(null);
    start(async () => {
      const r = await sendAdminOrderMessageAction(orderId, t);
      if (r.error) {
        setError(r.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mt-8 rounded-2xl border border-amber-200/90 bg-amber-50/40 p-4 ring-1 ring-amber-100">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Yönetim mesajı</p>
      <p className="mt-1 text-xs text-amber-950/80">
        Bu metin alıcı ve satıcıya sipariş sohbetinde görünür (aynı turuncu “Yönetim” etiketi ile).
      </p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Kullanıcılara görünecek mesaj…"
        className="mt-3 w-full resize-y rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-300"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {pending ? "Gönderiliyor…" : "Sohbete gönder"}
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
