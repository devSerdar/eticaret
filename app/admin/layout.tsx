import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/admin-auth";
import { getSession } from "@/lib/session";

const nav = [
  { href: "/admin", label: "Ozet" },
  { href: "/admin/kullanicilar", label: "Kullanicilar" },
  { href: "/admin/siparisler", label: "Siparisler" },
  { href: "/admin/ilanlar", label: "Ilanlar" },
  { href: "/admin/moderasyon", label: "Moderasyon" },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect(`/login?next=${encodeURIComponent("/admin")}`);
  if (!isAdminEmail(s.email)) redirect("/");

  return (
    <div className="min-h-[50vh] bg-slate-50/50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/admin" className="text-sm font-bold tracking-tight text-slate-900">
              Yonetim
            </Link>
            <span className="max-w-[min(100%,14rem)] truncate text-xs text-slate-500 sm:max-w-xs">{s.email}</span>
            <Link href="/" className="shrink-0 text-sm font-medium text-indigo-700 hover:underline">
              Siteye don
            </Link>
          </div>
          <nav className="mt-3 flex flex-wrap gap-1 border-t border-slate-100 pt-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                scroll={false}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
