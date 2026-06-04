import type { CreatureFamily, DamageType } from "../shared/types";

/**
 * Bestiário como DADOS, não código caso-a-caso.
 *
 * O DESIGN-BESTIARIO.md tem 25 criaturas que virão em waves futuras; o design
 * pede uma "biblioteca de blocos". Cada criatura é um template declarativo;
 * a IA lê o `behavior` e parâmetros — nada de classe por monstro.
 *
 * No M1 só o Rato Lanhoso existe e só o comportamento "chaser" é implementado.
 */

/** Tiers de dificuldade do bestiário (DESIGN-BESTIARIO.md). */
export type Tier = "T1" | "T2" | "T3" | "T4" | "T5";

/**
 * Comportamentos de IA do bestiário. M1 implementa só "chaser"; os demais
 * estão declarados para que templates futuros já tenham a forma certa.
 */
export type AiBehavior =
  | "chaser" // persegue via A* e bate em melee (Perseguidor / Matilha base)
  | "territorial" // neutro até provocado (declarado; não implementado no M1)
  | "shooter" // ataca à distância (declarado; não implementado no M1)
  | "caster"; // conjura (declarado; não implementado no M1)

/** Template declarativo de uma criatura. */
export interface CreatureTemplate {
  /** ID de espécie estável (chave de dados / contadores de Marca). */
  species: string;
  /** Nome exibível. */
  name: string;
  family: CreatureFamily;
  tier: Tier;
  behavior: AiBehavior;
  maxHp: number;
  /** Dano do ataque básico. */
  attackDamage: number;
  attackType: DamageType;
  /** Cooldown entre ataques, em ms. */
  attackCooldownMs: number;
  /** XP base concedido ao jogador por matar esta criatura (antes da redução
   *  anti-farm por diferença de nível — ver `formulas.xpFromKill`). */
  xp: number;
  /** Raio de aggro em tiles (Chebyshev): dentro disso, idle → persegue. */
  aggroRadius: number;
  /** Duração base do passo, em ms (define a velocidade de perseguição). */
  baseStepMs: number;
  /** Respawn após morte, em ticks (20 ticks/s). */
  respawnTicks: number;
}

/**
 * Rato Lanhoso — família Bestial, T1, Perseguidor. "O primeiro sangue do
 * jogador": rápido, fraco, vem em grupos. Só ataque básico.
 * Números PLACEHOLDER (mobs são fortes por design — pune descuido).
 */
export const RATO_LANHOSO: CreatureTemplate = {
  species: "rato_lanhoso",
  name: "Rato Lanhoso",
  family: "bestial",
  tier: "T1",
  behavior: "chaser",
  maxHp: 24,
  attackDamage: 8,
  attackType: "physical",
  attackCooldownMs: 1600,
  xp: 20, // ✏️ placeholder — calibrar no M2 (curva de XP íngreme por design)
  aggroRadius: 6,
  baseStepMs: 220, // ligeiramente mais rápido que o jogador (260)
  respawnTicks: 200, // ~10s
};

/** Registro de templates por espécie — ponto único de lookup. */
export const CREATURES: Record<string, CreatureTemplate> = {
  [RATO_LANHOSO.species]: RATO_LANHOSO,
};
