import { PVP_SERVERS } from "@/lib/ko-pvp-catalog";

export type GameMarketPlan = {
  slug: string;
  name: string;
  status: "aktif" | "yakinda";
  serverOrModeLabel: string;
  serverOrModes: string[];
  categories: string[];
};

export const GAME_MARKET_PLANS: GameMarketPlan[] = [
  {
    slug: "knight-online",
    name: "Knight Online",
    status: "aktif",
    serverOrModeLabel: "PVP Server",
    serverOrModes: PVP_SERVERS.map((s) => s.name),
    categories: ["Item", "CSS Pazari", "Goldbar", "Hesap"],
  },
  {
    slug: "metin2",
    name: "Metin2",
    status: "yakinda",
    serverOrModeLabel: "Sunucu",
    serverOrModes: ["TR Sunucular", "Private Sunucular"],
    categories: ["Yang", "Item", "Hesap"],
  },
  {
    slug: "valorant",
    name: "Valorant",
    status: "yakinda",
    serverOrModeLabel: "Bolge",
    serverOrModes: ["TR", "EU", "NA"],
    categories: ["VP", "Hesap", "Skin"],
  },
];

export const DEFAULT_GAME_SLUG = "knight-online";
