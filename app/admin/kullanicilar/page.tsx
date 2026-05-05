import Link from "next/link";
import { adminListUsers } from "@/lib/admin-data";

type PageProps = { searchParams: Promise<{ hata?: string }> };

export default async function AdminKullanicilarPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const users = await adminListUsers(400);
  const hata = sp.hata === "self" ? "Kendi hesabinizi yasaklayamazsiniz." : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Kullanicilar</h1>
      <p className="mt-2 text-sm text-slate-600">Profil icin satira tiklayin.</p>

      {hata ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900" role="alert">
          {hata}
        </p>
      ) : null}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.03]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">E-posta</th>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3 text-right">Bakiye</th>
              <th className="px-4 py-3">Kayit</th>
              <th className="px-4 py-3">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <Link href={`/admin/kullanicilar/${u.id}`} className="font-medium text-indigo-700 hover:underline">
                    {u.email}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-800">{u.displayName}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{u.balanceTl.toLocaleString("tr-TR")} TL</td>
                <td className="px-4 py-3 text-xs tabular-nums text-slate-500">{u.createdAt}</td>
                <td className="px-4 py-3">
                  {u.bannedAt ? (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-900">Yasakli</span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">Aktif</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
