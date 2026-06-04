import type { Dir8, EntityKind, Facing, MapData, Vec2 } from "./types";

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
  | { type: "stop" };

export interface EntityState {
  id: number;
  kind: EntityKind;
  name: string;
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
}

export interface Snapshot {
  tick: number;
  entities: EntityState[];
}

export type ServerMessage =
  | { type: "welcome"; playerId: number; map: MapData }
  | { type: "snapshot"; snap: Snapshot };

/** Lado do cliente: envia comandos, recebe mensagens. */
export interface ClientTransport {
  send(cmd: ClientCommand): void;
  onMessage(cb: (msg: ServerMessage) => void): void;
}
