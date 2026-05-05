import Link from "next/link";

const cards = [
  { href: "/admin/kullanicilar", title: "Kullanicilar", desc: "Profil, yasak / yasak kaldir" },
  { href: "/admin/siparisler", title: "Siparisler ve mesajlar", desc: "Tum siparis konusmalarini oku" },
  { href: "/admin/ilanlar", title: "Ilanlar", desc: "Yayindan kaldir / tekrar ac" },
  { href: "/admin/moderasyon", title: "Moderasyon kuyrugu", desc: "Uyelerin bildirdigi kayitlar" },
] as const;

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Yonetim paneli</h1>
      <p className="mt-2 text-sm text-slate-600">Asagidaki modullerden birini secin.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <li key={c.href}>
            <Link
              href={c.href}
              scroll={false}
              className="block rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] transition hover:border-indigo-200 hover:shadow-md"
            >
              <p className="font-semibold text-slate-900">{c.title}</p>
              <p className="mt-2 text-sm text-slate-600">{c.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
