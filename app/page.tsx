import Link from "next/link";
import { GAME_MARKET_PLANS } from "@/lib/market-data";
import { getLatestPublicListings } from "@/lib/listings";
import ListingCard from "@/components/ListingCard";

export default async function Home() {
  const latestListings = await getLatestPublicListings(6);
  const activeGames = GAME_MARKET_PLANS.filter((item) => item.status === "aktif");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-200">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute -top-32 -right-32 h-[40rem] w-[40rem] rounded-full bg-gradient-to-br from-indigo-100 to-violet-50 opacity-70 blur-[100px]" />
        
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-24 text-center sm:px-12 sm:py-32">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-indigo-700 ring-1 ring-inset ring-indigo-600/10">
            OyunTicaret — Premium Pazaryeri
          </span>
          <h1 className="mt-8 max-w-4xl text-5xl font-black tracking-tighter text-slate-900 sm:text-7xl">
            Güvenli, Hızlı ve Modern <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Dijital Varlık Ticareti
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-slate-500 sm:text-xl">
            Knight Online ve popüler PvP sunucularında en uygun fiyatlı ilanları keşfedin, 
            anında teslim alın veya saniyeler içinde kendi ilanınızı oluşturun.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/ilanlar"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-8 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              İlanları Keşfet
            </Link>
            <Link
              href="/hesabim/yeni-ilan"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 transition-all hover:bg-slate-50 hover:text-indigo-600"
            >
              Ücretsiz İlan Ver
            </Link>
          </div>
        </div>
      </section>

      {/* Popüler Sunucular / Kategoriler */}
      <section className="mt-20">
        <div className="flex items-end justify-between border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Popüler Sunucular</h2>
            <p className="mt-1 text-sm text-slate-500">En çok tercih edilen oyun ve sunucular.</p>
          </div>
        </div>
        
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeGames.map((game) => (
            <div key={game.slug} className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-slate-300">
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">{game.name}</h3>
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    Aktif
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {game.serverOrModes.length} farklı pazar başlığı mevcut.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {game.serverOrModes.map((sm) => {
                    const slug = sm.toLowerCase().replace(/\s+/g, "-");
                    return (
                      <Link
                        key={sm}
                        href={`/ilanlar/pvp/${slug}`}
                        className="inline-flex items-center rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 transition-colors hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-200"
                      >
                        {sm}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Vitrin: Son Eklenen İlanlar */}
      <section className="mt-24">
        <div className="flex items-end justify-between border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Son Eklenen İlanlar</h2>
            <p className="mt-1 text-sm text-slate-500">Pazara yeni düşen fırsatları kaçırmayın.</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {latestListings.length > 0 ? (
            latestListings.map((listing) => {
               // Normalde bu bilgiler Listing tablosunda ilişkisel tutulabilir veya slug'dan formatlanabilir.
               const game = GAME_MARKET_PLANS.find((g) => g.slug === listing.gameSlug);
               const gameName = game?.name || "Bilinmiyor";
               const serverName = listing.serverSlug.toUpperCase();
               const marketLabel = listing.marketSlug.charAt(0).toUpperCase() + listing.marketSlug.slice(1);

               return (
                 <ListingCard
                   key={listing.id}
                   listing={listing}
                   gameName={gameName}
                   serverName={serverName}
                   marketLabel={marketLabel}
                 />
               );
            })
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Henüz ilan yok</h3>
              <p className="mt-1 text-sm text-slate-500">Platforma ilk ilanı veren siz olun!</p>
            </div>
          )}
        </div>
      </section>
      
      {/* Call to Action (CTA) */}
      <section className="mt-24 overflow-hidden rounded-[2.5rem] bg-slate-900 relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
        <div className="absolute -top-24 -right-24 h-[30rem] w-[30rem] rounded-full bg-indigo-500 opacity-20 blur-[100px]" />
        
        <div className="relative z-10 px-6 py-20 text-center sm:px-12 sm:py-24">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Satış yapmaya hazır mısınız?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Hemen ücretsiz kayıt olun, saniyeler içinde ilanınızı oluşturun ve binlerce alıcıya güvenle ulaşın.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/kayit"
              className="rounded-xl bg-indigo-500 px-8 py-4 text-sm font-bold text-white shadow-md transition hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              Hemen Hesap Oluştur
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
