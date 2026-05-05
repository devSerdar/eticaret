export const KO_JOB_SLUGS = ["warrior", "rogue", "mage", "priest", "kurian"] as const;
export type KoJobSlug = (typeof KO_JOB_SLUGS)[number];

export const KO_JOBS: { slug: KoJobSlug; label: string }[] = [
  { slug: "warrior", label: "Warrior" },
  { slug: "rogue", label: "Rogue" },
  { slug: "mage", label: "Mage" },
  { slug: "priest", label: "Priest" },
  { slug: "kurian", label: "Kurian" },
];

export function isKoJobSlug(value: string): value is KoJobSlug {
  return (KO_JOB_SLUGS as readonly string[]).includes(value);
}

export function getKoJobLabel(slug: KoJobSlug): string {
  return KO_JOBS.find((j) => j.slug === slug)?.label ?? slug;
}
