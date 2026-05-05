"use client";

import { useEffect, useMemo, useState } from "react";

const LINKS = [
  { id: "hesap-ozeti", label: "Hesap ozeti" },
  { id: "cuzdan", label: "Cuzdan" },
  { id: "hareketler", label: "Hareketler" },
  { id: "demo-bakiye", label: "Demo arac" },
] as const;

const base =
  "shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition lg:block lg:w-full";
const idle = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
const active = "bg-slate-900 text-white hover:bg-slate-800 hover:text-white";

export default function HesabimSectionNav({ showDemo }: { showDemo: boolean }) {
  const ids = useMemo(
    (): readonly string[] =>
      showDemo
        ? ["hesap-ozeti", "cuzdan", "hareketler", "demo-bakiye"]
        : ["hesap-ozeti", "cuzdan", "hareketler"],
    [showDemo],
  );

  const [activeId, setActiveId] = useState<string>(ids[0] ?? "hesap-ozeti");

  useEffect(() => {
    const navOffset = 112;

    const tick = () => {
      let current = ids[0] ?? "hesap-ozeti";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= navOffset) current = id;
      }
      setActiveId((prev) => (prev === current ? prev : current));
    };

    tick();
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick);
    return () => {
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
    };
  }, [ids]);

  const links = LINKS.filter((l) => l.id !== "demo-bakiye" || showDemo);

  return (
    <nav className="-mx-1 mb-8 flex gap-2 overflow-x-auto pb-1 lg:mx-0 lg:mb-0 lg:flex-col lg:overflow-visible" aria-label="Sayfa bolumleri">
      <p className="hidden px-1 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 lg:block">Bu sayfa</p>
      {links.map((l) => (
        <a key={l.id} href={`#${l.id}`} className={`${base} ${activeId === l.id ? active : idle}`}>
          {l.label}
        </a>
      ))}
    </nav>
  );
}
