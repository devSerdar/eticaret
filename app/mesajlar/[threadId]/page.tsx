import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import OrderThreadPanel from "@/components/OrderThreadPanel";
import { getListingById } from "@/lib/listings";
import { listMessagesForOrder, markOrderMessagesSeen } from "@/lib/messages";
import { getOrderDetailById, userCanAccessOrder } from "@/lib/orders";
import { getSession } from "@/lib/session";

type PageProps = {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<{ listingId?: string }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ threadId }, sp] = await Promise.all([params, searchParams]);
  const decoded = decodeURIComponent(threadId);
  const order = await getOrderDetailById(decoded);
  const listingId = order?.listingId ?? sp.listingId;
  const listing = listingId ? await getListingById(listingId) : undefined;
  const short = decoded.length > 20 ? `${decoded.slice(0, 18)}…` : decoded;
  if (!listing) return { title: `Mesajlar ${short}` };
  return { title: `Mesaj | ${listing.title}` };
}

export default async function MesajThreadPage({ params, searchParams }: PageProps) {
  const session = await getSession();
  const [{ threadId }, sp] = await Promise.all([params, searchParams]);
  const decoded = decodeURIComponent(threadId);
  const order = await getOrderDetailById(decoded);
  if (!order) notFound();

  if (!session) {
    const listingId = sp.listingId ?? order.listingId;
    const path = `/mesajlar/${encodeURIComponent(decoded)}${listingId ? `?listingId=${encodeURIComponent(listingId)}` : ""}`;
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }

  if (!userCanAccessOrder(session.userId, order)) notFound();

  const listingIdParam = sp.listingId;
  if (listingIdParam && listingIdParam !== order.listingId) {
    redirect(`/mesajlar/${encodeURIComponent(order.id)}?listingId=${encodeURIComponent(order.listingId)}`);
  }

  const listing = await getListingById(order.listingId);
  if (!listing) notFound();

  await markOrderMessagesSeen(order.id, session.userId);
  const messages = await listMessagesForOrder(order.id, session.userId);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-14">
      <nav className="text-sm text-[var(--text-muted)]">
        <Link href="/ilanlar" scroll={false} className="font-medium text-indigo-700 hover:underline">
          Ilanlar
        </Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-600">Mesaj</span>
      </nav>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">Saticiyla mesajlasma</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        <span className="font-medium text-slate-800">{listing.title}</span> — teslimat saati, karakter adi ve diger
        detaylari burada paylasin.
      </p>

      <aside className="mt-6 rounded-2xl border border-slate-800/10 bg-slate-900/[0.03] p-4 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-900/[0.06]">
        <p className="font-semibold text-slate-900">Moderasyon</p>
        <p className="mt-2">
          OyunTicaret yoneticileri; dolandiricilik suphesi, sahte IBAN / dis kanal odeme talebi veya uye sikayeti
          durumunda bu konusmaya mudahale edebilir. Mesajlar veritabaninda saklanir; karsi tarafin mesajini
          &quot;Bildir&quot; ile inceleme kuyruguna gonderebilirsiniz.
        </p>
      </aside>

      <div className="mt-8">
        <OrderThreadPanel
          orderId={order.id}
          listingId={listing.id}
          listingTitle={listing.title}
          currentUserId={session.userId}
          buyerId={order.buyerId}
          initialMessages={messages}
        />
      </div>

      <p className="mt-6 text-center text-sm">
        <Link href={`/ilanlar/${listing.id}`} scroll={false} className="font-semibold text-indigo-700 hover:underline">
          Ilana don
        </Link>
      </p>
    </div>
  );
}
