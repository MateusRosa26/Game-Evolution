import type { PlayerClass, Attributes } from "../shared/types";

/**
 * Fórmulas derivadas da progressão — CAMADA SÓLIDA (DESIGN-EVOLUCAO.md §"Stats").
 *
 * REGRA: este é o ÚNICO lugar onde vivem números derivados de atributos/nível.
 * Nenhum derivado (HP máx, dano, regen, esquiva, curva de XP...) pode ser
 * calculado fora daqui — a sim e as waves futuras (skills, combate) consomem
 * estas funções PURAS. Tudo é determinístico (sem RNG, sem estado).
 *
 * Todos os números marcados `// ✏️ placeholder — calibrar no M2` são chutes
 * iniciais. O design pede curva íngreme e mobs fortes; calibrar com combate
 * real depois. As ASSINATURAS, porém, já são as definitivas: as skills da
 * próxima wave chamarão `magicDamage(attrs, base)`, `healPower(attrs, base)`,
 * etc. — então mexa nos números à vontade, mas evite mudar as formas.
 */

// ─────────────────────────────────────────────────────────────────────────
//  Crescimento automático por classe (DADOS, não código)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Ganho automático por nível, por classe. Some-se isto ao derivado-base a cada
 * level up (além dos pontos livres que o jogador distribui). Knight ganha mais
 * HP, Mage mais mana, etc. (DESIGN-EVOLUCAO.md §Classes).
 */
export interface ClassGrowth {
  /** HP máx adicionado por nível. */
  hpPerLevel: number;
  /** Mana máx adicionada por nível. */
  manaPerLevel: number;
}

/** Crescimento por classe. ✏️ placeholder — calibrar no M2. */
export const CLASS_GROWTH: Record<PlayerClass, ClassGrowth> = {
  knight: { hpPerLevel: 15, manaPerLevel: 2 }, // ✏️ placeholder — calibrar no M2
  mage: { hpPerLevel: 5, manaPerLevel: 12 }, // ✏️ placeholder — calibrar no M2
  rogue: { hpPerLevel: 9, manaPerLevel: 5 }, // ✏️ placeholder — calibrar no M2
  priest: { hpPerLevel: 7, manaPerLevel: 10 }, // ✏️ placeholder — calibrar no M2
};

/** Atributos iniciais por classe (nível 1). ✏️ placeholder — calibrar no M2. */
export const CLASS_BASE_ATTRIBUTES: Record<PlayerClass, Attributes> = {
  // ✏️ placeholder — calibrar no M2. Cada classe favorece seu atributo-chave.
  knight: { strength: 8, dexterity: 5, intelligence: 4, vitality: 8, spirit: 5 },
  mage: { strength: 4, dexterity: 5, intelligence: 8, vitality: 5, spirit: 6 },
  rogue: { strength: 5, dexterity: 8, intelligence: 5, vitality: 6, spirit: 4 },
  priest: { strength: 4, dexterity: 5, intelligence: 6, vitality: 5, spirit: 8 },
};

/** Pontos de atributo livres concedidos por level up. ✏️ placeholder — calibrar no M2. */
export const STAT_POINTS_PER_LEVEL = 3; // ✏️ placeholder — calibrar no M2

// ─────────────────────────────────────────────────────────────────────────
//  Recursos — HP e Mana máximos
// ─────────────────────────────────────────────────────────────────────────

/** Constantes base dos recursos. ✏️ placeholder — calibrar no M2. */
const BASE_HP = 50; // ✏️ placeholder — calibrar no M2
const HP_PER_VITALITY = 8; // ✏️ placeholder — calibrar no M2
const BASE_MANA = 10; // ✏️ placeholder — calibrar no M2
const MANA_PER_INTELLIGENCE = 6; // ✏️ placeholder — calibrar no M2

/**
 * HP máximo: base + Vitalidade + crescimento acumulado de classe por nível.
 * O termo de nível é `CLASS_GROWTH[cls].hpPerLevel * (level - 1)`.
 */
export function maxHp(attrs: Attributes, cls: PlayerClass, level: number): number {
  const growth = CLASS_GROWTH[cls].hpPerLevel * (level - 1);
  return Math.floor(BASE_HP + attrs.vitality * HP_PER_VITALITY + growth);
}

/**
 * Mana máxima: base + Inteligência + crescimento acumulado de classe por nível.
 */
export function maxMana(attrs: Attributes, cls: PlayerClass, level: number): number {
  const growth = CLASS_GROWTH[cls].manaPerLevel * (level - 1);
  return Math.floor(BASE_MANA + attrs.intelligence * MANA_PER_INTELLIGENCE + growth);
}

