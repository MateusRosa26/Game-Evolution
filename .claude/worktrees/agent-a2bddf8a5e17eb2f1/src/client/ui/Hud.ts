import { Container, Graphics, Text, type TextStyleOptions } from "pixi.js";
import type { PlayerProgressState } from "../../shared/protocol";
import { makeDraggable } from "./draggable";
import { UI, bar, hpColor, uiText } from "./theme";

/**
 * HUD do jogador — bloco CENTRAL embaixo (direção Apogea, jun/2026): selo de
 * level dourado grande à esquerda, barras largas de HP (verde→âmbar→vermelho) e
 * MP (azul) com número branco CENTRALIZADO, e uma linha fina de XP colada no
 * topo do HP. A hotbar de skills (`SkillBar`) é posicionada logo acima por fora.
 * Só apresentação: lê HP/MP da entidade + `progress` do player.
 */
const BARS_W = 320; // largura das barras
const HP_H = 18;
const MP_H = 16;
const XP_H = 4;
const GAP = 3;
const CHIP_R = 17; // raio do selo de level
const CLUSTER_H = XP_H + 1 + HP_H + GAP + MP_H; // altura do conjunto de barras

export class Hud {
  readonly container = new Container();
  private widget = new Container();
  private userPos: { x: number; y: number } | null = null;

  private panel = new Graphics();
  private bars = new Graphics();
  private levelChip = new Graphics();
  private badge = new Graphics();

  private hpText: Text;
  private mpText: Text;
  private xpText: Text;
  private levelText: Text;
  private nameText: Text;
  private goldText: Text;
  private badgeText: Text;
  private debugText: Text;
  private badgeClock = 0;

  private hp = 0;
  private maxHp = 1;
  private mp = 0;
  private maxMp = 1;
  private level = 0;
  private name = "";
  private goldShown = -1;
  private xp = 0;
  private xpForNextLevel = 1;
  private xpLevelFloor = 0;
  private freePoints = 0;
  private hasProgress = false;
  private screenW = 0;
  private screenH = 0;

  constructor() {
    this.container.addChild(this.widget);
    this.widget.addChild(this.panel, this.bars, this.levelChip, this.badge);
    makeDraggable(this.widget, CLUSTER_H + 12, (x, y) => {
      this.userPos = { x, y };
    });

    this.nameText = this.mkText(uiText(9, UI.textDim, "bold"), [0.5, 1]);
    this.levelText = this.mkText(uiText(15, UI.panelBg, "bold"), [0.5, 0.5]);
    this.hpText = this.mkText(uiText(10, 0xffffff, "bold"), [0.5, 0.5]);
    this.mpText = this.mkText(uiText(10, 0xffffff, "bold"), [0.5, 0.5]);
    this.xpText = this.mkText(uiText(7, UI.textDim, "bold"), [1, 0.5]);
    this.goldText = this.mkText(uiText(10, UI.goldBright, "bold"), [0, 0.5]);
    this.badgeText = this.mkText(uiText(9, UI.panelBg, "bold"), [0.5, 0.5]);
    this.badgeText.eventMode = "none";

    this.debugText = new Text({ text: "", style: { fontFamily: "monospace", fontSize: 11, fill: 0x8890a0 } });
    this.debugText.resolution = 2;
    this.debugText.anchor.set(1, 0);
    this.container.addChild(this.debugText);
  }

  private mkText(style: TextStyleOptions, anchor: [number, number]): Text {
    const t = new Text({ text: "", style });
    t.resolution = 3;
    t.anchor.set(anchor[0], anchor[1]);
    this.widget.addChild(t);
    return t;
  }

  setStats(hp: number, maxHp: number, mp: number, maxMp: number): void {
    if (hp === this.hp && maxHp === this.maxHp && mp === this.mp && maxMp === this.maxMp) return;
    this.hp = hp;
    this.maxHp = maxHp;
    this.mp = mp;
    this.maxMp = maxMp;
    this.redraw();
  }

  setName(name: string): void {
    if (name === this.name) return;
    this.name = name;
    this.redraw();
  }

  setProgress(p: PlayerProgressState): void {
    if (p.gold !== this.goldShown) {
      this.goldShown = p.gold;
      this.goldText.text = `${p.gold}`;
    }
    if (
      this.hasProgress &&
      p.level === this.level &&
      p.xp === this.xp &&
      p.xpForNextLevel === this.xpForNextLevel &&
      p.freeStatPoints === this.freePoints
    ) {
      return;
    }
    this.hasProgress = true;
    this.level = p.level;
    this.xp = p.xp;
    this.xpForNextLevel = p.xpForNextLevel;
    this.xpLevelFloor = p.xpLevelFloor;
    this.freePoints = p.freeStatPoints;
    this.redraw();
  }

  setDebug(text: string): void {
    this.debugText.text = text;
  }

  /** True se (sx,sy) está sobre o widget (anti-click-through). */
  hitTest(sx: number, sy: number): boolean {
    return this.widget.getBounds().rectangle.contains(sx, sy);
  }

  resize(screenW: number, screenH: number): void {
    this.screenW = screenW;
    this.screenH = screenH;
    this.debugText.position.set(screenW - 10, 8);
    this.redraw();
  }

