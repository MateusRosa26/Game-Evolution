import { Container, Graphics, Sprite, Text, type Texture } from "pixi.js";
import { TILE_SIZE } from "../../shared/constants";
import type { EntityState, Snapshot } from "../../shared/protocol";
import type { Facing } from "../../shared/types";
import type { SpriteLibrary } from "../assets/sprites";

/** Ciclo de caminhada: passo-esq, neutro, passo-dir, neutro. */
const WALK_CYCLE = [1, 0, 2, 0];

/** Floating damage text — sobe e some. */
const FLOAT_DUR_MS = 900;
const FLOAT_RISE_PX = 22;

interface FloatingText {
  text: Text;
  elapsed: number;
}

interface EntityVisual {
  container: Container;
  sprite: Sprite;
  /** Conjunto de texturas (knight/rat) deste visual. */
  textures: Record<Facing, Texture[]>;
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
  /** Marcador de alvo (estilo Tibia) reparentado sob o monstro alvo. */
  private targetMarker: Sprite;
  /** Floating damage texts ativos. */
  private floats: FloatingText[] = [];

  constructor(
    private sprites: SpriteLibrary,
    private layer: Container,
    playerId: number,
  ) {
    this.playerId = playerId;
    this.targetMarker = new Sprite(sprites.targetMarker);
    this.targetMarker.anchor.set(0.5, 0.5);
    this.targetMarker.visible = false;
  }

  /** Texturas certas para a espécie (player = knight, rato = rat). */
  private texturesFor(e: EntityState): Record<Facing, Texture[]> {
    if (e.species === "rato_lanhoso") return this.sprites.rat;
    return this.sprites.knight;
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

    // ── Eventos one-shot do tick: floating damage text ──
    for (const ev of snap.events) {
      if (ev.kind === "damage") this.spawnDamageText(ev.amount, ev.pos.x, ev.pos.y);
      // death: a remoção visual já acontece pelo diff de entidades acima.
    }

    // ── Marcador de alvo ──
    this.setTarget(snap.targetId);
  }

  /** Reposiciona/atualiza o marcador de alvo sob o monstro selecionado. */
  private setTarget(id: number | null): void {
    const v = id != null ? this.visuals.get(id) : undefined;
    if (!v) {
      this.targetMarker.visible = false;
      if (this.targetMarker.parent) this.targetMarker.parent.removeChild(this.targetMarker);
      return;
    }
    // ancorado no container do alvo (segue a interpolação de posição)
    if (this.targetMarker.parent !== v.container) {
      v.container.addChild(this.targetMarker);
    }
    this.targetMarker.position.set(0, -TILE_SIZE / 2);
    this.targetMarker.visible = true;
  }

  /**
   * Texto flutuante dourado "SUBIU DE NÍVEL!" sobre o jogador (apresentação:
   * o Game detecta a subida comparando snapshots e chama isto). Ancorado no
   * container do player para seguir a interpolação de posição.
   */
  spawnLevelUpText(): void {
    const v = this.visuals.get(this.playerId);
    if (!v) return;
    const text = new Text({
      text: "SUBIU DE NÍVEL!",
      style: {
        fontFamily: "monospace",
        fontSize: 12,
        fontWeight: "bold",
        fill: 0xffd95a,
        stroke: { color: 0x10141c, width: 4 },
      },
    });
    text.resolution = 4;
    text.anchor.set(0.5, 1);
    text.position.set(0, -44);
    text.zIndex = 1e9;
    v.container.addChild(text);
    // Reusa o pool de floats: sobe e some sobre o player.
    this.floats.push({ text, elapsed: 0 });
  }

  private spawnDamageText(amount: number, tileX: number, tileY: number): void {
    const text = new Text({
      text: `${amount}`,
      style: {
        fontFamily: "monospace",
        fontSize: 11,
        fontWeight: "bold",
        fill: 0xff5a4a,
        stroke: { color: 0x10141c, width: 3 },
      },
    });
    text.resolution = 4;
    text.anchor.set(0.5, 1);
    text.position.set((tileX + 0.5) * TILE_SIZE, (tileY + 0.6) * TILE_SIZE);
    text.zIndex = 1e9; // sempre por cima
    this.layer.addChild(text);
    this.floats.push({ text, elapsed: 0 });
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

    // floating damage text: sobe e desaparece
    for (const f of this.floats) {
      f.elapsed += deltaMS;
      const t = Math.min(f.elapsed / FLOAT_DUR_MS, 1);
      f.text.y -= (FLOAT_RISE_PX / FLOAT_DUR_MS) * deltaMS;
      f.text.alpha = 1 - t * t;
    }
    this.floats = this.floats.filter((f) => {
      if (f.elapsed >= FLOAT_DUR_MS) {
        f.text.destroy();
        return false;
      }
      return true;
    });
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
    v.sprite.texture = v.textures[v.facing][frame];
  }

  private createVisual(e: EntityState): EntityVisual {
    const container = new Container();
    const textures = this.texturesFor(e);

    const shadow = new Sprite(this.sprites.shadow);
    shadow.anchor.set(0.5, 0.5);
    shadow.position.set(0, -3);
    container.addChild(shadow);

    const sprite = new Sprite(textures[e.facing][0]);
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
      textures,
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