// ─────────────────────────────────────────────────────────────────────────
//  Dano
// ─────────────────────────────────────────────────────────────────────────

/** Coeficientes de dano. ✏️ placeholder — calibrar no M2. */
const STRENGTH_DAMAGE_FACTOR = 1.0; // ✏️ placeholder — calibrar no M2
const DEXTERITY_DAGGER_FACTOR = 1.2; // ✏️ placeholder — calibrar no M2 (adagas escalam com Des)
const INTELLIGENCE_DAMAGE_FACTOR = 1.1; // ✏️ placeholder — calibrar no M2
const SPIRIT_HEAL_FACTOR = 1.3; // ✏️ placeholder — calibrar no M2

/**
 * Dano físico de uma arma. `weaponBase` é o dano-base da arma (M1: do bestiário
 * para mobs; placeholder para o jogador). Adagas escalam com Destreza; demais
 * armas melee com Força. A próxima wave de armas decidirá o `usesDexterity`
 * a partir da arma equipada.
 */
export function physicalDamage(
  attrs: Attributes,
  weaponBase: number,
  usesDexterity = false,
): number {
  const attr = usesDexterity ? attrs.dexterity : attrs.strength;
  const factor = usesDexterity ? DEXTERITY_DAGGER_FACTOR : STRENGTH_DAMAGE_FACTOR;
  // ✏️ placeholder — calibrar no M2: escala linear simples sobre a base da arma.
  return Math.floor(weaponBase + attr * factor);
}

/**
 * Dano mágico de uma skill. `spellBase` é o dano-base da magia (vem do design da
 * skill na próxima wave). Escala com Inteligência.
 */
export function magicDamage(attrs: Attributes, spellBase: number): number {
  return Math.floor(spellBase + attrs.intelligence * INTELLIGENCE_DAMAGE_FACTOR); // ✏️ placeholder — calibrar no M2
}

/**
 * Poder de cura de uma skill. `healBase` é a cura-base (do design da skill).
 * Escala com Espírito.
 */
export function healPower(attrs: Attributes, healBase: number): number {
  return Math.floor(healBase + attrs.spirit * SPIRIT_HEAL_FACTOR); // ✏️ placeholder — calibrar no M2
}

// ─────────────────────────────────────────────────────────────────────────
//  Velocidade de ataque e esquiva
// ─────────────────────────────────────────────────────────────────────────

/** Cooldown base de auto-attack (ms) e redução por Destreza. ✏️ placeholder. */
const BASE_ATTACK_COOLDOWN_MS = 2000; // ✏️ placeholder — calibrar no M2
const ATTACK_COOLDOWN_PER_DEXTERITY_MS = 25; // ✏️ placeholder — calibrar no M2
const MIN_ATTACK_COOLDOWN_MS = 800; // ✏️ placeholder — piso anti-degeneração

/**
 * Cooldown de ataque (ms): Destreza reduz, com piso. Quanto menor, mais rápido.
 * `weaponBaseCooldown` permite que a arma equipada (wave futura) defina sua
 * própria base; default usa o placeholder global.
 */
export function attackCooldownMs(
  attrs: Attributes,
  weaponBaseCooldown: number = BASE_ATTACK_COOLDOWN_MS,
): number {
  const reduced = weaponBaseCooldown - attrs.dexterity * ATTACK_COOLDOWN_PER_DEXTERITY_MS;
  return Math.max(MIN_ATTACK_COOLDOWN_MS, Math.round(reduced));
}

/** Esquiva. ✏️ placeholder — calibrar no M2. */
const DODGE_PER_DEXTERITY = 0.005; // ✏️ placeholder — 0.5% por ponto de Destreza
const MAX_DODGE = 0.5; // ✏️ placeholder — teto de 50% (anti-degeneração)

/**
 * Chance de esquiva (0..1): escala com Destreza, com teto. Quem consome decide
 * se rola contra o RNG seedado (a sim, nunca aqui — esta função é pura).
 */
export function dodgeChance(attrs: Attributes): number {
  return Math.min(MAX_DODGE, attrs.dexterity * DODGE_PER_DEXTERITY);
}

// ─────────────────────────────────────────────────────────────────────────
//  Regeneração (por TICK da sim — 20 ticks/s)
// ─────────────────────────────────────────────────────────────────────────

/** Regen por tick. ✏️ placeholder — calibrar no M2. */
const HP_REGEN_BASE_PER_TICK = 0.02; // ✏️ placeholder — calibrar no M2
const HP_REGEN_PER_VITALITY = 0.01; // ✏️ placeholder — calibrar no M2
const MANA_REGEN_BASE_PER_TICK = 0.02; // ✏️ placeholder — calibrar no M2
const MANA_REGEN_PER_SPIRIT = 0.015; // ✏️ placeholder — calibrar no M2

