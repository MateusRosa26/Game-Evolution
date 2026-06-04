import type { AttributeKey, Attributes, Dir8, EntityKind, Facing, MapData, PlayerClass, Vec2 } from "./types";

/**
 * Protocolo cliente ⇄ simulação.
 *
 * IMPORTANTE: este protocolo é desenhado como se fosse rede desde o dia 1.
 * Hoje trafega por um LocalTransport (mesma página); no futuro online,
 * trafega por WebSocket sem mudar o formato.
 */

export type ClientCommand =
  /** WASD: direção mantida (null = soltou as teclas). */
  | { type: "setDir"; dir: Dir8 | null }
  /** Click-to-move: a simulação faz o pathfinding (como Tibia/RO). */
  | { type: "walkTo"; x: number; y: number }
  /** Seleciona alvo para auto-attack (null = limpa o alvo). */
  | { type: "selectTarget"; entityId: number | null }
  /** Distribui 1 ponto de atributo livre (a sim valida se há ponto). */
  | { type: "allocateStatPoint"; attr: AttributeKey }
  | { type: "stop" };

/**
 * Projeção da progressão do jogador no snapshot (DESIGN-EVOLUCAO.md §Camada
 * Sólida). Só dados serializáveis. Presente apenas na entidade do jogador.
 */
export interface PlayerProgressState {
  cls: PlayerClass;
  level: number;
  /** XP TOTAL acumulado. */
  xp: number;
  /** XP TOTAL necessário para atingir o próximo nível. */
  xpForNextLevel: number;
  attributes: Attributes;
  /** Pontos de atributo livres não distribuídos. */
  freeStatPoints: number;
}

export interface EntityState {
  id: number;
  kind: EntityKind;
  name: string;
  /** Espécie da criatura (escolhe o sprite no client); null para player/npc. */
  species: string | null;
  /** Tile lógico atual. */
  pos: Vec2;
  facing: Facing;
  /** Duração do passo atual em ms — o cliente usa para animar a transição. */
  stepMs: number;
  /** True se a entidade iniciou um passo neste tick. */
  moving: boolean;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  /** Progressão — presente SOMENTE na entidade do jogador (undefined p/ mobs). */
  progress?: PlayerProgressState;
}

/**
 * Eventos one-shot encaminhados ao client num snapshot (feedback visual).
 * Não são estado — acontecem uma vez no tick e o client reage (floating text,
 * morte). São a projeção dos eventos da sim relevantes ao jogador.
 */
export type SnapshotEvent =
  /** Dano aplicado — para floating damage text. */
  | { kind: "damage"; targetId: number; amount: number; pos: Vec2 }
  /** Entidade morreu — para efeito/limpeza visual. */
  | { kind: "death"; entityId: number; pos: Vec2 };

export interface Snapshot {
  tick: number;
  entities: EntityState[];
  /** Alvo selecionado do jogador local (marcador visual). null = nenhum. */
  targetId: number | null;
  /** Eventos one-shot deste tick (não persistem). */
  events: SnapshotEvent[];
}

export type ServerMessage =
  | { type: "welcome"; playerId: number; map: MapData }
  | { type: "snapshot"; snap: Snapshot };

/** Lado do cliente: envia comandos, recebe mensagens. */
export interface ClientTransport {
  send(cmd: ClientCommand): void;
  onMessage(cb: (msg: ServerMessage) => void): void;
}
