import type { CreatureFamily, Dir8, Facing, Vec2 } from "../shared/types";
import type { EntityKind } from "../shared/types";
import type { StatusEffect } from "./skills/status";

/** Intenção de movimento de uma entidade. */
export type MoveIntent =
  | { kind: "dir"; dir: Dir8 }
  | { kind: "path"; path: Vec2[]; goal: Vec2 }
  | null;

/** Estado de IA do monstro (M1: só o necessário para o Perseguidor). */
export type AiState = "idle" | "chasing";

/**
 * Entidade da simulação. Estrutura interna da sim (não trafega na rede —
 * o que vai ao client é a projeção em EntityState).
 */
export interface SimEntity {
  id: number;
  kind: EntityKind;
  name: string;
  /** Espécie (criaturas) — null para player/npc. Chave do bestiário/Marcas. */
  species: string | null;
  /** Família canônica (criaturas) — null para player/npc. */
  family: CreatureFamily | null;
  pos: Vec2;
  facing: Facing;
  /** ms (tempo lógico) a partir do qual pode dar o próximo passo. */
  nextMoveAt: number;
  /** Duração do último passo (para o cliente animar). */
  stepMs: number;
  /** True somente no tick em que um passo começou. */
  justMoved: boolean;
  /** Passo base EFETIVO (já com slow aplicado) — usado para `stepMs` por passo. */
  baseStepMs: number;
  /** Passo base NATURAL (sem slow) — fonte de verdade; `baseStepMs` deriva dele. */
  naturalStepMs: number;
  intent: MoveIntent;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;

  // ── Combate ──
  /** Alvo atual de auto-attack (null = nenhum). */
  targetId: number | null;
  /** ms (tempo lógico) a partir do qual pode atacar de novo. */
  nextAttackAt: number;
  /** Dano do ataque básico. */
  attackDamage: number;
  /** Cooldown de ataque, em ms. */
  attackCooldownMs: number;
  /** True se está morta (aguardando remoção/respawn neste tick). */
  dead: boolean;

  // ── Equipamento (fundação de itens — DESIGN-EVOLUCAO.md §"Itens são instâncias") ──
  /**
   * ID da INSTÂNCIA de arma equipada (no `ItemRegistry` da sim). Jogador nasce
   * com a arma da classe; null só em entidades sem arma (mobs — usam números do
   * bestiário). O dano-base/cooldown do auto-attack derivam do TEMPLATE desta
   * instância (ver `Simulation.recomputePlayerDerived`).
   */
  equippedWeaponId: number | null;

  // ── Skills + status (Wave Skills M1) ──
  /** Skills conhecidas (IDs). Jogador nasce com o kit da classe; mobs vazio. */
  knownSkills: string[];
  /** Cooldown por skill: skillId → tick lógico a partir do qual pode usar de novo. */
  skillCooldowns: Record<string, number>;
  /** Status effects ativos (queimadura/slow/veneno) — tick-based, com duração. */
  status: StatusEffect[];

  // ── IA de monstro (null para player) ──
  ai: AiState | null;
  /** Raio de aggro em tiles (Chebyshev). */
  aggroRadius: number;
  /** Spawn de origem — usado para respawn determinístico. */
  spawnPos: Vec2;
}
