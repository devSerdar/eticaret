import Link from "next/link";
import { notFound } from "next/navigation";
import { adminBanUserAction, adminUnbanUserAction } from "@/lib/admin-actions";
import { adminGetUserById } from "@/lib/admin-data";
import { listOrdersInvolvingUser } from "@/lib/orders";

type PageProps = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ ok?: string; hata?: string }>;
};

export default async function AdminKullaniciProfilPage({ params, searchParams }: PageProps) {
  const [{ userId }, sp] = await Promise.all([params, searchParams]);
  const user = await adminGetUserById(userId);
  if (!user) notFound();

  const orders = await listOrdersInvolvingUser(user.id, 40);

  const hata =
    sp.hata === "self"
      ? "Kendi hesabinizi yasaklayamazsiniz."
      : sp.hata === "not"
        ? "Yasak nedeni en az 4 karakter olmali."
        : sp.hata === "id"
          ? "Gecersiz istek."
          : null;
  const ok =
    sp.ok === "yasak" ? "Kullanici yasaklandi." : sp.ok === "yasak_kaldir" ? "Yasak kaldirildi." : null;

  return (
    <div>
      <nav className="text-sm text-slate-500">
        <Link href="/admin/kullanicilar" className="font-medium text-indigo-700 hover:underline">
          Kullanicilar
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-700">Profil</span>
      </nav>

      <h1 className="mt-6 text-2xl font-bold text-slate-900">Kullanici profili</h1>

      {hata ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900" role="alert">
          {hata}
        </p>
      ) : null}
      {ok ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {ok}
        </p>
      ) : null}

      <dl className="mt-8 grid gap-4 rounded-2xl border border-slate-200/90 bg-white p-6 text-sm shadow-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-bold uppercase text-slate-500">E-posta</dt>
          <dd className="mt-1 font-medium text-slate-900">{user.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase text-slate-500">Gorunen ad</dt>
          <dd className="mt-1 font-medium text-slate-900">{user.displayName}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase text-slate-500">Kullanici ID</dt>
          <dd className="mt-1 font-mono text-xs text-slate-700 [overflow-wrap:anywhere]">{user.id}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase text-slate-500">Bakiye</dt>
          <dd className="mt-1 font-semibold tabular-nums text-slate-900">{user.balanceTl.toLocaleString("tr-TR")} TL</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase text-slate-500">Kayit</dt>
          <dd className="mt-1 tabular-nums text-slate-700">{user.createdAt}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase text-slate-500">Yasak</dt>
          <dd className="mt-1 text-slate-800">
            {user.bannedAt ? (
              <>
                <span className="font-semibold text-rose-800">{user.bannedAt}</span>
                {user.banReason ? (
                  <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-700 ring-1 ring-slate-100">
                    {user.banReason}
                  </p>
                ) : null}
              </>
            ) : (
              <span className="text-emerald-800">Yok</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-10 flex flex-col gap-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900">Yasakla</h2>
          <p className="mt-1 text-sm text-slate-600">En az 4 karakterlik aciklama zorunludur.</p>
          <form action={adminBanUserAction} className="mt-4 space-y-3">
            <input type="hidden" name="userId" value={user.id} />
            <textarea
              name="reason"
              required
              minLength={4}
              rows={3}
              placeholder="Yasak nedeni…"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-200"
            />
            <button
              type="submit"
              className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"
            >
              Yasakla
            </button>
          </form>
        </div>
        <div className="shrink-0 border-t border-slate-100 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <h2 className="text-lg font-bold text-slate-900">Yasagi kaldir</h2>
          <p className="mt-1 text-sm text-slate-600">Hesabi tekrar giris ve islemlere acar.</p>
          <form action={adminUnbanUserAction} className="mt-4">
            <input type="hidden" name="userId" value={user.id} />
            <button
              type="submit"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Yasagi kaldir
            </button>
          </form>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-lg font-bold text-slate-900">Siparisler (son kayitlar)</h2>
        <p className="mt-1 text-sm text-slate-600">Alici veya satici oldugu siparisler; mesajlari gormek icin tiklayin.</p>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Kayit yok.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/siparisler/${encodeURIComponent(o.id)}`}
                  scroll={false}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm shadow-sm hover:border-indigo-200"
                >
                  <span className="font-mono text-xs text-slate-600 [overflow-wrap:anywhere]">{o.id}</span>
                  <span className="text-slate-700">{o.listingTitle}</span>
                  <span className="text-xs text-slate-500">{o.messageCount} mesaj</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
