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
  /**
   * ID da arma/skill que causou o dano (null = fonte ambiental). DEPRECADO como
   * fonte de verdade da arma: mantido p/ floating text/legado. A ARMA real é a
   * instância em `weaponInstanceId`/`weaponTemplateId` abaixo (ledger lê dali).
   */
  weaponId: string | null;
  skillId: string | null;
  /**
   * Instância de arma equipada que causou o dano (null = não foi a arma:
   * magia/DoT/ambiental). É a CHAVE que o ledger usa para atribuir dano à arma
   * (DESIGN-EVOLUCAO.md §"Itens são instâncias"). Auto-attack e skills físicas de
   * arma (Golpe Forte/Apunhalar) trazem a instância; projéteis/cura trazem null.
   */
  weaponInstanceId: number | null;
  /** Template da arma-instância acima (conveniência p/ consumidores). */
  weaponTemplateId: string | null;
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
  /**
   * Arma equipada que deu o golpe final — DEPRECADO como fonte de verdade
   * (mantido p/ legado). A arma real é a instância em `weaponInstanceId`.
   */
  weaponId: string | null;
  /** Skill que deu o golpe final, se foi por skill. */
  skillId: string | null;
  /**
   * Instância de arma que deu o GOLPE FINAL estando equipada (null = golpe final
   * por magia/DoT/ambiental → NÃO conta para a Marca da arma). É a chave que o
   * ledger usa p/ atribuir o kill à arma (DESIGN-EVOLUCAO.md §"Anti-degeneração":
   * "conta o kill se ela deu o golpe final estando equipada").
   */
  weaponInstanceId: number | null;
  /** Template da arma-instância acima (conveniência p/ consumidores). */
  weaponTemplateId: string | null;
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
 * DESIGN-EVOLUCAO.md §"Regras de contagem"). Emitido a partir da Wave Skills M1.
 *
 * O PAYLOAD carrega o PERFIL DE USO completo que as fichas pedem — e o que as
 * Mutações (wave futura) precisarão para decidir QUAL mutação nasce:
 * distância do cast, HP% do caster, alvo já queimando/lento/envenenado,
 * ângulo (costas/frente), HP% do alvo no momento (abertura/execução),
 * nº de alvos atingidos, família do alvo, em combate ou não.
 *
 * Convenção da sim (documentada): só emitimos com `validHit: true` (cast que
 * conectou). Spam no ar NÃO emite evento (nem gasta mana/cooldown). O campo
 * `validHit` fica no payload por contrato/clareza — sempre true por ora.
 */
export interface SkillUseEvent {
  caster: CombatActorRef;
  skillId: string;
  /** Sempre true por ora (só emitimos casts que conectaram — ver doc acima). */
  validHit: boolean;
  /** Alvos efetivamente atingidos (vazio = não conta para Mutação). */
  targets: CombatActorRef[];
  /** Nº de alvos atingidos (ficha: Bola de Fogo/Lança de Gelo rastreiam isso). */
  targetsHit: number;
  /** Distância Chebyshev do cast até o alvo (ficha: distância do cast). */
  castDistance: number;
  /** HP% do caster ao usar (0..1) — fichas Golpe Forte/Luz Sagrada/Curar. */
  casterHpPct: number;
  /** Caster estava em combate? (tinha alvo de auto-attack) — ficha Curar/Socorros. */
  casterInCombat: boolean;
  /** Alvo primário é o próprio caster? (self vs aliado) — ficha Curar Ferimentos. */
  targetSelf: boolean;
  /** HP% do alvo primário NO MOMENTO do cast (antes do golpe) — ficha Apunhalar. */
  targetHpPct: number | null;
  /** Família do alvo primário — ficha Luz Sagrada (profano ou não). */
  targetFamily: CreatureFamily | null;
  /** Alvo já estava queimando antes do cast — ficha Bola de Fogo. */
  targetWasBurning: boolean;
  /** Alvo já estava lento/congelado antes do cast — ficha Lança de Gelo. */
  targetWasSlowed: boolean;
  /** Alvo já estava envenenado antes do cast — ficha Apunhalar (Lâmina Suja). */
  targetWasPoisoned: boolean;
  /** Golpe veio pelas costas — ficha Apunhalar (ângulo). */
  hitFromBehind: boolean;
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
