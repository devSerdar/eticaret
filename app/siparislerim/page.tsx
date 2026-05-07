import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import HesabimActiveOrdersPanel from "@/components/HesabimActiveOrdersPanel";
import { findUserById } from "@/lib/demo-auth-store";
import { listUserOrderSummaries } from "@/lib/orders";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Siparislerim | OyunTicaret",
};

export default async function SiparislerimPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=%2Fsiparislerim");
  const user = await findUserById(session.userId);
  if (!user) redirect("/login?next=%2Fsiparislerim");

  const orders = await listUserOrderSummaries(user.id, 300, "all");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Siparislerim</h1>
          <p className="mt-1 text-sm text-slate-600">
            Aktif, tamamlanan ve iptal edilmis siparislerinizi bu alandan yonetin.
          </p>
        </div>
        <Link
          href="/hesabim"
          scroll={false}
          className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Hesabima don
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <HesabimActiveOrdersPanel
          orders={orders}
          currentUserId={session.userId}
          currentUserDisplayName={session.displayName}
          defaultTab="active"
        />
      </section>
    </main>
  );
}
