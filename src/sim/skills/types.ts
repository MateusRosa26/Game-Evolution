import type { DamageType } from "../../shared/types";

/**
 * Skills como DADOS (DESIGN-EVOLUCAO.md §"Magias e Skills": "Toda skill nasce
 * já preparada para o sistema"). Uma skill é uma DEFINIÇÃO declarativa; a
 * lógica vive em executores GENÉRICOS por tipo de targeting (executor.ts).
 * Adicionar skill = adicionar uma entrada de dados, não código novo.
 *
 * Determinístico/serializável: só IDs, tags e números. Zero pixi/browser.
 */

/** Tipo de targeting — escolhe qual executor genérico resolve a skill. */
export type TargetingKind =
  | "meleeTarget" // melee no alvo selecionado (Golpe Forte)
  | "meleePositional" // melee posicional, bônus pelas costas (Apunhalar)
  | "projectileTarget" // projétil no alvo (Bola de Fogo, Luz Sagrada)
  | "lineThrough" // linha perfurante na direção do alvo (Lança de Gelo)
  | "healTarget" // cura self/aliado (Curar Ferimentos)
  | "groundTarget" // área num tile mirado (Storm, Garras da Terra) — executor T2 ✏️
  | "selfRadius" // área ao redor do caster (nova/redemoinho) — executor T3 ✏️
  | "chain"; // salta entre alvos com falloff (raio em cadeia) — executor T4 ✏️

/** Como a fórmula de dano/cura é calculada (qual função de formulas.ts usa). */
export type EffectKind = "physical" | "magic" | "heal";

/** Tag de elemento/estilo (alimenta Caminhos no futuro). Strings estáveis. */
export type SkillTag =
  | "fisico"
  | "arma"
  | "fogo"
  | "queimadura"
  | "gelo"
  | "lentidao"
  | "sagrado"
  | "anti-profano"
  | "cura"
  | "posicional";

/**
 * Aplicação de status que a skill faz no(s) alvo(s) atingido(s) — union
 * DISCRIMINADA que carrega os PRÓPRIOS parâmetros (declarativo: a skill é dado,
 * o executor é genérico). Tempos em ms (a sim converte p/ ticks via `msToTicks`).
 *  - burn/bleed/poison = DoT (burn fogo, bleed físico, poison o tipo próprio);
 *  - slow = aumenta o stepMs por um fator, por um tempo;
 *  - root = trava o movimento por um tempo (terra; DESIGN: morte=lifedrain à parte).
 */
export type SkillStatusApply =
  | { kind: "burn"; damagePerTick: number; durationMs: number; intervalMs: number; damageType: DamageType }
  | { kind: "bleed"; damagePerTick: number; durationMs: number; intervalMs: number } // DoT físico
  | { kind: "poison"; damagePerTick: number; durationMs: number; intervalMs: number }
  | { kind: "slow"; stepMsMultiplier: number; durationMs: number }
  | { kind: "root"; durationMs: number };

/** Definição declarativa de uma skill. */
export interface SkillDef {
  /** ID estável (chave de dados / contadores de Marca). */
  id: string;
  /** Nome exibível (pt-BR). */
  name: string;
  /** Classe dona (null = comum a todas — não há comuns no kit M1). */
  cls: "knight" | "mage" | "rogue" | "priest" | null;
  targeting: TargetingKind;
  effect: EffectKind;
  /** Tipo de dano do golpe (para o pipeline de combate e resistências). */
  damageType: DamageType;
  tags: SkillTag[];
  /** Custo de mana por cast. */
  manaCost: number;
  /** Cooldown em ms (a sim converte p/ ticks via `msToTicks`). */
  cooldownMs: number;
  /** Alcance em tiles (Chebyshev). melee = 1, self-heal aceita range 0. */
  range: number;
  /** Base de dano/cura passada à fórmula (✏️ vem de numbers.ts). */
  power: number;
  /** Status aplicado no(s) alvo(s) atingido(s) — burn/bleed/poison/slow/root. */
  applyStatus?: SkillStatusApply;
  /**
   * Tempo de conjuração em ms (a sim converte p/ ticks via `msToTicks`).
   * Ausente/0 = resolução INSTANTÂNEA (estilo runa de Tibia — comportamento M1).
   * >0 = a sim arma um `casting` no caster e só resolve ao fim; mover ou tomar
   * dano durante o cast CANCELA (sem resolução). Mana cobrada no INÍCIO do cast.
   */
  castTimeMs?: number;
  // ── Superfície de dados dos executores T2+ (preenchida por tasks futuras) ──
  /** Raio da área em tiles (Chebyshev) — groundTarget/selfRadius. ✏️ executor T2/T3. */
  areaRadius?: number;
  /** Máximo de saltos do raio em cadeia — chain. ✏️ executor T4. */
  chainMax?: number;
  /** Alcance de cada salto em tiles — chain. ✏️ executor T4. */
  chainRange?: number;
  /** Fração de dano perdida por salto (0.2 = −20%/salto) — chain. ✏️ executor T4. */
  chainFalloff?: number;
  /** Fração do dano causado devolvida como cura ao caster (morte = lifedrain). ✏️ aplicada por task futura. */
  lifedrainPct?: number;
}
