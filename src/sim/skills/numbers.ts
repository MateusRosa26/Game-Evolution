/**
 * NÚMEROS das skills do M1 — TODOS placeholder, agrupados num arquivo só.
 *
 * Régua real só no M1 dar o combate de pé (DESIGN-EVOLUCAO.md §"Magias e
 * Skills": "Números de dano/custo/cooldown são ✏️ até o M1 dar a régua").
 * Cada entrada é o que o design da skill pede; as ASSINATURAS das fórmulas
 * (`magicDamage`/`physicalDamage`/`healPower`) é que mandam — aqui só vivem as
 * BASES que essas fórmulas recebem, mais custo/cooldown/duração de status.
 *
 * Convenção: cooldown e durações em TICKS (a sim é tick-based, 20/s — TICK_MS).
 * Custo de mana em pontos de mana. Bases de dano/cura em pontos de HP.
 */

/** Skill = uma entrada deste mapa de números. Mexa à vontade nos valores. */
export interface SkillNumbers {
  /** Custo de mana por cast. */
  manaCost: number;
  /** Cooldown em ticks da sim (20 ticks/s). */
  cooldownTicks: number;
  /** Base de dano/cura passada à fórmula (magicDamage/physicalDamage/healPower). */
  power: number;
  /** Alcance em tiles (Chebyshev) — projétil/linha/melee. */
  range: number;
}

// ── Golpe Forte (Knight) — golpe com a arma por ~1.8× ──
export const GOLPE_FORTE = {
  // calibrado (bateria M1.2, jun/2026): inerte no T1 (provado 6/12/15 idênticos);
  // 12 abre espaço de decisão de burst em correntes contínuas T2+ sem custo presente.
  manaCost: 12,
  cooldownTicks: 120, // ~6s @20tps — freio real do GF; re-régua na bateria T2 (gap knight×rogue adiado)
  /** Multiplicador sobre o dano da ARMA equipada (ficha: ~1.8×). */
  weaponMultiplier: 1.8, // ✏️ placeholder
  range: 1, // melee
} as const;

// ── Bola de Fogo (Mage) — projétil de fogo + queimadura ──
export const BOLA_DE_FOGO = {
  manaCost: 14, // ✏️ placeholder
  cooldownTicks: 30, // ✏️ placeholder
  power: 14, // base de dano mágico ✏️ placeholder
  range: 6, // ✏️ placeholder
  /** Queimadura (DoT) aplicada no alvo. */
  burn: { damagePerTick: 3, durationTicks: 60, tickEveryTicks: 10 }, // ✏️ placeholder
} as const;

// ── Lança de Gelo (Mage) — projétil perfurante (linha) + slow ──
export const LANCA_DE_GELO = {
  manaCost: 16, // ✏️ placeholder
  cooldownTicks: 40, // ✏️ placeholder
  power: 12, // base de dano mágico ✏️ placeholder
  range: 6, // comprimento da linha ✏️ placeholder
  /** Lentidão aplicada em cada alvo atravessado. */
  slow: { stepMsMultiplier: 1.5, durationTicks: 60 }, // ✏️ placeholder (+50% stepMs)
} as const;

// ── Apunhalar (Rogue) — melee posicional, ~2× pelas costas ──
export const APUNHALAR = {
  manaCost: 5, // ✏️ placeholder
  // calibrado (re-check pós-wand, 09/jun): 20t (1s) era SPAM degenerado — o rogue
  // front-loadava 2 Apunhalares e deletava o Esqueleto on-level em 1,2s (falha o
  // teste de Sirlin: "vence repetindo um movimento"). 60t (3s) = 1 strike + auto da
  // adaga → TTK 2,4s: segue o mais rápido das classes, mas devolve o Apunhalar ao
  // papel de GOLPE POSICIONAL da ficha (vale manobrar pro backstab 2×), não 2º
  // auto-attack. Varredura: a CADÊNCIA é o lever (power quase não move o TTK).
  // ⚠️ TTK-alvo relativo re-checar na bateria de kit completo (com Redemoinho/AoE
  // do Knight). Report: `docs/reports/2026-06-09-recheck-spread-pos-wand.md`.
  cooldownTicks: 60,
  power: 8, // base de dano físico (usa a adaga como base também) ✏️ placeholder
  range: 1, // melee
  /** Multiplicador de dano quando acerta pelas costas (ficha: ~2×). */
  backstabMultiplier: 2.0, // ✏️ placeholder
} as const;

// ── Luz Sagrada (Priest) — projétil holy, bônus vs profanos ──
export const LUZ_SAGRADA = {
  manaCost: 12, // ✏️ placeholder
  cooldownTicks: 30, // ✏️ placeholder
  power: 13, // base de dano mágico (holy) ✏️ placeholder
  range: 6, // ✏️ placeholder
  /** Multiplicador de dano vs famílias profanas (undead/demon) — é o nuke solo. */
  // calibrado (bateria T2, 2026-06-08): 2.5 one-shotava o Esqueleto (família-coração)
  // já no lvl 1 → trivializava o farm do Priest. 1.8 = kill em ~2 casts: continua o
  // melhor anti-profano disparado, sem virar botão-de-deletar (DESIGN-BESTIARIO:
  // "forte sem trivializar a família-coração"). Re-checar vs demon T3+ na bateria T3.
  unholyMultiplier: 1.8,
} as const;

// ── Curar Ferimentos (Priest) — cura self/aliado ──
export const CURAR_FERIMENTOS = {
  manaCost: 10, // ✏️ placeholder
  cooldownTicks: 30, // ✏️ placeholder
  power: 18, // base de cura ✏️ placeholder
  range: 6, // alcance até o aliado (self = 0) ✏️ placeholder
} as const;
