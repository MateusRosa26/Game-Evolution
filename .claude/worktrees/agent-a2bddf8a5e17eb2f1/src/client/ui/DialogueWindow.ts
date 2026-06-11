/**
 * Janela de DIÁLOGO (SISTEMA-NPCS.md — híbrida): texto do NPC + opções
 * clicáveis. Campo de keywords digitáveis = v2 (✏️). Apresentação pura:
 * a view vem da sim no snapshot; cada clique vira `dialogueChoice`.
 */
import { Container, Graphics, Text } from "pixi.js";
import type { DialogueViewState } from "../../shared/protocol";
import { hex, PAL } from "../assets/palette";

const W = 360;
const PAD = 14;
const HEADER_H = 24;

export class DialogueWindow {
  readonly container = new Container();
  private bg = new Graphics();
  private name: Text;
  private body: Text;
  private optionLayer = new Container();
  private current: string | null = null;
  private screenW = 0;
  private screenH = 0;

  constructor(private onChoose: (optionId: string) => void) {
    this.container.visible = false;
    this.container.addChild(this.bg);
    this.name = new Text({
      text: "",
      style: {
        fontFamily: "monospace",
        fontSize: 11,
        fontWeight: "bold",
        fill: hex(PAL.levelGold),
        stroke: { color: 0x10141c, width: 2 },
      },
    });
    this.name.resolution = 3;
    this.body = new Text({
      text: "",
      style: {
        fontFamily: "monospace",
        fontSize: 9,
        fill: 0xe8e4d8,
        stroke: { color: 0x10141c, width: 2 },
        wordWrap: true,
        wordWrapWidth: W - PAD * 2,
        lineHeight: 14,
      },
    });
    this.body.resolution = 3;
    this.container.addChild(this.name, this.body, this.optionLayer);
  }

  /** Atualiza com a view do snapshot (null = sem diálogo → esconde). */
  update(view: DialogueViewState | undefined): void {
    if (!view) {
      if (this.container.visible) {
        this.container.visible = false;
        this.current = null;
      }
      return;
    }
    const key = JSON.stringify(view);
    if (key === this.current) return;
    this.current = key;
    this.container.visible = true;
    this.layout(view);
  }

  resize(w: number, h: number): void {
    this.screenW = w;
    this.screenH = h;
  }

  private layout(view: DialogueViewState): void {
    this.name.text = view.npcName;
    this.body.text = view.text;

    this.optionLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    const bodyH = this.body.height;
    let oy = HEADER_H + 8 + bodyH + 12;
    for (const opt of view.options) {
      const btn = new Container();
      const label = new Text({
        text: `› ${opt.label}`,
        style: {
          fontFamily: "monospace",
          fontSize: 9,
          fontWeight: "bold",
          fill: 0xd8e0b8,
          stroke: { color: 0x10141c, width: 2 },
        },
      });
      label.resolution = 3;
      const g = new Graphics();
      g.roundRect(-6, -4, W - PAD * 2 + 12, label.height + 8, 4).fill({ color: 0x1a1e28, alpha: 0.9 });
      g.roundRect(-6, -4, W - PAD * 2 + 12, label.height + 8, 4).stroke({ color: 0x2a3140, width: 1 });
      btn.addChild(g, label);
      btn.position.set(PAD, oy);
      btn.eventMode = "static";
      btn.cursor = "pointer";
      btn.on("pointertap", () => this.onChoose(opt.id));
      btn.on("pointerover", () => g.tint = 0xc8a84b);
      btn.on("pointerout", () => g.tint = 0xffffff);
      this.optionLayer.addChild(btn);
      oy += label.height + 14;
    }

    const h = oy + PAD - 4;
    this.bg.clear();
    this.bg.roundRect(0, 0, W, h, 7).fill({ color: hex(PAL.panelBg), alpha: 1 });
    this.bg.roundRect(0, 0, W, h, 7).stroke({ color: hex(PAL.panelBorder), width: 1.5 });
    this.bg.rect(0, HEADER_H, W, 1).fill(hex(PAL.panelBorder));
    this.name.position.set(PAD, 7);
    this.body.position.set(PAD, HEADER_H + 8);

    // ancorada embaixo-centro (perto do mundo, sem cobrir o char)
    this.container.position.set(
      Math.round((this.screenW - W) / 2),
      Math.round(this.screenH - h - 90),
    );
  }
}
