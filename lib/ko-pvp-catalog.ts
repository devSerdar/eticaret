export type PvpServer = {
  slug: string;
  name: string;
  /** Ek eşleşme: arama kutusunda yazılan metin */
  aliases: string[];
};

export const PVP_MARKET_SLUGS = ["item", "css", "goldbar"] as const;
export type PvpMarketSlug = (typeof PVP_MARKET_SLUGS)[number];

export type PvpMarket = {
  slug: PvpMarketSlug;
  label: string;
  description: string;
};

export const PVP_MARKETS: PvpMarket[] = [
  { slug: "item", label: "Item", description: "Silah, zırh, aksesuar ve diğer item ilanları." },
  { slug: "css", label: "CSS Pazarı", description: "Cash Shop ve benzeri içerik ilanları." },
  { slug: "goldbar", label: "Goldbar", description: "GB ve para birimi ilanları." },
];

export const PVP_SERVERS: PvpServer[] = [
  { slug: "ko4fun", name: "KO4FUN", aliases: ["ko4fun", "ko4", "ko 4 fun"] },
  { slug: "oldusko", name: "OldUSKO", aliases: ["oldusko", "old usko"] },
  { slug: "apexmyko", name: "ApexMYKO", aliases: ["apexmyko", "apex myko", "apex"] },
  { slug: "zeugma", name: "Zeugma", aliases: ["zeugma"] },
  { slug: "mykov2", name: "MykoV2", aliases: ["mykov2", "myko v2", "myko"] },
  { slug: "drakigame", name: "DrakiGame", aliases: ["drakigame", "draki"] },
  { slug: "fightko", name: "FightKO", aliases: ["fightko", "fight ko"] },
  { slug: "yourko", name: "YourKO", aliases: ["yourko", "your ko"] },
  { slug: "deathko", name: "DeathKO", aliases: ["deathko", "death ko"] },
  { slug: "homekoworld", name: "HomekoWorld", aliases: ["homekoworld", "homeko world", "homeko"] },
];

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}

export function getPvpServerBySlug(slug: string): PvpServer | undefined {
  const key = normalize(slug);
  return PVP_SERVERS.find((s) => s.slug === key);
}

export function isPvpMarketSlug(slug: string): slug is PvpMarketSlug {
  return (PVP_MARKET_SLUGS as readonly string[]).includes(slug);
}

export function getPvpMarketBySlug(slug: string): PvpMarket | undefined {
  if (!isPvpMarketSlug(slug)) return undefined;
  return PVP_MARKETS.find((m) => m.slug === slug);
}

/**
 * Sunucu araması: slug, görünen ad veya alias ile eşleşir.
 */
export function searchPvpServers(query: string): PvpServer[] {
  const q = normalize(query);
  if (!q) return PVP_SERVERS;

  return PVP_SERVERS.filter((server) => {
    if (normalize(server.slug).includes(q) || q.includes(normalize(server.slug))) return true;
    if (normalize(server.name).includes(q) || q.includes(normalize(server.name))) return true;
    return server.aliases.some((a) => {
      const na = normalize(a);
      return na.includes(q) || q.includes(na);
    });
  });
}
