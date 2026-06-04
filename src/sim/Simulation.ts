import { BASE_WALK_MS, DIAGONAL_FACTOR, TICK_MS } from "../shared/constants";
import type { EntityState, Snapshot } from "../shared/protocol";
import type { ClientCommand } from "../shared/protocol";
import {
  DIR_VECTORS,
  dirFromDelta,
  facingFromDir,
  isDiagonal,
  type Dir8,
  type EntityKind,
  type Facing,
  type MapData,
  type Vec2,
} from "../shared/types";
import { findPath, nearestWalkable } from "./pathfinding";
import { World } from "./World";

/** Intenção de movimento de uma entidade. */
type MoveIntent =
  | { kind: "dir"; dir: Dir8 }
  | { kind: "path"; path: Vec2[]; goal: Vec2 }
  | null;

interface SimEntity {
  id: number;
  kind: EntityKind;
  name: string;
  pos: Vec2;
  facing: Facing;
  /** ms (tempo lógico) a partir do qual pode dar o próximo passo. */
  nextMoveAt: number;
  /** Duração do último passo (para o cliente animar). */
  stepMs: number;
  /** True somente no tick em que um passo começou. */
  justMoved: boolean;
  baseStepMs: number;
  intent: MoveIntent;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
}

/**
 * Simulação autoritativa do jogo. Roda em ticks discretos com tempo lógico
 * próprio (tick * TICK_MS) — zero dependência de browser/render.
 * É exatamente o código que um dia roda num servidor Node.
 */
export class Simulation {
  readonly world: World;
  private entities = new Map<number, SimEntity>();
  private nextId = 1;
  private tickCount = 0;
  private snapshotListeners: ((snap: Snapshot) => void)[] = [];

  constructor(map: MapData) {
    this.world = new World(map);
  }

  /** Tempo lógico atual em ms. */
  private now(): number {
    return this.tickCount * TICK_MS;
  }

  addPlayer(name: string): number {
    const id = this.nextId++;
    const spawn = this.world.map.spawn;
    this.entities.set(id, {
      id,
      kind: "player",
      name,
      pos: { x: spawn.x, y: spawn.y },
      facing: "s",
      nextMoveAt: 0,
      stepMs: BASE_WALK_MS,
      justMoved: false,
      baseStepMs: BASE_WALK_MS,
      intent: null,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
    });
    return id;
  }

  removeEntity(id: number): void {
    this.entities.delete(id);
  }

  handleCommand(entityId: number, cmd: ClientCommand): void {
    const e = this.entities.get(entityId);
    if (!e) return;
    switch (cmd.type) {
      case "setDir":
        e.intent = cmd.dir ? { kind: "dir", dir: cmd.dir } : null;
        break;
      case "walkTo": {
        const goal = nearestWalkable(this.world, { x: Math.round(cmd.x), y: Math.round(cmd.y) });
        if (!goal) break;
        const path = findPath(this.world, e.pos, goal);
        if (path && path.length > 0) e.intent = { kind: "path", path, goal };
        break;
      }
      case "stop":
        e.intent = null;
        break;
    }
  }

  onSnapshot(cb: (snap: Snapshot) => void): void {
    this.snapshotListeners.push(cb);
  }

  tick(): void {
    this.tickCount++;
    const now = this.now();

    for (const e of this.entities.values()) {
      e.justMoved = false;
      if (!e.intent || now < e.nextMoveAt) continue;

      if (e.intent.kind === "dir") {
        this.stepInDirection(e, e.intent.dir, now);
      } else {
        this.stepAlongPath(e, now);
      }
    }

    this.emitSnapshot();
  }

  /** Passo na direção (WASD). Com "slide": diagonal bloqueada tenta os eixos. */
  private stepInDirection(e: SimEntity, dir: Dir8, now: number): void {
    e.facing = facingFromDir(dir);
    const candidates: Dir8[] = [dir];
    if (isDiagonal(dir)) {
      candidates.push(dir[1] as Dir8, dir[0] as Dir8); // ex.: "ne" → "e", "n"
    }
    for (const d of candidates) {
      if (this.tryStep(e, d, now)) return;
    }
  }

  private stepAlongPath(e: SimEntity, now: number): void {
    if (e.intent?.kind !== "path") return;
    const next = e.intent.path[0];
    if (!next) {
      e.intent = null;
      return;
    }
    const dir = dirFromDelta(next.x - e.pos.x, next.y - e.pos.y);
    if (!dir) {
      // Path dessincronizado (não deveria acontecer) — recalcula.
      const path = findPath(this.world, e.pos, e.intent.goal);
      e.intent = path && path.length > 0 ? { kind: "path", path, goal: e.intent.goal } : null;
      return;
    }
    if (this.tryStep(e, dir, now)) {
      e.intent.path.shift();
      if (e.intent.path.length === 0) e.intent = null;
    } else {
      // Bloqueio dinâmico (futuro: outra criatura no tile) — recalcula.
      const path = findPath(this.world, e.pos, e.intent.goal);
      e.intent = path && path.length > 0 ? { kind: "path", path, goal: e.intent.goal } : null;
    }
  }

  /** Tenta executar um passo. Retorna true se moveu. */
  private tryStep(e: SimEntity, dir: Dir8, now: number): boolean {
    const v = DIR_VECTORS[dir];
    const nx = e.pos.x + v.x;
    const ny = e.pos.y + v.y;
    if (!this.world.isWalkable(nx, ny)) return false;
    if (isDiagonal(dir)) {
      // Mesma regra do pathfinding: não atravessar quinas.
      if (!this.world.isWalkable(e.pos.x + v.x, e.pos.y) || !this.world.isWalkable(e.pos.x, e.pos.y + v.y)) {
        return false;
      }
    }
    e.pos = { x: nx, y: ny };
    e.facing = facingFromDir(dir);
    e.stepMs = Math.round(e.baseStepMs * (isDiagonal(dir) ? DIAGONAL_FACTOR : 1));
    e.nextMoveAt = now + e.stepMs;
    e.justMoved = true;
    return true;
  }

  private emitSnapshot(): void {
    const entities: EntityState[] = [];
    for (const e of this.entities.values()) {
      entities.push({
        id: e.id,
        kind: e.kind,
        name: e.name,
        pos: { x: e.pos.x, y: e.pos.y },
        facing: e.facing,
        stepMs: e.stepMs,
        moving: e.justMoved,
        hp: e.hp,
        maxHp: e.maxHp,
        mp: e.mp,
        maxMp: e.maxMp,
      });
    }
    const snap: Snapshot = { tick: this.tickCount, entities };
    for (const cb of this.snapshotListeners) cb(snap);
  }
}