/**
 * Regeneração de HP por TICK (não por segundo). Escala com Vitalidade. Valor
 * fracionário: o acumulador de regen da entidade soma e aplica em inteiros.
 */
export function hpRegenPerTick(attrs: Attributes): number {
  return HP_REGEN_BASE_PER_TICK + attrs.vitality * HP_REGEN_PER_VITALITY; // ✏️ placeholder
}

/**
 * Regeneração de mana por TICK (não por segundo). Escala com Espírito.
 */
export function manaRegenPerTick(attrs: Attributes): number {
  return MANA_REGEN_BASE_PER_TICK + attrs.spirit * MANA_REGEN_PER_SPIRIT; // ✏️ placeholder
}

// ─────────────────────────────────────────────────────────────────────────
//  Curva de XP (estilo Tibia: polinomial)
// ─────────────────────────────────────────────────────────────────────────

/**
 * XP TOTAL acumulado necessário para ATINGIR `level` (level 1 = 0).
 * Curva polinomial estilo Tibia (crescimento ~cúbico) — íngreme por design
 * (DESIGN-EVOLUCAO.md §"Ritmo de progressão"). ✏️ placeholder — calibrar no M2.
 *
 * Fórmula (Tibia-like): para n = level,
 *   total(n) = round( (50/3) * (n³ - 6n² + 17n - 12) )
 * dá total(1)=0, total(2)=100, total(3)=350, ... crescendo cubicamente.
 */
export function xpForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level));
  // ✏️ placeholder — calibrar no M2.
  return Math.round((50 / 3) * (n * n * n - 6 * n * n + 17 * n - 12));
}

/**
 * XP necessária para ir do `level` atual ao próximo (delta, não acumulado).
 * Útil para o snapshot/HUD (barra de progresso do nível).
 */
export function xpToNextLevel(level: number): number {
  return xpForLevel(level + 1) - xpForLevel(level);
}

/**
 * Dada uma quantidade TOTAL de XP, retorna o nível correspondente.
 * Determinístico; sobe enquanto o total acumulado cobrir o próximo nível.
 */
export function levelForXp(totalXp: number): number {
  let level = 1;
  while (totalXp >= xpForLevel(level + 1)) level++;
  return level;
}

// ─────────────────────────────────────────────────────────────────────────
//  XP por kill + regra anti-farm (kill válido)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Diferença de nível a partir da qual a criatura para de dar XP (anti-farm):
 * matar mob muito abaixo do seu nível não vale (DESIGN-EVOLUCAO.md
 * §Anti-degeneração: "mata farm de rato no lvl 100"). ✏️ placeholder.
 */
const XP_FALLOFF_START_DIFF = 5; // ✏️ placeholder — sem penalidade até 5 níveis acima
const XP_FALLOFF_PER_LEVEL = 0.2; // ✏️ placeholder — -20% por nível além do limite

/**
 * XP concedida por um kill, já com a redução anti-farm por diferença de nível.
 * `baseXp` é o XP do template da criatura (bestiary). `playerLevel` é o nível
 * do jogador; `creatureLevel` o nível efetivo da criatura (placeholder: derive
 * do tier no chamador, ou passe 1 enquanto não houver nível de criatura).
 *
 * Retorna XP inteira ≥ 0. Zero = kill NÃO vale (mob muito fraco p/ o nível).
 */
export function xpFromKill(baseXp: number, playerLevel: number, creatureLevel: number): number {
  if (baseXp <= 0) return 0;
  const diff = playerLevel - creatureLevel;
  if (diff <= XP_FALLOFF_START_DIFF) return baseXp; // dentro da faixa: XP cheia
  // ✏️ placeholder — redução linear; some 0 quando suficientemente abaixo.
  const factor = Math.max(0, 1 - (diff - XP_FALLOFF_START_DIFF) * XP_FALLOFF_PER_LEVEL);
  return Math.floor(baseXp * factor);
}

/**
 * Kill VÁLIDO para fins de progressão/tracking (pré-requisito das Marcas
 * futuras — DESIGN-EVOLUCAO.md §Anti-degeneração): só vale se ainda dá XP.
 * Helper exportado para a wave de Marcas consumir sem reimplementar a regra.
 */
export function isValidKill(baseXp: number, playerLevel: number, creatureLevel: number): boolean {
  return xpFromKill(baseXp, playerLevel, creatureLevel) > 0;
}