  tick(deltaMS: number): void {
    if (!this.hasProgress || this.freePoints <= 0) return;
    this.badgeClock += deltaMS;
    const pulse = 0.5 + 0.5 * Math.sin(this.badgeClock / 220);
    this.badge.alpha = 0.65 + 0.35 * pulse;
    this.badge.scale.set(0.92 + 0.12 * pulse);
  }

  private redraw(): void {
    // O widget é posicionado de modo que as BARRAS fiquem centradas na tela; o
    // selo de level "pendura" à esquerda das barras. Coords locais: barra em x=0.
    const barsX = Math.round((this.screenW - BARS_W) / 2);
    const pos = this.userPos ?? { x: barsX, y: this.screenH - CLUSTER_H - 16 };
    this.widget.position.set(pos.x, pos.y);

    // ── painel sutil atrás do conjunto (inclui o selo à esquerda) ──
    const padL = CHIP_R * 2 + 14;
    this.panel.clear();
    this.panel
      .roundRect(-padL, -8, BARS_W + padL + 8, CLUSTER_H + 16, 8)
      .fill({ color: UI.panelBg, alpha: 0.8 });
    this.panel
      .roundRect(-padL, -8, BARS_W + padL + 8, CLUSTER_H + 16, 8)
      .stroke({ color: UI.panelBorder, width: 1 });

    // ── selo de level (grande, dourado) à esquerda ──
    const chipCx = -padL + CHIP_R + 6;
    const chipCy = CLUSTER_H / 2 - 4;
    this.levelChip.clear();
    this.levelChip.circle(chipCx, chipCy, CHIP_R).fill(UI.gold);
    this.levelChip.circle(chipCx, chipCy, CHIP_R).stroke({ color: UI.textShadow, width: 2 });
    this.levelChip.circle(chipCx, chipCy, CHIP_R - 3).stroke({ color: UI.goldBright, width: 1 });
    this.levelChip.visible = this.hasProgress;
    this.levelText.text = this.hasProgress ? `${this.level}` : "";
    this.levelText.position.set(chipCx, chipCy);
    // nome do herói, centralizado sob o selo de level
    this.nameText.text = this.name || "Herói";
    this.nameText.position.set(chipCx, CLUSTER_H + 7);

    // ── barras ──
    this.bars.clear();
    // XP: linha fina colada no topo do HP
    const xpSpan = this.xpForNextLevel - this.xpLevelFloor;
    const xpRatio = this.hasProgress && xpSpan > 0 ? (this.xp - this.xpLevelFloor) / xpSpan : 0;
    bar(this.bars, 0, 0, BARS_W, XP_H, xpRatio, UI.xpFill, UI.xpTop, UI.xpBack);

    // HP (verde→âmbar→vermelho), número branco centralizado
    const hpY = XP_H + 1;
    const hpRatio = this.hp / this.maxHp;
    const hpc = hpColor(hpRatio);
    bar(this.bars, 0, hpY, BARS_W, HP_H, hpRatio, hpc.fill, hpc.top, UI.hpBack);
    this.hpText.text = `${this.hp} / ${this.maxHp}`;
    this.hpText.position.set(BARS_W / 2, hpY + HP_H / 2);

    // MP (azul), número branco centralizado
    const mpY = hpY + HP_H + GAP;
    bar(this.bars, 0, mpY, BARS_W, MP_H, this.mp / this.maxMp, UI.mpFill, UI.mpTop, UI.mpBack);
    this.mpText.text = `${this.mp} / ${this.maxMp}`;
    this.mpText.position.set(BARS_W / 2, mpY + MP_H / 2);

    // % de XP discreto na ponta direita da linha de XP
    this.xpText.text = this.hasProgress ? `${Math.floor(Math.max(0, Math.min(1, xpRatio)) * 100)}%` : "";
    this.xpText.position.set(BARS_W - 3, XP_H / 2 + 0.5);

    // ── gold (moeda + valor) à direita, sob a barra de MP ──
    const goldY = CLUSTER_H + 7;
    this.goldText.anchor.set(1, 0.5);
    this.goldText.position.set(BARS_W, goldY);
    this.goldText.visible = this.hasProgress;
    this.bars.circle(BARS_W - this.goldText.width - 8, goldY, 4.5).fill(UI.gold);
    this.bars.circle(BARS_W - this.goldText.width - 8, goldY, 4.5).stroke({ color: UI.textShadow, width: 1 });

    // ── badge de pontos livres (sobre o selo de level) ──
    const showBadge = this.hasProgress && this.freePoints > 0;
    this.badge.visible = showBadge;
    this.badgeText.visible = showBadge;
    if (showBadge) {
      const bx = chipCx + CHIP_R - 3;
      const by = chipCy - CHIP_R + 3;
      this.badge.clear();
      this.badge.circle(0, 0, 8).fill(UI.goldBright);
      this.badge.circle(0, 0, 8).stroke({ color: UI.textShadow, width: 1.5 });
      this.badge.position.set(bx, by);
      this.badgeText.text = `+${this.freePoints}`;
      this.badgeText.position.set(bx, by);
    } else {
      this.badgeClock = 0;
      this.badge.alpha = 1;
      this.badge.scale.set(1);
    }
  }
}
