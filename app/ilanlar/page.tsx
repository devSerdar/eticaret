import Link from "next/link";
import { redirect } from "next/navigation";
import { getPvpServerBySlug, searchPvpServers } from "@/lib/ko-pvp-catalog";

type IlanlarPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function IlanlarPage({ searchParams }: IlanlarPageProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";

  if (q) {
    const exact = getPvpServerBySlug(q);
    if (exact) redirect(`/ilanlar/pvp/${exact.slug}`);
  }

  const matches = searchPvpServers(q);

  if (q && matches.length === 1) {
    redirect(`/ilanlar/pvp/${matches[0].slug}`);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-14">
      <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[var(--shadow-lg)] ring-1 ring-slate-900/5 backdrop-blur-md sm:p-8">
        <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-gradient-to-br from-indigo-400/25 to-transparent blur-2xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Knight Online PVP</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-4xl">Sunucu sec, pazara gir</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)] md:text-base">
            Ornegin <strong className="font-semibold text-slate-800">ko4fun</strong> yazip aradiginda dogrudan o
            sunucunun sayfasina yonlenirsin. Ardından Item, CSS Pazari veya Goldbar ile ilanlara inersin.
          </p>

          <form className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch" action="/ilanlar" method="GET">
            <div className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                </svg>
              </span>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Sunucu ara (ko4fun, oldusko, apex...)"
                className="w-full rounded-2xl border border-slate-200/90 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 shadow-inner outline-none ring-0 transition placeholder:text-slate-400 focus:border-indigo-300 focus:shadow-[0_0_0_3px_var(--ring-focus)]"
              />
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500 sm:w-auto"
            >
              Sunucu bul
            </button>
          </form>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{q ? "Eslesen sunucular" : "Tum PVP sunuculari"}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Bir karta tikla — uc pazar secenegi acilir.</p>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300/90 bg-white/70 p-10 text-center shadow-[var(--shadow-sm)]">
            <p className="text-sm font-medium text-slate-700">Sonuc bulunamadi</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Farkli bir sunucu adi veya kisaltma dene.</p>
          </div>
        ) : (
          <ul className="mt-6 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:items-stretch">
            {matches.map((server) => (
              <li key={server.slug} className="flex h-full min-h-0">
                <Link
                  href={`/ilanlar/pvp/${server.slug}`}
                  className="group relative flex h-full min-h-[200px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-[var(--shadow-sm)] ring-1 ring-slate-900/[0.03] transition hover:-translate-y-1 hover:border-indigo-200/80 hover:shadow-[var(--shadow-md)]"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-80 transition group-hover:opacity-100" />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-slate-900">{server.name}</p>
                        <p className="mt-1 truncate font-mono text-xs text-slate-500">/{server.slug}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-900/[0.04] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 ring-1 ring-slate-900/5">
                        PVP
                      </span>
                    </div>
                    <p className="mt-4 line-clamp-2 text-sm text-[var(--text-muted)]">
                      <span className="font-medium text-slate-700">Item</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span className="font-medium text-slate-700">CSS</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span className="font-medium text-slate-700">Goldbar</span>
                    </p>
                    <p className="mt-auto pt-4 text-xs font-medium text-indigo-600 transition group-hover:text-indigo-700">
                      Pazara git →
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
