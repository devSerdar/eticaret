import Link from "next/link";
import { notFound } from "next/navigation";
import { countListingsByServerAndMarket } from "@/lib/listings";
import { getPvpServerBySlug, PVP_MARKETS } from "@/lib/ko-pvp-catalog";

type ServerHubProps = {
  params: Promise<{ server: string }>;
};

const marketStyle: Record<string, { gradient: string; icon: string }> = {
  item: { gradient: "from-violet-500 via-fuchsia-500 to-pink-500", icon: "I" },
  css: { gradient: "from-sky-500 via-cyan-500 to-teal-400", icon: "C" },
  goldbar: { gradient: "from-amber-500 via-orange-500 to-yellow-400", icon: "G" },
};

export default async function PvpServerHubPage({ params }: ServerHubProps) {
  const { server: serverParam } = await params;
  const server = getPvpServerBySlug(serverParam);
  if (!server) notFound();

  const counts = await Promise.all(
    PVP_MARKETS.map(async (market) => ({
      market,
      count: await countListingsByServerAndMarket(server.slug, market.slug),
    })),
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-14">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
        <Link
          href="/ilanlar"
          className="rounded-full bg-white/90 px-3 py-1 font-medium text-indigo-700 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-indigo-50"
        >
          Sunucu ara
        </Link>
        <span className="text-slate-300">/</span>
        <span className="rounded-full bg-slate-900/[0.04] px-3 py-1 font-medium text-slate-800 ring-1 ring-slate-900/5">
          {server.name}
        </span>
      </nav>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{server.name}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-muted)] md:text-base">
            Pazar turunu sec; listeler sadece bu sunucu ve secilen kategoriye gore filtrelenir.
          </p>
        </div>
        <div className="rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50/90 to-white px-4 py-3 text-sm text-indigo-950 shadow-sm ring-1 ring-indigo-100/60">
          <span className="font-semibold">3 pazar</span>
          <span className="text-indigo-400"> · </span>
          Item, CSS, Goldbar
        </div>
      </div>

      <div className="mt-10 grid auto-rows-fr gap-5 md:grid-cols-3 md:items-stretch">
        {counts.map(({ market, count }) => {
          const style = marketStyle[market.slug] ?? marketStyle.item;
          return (
            <Link
              key={market.slug}
              href={`/ilanlar/pvp/${server.slug}/${market.slug}`}
              className="group relative flex h-full min-h-[240px] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-[var(--shadow-sm)] ring-1 ring-slate-900/[0.03] transition hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
            >
              <div className={`absolute inset-x-0 top-0 z-10 h-1.5 bg-gradient-to-r ${style.gradient}`} />
              <div className="flex flex-1 flex-col p-6 pt-8">
                <div className="flex gap-4">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${style.gradient} text-sm font-black text-white shadow-lg`}
                  >
                    {style.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold text-slate-900">{market.label}</h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--text-muted)]">
                      {market.description}
                    </p>
                  </div>
                </div>

                <div className="mt-auto border-t border-slate-100 pt-4">
                  <p className="inline-flex items-center gap-2 rounded-full bg-slate-900/[0.04] px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-900/5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {count} ilan
                  </p>
                  <p className="mt-3 text-xs font-semibold text-indigo-600 transition group-hover:text-indigo-700">
                    Listeyi ac →
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
