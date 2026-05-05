import Link from "next/link";
import { listOrdersForAdmin } from "@/lib/orders";

export default async function AdminSiparislerPage() {
  const orders = await listOrdersForAdmin(120);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Siparisler ve mesajlar</h1>
      <p className="mt-2 text-sm text-slate-600">
        Sikayet olmadan tum siparis konusmalarina erisebilirsiniz. Satira tiklayin.
      </p>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.03]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Siparis</th>
              <th className="px-4 py-3">Ilan</th>
              <th className="px-4 py-3">Alici</th>
              <th className="px-4 py-3">Satici</th>
              <th className="px-4 py-3 text-right">Tutar</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3 text-center">Mesaj</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/siparisler/${encodeURIComponent(o.id)}`}
                    className="font-mono text-xs font-semibold text-indigo-700 hover:underline [overflow-wrap:anywhere]"
                  >
                    {o.id}
                  </Link>
                </td>
                <td className="max-w-[200px] px-4 py-3 text-slate-800 [overflow-wrap:anywhere]">{o.listingTitle}</td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <span className="font-medium text-slate-800">{o.buyerName}</span>
                  <br />
                  {o.buyerEmail}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <span className="font-medium text-slate-800">{o.sellerName}</span>
                  <br />
                  {o.sellerEmail}
                </td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums">{o.priceTl} TL</td>
                <td className="px-4 py-3 text-xs tabular-nums text-slate-500">{o.createdAt}</td>
                <td className="px-4 py-3 text-center text-xs font-medium">{o.messageCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
