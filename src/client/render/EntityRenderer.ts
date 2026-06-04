import { Container, Graphics, Sprite, Text } from "pixi.js";
import { TILE_SIZE } from "../../shared/constants";
import type { EntityState, Snapshot } from "../../shared/protocol";
import type { Facing } from "../../shared/types";
import type { SpriteLibrary } from "../assets/sprites";

/** Ciclo de caminhada: passo-esq, neutro, passo-dir, neutro. */
const WALK_CYCLE = [1, 0, 2, 0];

interface EntityVisual {
  container: Container;
  sprite: Sprite;
  nameText: Text;
  hpBar: Graphics;
  // tween de posição (em tiles, com fração)
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  tweenElapsed: number;
  tweenDur: number;
  facing: Facing;
  walkClock: number;
  lastHpRatio: number;
}

/**
 * Mantém o estado visual das entidades e interpola entre snapshots —
 * a simulação anda em tiles discretos; aqui o passo vira movimento suave.
 */
export class EntityRenderer {
  private visuals = new Map<number, EntityVisual>();
  private playerId: number;

  constructor(
    private sprites: SpriteLibrary,
    private layer: Container,
    playerId: number,
  ) {
    this.playerId = playerId;
  }

  /** Posição visual atual do jogador local, em pixels de mundo (centro). */
  playerWorldPos(): { x: number; y: number } | null {
    const v = this.visuals.get(this.playerId);
    if (!v) return null;
    return { x: v.container.position.x, y: v.container.position.y - TILE_SIZE / 2 };
  }

  apply(snap: Snapshot): void {
    const seen = new Set<number>();
    for (const e of snap.entities) {
      seen.add(e.id);
      let v = this.visuals.get(e.id);
      if (!v) {
        v = this.createVisual(e);
        this.visuals.set(e.id, v);
      }
      // novo passo? inicia tween a partir da posição visual atual
      if (e.pos.x !== v.toX || e.pos.y !== v.toY) {
        const cur = this.currentTilePos(v);
        v.fromX = cur.x;
        v.fromY = cur.y;
        v.toX = e.pos.x;
        v.toY = e.pos.y;
        v.tweenElapsed = 0;
        v.tweenDur = e.stepMs;
      }
      if (e.facing !== v.facing) {
        v.facing = e.facing;
        this.applyFrame(v, this.currentFrame(v));
      }
      const ratio = e.maxHp > 0 ? e.hp / e.maxHp : 0;
      if (ratio !== v.lastHpRatio) {
        v.lastHpRatio = ratio;
        this.drawHpBar(v.hpBar, ratio);
      }
    }
    // remove quem saiu
    for (const [id, v] of this.visuals) {
      if (!seen.has(id)) {
        v.container.destroy({ children: true });
        this.visuals.delete(id);
      }
    }
  }

  tick(deltaMS: number): void {
    for (const v of this.visuals.values()) {
      const moving = v.tweenElapsed < v.tweenDur;
      if (moving) {
        v.tweenElapsed = Math.min(v.tweenElapsed + deltaMS, v.tweenDur);
        v.walkClock += deltaMS;
      } else if (v.walkClock !== 0) {
        v.walkClock = 0;
        this.applyFrame(v, 0);
      }
      const cur = this.currentTilePos(v);
      v.container.position.set((cur.x + 0.5) * TILE_SIZE, (cur.y + 1) * TILE_SIZE);
      v.container.zIndex = v.container.position.y;
      if (moving) this.applyFrame(v, this.currentFrame(v));
    }
  }

  private currentTilePos(v: EntityVisual): { x: number; y: number } {
    const t = v.tweenDur > 0 ? Math.min(v.tweenElapsed / v.tweenDur, 1) : 1;
    return {
      x: v.fromX + (v.toX - v.fromX) * t,
      y: v.fromY + (v.toY - v.fromY) * t,
    };
  }

  private currentFrame(v: EntityVisual): number {
    if (v.walkClock === 0) return 0;
    // meio passo por frame do ciclo
    const stepHalf = Math.max(v.tweenDur / 2, 80);
    return WALK_CYCLE[Math.floor(v.walkClock / stepHalf) % WALK_CYCLE.length];
  }

  private applyFrame(v: EntityVisual, frame: number): void {
    v.sprite.texture = this.sprites.knight[v.facing][frame];
  }

  private createVisual(e: EntityState): EntityVisual {
    const container = new Container();

    const shadow = new Sprite(this.sprites.shadow);
    shadow.anchor.set(0.5, 0.5);
    shadow.position.set(0, -3);
    container.addChild(shadow);

    const sprite = new Sprite(this.sprites.knight[e.facing][0]);
    sprite.anchor.set(0.5, 1);
    sprite.position.set(0, 0);
    container.addChild(sprite);

    const nameText = new Text({
      text: e.name,
      style: {
        fontFamily: "monospace",
        fontSize: 8,
        fill: e.kind === "player" ? 0xd8e0b8 : 0xc8c8c8,
        stroke: { color: 0x10141c, width: 2 },
      },
    });
    nameText.resolution = 4;
    nameText.anchor.set(0.5, 1);
    nameText.position.set(0, -38);
    container.addChild(nameText);

    const hpBar = new Graphics();
    hpBar.position.set(-14, -37);
    container.addChild(hpBar);

    const v: EntityVisual = {
      container,
      sprite,
      nameText,
      hpBar,
      fromX: e.pos.x,
      fromY: e.pos.y,
      toX: e.pos.x,
      toY: e.pos.y,
      tweenElapsed: 0,
      tweenDur: 0,
      facing: e.facing,
      walkClock: 0,
      lastHpRatio: -1,
    };
    container.position.set((e.pos.x + 0.5) * TILE_SIZE, (e.pos.y + 1) * TILE_SIZE);
    container.zIndex = container.position.y;
    this.layer.addChild(container);
    return v;
  }

  private drawHpBar(g: Graphics, ratio: number): void {
    g.clear();
    g.rect(0, 0, 28, 3).fill({ color: 0x10141c, alpha: 0.9 });
    const w = Math.max(0, Math.round(26 * ratio));
    const color = ratio > 0.5 ? 0x58a85a : ratio > 0.25 ? 0xc8a84b : 0xb8333f;
    if (w > 0) g.rect(1, 1, w, 1).fill(color);
  }
}
