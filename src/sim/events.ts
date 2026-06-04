import type { CreatureFamily, DamageType, Vec2 } from "../shared/types";

/**
 * Barramento de eventos da simulação.
 *
 * Fundamenta TODO o sistema de progressão futuro (DESIGN-EVOLUCAO.md):
 * Marcas, Mutações e Caminhos são consumidores declarativos destes eventos.
 * Por isso os payloads são RICOS desde o M1 — consumidores futuros filtram
 * por campos (família, golpe final, HP%, contexto) sem mudar quem emite.
 *
 * Regras:
 * - Interno da sim. Subscribe SÍNCRONO e DETERMINÍSTICO (ordem de inscrição).
 * - Emitido durante o tick; nunca atravessa rede diretamente. Eventos
 *   relevantes ao jogador são reencaminhados ao client via protocol (snapshot).
 * - Payloads só carregam dados serializáveis (IDs e valores), nunca refs.
 */

/** Identidade de combate de uma entidade no momento do evento. */
export interface CombatActorRef {
  id: number;
  /** Espécie da criatura (ex: "rato_lanhoso") — null para o jogador/genérico. */
  species: string | null;
  /** Família canônica — null quando não for criatura (ex: jogador). */
  family: CreatureFamily | null;
}

/** Contexto compartilhado por eventos de combate (alimenta condições de Marca). */
export interface CombatContext {
  /** Tick lógico em que o evento ocorreu. */
  tick: number;
  /** É noite no mundo? (condição comum de Marca — placeholder, sempre false no M1). */
  night: boolean;
}

/**
 * `damage` — toda aplicação de dano. Base para Marcas de "dano causado",
 * e para o floating text no client.
 */
export interface DamageEvent {
  source: CombatActorRef;
  target: CombatActorRef;
  amount: number;
  damageType: DamageType;
  /** Posição (tile) do alvo ao receber o dano. */
  at: Vec2;
  /** ID da arma/skill que causou o dano (null = fonte ambiental). */
  weaponId: string | null;
  skillId: string | null;
  context: CombatContext;
}

/**
 * `kill` — o coração do sistema de Marcas. O payload carrega TUDO que uma
 * condição de Marca possa filtrar (DESIGN-EVOLUCAO.md §1):
 * quem matou, com qual arma/skill, espécie E família da vítima, golpe final,
 * HP% do atacante, tick, posições, distância, noite.
 */
export interface KillEvent {
  attacker: CombatActorRef;
  victim: CombatActorRef;
  /** Arma equipada que deu o golpe final (conta para a Marca da arma). */
  weaponId: string | null;
  /** Skill que deu o golpe final, se foi por skill. */
  skillId: string | null;
  /** Dano do golpe final e seu tipo. */
  finalBlow: { amount: number; damageType: DamageType };
  /** HP% do atacante NO MOMENTO do kill (0..1) — ex.: Marca "Última Resposta". */
  attackerHpPct: number;
  /** Posições (tile) no momento do kill. */
  attackerPos: Vec2;
  victimPos: Vec2;
  /** Distância Chebyshev em tiles entre atacante e vítima (0 = melee colado). */
  distance: number;
  context: CombatContext;
}

/**
 * `skill_use` — uso de skill que ATINGIU alvo válido (spam no ar não conta —
 * DESIGN-EVOLUCAO.md §"Regras de contagem"). Tipo completo definido agora;
 * ainda NÃO emitido no M1 (skills chegam em waves futuras).
 */
export interface SkillUseEvent {
  caster: CombatActorRef;
  skillId: string;
  /** Alvos efetivamente atingidos (vazio = não conta para Mutação). */
  targets: CombatActorRef[];
  context: CombatContext;
}

/**
 * `block` — defesa que mitigou dano (escudo/parry). Tipo completo definido
 * agora; ainda NÃO emitido no M1.
 */
export interface BlockEvent {
  blocker: CombatActorRef;
  attacker: CombatActorRef;
  /** Quanto de dano foi mitigado. */
  blocked: number;
  damageType: DamageType;
  context: CombatContext;
}

/**
 * `level_up` — personagem subiu de nível. Tipo completo definido agora;
 * ainda NÃO emitido no M1 (level/XP chega em wave futura).
 */
export interface LevelUpEvent {
  entity: CombatActorRef;
  fromLevel: number;
  toLevel: number;
  context: CombatContext;
}

/** Mapa nome-do-evento → payload. Fonte de verdade dos tipos do bus. */
export interface SimEventMap {
  damage: DamageEvent;
  kill: KillEvent;
  skill_use: SkillUseEvent;
  block: BlockEvent;
  level_up: LevelUpEvent;
}

export type SimEventName = keyof SimEventMap;
type Listener<E extends SimEventName> = (payload: SimEventMap[E]) => void;

/**
 * Bus determinístico: listeners disparam na ordem de inscrição, de forma
 * síncrona, dentro do tick. Sem timers, sem async — replay-safe.
 */
export class EventBus {
  private listeners: { [E in SimEventName]: Listener<E>[] } = {
    damage: [],
    kill: [],
    skill_use: [],
    block: [],
    level_up: [],
  };

  on<E extends SimEventName>(event: E, cb: Listener<E>): void {
    this.listeners[event].push(cb);
  }

  emit<E extends SimEventName>(event: E, payload: SimEventMap[E]): void {
    for (const cb of this.listeners[event]) cb(payload);
  }
}
