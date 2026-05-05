import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-slate-200/80 bg-white/90 shadow-[0_-8px_40px_rgba(15,23,42,0.04)] backdrop-blur-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200/70 to-transparent" />
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="text-base font-bold text-slate-900">OyunTicaret</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--text-muted)]">
            Knight Online PVP odakli pazar. Guvenli islem ve sade deneyim hedefiyle gelistiriliyor.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hizli baglantilar</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/ilanlar" className="text-slate-600 transition hover:text-indigo-600">
                Ilanlar
              </Link>
            </li>
            <li>
              <Link href="/#oyun-plani" className="text-slate-600 transition hover:text-indigo-600">
                Oyun plani
              </Link>
            </li>
            <li>
              <Link href="/#kategori-plani" className="text-slate-600 transition hover:text-indigo-600">
                Kategoriler
              </Link>
            </li>
          </ul>
        </div>
        <div className="md:text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Durum</p>
          <p className="mt-3 text-sm text-[var(--text-muted)]">Aktif gelistirme — destek kanali yakinda.</p>
          <p className="mt-6 text-xs text-slate-400">© {new Date().getFullYear()} OyunTicaret</p>
        </div>
      </div>
    </footer>
  );
}
