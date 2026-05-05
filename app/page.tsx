import Link from "next/link";
import { GAME_MARKET_PLANS } from "@/lib/market-data";

export default function Home() {
  const activeGames = GAME_MARKET_PLANS.filter((item) => item.status === "aktif");
  const upcomingGames = GAME_MARKET_PLANS.filter((item) => item.status === "yakinda");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-16">
      <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-8 shadow-[var(--shadow-lg)] ring-1 ring-slate-900/5 backdrop-blur-md md:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-indigo-400/30 to-violet-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-teal-400/20 to-cyan-300/15 blur-3xl" />

        <div className="relative">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-4 py-1.5 text-xs font-semibold tracking-wide text-indigo-800 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.25)]" />
            OyunTicaret — coklu oyun altyapisi
          </p>
          <h1 className="max-w-3xl text-3xl font-bold leading-[1.15] tracking-tight text-slate-900 md:text-5xl md:leading-tight">
            Guvenli alim satim icin <span className="bg-gradient-to-r from-indigo-700 to-violet-600 bg-clip-text text-transparent">modern</span> bir pazar
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--text-muted)] md:text-lg">
            Sistem Knight Online ile basliyor; veri modeli ileride eklenecek oyunlara hazir. Yeni oyun eklemek
            merkezi plan listesine kayit eklemek kadar basit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/ilanlar"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500"
            >
              Ilanlara Git
            </Link>
            <a
              href="#kategori-plani"
              className="inline-flex items-center justify-center rounded-full border border-slate-200/90 bg-white/90 px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-indigo-200 hover:bg-white"
            >
              Kategori plani
            </a>
          </div>

          <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-slate-200/80 pt-8 sm:max-w-2xl">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Aktif oyun</dt>
              <dd className="mt-1 text-lg font-bold text-slate-900">{activeGames.length}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Yakinda</dt>
              <dd className="mt-1 text-lg font-bold text-slate-900">{upcomingGames.length}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">PVP sunucu</dt>
              <dd className="mt-1 text-lg font-bold text-slate-900">
                {activeGames[0]?.serverOrModes.length ?? "—"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section id="oyun-plani" className="mt-16 scroll-mt-24">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Oyun plani</h2>
            <p className="mt-1 max-w-xl text-sm text-[var(--text-muted)]">
              Aktif oyunlar hemen, digerleri kontrollu sekilde acilacak.
            </p>
          </div>
          <span className="hidden h-px flex-1 translate-y-[-10px] bg-gradient-to-r from-slate-200 to-transparent sm:block" />
        </div>

        <div className="mt-6 grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3 md:items-stretch">
          {GAME_MARKET_PLANS.map((game) => (
            <article
              key={game.slug}
              className="group relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[var(--shadow-sm)] ring-1 ring-slate-900/[0.03] transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 ${
                  game.status === "aktif"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : "bg-gradient-to-r from-amber-400 to-orange-400"
                }`}
              />
              <div className="flex flex-1 flex-col pt-0.5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 text-lg font-semibold text-slate-900">{game.name}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      game.status === "aktif"
                        ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                        : "bg-amber-50 text-amber-900 ring-1 ring-amber-100"
                    }`}
                  >
                    {game.status === "aktif" ? "Aktif" : "Yakinda"}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
                  {game.serverOrModeLabel}: <span className="font-medium text-slate-700">{game.serverOrModes.length}</span>{" "}
                  baslik
                </p>
                <p className="mt-2 line-clamp-3 flex-1 text-sm text-[var(--text-muted)]">
                  Kategori: <span className="text-slate-700">{game.categories.join(", ")}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="kategori-plani" className="mt-16 scroll-mt-24" aria-labelledby="kategori-baslik">
        <h2 id="kategori-baslik" className="text-2xl font-bold tracking-tight text-slate-900">
          Aktif oyunlar — kategori plani
        </h2>
        <div className="mt-6 space-y-4">
          {activeGames.map((game) => (
            <div
              key={game.slug}
              className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[var(--shadow-sm)] ring-1 ring-slate-900/[0.03]"
            >
              <p className="text-sm font-semibold text-slate-800">{game.name}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {game.categories.map((item) => (
                  <span
                    key={`${game.slug}-${item}`}
                    className="rounded-full border border-indigo-100/80 bg-gradient-to-b from-white to-indigo-50/50 px-4 py-2 text-sm font-medium text-indigo-950 shadow-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {upcomingGames.length > 0 ? (
          <p className="mt-6 text-sm text-[var(--text-muted)]">
            Siradaki oyunlar: <span className="font-medium text-slate-700">{upcomingGames.map((g) => g.name).join(", ")}</span>
          </p>
        ) : null}
      </section>
    </div>
  );
}
