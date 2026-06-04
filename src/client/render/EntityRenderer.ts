import { Container, Graphics, Sprite, Text, type Texture } from "pixi.js";
import { TILE_SIZE } from "../../shared/constants";
import type { EntityState, Snapshot, StatusEffectState } from "../../shared/protocol";
import type { Facing } from "../../shared/types";
import type { SpriteLibrary } from "../assets/sprites";
import { skillMeta } from "../ui/skillMeta";

/** Ciclo de caminhada: passo-esq, neutro, passo-dir, neutro. */
const WALK_CYCLE = [1, 0, 2, 0];

/**
 * Tempo parado (ms) antes de voltar ao frame neutro. Entre um passo e o
 * próximo snapshot há jitter de timer de alguns ms — sem essa folga, o sprite
 * "piscava" pro idle a cada passo e a caminhada nunca emendava o ciclo.
 */
const IDLE_RESET_MS = 90;

/** Floating damage text — sobe e some. */
const FLOAT_DUR_MS = 900;
const FLOAT_RISE_PX = 22;

/**
 * Projétil de cast (runa viajando from→to): velocidade CONSTANTE em px/ms —
 * a duração escala com a distância (1 tile não parece lento nem 7 tiles
 * parecem teleporte). Piso/teto para legibilidade.
 */
const CAST_SPEED_PX_PER_MS = 0.45; // ~14 tiles/s
const CAST_MIN_DUR_MS = 80;
const CAST_MAX_DUR_MS = 320;

/** Cor por tipo de status effect (apresentação dos ícones sobre a HP bar). */
const STATUS_COLOR: Record<StatusEffectState["kind"], number> = {
  burn: 0xff7a32,
  slow: 0x6fc8e8,
  poison: 0x7ad15a,
};

interface FloatingText {
  text: Text;
  elapsed: number;
}

interface CastProjectile {
  gfx: Graphics;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  elapsed: number;
  /** Duração do voo (derivada da distância — velocidade constante). */
  durMs: number;
}

interface EntityVisual {
  container: Container;
  sprite: Sprite;
  /** Conjunto de texturas (knight/rat) deste visual. */
  textures: Record<Facing, Texture[]>;
  nameText: Text;
  hpBar: Graphics;
  /** Ícones de status effect (burn/slow/poison) sobre a HP bar. */
  statusIcons: Graphics;
  /** Chave dos status desenhados (evita redesenhar todo tick). */
  statusKey: string;
  // tween de posição (em tiles, com fração)
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  tweenElapsed: number;
  tweenDur: number;
  facing: Facing;
  walkClock: number;
  /** Tempo acumulado parado (p/ resetar a animação só após IDLE_RESET_MS). */
  idleMs: number;
  lastHpRatio: number;
  /** Espécie/skin do conjunto de texturas atual (troca de skin em runtime). */
  skinKey: string;
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
  /** Projéteis de cast ativos (runas viajando). */
  private casts: CastProjectile[] = [];

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

  /** Texturas certas para a espécie (player = knight na skin atual, rato = rat). */
  private texturesFor(e: EntityState): Record<Facing, Texture[]> {
    if (e.species === "rato_lanhoso") return this.sprites.rat;
    return this.sprites.knight[e.skin ?? "padrao"] ?? this.sprites.knight.padrao;
  }

