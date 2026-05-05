import Link from "next/link";
import { logoutAction } from "@/lib/auth-actions";

export type NavbarUser = {
  displayName: string;
  email: string;
  balanceTL: number;
};

const links = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/ilanlar", label: "Ilanlar" },
  { href: "/#oyun-plani", label: "Oyun Plani" },
  { href: "/#kategori-plani", label: "Kategoriler" },
];

type NavbarProps = {
  user: NavbarUser | null;
  /** ADMIN_EMAILS ile eslesen oturum */
  showAdmin?: boolean;
};

function userInitial(displayName: string, email: string): string {
  const c = displayName.trim().charAt(0) || email.trim().charAt(0) || "?";
  return c.toLocaleUpperCase("tr-TR");
}

export default function Navbar({ user, showAdmin }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/75 shadow-[var(--shadow-xs)] backdrop-blur-xl backdrop-saturate-150">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-200/80 to-transparent" />
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 py-2 sm:h-[4.25rem] sm:gap-4 sm:py-0">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-black text-white shadow-md shadow-indigo-500/25 ring-2 ring-white/80">
            OT
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            Oyun<span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Ticaret</span>
          </span>
        </Link>

        <nav className="flex min-w-0 flex-1 justify-center overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden">
          <div className="flex shrink-0 items-center gap-0.5 rounded-full border border-slate-200/80 bg-white/60 p-1 shadow-inner md:gap-1">
            {links.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="shrink-0 rounded-full px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-indigo-700 hover:shadow-sm sm:px-3.5 sm:text-sm"
              >
                {item.label}
              </Link>
            ))}
            {showAdmin ? (
              <Link
                href="/admin"
                scroll={false}
                className="shrink-0 rounded-full px-3 py-2 text-xs font-semibold text-rose-800 transition hover:bg-rose-50 hover:shadow-sm sm:px-3.5 sm:text-sm"
              >
                Yonetim
              </Link>
            ) : null}
          </div>
        </nav>

        <div className="flex shrink-0 items-center justify-end">
          {user ? (
            <div className="flex max-w-[min(100vw-8rem,22rem)] items-center rounded-2xl border border-slate-200/90 bg-white/95 py-1 pl-1.5 pr-1 shadow-sm ring-1 ring-slate-900/[0.04] sm:max-w-none">
              <Link
                href="/hesabim"
                className="flex min-w-0 max-w-[10rem] items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-slate-50 sm:max-w-[11rem] sm:px-2.5"
                title={user.email}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-sm font-bold text-white shadow-inner ring-2 ring-white"
                  aria-hidden
                >
                  {userInitial(user.displayName, user.email)}
                </span>
                <span className="hidden min-w-0 flex-col text-left sm:flex">
                  <span className="truncate text-sm font-semibold leading-tight text-slate-900">{user.displayName}</span>
                  <span className="truncate text-[11px] leading-tight text-slate-500">{user.email}</span>
                </span>
              </Link>

              <span className="mx-0.5 hidden h-9 w-px shrink-0 bg-slate-200/90 sm:block" aria-hidden />

              <Link
                href="/bakiye/yukle"
                scroll={false}
                className="flex shrink-0 flex-col items-center justify-center rounded-xl px-2.5 py-1.5 text-center transition hover:bg-emerald-50/80 sm:min-w-[4.5rem] sm:px-3"
                title="Bakiye yukle"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/90">Bakiye</span>
                <span className="text-sm font-bold tabular-nums leading-tight text-emerald-950">
                  {user.balanceTL.toLocaleString("tr-TR")} <span className="text-xs font-semibold text-emerald-800/80">TL</span>
                </span>
              </Link>

              <span className="mx-0.5 hidden h-9 w-px shrink-0 bg-slate-200/90 sm:block" aria-hidden />

              <form action={logoutAction} className="shrink-0">
                <button
                  type="submit"
                  className="rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-800 sm:px-3 sm:text-sm"
                >
                  Cikis
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full border border-slate-200/90 bg-white/80 px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-white hover:text-indigo-800 sm:px-4"
              >
                Giris
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 transition hover:from-indigo-500 hover:to-violet-500 sm:px-4"
              >
                Kayit Ol
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
