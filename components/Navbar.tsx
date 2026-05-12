import Link from "next/link";
import { logoutAction } from "@/lib/auth-actions";

export type NavbarUser = {
  displayName: string;
  email: string;
  balanceTL: number;
};

const links = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/ilanlar", label: "İlanlar" },
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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
            OT
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Oyun<span className="text-indigo-600">Ticaret</span>
          </span>
        </Link>

        {/* Center Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-indigo-600"
            >
              {item.label}
            </Link>
          ))}
          {showAdmin ? (
            <Link
              href="/admin"
              scroll={false}
              className="text-sm font-semibold text-rose-600 transition-colors hover:text-rose-700"
            >
              Yönetim
            </Link>
          ) : null}
        </nav>

        {/* Right Section */}
        <div className="flex items-center justify-end gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {/* Bakiye */}
              <Link
                href="/bakiye/yukle"
                scroll={false}
                className="hidden sm:flex flex-col items-end group"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-emerald-600 transition-colors">Bakiye</span>
                <span className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {user.balanceTL.toLocaleString("tr-TR")} <span className="text-xs font-semibold text-slate-500 group-hover:text-emerald-600">TL</span>
                </span>
              </Link>

              <div className="hidden sm:block h-8 w-px bg-slate-200" aria-hidden />

              {/* User Dropdown / Profile */}
              <div className="flex items-center gap-3">
                <Link
                  href="/hesabim"
                  className="flex items-center gap-3 transition-opacity hover:opacity-80"
                  title={user.email}
                >
                  <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-sm font-bold text-slate-900">{user.displayName}</span>
                    <span className="text-xs font-medium text-slate-500">Hesabım</span>
                  </div>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 ring-1 ring-inset ring-slate-200"
                    aria-hidden
                  >
                    {userInitial(user.displayName, user.email)}
                  </span>
                </Link>

                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition-colors"
                    title="Çıkış Yap"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-flex text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
              >
                Giriş Yap
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
              >
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
