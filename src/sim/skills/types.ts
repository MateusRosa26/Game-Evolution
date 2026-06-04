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
  | "healTarget"; // cura self/aliado (Curar Ferimentos)

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

/** Aplicação de status que a skill faz no alvo (declarativo). */
export interface SkillStatusApply {
  kind: "burn" | "slow" | "poison";
}

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
  /** Cooldown em ticks da sim (20/s). */
  cooldownTicks: number;
  /** Alcance em tiles (Chebyshev). melee = 1, self-heal aceita range 0. */
  range: number;
  /** Base de dano/cura passada à fórmula (✏️ vem de numbers.ts). */
  power: number;
  /** Status aplicado no(s) alvo(s) atingido(s) — burn/slow/poison. */
  applyStatus?: SkillStatusApply;
}
