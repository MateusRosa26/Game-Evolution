import { Container, Graphics, Text } from "pixi.js";
import type { PlayerProgressState } from "../../shared/protocol";
import { PAL, hex } from "../assets/palette";

/**
 * HUD do jogador: painel com barras de HP/MP, barra fina de XP (estilo MMO),
 * level e badge pulsante de pontos livres. Apenas apresentação — lê o snapshot
 * (HP/MP da entidade + `progress` do player) e não calcula NENHUMA regra.
 */
export class Hud {
  readonly container = new Container();

  private panel = new Graphics();
  private bars = new Graphics();
  private hpText: Text;
  private mpText: Text;
  private debugText: Text;

  // ── Progressão ──
  private levelText: Text;
  private xpText: Text;
  private badge = new Graphics();
  private badgeText: Text;
  private badgeClock = 0;

  private hp = 0;
  private maxHp = 1;
  private mp = 0;
  private maxMp = 1;
  private level = 0;
  private xp = 0;
  private xpForNextLevel = 1;
  private freePoints = 0;
  private hasProgress = false;
  private screenH = 0;

  constructor() {
    this.container.addChild(this.panel);
    this.container.addChild(this.bars);

    const textStyle = {
      fontFamily: "monospace",
      fontSize: 9,
      fill: 0xe8e4d8,
      stroke: { color: 0x10141c, width: 2 },
    } as const;

    this.hpText = new Text({ text: "", style: textStyle });
    this.hpText.resolution = 3;
    this.hpText.anchor.set(0.5, 0.5);
    this.container.addChild(this.hpText);

    this.mpText = new Text({ text: "", style: textStyle });
    this.mpText.resolution = 3;
    this.mpText.anchor.set(0.5, 0.5);
    this.container.addChild(this.mpText);

    // Level (dourado, à esquerda da barra de XP)
    this.levelText = new Text({
      text: "",
      style: {
        fontFamily: "monospace",
        fontSize: 9,
        fontWeight: "bold",
        fill: hex(PAL.levelGold),
        stroke: { color: 0x10141c, width: 2 },
      },
    });
    this.levelText.resolution = 3;
    this.levelText.anchor.set(0, 0.5);
    this.container.addChild(this.levelText);

    // % de XP até o próximo nível (centralizado na barra de XP)
    this.xpText = new Text({
      text: "",
      style: {
        fontFamily: "monospace",
        fontSize: 7,
        fill: 0xe8e4d8,
        stroke: { color: 0x10141c, width: 2 },
      },
    });
    this.xpText.resolution = 3;
    this.xpText.anchor.set(0.5, 0.5);
    this.container.addChild(this.xpText);

    // Badge pulsante de pontos livres (hint para abrir o painel com C)
    this.container.addChild(this.badge);
    this.badgeText = new Text({
      text: "",
      style: {
        fontFamily: "monospace",
        fontSize: 9,
        fontWeight: "bold",
        fill: 0x10141c,
      },
    });
    this.badgeText.resolution = 3;
    this.badgeText.anchor.set(0.5, 0.5);
    this.container.addChild(this.badgeText);

    this.debugText = new Text({
      text: "",
      style: { fontFamily: "monospace", fontSize: 11, fill: 0x8890a0 },
    });
    this.debugText.resolution = 2;
    this.debugText.anchor.set(1, 0);
    this.container.addChild(this.debugText);
  }

  setStats(hp: number, maxHp: number, mp: number, maxMp: number): void {
    if (hp === this.hp && maxHp === this.maxHp && mp === this.mp && maxMp === this.maxMp) return;
    this.hp = hp;
    this.maxHp = maxHp;
    this.mp = mp;
    this.maxMp = maxMp;
    this.redraw();
  }

  /** Atualiza a camada de progressão a partir do snapshot do player. */
  setProgress(p: PlayerProgressState): void {
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
    this.freePoints = p.freeStatPoints;
    this.redraw();
  }

  setDebug(text: string): void {
    this.debugText.text = text;
  }

  resize(screenW: number, screenH: number): void {
    this.screenH = screenH;
    this.debugText.position.set(screenW - 10, 8);
    this.redraw();
  }

  /** Animação do badge de pontos livres (pulsa). */
  tick(deltaMS: number): void {
    if (!this.hasProgress || this.freePoints <= 0) return;
    this.badgeClock += deltaMS;
    const pulse = 0.5 + 0.5 * Math.sin(this.badgeClock / 220);
    this.badge.alpha = 0.65 + 0.35 * pulse;
    this.badge.scale.set(0.92 + 0.12 * pulse);
  }

