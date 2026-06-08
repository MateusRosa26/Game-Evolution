/**
 * DIÁRIO de quests (tecla J) — SISTEMA-QUESTS.md: a entrada guarda as
 * palavras do NPC; contador discreto ("4/8") SÓ nas diretas (decisão
 * jun/2026). Completadas ficam como registro (o diário é o troféu).
 */
import { Container, Graphics, Text } from "pixi.js";
import type { QuestJournalEntry } from "../../shared/protocol";
import { hex, PAL } from "../assets/palette";
import { makeDraggable } from "./draggable";

const W = 300;
const PAD = 14;
const HEADER_H = 24;

export class JournalPanel {
  readonly container = new Container();
  private bg = new Graphics();
  private title: Text;
  private entriesLayer = new Container();
  private quests: QuestJournalEntry[] = [];
  private lastKey = "";
  private userPos: { x: number; y: number } | null = null;
  private screenH = 0;

  constructor() {
    this.container.visible = false;
    this.container.addChild(this.bg, this.entriesLayer);
    makeDraggable(this.container, HEADER_H, (x, y) => {
      this.userPos = { x, y };
      this.layout();
    });
    this.title = new Text({
      text: "Diário",
      style: {
        fontFamily: "monospace",
        fontSize: 11,
        fontWeight: "bold",
        fill: hex(PAL.levelGold),
        stroke: { color: 0x10141c, width: 2 },
      },
    });
    this.title.resolution = 3;
    this.title.anchor.set(0, 0.5);
    this.container.addChild(this.title);
  }

  get visible(): boolean {
    return this.container.visible;
  }

  toggle(): void {
    this.container.visible = !this.container.visible;
    if (this.container.visible) this.layout();
  }

  setState(quests: QuestJournalEntry[] | undefined): void {
    this.quests = quests ?? [];
    const key = JSON.stringify(this.quests);
    if (this.container.visible && key !== this.lastKey) {
      this.lastKey = key;
      this.layout();
    }
  }

  resize(_w: number, h: number): void {
    this.screenH = h;
    if (this.container.visible) this.layout();
  }

  private layout(): void {
    this.entriesLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    let oy = HEADER_H + 10;

    if (this.quests.length === 0) {
      const empty = new Text({
        text: "Nenhuma anotação ainda.",
        style: { fontFamily: "monospace", fontSize: 8, fill: hex(PAL.attrLabel), stroke: { color: 0x10141c, width: 2 } },
      });
      empty.resolution = 3;
      empty.position.set(PAD, oy);
      this.entriesLayer.addChild(empty);
      oy += 20;
    }

    for (const q of this.quests) {
      const head = new Text({
        text: `${q.completed ? "✓ " : "• "}${q.name}${q.counter ? `  (${q.counter.cur}/${q.counter.max})` : ""}`,
        style: {
          fontFamily: "monospace",
          fontSize: 9,
          fontWeight: "bold",
          fill: q.completed ? 0x8890a0 : 0xd8e0b8,
          stroke: { color: 0x10141c, width: 2 },
        },
      });
      head.resolution = 3;
      head.position.set(PAD, oy);
      this.entriesLayer.addChild(head);
      oy += 15;

      const body = new Text({
        text: q.entry,
        style: {
          fontFamily: "monospace",
          fontSize: 7,
          fill: hex(PAL.attrLabel),
          stroke: { color: 0x10141c, width: 2 },
          wordWrap: true,
          wordWrapWidth: W - PAD * 2,
          lineHeight: 11,
        },
      });
      body.resolution = 3;
      body.position.set(PAD, oy);
      this.entriesLayer.addChild(body);
      oy += body.height + 12;
    }

    const h = oy + PAD - 6;
    const pos = this.userPos ?? { x: 16, y: Math.max(56, this.screenH / 2 - h / 2) };
    this.container.position.set(pos.x, pos.y);
    this.bg.clear();
    this.bg.roundRect(0, 0, W, h, 6).fill({ color: hex(PAL.panelBg), alpha: 1 });
    this.bg.roundRect(0, 0, W, h, 6).stroke({ color: hex(PAL.panelBorder), width: 1.5 });
    this.bg.rect(0, HEADER_H, W, 1).fill(hex(PAL.panelBorder));
    this.title.position.set(PAD, HEADER_H / 2);
  }
}
