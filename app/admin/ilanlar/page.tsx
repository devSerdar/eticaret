import Link from "next/link";
import { adminListAllListings } from "@/lib/listings";
import { adminSetListingHiddenAction } from "@/lib/admin-actions";

type PageProps = {
  searchParams: Promise<{ hata?: string; ok?: string }>;
};

export default async function AdminIlanlarPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const listings = await adminListAllListings(200);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Ilanlar</h1>
      <p className="mt-2 text-sm text-slate-600">Yonetici gizlemesi: ilan halka listelerinde gorunmez; satin alma engellenir.</p>

      {sp.hata ? (
        <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">{sp.hata}</p>
      ) : null}
      {sp.ok ? (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Ilan durumu guncellendi.
        </p>
      ) : null}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.03]">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Baslik</th>
              <th className="px-4 py-3">Sunucu / Pazar</th>
              <th className="px-4 py-3 text-right">Fiyat</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3">Islem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listings.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3 font-mono text-xs text-slate-600 [overflow-wrap:anywhere]">{l.id}</td>
                <td className="max-w-[220px] px-4 py-3 font-medium text-slate-900 [overflow-wrap:anywhere]">{l.title}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {l.serverSlug} / {l.marketSlug}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{l.price} TL</td>
                <td className="px-4 py-3">
                  {l.hiddenByAdmin ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-950">Gizli</span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">Yayinda</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={adminSetListingHiddenAction}>
                      <input type="hidden" name="listingId" value={l.id} />
                      <input type="hidden" name="hidden" value={l.hiddenByAdmin ? "0" : "1"} />
                      <button
                        type="submit"
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          l.hiddenByAdmin
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                            : "border border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100"
                        }`}
                      >
                        {l.hiddenByAdmin ? "Yayina al" : "Yayindan kaldir"}
                      </button>
                    </form>
                    {l.hiddenByAdmin ? (
                      <span className="text-xs text-slate-500">Vitrin: gizli</span>
                    ) : (
                      <Link
                        href={`/ilanlar/${l.id}`}
                        scroll={false}
                        className="text-xs font-semibold text-indigo-700 hover:underline"
                      >
                        Halka sayfa
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
