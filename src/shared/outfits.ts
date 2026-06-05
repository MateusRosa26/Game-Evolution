/**
 * Sistema de outfits estilo Tibia — DADOS compartilhados sim ⇄ client.
 *
 * O personagem compõe o visual com 3 PEÇAS (cabeça/peito/pernas), cada uma
 * de um SET, cada uma com uma COR da grade curada. Misturar peças de sets
 * diferentes é o ponto ("peito de knight, capuz de rogue, calça de citizen").
 *
 * - O outfit é ESTADO da sim (no online todos veem): o client envia
 *   `setOutfit`, a sim VALIDA posse das peças + índices de cor e projeta no
 *   snapshot. Itens segurados (espada/escudo) são EQUIPAMENTO, não outfit.
 * - Peças de sets `free` nascem no guarda-roupa; as demais são desbloqueadas
 *   por quest e/ou conteúdo pago ✏️ (sistema de desbloqueio futuro — a
 *   validação já vive na sim).
 * - Cores são ÍNDICES na grade curada (`OUTFIT_COLORS`) — serializável,
 *   validável e à prova de rosa-neón: toda cor da grade respeita o dark
 *   medieval (geração segue as regras de ramp do design/ESTUDO-REFERENCIAS §1).
 */

export type OutfitSlot = "head" | "torso" | "legs";

export interface OutfitPiece {
  /** Cor = índice em OUTFIT_COLORS. */
  color: number;
  /** Peça = id em OUTFIT_PARTS (deve ser do slot certo). */
  part: string;
}

/** Visual completo do personagem (vai no snapshot). */
export interface OutfitState {
  head: OutfitPiece;
  torso: OutfitPiece;
  legs: OutfitPiece;
}

export interface OutfitPartDef {
  id: string;
  slot: OutfitSlot;
  /** Set de origem (agrupamento no guarda-roupa/UI). */
  set: string;
  /** Nome exibível (pt-BR). */
  name: string;
  /** Peças free nascem possuídas; as demais via quest/pago ✏️. */
  free: boolean;
}

/** Sets disponíveis (id → nome exibível). */
export const OUTFIT_SETS: Record<string, string> = {
  knight: "Aço de Alvorada",
  rogue: "Couro da Sombra",
  mage: "Véu Arcano",
  priest: "Hábito da Aurora",
  citizen: "Cidadão",
  ouro: "Ouro Cerimonial",
  vigilia: "Vigília Negra",
};

/**
 * Catálogo de peças: 7 sets × 3 slots. A FORMA da peça vem do set (o desenho
 * procedural vive no client); a cor é livre (grade). Assinaturas fixas de
 * peça (ex: olhos em brasa da Vigília) não são recoloríveis.
 */
export const OUTFIT_PARTS: OutfitPartDef[] = [
  // ── Aço de Alvorada (knight) — grátis ──
  { id: "elmo_alvorada", slot: "head", set: "knight", name: "Elmo de Alvorada", free: true },
  { id: "peitoral_alvorada", slot: "torso", set: "knight", name: "Peitoral de Alvorada", free: true },
  { id: "grevas_alvorada", slot: "legs", set: "knight", name: "Grevas de Alvorada", free: true },
  // ── Couro da Sombra (rogue) — grátis ──
  { id: "capuz_sombra", slot: "head", set: "rogue", name: "Capuz da Sombra", free: true },
  { id: "gibao_sombra", slot: "torso", set: "rogue", name: "Gibão da Sombra", free: true },
  { id: "calca_sombra", slot: "legs", set: "rogue", name: "Calça da Sombra", free: true },
  // ── Véu Arcano (mage) — grátis ──
  { id: "chapeu_arcano", slot: "head", set: "mage", name: "Chapéu Arcano", free: true },
  { id: "robe_arcano", slot: "torso", set: "mage", name: "Robe Arcano", free: true },
  { id: "saiote_arcano", slot: "legs", set: "mage", name: "Saiote Arcano", free: true },
  // ── Hábito da Aurora (priest) — grátis ──
  { id: "coifa_aurora", slot: "head", set: "priest", name: "Coifa da Aurora", free: true },
  { id: "tunica_aurora", slot: "torso", set: "priest", name: "Túnica da Aurora", free: true },
  { id: "saia_aurora", slot: "legs", set: "priest", name: "Saia da Aurora", free: true },
  // ── Cidadão — grátis ──
  { id: "cabeca_cidadao", slot: "head", set: "citizen", name: "Cabelo de Cidadão", free: true },
  { id: "camisa_cidadao", slot: "torso", set: "citizen", name: "Camisa de Cidadão", free: true },
  { id: "calca_cidadao", slot: "legs", set: "citizen", name: "Calça de Cidadão", free: true },
  // ── Ouro Cerimonial — ✏️ futuro: conteúdo pago ──
  { id: "elmo_ouro", slot: "head", set: "ouro", name: "Elmo Cerimonial", free: false },
  { id: "peitoral_ouro", slot: "torso", set: "ouro", name: "Peitoral Cerimonial", free: false },
  { id: "grevas_ouro", slot: "legs", set: "ouro", name: "Grevas Cerimoniais", free: false },
  // ── Vigília Negra — ✏️ futuro: recompensa de quest ──
  { id: "elmo_vigilia", slot: "head", set: "vigilia", name: "Elmo da Vigília", free: false },
  { id: "peitoral_vigilia", slot: "torso", set: "vigilia", name: "Peitoral da Vigília", free: false },
  { id: "grevas_vigilia", slot: "legs", set: "vigilia", name: "Grevas da Vigília", free: false },
];

