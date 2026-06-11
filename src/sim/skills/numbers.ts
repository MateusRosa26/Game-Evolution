/**
 * NÚMEROS das skills do M1 — TODOS placeholder, agrupados num arquivo só.
 *
 * Régua real só no M1 dar o combate de pé (DESIGN-EVOLUCAO.md §"Magias e
 * Skills": "Números de dano/custo/cooldown são ✏️ até o M1 dar a régua").
 * Cada entrada é o que o design da skill pede; as ASSINATURAS das fórmulas
 * (`magicDamage`/`physicalDamage`/`healPower`) é que mandam — aqui só vivem as
 * BASES que essas fórmulas recebem, mais custo/cooldown/duração de status.
 *
 * Convenção: cooldown e durações em MILISSEGUNDOS (a sim converte p/ ticks via
 * `msToTicks` — o tick é só a resolução interna). Custo de mana em pontos de
 * mana. Bases de dano/cura em pontos de HP.
 */

/** Skill = uma entrada deste mapa de números. Mexa à vontade nos valores. */
export interface SkillNumbers {
  /** Custo de mana por cast. */
  manaCost: number;
  /** Cooldown em ms. */
  cooldownMs: number;
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
  cooldownMs: 6000, // 6s — freio real do GF; re-régua na bateria T2 (gap knight×rogue adiado)
  /** Multiplicador sobre o dano da ARMA equipada (ficha: ~1.8×). */
  weaponMultiplier: 1.8, // ✏️ placeholder
  range: 1, // melee
} as const;

// ── Bola de Fogo (Mage) — projétil de fogo + queimadura ──
export const BOLA_DE_FOGO = {
  manaCost: 14, // ✏️ placeholder
  cooldownMs: 1500, // ✏️ placeholder
  power: 7, // single-target FRACO de propósito (carry de AoE, skills futuras); rogue é o rei single ✏️
  range: 6, // ✏️ placeholder
  /** Queimadura (DoT): aplica `damagePerTick` a cada `intervalMs`, por `durationMs`. */
  burn: { damagePerTick: 3, durationMs: 3000, intervalMs: 500 }, // ✏️ placeholder
} as const;

// ── Lança de Gelo (Mage) — projétil perfurante (linha) + slow ──
export const LANCA_DE_GELO = {
  manaCost: 16, // ✏️ placeholder
  cooldownMs: 2000, // ✏️ placeholder
  power: 13, // base mágica (< Bola: tem slow de utilidade) — híbrido caster ✏️ Balancista
  range: 6, // comprimento da linha ✏️ placeholder
  /** Lentidão aplicada em cada alvo atravessado. */
  slow: { stepMsMultiplier: 1.5, durationMs: 3000 }, // ✏️ placeholder (+50% stepMs)
} as const;

// ── Apunhalar (Rogue) — melee posicional, ~2× pelas costas ──
export const APUNHALAR = {
  manaCost: 5, // ✏️ placeholder
  // calibrado (re-check pós-wand, 09/jun): 1000ms era SPAM degenerado — o rogue
  // front-loadava 2 Apunhalares e deletava o Esqueleto on-level em 1,2s (falha o
  // teste de Sirlin: "vence repetindo um movimento"). 3000ms = 1 strike + auto da
  // adaga → TTK 2,4s: segue o mais rápido das classes, mas devolve o Apunhalar ao
  // papel de GOLPE POSICIONAL da ficha (vale manobrar pro backstab 2×), não 2º
  // auto-attack. Varredura: a CADÊNCIA é o lever (power quase não move o TTK).
  // ⚠️ TTK-alvo relativo re-checar na bateria de kit completo (com Redemoinho/AoE
  // do Knight). Report: `docs/reports/2026-06-09-recheck-spread-pos-wand.md`.
  cooldownMs: 3000,
  power: 8, // base de dano físico (usa a adaga como base também) ✏️ placeholder
  range: 1, // melee
  /** Multiplicador de dano quando acerta pelas costas (ficha: ~2×). */
  backstabMultiplier: 2.0, // ✏️ placeholder
} as const;

