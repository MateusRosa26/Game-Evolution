import { Container, Graphics, Text } from "pixi.js";

/** HUD mínimo: painel com barras de HP/MP + linha de debug discreta. */
export class Hud {
  readonly container = new Container();

  private panel = new Graphics();
  private bars = new Graphics();
  private hpText: Text;
  private mpText: Text;
  private debugText: Text;

  private hp = 0;
  private maxHp = 1;
  private mp = 0;
  private maxMp = 1;
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

  setDebug(text: string): void {
    this.debugText.text = text;
  }

  resize(screenW: number, screenH: number): void {
    this.screenH = screenH;
    this.debugText.position.set(screenW - 10, 8);
    this.redraw();
  }

  private redraw(): void {
    const x = 12;
    const y = this.screenH - 76;
    const barW = 180;

    this.panel.clear();
    this.panel.roundRect(x, y, barW + 28, 64, 6).fill({ color: 0x12151d, alpha: 0.88 });
    this.panel.roundRect(x, y, barW + 28, 64, 6).stroke({ color: 0x3a4254, width: 1.5 });

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
  }
}
