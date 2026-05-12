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
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-200">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute -top-32 -right-32 h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-indigo-100 to-violet-50 opacity-70 blur-[100px]" />
        
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-16 text-center sm:px-12 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-indigo-700 ring-1 ring-inset ring-indigo-600/10">
            Knight Online PVP
          </span>
          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tighter text-slate-900 sm:text-6xl">
            Sunucu Seç, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Pazara Gir
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-slate-500">
            Örneğin <strong className="font-bold text-slate-700">ko4fun</strong> yazıp aradığında doğrudan o
            sunucunun sayfasına yönlenirsin. Ardından Item, CSS Pazarı veya Goldbar ile ilanlara inersin.
          </p>

          <form className="mt-10 flex w-full max-w-lg flex-col gap-3 sm:flex-row sm:items-stretch" action="/ilanlar" method="GET">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                </svg>
              </span>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Sunucu ara (ko4fun, oldusko, apex...)"
                className="w-full rounded-xl border-0 bg-slate-50 py-4 pl-12 pr-4 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-600 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-14 items-center justify-center rounded-xl bg-slate-900 px-8 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 sm:w-auto"
            >
              Sunucu Bul
            </button>
          </form>
        </div>
      </section>

      <section className="mt-20">
        <div className="flex items-end justify-between border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{q ? "Eşleşen Sunucular" : "Tüm PVP Sunucuları"}</h2>
            <p className="mt-1 text-sm text-slate-500">Bir karta tıkla — üç pazar seçeneği açılır.</p>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
              <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Sonuç bulunamadı</h3>
            <p className="mt-1 text-sm text-slate-500">Farklı bir sunucu adı veya kısaltma dene.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((server) => (
              <Link
                key={server.slug}
                href={`/ilanlar/pvp/${server.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-slate-300"
              >
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">{server.name}</h3>
                    <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                      PVP
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 font-mono">
                    /{server.slug}
                  </p>
                  
                  <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                      Item
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-500"></span>
                      CSS
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      Goldbar
                    </span>
                  </div>

                  <div className="mt-8 flex items-center justify-end border-t border-slate-100 pt-4">
                    <span className="text-sm font-bold text-indigo-600 transition-colors group-hover:text-indigo-700 flex items-center gap-1">
                      Pazara Git
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
