import Link from "next/link";
import { listOpenModerationReports } from "@/lib/moderation";
import { resolveModerationAction } from "@/lib/moderation-actions";

const KIND_LABEL: Record<string, string> = {
  user_message: "Mesaj bildirimi",
  off_channel: "Dis kanal",
  payment_suspicion: "Odeme suphesi",
  other: "Diger",
};

type PageProps = {
  searchParams: Promise<{ hata?: string }>;
};

export default async function AdminModerasyonPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const reports = await listOpenModerationReports();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Moderasyon kuyrugu</h1>
      <p className="mt-2 text-sm text-slate-600">
        Uyelerin bildirdigi mesajlar ve diger kayitlar. Inceleme notu yazip kaydi kapatabilirsiniz.
      </p>

      {sp.hata ? (
        <p
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
          role="alert"
        >
          {decodeURIComponent(sp.hata)}
        </p>
      ) : null}

      {reports.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
          Acik bildirim yok.
        </p>
      ) : (
        <ul className="mt-8 space-y-6">
          {reports.map((r) => {
            const mesajHref =
              r.orderId && r.listingId
                ? `/mesajlar/${encodeURIComponent(r.orderId)}?listingId=${encodeURIComponent(r.listingId)}`
                : null;
            return (
              <li
                key={r.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {KIND_LABEL[r.kind] ?? r.kind}
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-600">{r.id}</p>
                    <p className="mt-2 text-xs text-slate-500">{r.createdAt}</p>
                  </div>
                  {mesajHref ? (
                    <Link
                      href={mesajHref}
                      scroll={false}
                      className="shrink-0 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-900 hover:bg-indigo-100"
                    >
                      Konusmaya git
                    </Link>
                  ) : null}
                </div>

                {r.messageSnippet ? (
                  <blockquote className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                    {r.messageSnippet}
                  </blockquote>
                ) : null}

                <p className="mt-3 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Bildiren:</span>{" "}
                  {r.reporterEmail ?? r.reporterId ?? "—"}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Not:</span> {r.note || "—"}
                </p>

                <form action={resolveModerationAction} className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-end">
                  <input type="hidden" name="reportId" value={r.id} />
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`note-${r.id}`} className="text-xs font-semibold text-slate-600">
                      Yonetici notu
                    </label>
                    <textarea
                      id={`note-${r.id}`}
                      name="adminNote"
                      rows={2}
                      placeholder="Inceleme ozeti…"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <button
                    type="submit"
                    className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Cozuldu
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
