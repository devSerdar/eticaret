"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminCancelIncompleteOrderAction } from "@/lib/admin-actions";

export default function AdminOrderCancelForm({
  orderId,
  canCancel,
}: {
  orderId: string;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!canCancel) {
    return (
      <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Bu sipariş iptal edilemez (zaten iptal veya satış tamamlanmış).
      </p>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = reason.trim();
    if (t.length < 8) return;
    setError(null);
    start(async () => {
      const r = await adminCancelIncompleteOrderAction(orderId, t);
      if (r.error) {
        setError(r.error);
        return;
      }
      setReason("");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 rounded-2xl border border-rose-200/90 bg-rose-50/40 p-4 ring-1 ring-rose-100"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-rose-900">Siparişi yönetici iptali</p>
      <p className="mt-1 text-xs text-rose-950/80">
        Yalnızca <strong>tamamlanmamış</strong> siparişler. Alıcıya iade, satıcıdan tutar düşülür; sohbete gerekçe
        mesajı düşer.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        placeholder="İptal gerekçesi (en az 8 karakter) — kullanıcılar görecek"
        className="mt-3 w-full resize-y rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-rose-300"
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending || reason.trim().length < 8}
          className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
        >
          {pending ? "İptal ediliyor…" : "Siparişi iptal et"}
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
