import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { GAME_MARKET_PLANS } from "@/lib/market-data";
import { getPvpMarketBySlug, getPvpServerBySlug } from "@/lib/ko-pvp-catalog";
import { getListingById } from "@/lib/listings";
import { getOrderDetailById, userCanAccessOrder } from "@/lib/orders";
import { MOCK_ORDER_DISPLAY_FLOW, MOCK_ORDER_PHASE_LABEL } from "@/lib/mock-order";
import { getSession } from "@/lib/session";

type PageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ listingId?: string }>;
};

const MESAJ_ASAMA_INDEX = 2;

function phaseTone(index: number, currentIndex: number): string {
  if (index < currentIndex) return "border-emerald-200 bg-emerald-50/80 text-emerald-900 ring-emerald-100";
  if (index === currentIndex) return "border-indigo-300 bg-indigo-50 text-indigo-950 ring-indigo-200";
  return "border-slate-200/90 bg-slate-50 text-slate-500 ring-slate-100";
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ orderId }, sp] = await Promise.all([params, searchParams]);
  const decoded = decodeURIComponent(orderId);
  const order = await getOrderDetailById(decoded);
  const listing = order ? await getListingById(order.listingId) : undefined;
  const short = decoded.length > 24 ? `${decoded.slice(0, 22)}…` : decoded;
  if (!listing) return { title: `Siparis ${short}` };
  return { title: `Siparis ${short} | ${listing.title}` };
}

export default async function OrderConfirmationPage({ params, searchParams }: PageProps) {
  const session = await getSession();
  if (!session) {
    const [{ orderId }] = await Promise.all([params]);
    redirect(`/login?next=${encodeURIComponent(`/siparis/${orderId}`)}`);
  }

  const [{ orderId }, sp] = await Promise.all([params, searchParams]);
  const decoded = decodeURIComponent(orderId);
  const order = await getOrderDetailById(decoded);
  if (!order) notFound();

  if (!userCanAccessOrder(session.userId, order)) notFound();

  const listingIdParam = sp.listingId;
  if (listingIdParam && listingIdParam !== order.listingId) {
    redirect(`/siparis/${encodeURIComponent(order.id)}`);
  }

  const listing = await getListingById(order.listingId);
  if (!listing) notFound();

  const server = getPvpServerBySlug(listing.serverSlug);
  const market = getPvpMarketBySlug(listing.marketSlug);
  if (!server || !market) notFound();

  const gameName = GAME_MARKET_PLANS.find((g) => g.slug === listing.gameSlug)?.name ?? "Knight Online";
  const marketPath = `/ilanlar/pvp/${server.slug}/${market.slug}`;
  const detailHref = `/ilanlar/${listing.id}`;
  const mesajHref = `/mesajlar/${encodeURIComponent(order.id)}?listingId=${encodeURIComponent(listing.id)}`;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-14">
      <div className="overflow-hidden rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-indigo-50/50 p-8 shadow-[var(--shadow-lg)] ring-1 ring-slate-900/[0.04] sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Siparis tamamlandi</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Tesekkurler</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Tutar platform bakiyenizden dusuldu ve siparis veritabanina kaydedildi. Teslimat icin asagidaki mesajlasma
          sayfasinda saticiyla iletisime gecin; odeme bekleniyor asamasi yoktur.
        </p>

        <div className="mt-6">
          <Link
            href={mesajHref}
            scroll={false}
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-violet-500 sm:w-auto"
          >
            Saticiyla mesaja git
          </Link>
        </div>

        <dl className="mt-8 rounded-2xl border border-white/80 bg-white/90 p-5 text-sm shadow-inner ring-1 ring-slate-900/[0.04]">
          <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-3">
            <dt className="text-slate-500">Siparis no</dt>
            <dd className="font-mono text-xs font-semibold text-slate-900 sm:text-sm [overflow-wrap:anywhere]">{order.id}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 py-3">
            <dt className="text-slate-500">Oyun</dt>
            <dd className="font-medium text-slate-900">{gameName}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 py-3">
            <dt className="text-slate-500">Ilan</dt>
            <dd className="max-w-[70%] text-right font-medium text-slate-900 [overflow-wrap:anywhere]">{listing.title}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 py-3">
            <dt className="text-slate-500">Satici</dt>
            <dd className="font-medium text-slate-900">{listing.seller}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-slate-500">Tutar</dt>
            <dd className="font-bold text-slate-900">
              {order.priceTl} <span className="text-slate-500">TL</span>{" "}
              <span className="block text-xs font-normal text-emerald-800">Bakiyeden dusuldu</span>
            </dd>
          </div>
          <div className="pt-3">
            <dt className="text-slate-500">Surec</dt>
            <dd className="mt-3">
              <ol className="space-y-2">
                {MOCK_ORDER_DISPLAY_FLOW.map((status, i) => (
                  <li
                    key={status}
                    className={`rounded-xl border px-4 py-2.5 text-xs font-medium ring-1 sm:text-sm ${phaseTone(i, MESAJ_ASAMA_INDEX)}`}
                  >
                    <span className="font-semibold">{MOCK_ORDER_PHASE_LABEL[status]}</span>
                    {i === MESAJ_ASAMA_INDEX ? (
                      <span className="mt-1 block font-normal text-indigo-800/90">
                        Simdi: teslimat detaylarini mesajda paylasin. Supheli durumda mesaji bildirebilirsiniz; yonetici
                        moderasyon kuyrugundan inceleyebilir.
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={detailHref}
            scroll={false}
            className="rounded-xl border border-slate-200/90 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-slate-50"
          >
            Ilana don
          </Link>
          <Link
            href={marketPath}
            scroll={false}
            className="rounded-xl border border-slate-200/90 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-slate-50"
          >
            Pazara don
          </Link>
        </div>
      </div>
    </div>
  );
}
