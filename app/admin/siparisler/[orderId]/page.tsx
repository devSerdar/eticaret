import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetListingById } from "@/lib/listings";
import { listMessagesForOrder } from "@/lib/messages";
import { getOrderDetailById } from "@/lib/orders";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function AdminSiparisMesajPage({ params }: PageProps) {
  const { orderId: raw } = await params;
  const orderId = decodeURIComponent(raw);
  const order = await getOrderDetailById(orderId);
  if (!order) notFound();

  const listing = await adminGetListingById(order.listingId);
  const messages = await listMessagesForOrder(order.id);

  return (
    <div>
      <nav className="text-sm text-slate-500">
        <Link href="/admin/siparisler" className="font-medium text-indigo-700 hover:underline">
          Siparisler
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-700">Mesajlar</span>
      </nav>

      <h1 className="mt-6 text-2xl font-bold text-slate-900">Siparis konusmasi (yonetici)</h1>
      <p className="mt-2 font-mono text-xs text-slate-600 [overflow-wrap:anywhere]">{order.id}</p>

      <dl className="mt-6 grid gap-3 rounded-2xl border border-slate-200/90 bg-white p-5 text-sm shadow-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-bold uppercase text-slate-500">Ilan</dt>
          <dd className="mt-1 font-medium text-slate-900">{listing?.title ?? order.listingId}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase text-slate-500">Alici</dt>
          <dd className="mt-1 text-slate-800">
            {order.buyerDisplayName}
            <br />
            <span className="text-xs text-slate-500">ID: {order.buyerId}</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase text-slate-500">Satici</dt>
          <dd className="mt-1 text-slate-800">
            {order.sellerDisplayName}
            <br />
            <span className="text-xs text-slate-500">ID: {order.sellerId}</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase text-slate-500">Tutar</dt>
          <dd className="mt-1 font-semibold">{order.priceTl} TL</dd>
        </div>
      </dl>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">Mesajlar ({messages.length})</h2>
        <ul className="mt-4 space-y-4">
          {messages.map((m) => (
            <li key={m.id} className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-900">{m.senderDisplayName}</span>
                <span className="font-mono text-[10px] text-slate-400">{m.id}</span>
                <span className="tabular-nums text-slate-500">{m.createdAt}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800 [overflow-wrap:anywhere]">{m.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-sm">
        <Link href={`/admin/kullanicilar/${order.buyerId}`} className="font-semibold text-indigo-700 hover:underline">
          Alici profili
        </Link>
        {" · "}
        <Link href={`/admin/kullanicilar/${order.sellerId}`} className="font-semibold text-indigo-700 hover:underline">
          Satici profili
        </Link>
      </p>
    </div>
  );
}