// ── Luz Sagrada (Priest) — projétil holy, bônus vs profanos ──
export const LUZ_SAGRADA = {
  manaCost: 12, // ✏️ placeholder
  cooldownMs: 1500, // ✏️ placeholder
  power: 14, // base sagrada (nuke do priest) — híbrido caster, escala Espírito ✏️ Balancista
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
  cooldownMs: 1500, // ✏️ placeholder
  power: 18, // base de cura ✏️ placeholder
  range: 6, // alcance até o aliado (self = 0) ✏️ placeholder
} as const;

// ── Garras da Terra (Mage/Int) — groundTarget mirado + root (terra) ──
export const GARRAS_DA_TERRA = {
  manaCost: 18, // ✏️ Balancista
  cooldownMs: 4000, // ✏️ Balancista
  power: 9, // dano modesto — o valor é o CONTROLE (root), não o nuke ✏️ Balancista
  range: 6, // alcance da MIRA (até onde dá pra mirar o tile) ✏️ Balancista
  castTimeMs: 800, // conjuração mirada (cancela ao mover/tomar dano)
  areaRadius: 1, // 3×3 ao redor do tile mirado ✏️ Balancista
  root: { durationMs: 1500 }, // enraíza os pegos (terra = root) ✏️ Balancista
} as const;

// ── Tempestade (Mage/Int) — groundTarget mirado, raio (lightning), AoE de dano ──
export const TEMPESTADE = {
  manaCost: 28, // ✏️ Balancista
  cooldownMs: 6000, // ✏️ Balancista
  power: 16, // AoE de dano alta (sem status) — o nuke de área ✏️ Balancista
  range: 6, // alcance da mira ✏️ Balancista
  castTimeMs: 1000, // ✏️ Balancista
  areaRadius: 1, // 3×3 ✏️ Balancista
} as const;

// ── Redemoinho (Knight/For) — selfRadius físico, escala a ARMA (tag arma) ──
export const REDEMOINHO = {
  manaCost: 14, // ✏️ Balancista
  cooldownMs: 5000, // ✏️ Balancista
  power: 4, // bônus FLAT sobre o dano da arma (instant burst) ✏️ Balancista
  areaRadius: 1, // tudo adjacente (3×3) ✏️ Balancista
} as const;

// ── Aura Sagrada (Priest/Esp) — selfRadius de cura (caster + aliados) ──
export const AURA_SAGRADA = {
  manaCost: 22, // > custo da cura individual (cura em área é premium) ✏️ Balancista
  cooldownMs: 6000, // ✏️ Balancista
  power: 14, // base de cura por alvo (< cura individual; o valor é o alcance) ✏️ Balancista
  areaRadius: 2, // 5×5 ao redor do caster ✏️ Balancista
} as const;

// ── Fagulhas (Mage/Int) — chain (raio), chip-AoE FRACO; NÃO deve deletar um pack ──
export const FAGULHAS = {
  manaCost: 10, // ✏️ Balancista
  cooldownMs: 2500, // ✏️ Balancista
  power: 6, // dano-base BAIXO — chip; o teto da cadeia é sublinear (Balancista) ✏️
  range: 6, // alcance até o alvo primário ✏️ Balancista
  chainMax: 3, // primário + 2 saltos ✏️ Balancista
  chainRange: 2, // distância máxima de cada salto ✏️ Balancista
  chainFalloff: 0.6, // −40% de dano por salto ✏️ Balancista
} as const;

// ── Dreno Vital (Mage/Int) — projétil de morte (death), lifedrain 50% ──
export const DRENO_VITAL = {
  manaCost: 16, // ✏️ Balancista
  cooldownMs: 3000, // ✏️ Balancista
  power: 11, // dano single-target; metade volta como cura ✏️ Balancista
  range: 6, // ✏️ Balancista
  lifedrainPct: 0.5, // cura o caster por 50% do dano causado ✏️ Balancista
} as const;
