import Link from "next/link";
import { GAME_MARKET_PLANS } from "@/lib/market-data";
import { getLatestPublicListings } from "@/lib/listings";
import ListingCard from "@/components/ListingCard";

export default async function Home() {
  const latestListings = await getLatestPublicListings(6);
  const activeGames = GAME_MARKET_PLANS.filter((item) => item.status === "aktif");

  return (
    <div className="relative min-h-screen bg-[#f8f7ff] overflow-hidden">
      {/* Background Floating Blobs */}
      <div className="pointer-events-none absolute -top-40 -left-20 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[80px]" aria-hidden />
      <div className="pointer-events-none absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-[80px]" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 left-1/3 h-[700px] w-[700px] rounded-full bg-sky-500/5 blur-[100px]" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden rounded-[2rem] border border-[#e8e5ff] bg-white/70 p-8 shadow-[0_8px_32px_rgba(99,102,241,0.05)] backdrop-blur-xl sm:p-16 lg:p-24">
          <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-white/20" />
          
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
              </span>
              Premium Pazaryeri
            </div>
            
            <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight text-[#1e1b4b] sm:text-7xl lg:text-[5rem] lg:leading-[1.1]">
              Dijital varlık ticaretinin <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">
                en şık hali.
              </span>
            </h1>
            
            <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-slate-500 sm:text-xl">
              Knight Online ve popüler PvP sunucularında güvenli alışveriş. 
              Saniyeler içinde ilan oluşturun, en uygun fiyatlı fırsatları anında yakalayın.
            </p>
            
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/ilanlar"
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-sm font-bold text-white shadow-[0_4px_20px_rgba(99,102,241,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(99,102,241,0.4)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#f8f7ff]"
              >
                İlanları Keşfet
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              <Link
                href="/hesabim/yeni-ilan"
                className="inline-flex items-center justify-center rounded-xl border border-[#e8e5ff] bg-white px-8 py-4 text-sm font-bold text-[#1e1b4b] shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#f8f7ff]"
              >
                Ücretsiz İlan Ver
              </Link>
            </div>
          </div>
        </section>

        {/* POPÜLER SUNUCULAR */}
        <section className="mt-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#1e1b4b] sm:text-3xl">Popüler Sunucular</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">En çok ticaret dönen oyunlar ve sunucular.</p>
            </div>
          </div>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {activeGames.map((game) => (
              <div 
                key={game.slug} 
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#ede9fe] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_12px_40px_-12px_rgba(99,102,241,0.15)]"
              >
                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-[#1e1b4b]">{game.name}</h3>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600 ring-1 ring-inset ring-emerald-500/20">
                    Aktif
                  </span>
                </div>
                
                <p className="mb-6 text-sm text-slate-500">
                  Toplam <strong className="font-semibold text-slate-700">{game.serverOrModes.length}</strong> pazar kanalı
                </p>
                
                <div className="mt-auto flex flex-wrap gap-2">
                  {game.serverOrModes.map((sm) => {
                    const slug = sm.toLowerCase().replace(/\s+/g, "-");
                    return (
                      <Link
                        key={sm}
                        href={`/ilanlar/pvp/${slug}`}
                        className="inline-flex items-center rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        {sm}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* VİTRİN */}
        <section className="mt-24">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#1e1b4b] sm:text-3xl">Pazara Düşenler</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">Sisteme eklenen son ilanları kaçırmayın.</p>
            </div>
            <Link 
              href="/ilanlar" 
              className="hidden text-sm font-bold text-indigo-600 hover:text-indigo-700 sm:block"
            >
              Tümünü Gör →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {latestListings.length > 0 ? (
              latestListings.map((listing) => {
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
              <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#e8e5ff] bg-white/50 py-20 text-center backdrop-blur-sm">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 shadow-sm">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="mt-6 text-lg font-bold text-[#1e1b4b]">Henüz ilan yok</h3>
                <p className="mt-2 text-sm text-slate-500">Platforma ilk ilanı veren siz olun!</p>
              </div>
            )}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link 
              href="/ilanlar" 
              className="inline-block text-sm font-bold text-indigo-600 hover:text-indigo-700"
            >
              Tüm İlanları Gör →
            </Link>
          </div>
        </section>
        
        {/* CTA BÖLÜMÜ */}
        <section className="mt-32">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#1e1b4b] px-6 py-20 text-center shadow-2xl sm:px-16 sm:py-24">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
            <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-indigo-500 opacity-20 blur-[100px]" />
            <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-500 opacity-20 blur-[100px]" />
            
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Alışverişe Başlayın
              </h2>
              <p className="mt-6 text-lg text-indigo-100/80">
                Binlerce oyuncunun arasına katılın, güvenilir altyapı ile anında satıp anında kazanın.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/kayit"
                  className="w-full rounded-xl bg-indigo-500 px-8 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-[#1e1b4b] sm:w-auto"
                >
                  Hemen Hesap Oluştur
                </Link>
                <Link
                  href="/login"
                  className="w-full rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/10 sm:w-auto"
                >
                  Giriş Yap
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
