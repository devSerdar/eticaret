/** Faz 4 mock siparis; kalici depolama yok. Bakiye onceden yuklenir; odeme bekleniyor asamasi yok. */

export type MockOrderPhase =
  | "siparis_acildi"
  | "bakiye_kullanildi"
  | "mesajlasma"
  | "teslim_netlesiyor"
  | "tamamlandi";

export const MOCK_ORDER_PHASE_LABEL: Record<MockOrderPhase, string> = {
  siparis_acildi: "Siparis acildi",
  bakiye_kullanildi: "Bakiye kullanildi (platform)",
  mesajlasma: "Saticiyla mesajlasma",
  teslim_netlesiyor: "Teslimat detayi (mesajda)",
  tamamlandi: "Tamamlandi (demo)",
};

/** Siparis onay sayfasinda vurgulanan asama: mesajlasma */
export const MOCK_ORDER_DISPLAY_FLOW: MockOrderPhase[] = [
  "siparis_acildi",
  "bakiye_kullanildi",
  "mesajlasma",
  "teslim_netlesiyor",
  "tamamlandi",
];

export function createMockOrderRef(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `OT-${t}-${r}`;
}