  private redraw(): void {
    const x = 12;
    const barW = 180;
    // altura do painel: HP + MP + barra fina de XP
    const panelH = 80;
    const y = this.screenH - panelH - 12;

    this.panel.clear();
    this.panel.roundRect(x, y, barW + 28, panelH, 6).fill({ color: 0x12151d, alpha: 0.88 });
    this.panel.roundRect(x, y, barW + 28, panelH, 6).stroke({ color: 0x3a4254, width: 1.5 });

    this.bars.clear();
    // HP
    const hpRatio = Math.max(0, Math.min(1, this.hp / this.maxHp));
    this.bars.roundRect(x + 14, y + 12, barW, 16, 3).fill(0x241015);
    if (hpRatio > 0) {
      this.bars.roundRect(x + 14, y + 12, barW * hpRatio, 16, 3).fill(0xa62f3b);
      this.bars.roundRect(x + 14, y + 12, barW * hpRatio, 6, 3).fill({ color: 0xc94e58, alpha: 0.8 });
    }
    this.bars.roundRect(x + 14, y + 12, barW, 16, 3).stroke({ color: 0x10141c, width: 1.5 });
    // MP
    const mpRatio = Math.max(0, Math.min(1, this.mp / this.maxMp));
    this.bars.roundRect(x + 14, y + 36, barW, 16, 3).fill(0x101a2c);
    if (mpRatio > 0) {
      this.bars.roundRect(x + 14, y + 36, barW * mpRatio, 16, 3).fill(0x2e5598);
      this.bars.roundRect(x + 14, y + 36, barW * mpRatio, 6, 3).fill({ color: 0x4a73b8, alpha: 0.8 });
    }
    this.bars.roundRect(x + 14, y + 36, barW, 16, 3).stroke({ color: 0x10141c, width: 1.5 });

    this.hpText.text = `${this.hp} / ${this.maxHp}`;
    this.hpText.position.set(x + 14 + barW / 2, y + 20);
    this.mpText.text = `${this.mp} / ${this.maxMp}`;
    this.mpText.position.set(x + 14 + barW / 2, y + 44);

    // ── Barra fina de XP (estilo Tibia/MMO) ──
    const xpY = y + 60;
    const xpBarX = x + 36; // espaço para o "Lv" à esquerda
    const xpBarW = barW - 22;
    const xpRatio =
      this.hasProgress && this.xpForNextLevel > 0
        ? Math.max(0, Math.min(1, this.xp / this.xpForNextLevel))
        : 0;

    this.bars.roundRect(xpBarX, xpY, xpBarW, 8, 2).fill(hex(PAL.xpBack));
    if (xpRatio > 0) {
      this.bars.roundRect(xpBarX, xpY, xpBarW * xpRatio, 8, 2).fill(hex(PAL.xpFill));
      this.bars
        .roundRect(xpBarX, xpY, xpBarW * xpRatio, 3, 2)
        .fill({ color: hex(PAL.xpShine), alpha: 0.85 });
    }
    this.bars.roundRect(xpBarX, xpY, xpBarW, 8, 2).stroke({ color: 0x10141c, width: 1 });

    this.levelText.text = this.hasProgress ? `${this.level}` : "";
    this.levelText.position.set(x + 14, xpY + 4);

    this.xpText.text = this.hasProgress ? `${Math.floor(xpRatio * 100)}%` : "";
    this.xpText.position.set(xpBarX + xpBarW / 2, xpY + 4);

    // ── Badge de pontos livres (sobre o canto superior-direito do painel) ──
    const showBadge = this.hasProgress && this.freePoints > 0;
    this.badge.visible = showBadge;
    this.badgeText.visible = showBadge;
    if (showBadge) {
      const bx = x + barW + 22;
      const by = y + 2;
      this.badge.clear();
      this.badge.circle(0, 0, 9).fill(hex(PAL.badgePulse));
      this.badge.circle(0, 0, 9).stroke({ color: 0x10141c, width: 1.5 });
      this.badge.position.set(bx, by);
      this.badgeText.text = `${this.freePoints}`;
      this.badgeText.position.set(bx, by);
    } else {
      this.badgeClock = 0;
      this.badge.alpha = 1;
      this.badge.scale.set(1);
    }
  }
}