  /** Chave de skin usada no visual (para detectar troca em runtime). */
  private skinKeyOf(e: EntityState): string {
    return e.species ?? e.skin ?? "padrao";
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
        const jump = Math.max(Math.abs(e.pos.x - v.toX), Math.abs(e.pos.y - v.toY)) > 1;
        if (jump) {
          // Teleporte (respawn de morte, blinks futuros): CORTA, não desliza —
          // tween aqui faria o sprite escorregar pelo mapa atravessando tudo.
          v.fromX = e.pos.x;
          v.fromY = e.pos.y;
          v.toX = e.pos.x;
          v.toY = e.pos.y;
          v.tweenElapsed = 0;
          v.tweenDur = 0;
        } else {
          const cur = this.currentTilePos(v);
          v.fromX = cur.x;
          v.fromY = cur.y;
          v.toX = e.pos.x;
          v.toY = e.pos.y;
          v.tweenElapsed = 0;
          v.tweenDur = e.stepMs;
        }
      }
      if (e.facing !== v.facing) {
        v.facing = e.facing;
        this.applyFrame(v, this.currentFrame(v));
      }
      // troca de skin em runtime (hotkey 0): troca o conjunto de texturas
      const skinKey = this.skinKeyOf(e);
      if (skinKey !== v.skinKey) {
        v.skinKey = skinKey;
        v.textures = this.texturesFor(e);
        this.applyFrame(v, this.currentFrame(v));
      }
      const ratio = e.maxHp > 0 ? e.hp / e.maxHp : 0;
      if (ratio !== v.lastHpRatio) {
        v.lastHpRatio = ratio;
        this.drawHpBar(v.hpBar, ratio);
      }
      // ── Indicadores de status effect sobre a HP bar ──
      const statusKey = e.status.map((s) => s.kind).join(",");
      if (statusKey !== v.statusKey) {
        v.statusKey = statusKey;
        this.drawStatusIcons(v.statusIcons, e.status);
      }
    }
    // remove quem saiu
    for (const [id, v] of this.visuals) {
      if (!seen.has(id)) {
        // o marcador de alvo é compartilhado — resgata antes de destruir o
        // container, senão destroy({children}) o leva junto e setTarget crasha
        if (this.targetMarker.parent === v.container) {
          v.container.removeChild(this.targetMarker);
          this.targetMarker.visible = false;
        }
        v.container.destroy({ children: true });
        this.visuals.delete(id);
      }
    }

    // ── Eventos one-shot do tick: floats, cast e cura ──
    for (const ev of snap.events) {
      if (ev.kind === "damage") {
        const at = this.visualPosOf(ev.targetId, ev.pos);
        this.spawnDamageText(ev.amount, at.x, at.y);
      } else if (ev.kind === "cast") {
        this.spawnCast(ev.skillId, ev.casterId, ev.from, ev.to);
      } else if (ev.kind === "heal") {
        const at = this.visualPosOf(ev.targetId, ev.pos);
        this.spawnHealText(ev.amount, at.x, at.y);
      }
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

  /**
   * Posição visual (interpolada) de uma entidade em px de mundo — onde o
   * jogador VÊ o alvo, não o tile da sim (mob no meio do passo). Fallback:
   * centro do tile do evento (entidade já removida, ex.: golpe fatal).
   */
  private visualPosOf(entityId: number, fallbackTile: { x: number; y: number }): { x: number; y: number } {
    const v = this.visuals.get(entityId);
    if (v) return { x: v.container.position.x, y: v.container.position.y - TILE_SIZE * 0.4 };
    return { x: (fallbackTile.x + 0.5) * TILE_SIZE, y: (fallbackTile.y + 0.6) * TILE_SIZE };
  }

  private spawnDamageText(amount: number, worldX: number, worldY: number): void {
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
    text.position.set(worldX, worldY);
    text.zIndex = 1e9; // sempre por cima
    this.layer.addChild(text);
    this.floats.push({ text, elapsed: 0 });
  }

  /** Floating text VERDE de cura sobre o alvo (segue o padrão do dano). */
  private spawnHealText(amount: number, worldX: number, worldY: number): void {
    const text = new Text({
      text: `+${amount}`,
      style: {
        fontFamily: "monospace",
        fontSize: 11,
        fontWeight: "bold",
        fill: 0x5fe06a,
        stroke: { color: 0x10141c, width: 3 },
      },
    });
    text.resolution = 4;
    text.anchor.set(0.5, 1);
    text.position.set(worldX, worldY);
    text.zIndex = 1e9;
    this.layer.addChild(text);
    this.floats.push({ text, elapsed: 0 });
  }

  /**
   * Projétil de cast (runa de Tibia): círculo colorido pela skill viajando de
   * `from`→`to` a velocidade constante. Origem = posição VISUAL do caster
   * (mid-step), destino = tile do evento. APRESENTAÇÃO pura — a sim já
   * resolveu o efeito.
   */
  private spawnCast(
    skillId: string,
    casterId: number,
    from: { x: number; y: number },
    to: { x: number; y: number },
  ): void {
    const color = skillMeta(skillId).color;
    const gfx = new Graphics();
    gfx.circle(0, 0, 4).fill({ color, alpha: 0.95 });
    gfx.circle(0, 0, 6).stroke({ color, alpha: 0.4, width: 2 });
    gfx.zIndex = 1e9;
    this.layer.addChild(gfx);
    const origin = this.visualPosOf(casterId, from);
    const toX = (to.x + 0.5) * TILE_SIZE;
    const toY = (to.y + 0.5) * TILE_SIZE;
    const dist = Math.hypot(toX - origin.x, toY - origin.y);
    const durMs = Math.min(CAST_MAX_DUR_MS, Math.max(CAST_MIN_DUR_MS, dist / CAST_SPEED_PX_PER_MS));
    this.casts.push({ gfx, fromX: origin.x, fromY: origin.y, toX, toY, elapsed: 0, durMs });
  }

  tick(deltaMS: number): void {
    for (const v of this.visuals.values()) {
      const moving = v.tweenElapsed < v.tweenDur;
      if (moving) {
        v.tweenElapsed = Math.min(v.tweenElapsed + deltaMS, v.tweenDur);
        v.walkClock += deltaMS;
        v.idleMs = 0;
      } else if (v.walkClock !== 0) {
        // Só volta ao frame neutro após uma folga — um passo emenda no outro
        // sem o sprite piscar pro idle entre snapshots.
        v.idleMs += deltaMS;
        if (v.idleMs >= IDLE_RESET_MS) {
          v.walkClock = 0;
          this.applyFrame(v, 0);
        }
      }
      const cur = this.currentTilePos(v);
      // Snap a meio-pixel de mundo (= 1px de tela no zoom 2×): mata o shimmer
      // de subpixel do pixel art (nearest) em movimento, sem serrilhar o tween.
      v.container.position.set(
        Math.round((cur.x + 0.5) * TILE_SIZE * 2) / 2,
        Math.round((cur.y + 1) * TILE_SIZE * 2) / 2,
      );
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

    // projéteis de cast: viajam from→to a velocidade constante e somem ao chegar
    for (const c of this.casts) {
      c.elapsed += deltaMS;
      const t = Math.min(c.elapsed / c.durMs, 1);
      c.gfx.position.set(c.fromX + (c.toX - c.fromX) * t, c.fromY + (c.toY - c.fromY) * t);
    }
    this.casts = this.casts.filter((c) => {
      if (c.elapsed >= c.durMs) {
        c.gfx.destroy();
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

    // ícones de status: à direita da HP bar (HP bar vai de x=-14 a x=14)
    const statusIcons = new Graphics();
    statusIcons.position.set(16, -37);
    container.addChild(statusIcons);

    const v: EntityVisual = {
      container,
      sprite,
      textures,
      nameText,
      hpBar,
      statusIcons,
      statusKey: "",
      fromX: e.pos.x,
      fromY: e.pos.y,
      toX: e.pos.x,
      toY: e.pos.y,
      tweenElapsed: 0,
      tweenDur: 0,
      facing: e.facing,
      walkClock: 0,
      idleMs: 0,
      lastHpRatio: -1,
      skinKey: this.skinKeyOf(e),
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

  /**
   * Ícones minúsculos de status (chama=burn, floco=slow, gota=poison) sobre a
   * HP bar de quem tem status ativo. Glifos procedurais simples via Graphics —
   * só apresentação (a duração/efeito vive na sim).
   */
  private drawStatusIcons(g: Graphics, status: StatusEffectState[]): void {
    g.clear();
    const size = 6;
    const gap = 2;
    for (let i = 0; i < status.length; i++) {
      const s = status[i];
      const color = STATUS_COLOR[s.kind];
      const cx = i * (size + gap) + size / 2;
      const cy = 1 + size / 2;
      // fundo escuro p/ contraste
      g.circle(cx, cy, size / 2 + 1).fill({ color: 0x10141c, alpha: 0.9 });
      if (s.kind === "burn") {
        // chama: triângulo apontando p/ cima
        g.poly([cx, cy - size / 2, cx + size / 2, cy + size / 2, cx - size / 2, cy + size / 2]).fill(color);
      } else if (s.kind === "slow") {
        // floco: losango
        g.poly([cx, cy - size / 2, cx + size / 2, cy, cx, cy + size / 2, cx - size / 2, cy]).fill(color);
      } else {
        // poison: gota (círculo)
        g.circle(cx, cy, size / 2).fill(color);
      }
    }
  }
}