/** Lookup por id (derivado — não duplicar dados). */
export const OUTFIT_PART_BY_ID: Record<string, OutfitPartDef> = Object.fromEntries(
  OUTFIT_PARTS.map((p) => [p.id, p]),
);

/** Peças de um slot (ordem do catálogo = ordem na UI). */
export function partsForSlot(slot: OutfitSlot): OutfitPartDef[] {
  return OUTFIT_PARTS.filter((p) => p.slot === slot);
}

// ──────────────────────────────────────────────────────────────────────
// Grade curada de cores (estilo Tibia) — gerada por regras, salva como dados
// ──────────────────────────────────────────────────────────────────────

/**
 * Gera a grade curada: 12 matizes × 8 variações (claro/escuro × saturação),
 * com limites que protegem o dark medieval (sem neón: saturação e brilho
 * contidos; sem extremos 0%/100%). + 1 fileira de neutros (cinzas/marrons).
 * O RESULTADO é estável (função pura) — sim e client geram a mesma grade.
 */
function makeOutfitColors(): string[] {
  const colors: string[] = [];
  // fileira 0: neutros — do quase-preto ao off-white (8)
  const neutrals = ["#23262d", "#33363e", "#474b54", "#5d626c", "#757a84", "#8f939c", "#aab0b3", "#c5c3bb"];
  colors.push(...neutrals);
  // 12 matizes × 8 variações (sat 0.25/0.45 × luz 0.24/0.36/0.48/0.58) —
  // limites apertados de propósito: o topo (s alto + l alto) vira neón e
  // quebra o dark medieval (armadilha nº 1 da régua de cor).
  for (let h = 0; h < 12; h++) {
    const hue = h * 30;
    for (const s of [0.25, 0.45]) {
      for (const l of [0.24, 0.36, 0.48, 0.58]) {
        colors.push(hsl(hue, s, l));
      }
    }
  }
  return colors;
}

/** hsl → hex (puro, sem APIs de browser — usável na sim p/ validação). */
function hsl(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** A grade (104 cores): índice = identidade da cor no protocolo. */
export const OUTFIT_COLORS: string[] = makeOutfitColors();

export function isValidOutfitColor(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < OUTFIT_COLORS.length;
}

/** Clone raso-profundo de um outfit (3 peças) — evita aliasing sim⇄snapshot. */
export function structuredCloneOutfit(o: OutfitState): OutfitState {
  return {
    head: { part: o.head.part, color: o.head.color },
    torso: { part: o.torso.part, color: o.torso.color },
    legs: { part: o.legs.part, color: o.legs.color },
  };
}

/** Outfit default de cada classe (peça do set da classe, cores sóbrias). */
export const DEFAULT_OUTFIT_BY_CLASS: Record<string, OutfitState> = {
  knight: {
    head: { part: "elmo_alvorada", color: 4 },
    torso: { part: "peitoral_alvorada", color: 4 },
    // azul-aço suave (h240 s.25 l.36) — bate com a calça do sprite original
    legs: { part: "grevas_alvorada", color: 73 },
  },
  rogue: {
    // couro escuro mas LEGÍVEL (um tom acima do quase-preto)
    head: { part: "capuz_sombra", color: 2 },
    torso: { part: "gibao_sombra", color: 17 },
    legs: { part: "calca_sombra", color: 1 },
  },
  mage: {
    // azul arcano profundo (h240 s.45 l.36)
    head: { part: "chapeu_arcano", color: 77 },
    torso: { part: "robe_arcano", color: 77 },
    legs: { part: "saiote_arcano", color: 73 },
  },
  priest: {
    // hábito off-white + saia cinza sóbria
    head: { part: "coifa_aurora", color: 7 },
    torso: { part: "tunica_aurora", color: 7 },
    legs: { part: "saia_aurora", color: 5 },
  },
};
