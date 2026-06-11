import type { CreatureFamily, Dir8, Facing, Vec2 } from "../shared/types";
import type { EntityKind } from "../shared/types";
import type { OutfitState } from "../shared/outfits";
import type { StatusEffect } from "./skills/status";
import type { QuestState } from "./quests";
import type { EquipSlot } from "../shared/protocol";

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
  /**
   * ANDAR (z-level) em que a entidade está — SISTEMA-ANDARES.md. `pos` é 2D
   * dentro deste andar; colisão/pathfinding/aggro operam só dentro do mesmo z.
   * Overworld = `baseZ` (0); subsolo z<0. Transição só por portal (escada/etc.).
   */
  z: number;
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
  /**
   * ms (tempo lógico) a partir do qual pode usar de novo um consumível de cura
   * (exausto compartilhado das poções — anti-spam estilo Tibia). Comida não usa
   * exausto (o teto de saciedade regula). Só players exercitam isto.
   */
  nextItemUseAt: number;
  /** True se está morta (aguardando remoção/respawn neste tick). */
  dead: boolean;

  // ── NPC (kind === "npc") ──
  /** Id ESTÁVEL do NPC ("bartolo") — chave de diálogo/quests. null p/ não-NPC. */
  npcKey: string | null;

  // ── Jogador: economia, diário e conversa ──
  // (ouro NÃO é mais campo: é item empilhável no bolso — modelo Tibia jun/2026.
  //  O total carregado é somado do bolso no snapshot.)
  /** Estado das quests por id (players). */
  quests: Map<string, QuestState>;
  /** Diálogo aberto: entityId do NPC + visão atual (players; null = sem). */
  activeDialogue: {
    npcEntityId: number;
    view: { text: string; options: { id: string; label: string }[] };
  } | null;
  /**
   * Loja aberta: entityId do NPC mercador (players; null = sem). Paralelo ao
   * diálogo (mutuamente exclusivos — abrir loja fecha o diálogo). O SORTIMENTO
   * não vive aqui: é remontado a cada snapshot de `COMMERCE` + `quests` (como a
   * view do diálogo), pra refletir trade destravado por quest sem estado duplo.
   */
  activeShop: { npcEntityId: number } | null;

  // ── Itens (onda 1 — DESIGN-ITENS) ──
  /** Equipamento: instanceId por slot (11 slots, modelo Tibia). */
  equipment: Partial<Record<EquipSlot, number>>;
  /** Container da mochila/bolso equipado (onda 1: direto na entidade; ✏️ vira item aninhado). */
  backpackContainerId: number | null;
  /** Containers ABERTOS por este jogador (janelas na UI). */
  openContainers: Set<number>;

  // ── Equipamento (fundação de itens — DESIGN-EVOLUCAO.md §"Itens são instâncias") ──
  /**
   * ID da INSTÂNCIA de arma equipada (no `ItemRegistry` da sim). Jogador nasce
   * com a arma da classe; null só em entidades sem arma (mobs — usam números do
   * bestiário). O dano-base/cooldown do auto-attack derivam do TEMPLATE desta
   * instância (ver `Simulation.recomputePlayerDerived`).
   */
  equippedWeaponId: number | null;

  /**
   * Outfit do personagem (peças + cores — `shared/outfits.ts`). ESTADO da
   * sim (no online todos veem); null para mobs (sprite vem da espécie).
   */
  outfit: OutfitState | null;
  /**
   * Guarda-roupa: ids de peças possuídas. Peças `free` nascem aqui; quest/
   * conteúdo pago adiciona ✏️. A validação de `setOutfit` é contra este set.
   */
  wardrobe: Set<string>;

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
  /** Respawn em ms deste spawn específico (override por-spot do template —
   *  EXPLORACAO.md §teto de exp/h). undefined = usa `template.respawnMs`. */
  respawnMs?: number;
}
