/**
 * Janela de CONTAINER (bolso/mochila/cadáver) — uma por container aberto
 * (estilo Tibia; DESIGN-ITENS "cada uma abre sua janela").
 *
 * Grade de slots: item = quadradinho com iniciais + tooltip nome; pilha de
 * gold = moeda com a quantia (clique = saquear). Drag & drop via ItemDnD.
 * Apresentação pura: tudo vira comando pra sim.
 */
import { Container, FederatedPointerEvent, Graphics, Text } from "pixi.js";
import type { ContainerView, ItemRef } from "../../shared/protocol";
import { hex, PAL } from "../assets/palette";
import { makeDraggable } from "./draggable";
import type { ItemDnD } from "./dnd";
import { panelFrame, slot } from "./theme";
import type { Tooltip } from "./Tooltip";

const COLS = 4;
const SLOT = 34;
const GAP = 4;
const PAD = 10;
const HEADER_H = 22;

export class ContainerWindow {
  /** Largura fixa da janela (4 colunas) — usada pelo layout de janelas do Game. */
  static readonly WIDTH = PAD * 2 + COLS * SLOT + (COLS - 1) * GAP;
  /** Altura da janela para uma dada capacidade (para empilhar sem sobrepor). */
  static heightFor(capacity: number): number {
    const rows = Math.ceil(capacity / COLS);
    return HEADER_H + PAD + rows * (SLOT + GAP) + PAD - GAP;
  }

  readonly container = new Container();
  private bg = new Graphics();
  private title: Text;
  private closeBtn: Text;
  private slotLayer = new Container();
  private view: ContainerView | null = null;
  private userPos: { x: number; y: number } | null = null;

  constructor(
    readonly containerId: number,
    private dnd: ItemDnD,
    private send: {
      close: (id: number) => void;
      lootGold: (id: number, slot: number) => void;
    },
    private tooltip: Tooltip,
    defaultPos: { x: number; y: number },
  ) {
    this.userPos = defaultPos;
    this.container.addChild(this.bg, this.slotLayer);
    makeDraggable(this.container, HEADER_H, (x, y) => {
      this.userPos = { x, y };
      this.layout();
    });

    this.title = new Text({
      text: "",
      style: {
        fontFamily: "monospace",
        fontSize: 10,
        fontWeight: "bold",
        fill: hex(PAL.levelGold),
        stroke: { color: 0x10141c, width: 2 },
      },
    });
    this.title.resolution = 3;
    this.title.anchor.set(0, 0.5);
    this.container.addChild(this.title);

    this.closeBtn = new Text({
      text: "✕",
      style: { fontFamily: "monospace", fontSize: 11, fill: 0xc8c8c8 },
    });
    this.closeBtn.resolution = 3;
    this.closeBtn.anchor.set(0.5);
    this.closeBtn.eventMode = "static";
    this.closeBtn.cursor = "pointer";
    this.closeBtn.on("pointertap", () => this.send.close(this.containerId));
    this.container.addChild(this.closeBtn);
  }

  /** Atualiza com a view do snapshot (re-render só se mudou). */
  update(view: ContainerView): void {
    const key = JSON.stringify(view);
    if (this.view && JSON.stringify(this.view) === key) return;
    this.view = view;
    this.layout();
  }

  destroy(): void {
    this.dnd.clearOwner(`container:${this.containerId}`);
    this.container.destroy({ children: true });
  }

  private layout(): void {
    if (!this.view) return;
    const v = this.view;
    const rows = Math.ceil(v.capacity / COLS);
    const w = PAD * 2 + COLS * SLOT + (COLS - 1) * GAP;
    const h = HEADER_H + PAD + rows * (SLOT + GAP) + PAD - GAP;
    const pos = this.userPos ?? { x: 60, y: 60 };
    this.container.position.set(pos.x, pos.y);

    panelFrame(this.bg, w, h);
    this.title.text = v.name;
    this.title.position.set(PAD, HEADER_H / 2);
    this.closeBtn.position.set(w - 12, HEADER_H / 2);

    this.slotLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    const dropSlots = [];
    for (let i = 0; i < v.capacity; i++) {
      const sx = PAD + (i % COLS) * (SLOT + GAP);
      const sy = HEADER_H + PAD + Math.floor(i / COLS) * (SLOT + GAP);
      const cell = new Graphics();
      const filled = !!(v.items.find((it) => it.slot === i) || v.goldPiles.find((g) => g.slot === i));
      slot(cell, 0, 0, SLOT, filled);
      cell.position.set(sx, sy);
      this.slotLayer.addChild(cell);

      const ref: ItemRef = { kind: "container", containerId: v.containerId, slot: i };
      dropSlots.push({
        ref,
        bounds: () => {
          const p = cell.getGlobalPosition();
          return { x: p.x, y: p.y, w: SLOT, h: SLOT };
        },
      });

      const item = v.items.find((it) => it.slot === i);
      const gold = v.goldPiles.find((g) => g.slot === i);
      if (item) {
        const label = new Text({
          text: item.name.slice(0, 2).toUpperCase(),
          style: { fontFamily: "monospace", fontSize: 11, fontWeight: "bold", fill: 0xe8e4d8 },
        });
        label.resolution = 3;
        label.anchor.set(0.5);
        label.position.set(SLOT / 2, SLOT / 2 - 4);
        const name = new Text({
          text: item.name.length > 7 ? item.name.slice(0, 7) + "…" : item.name,
          style: { fontFamily: "monospace", fontSize: 5, fill: hex(PAL.attrLabel) },
        });
        name.resolution = 3;
        name.anchor.set(0.5);
        name.position.set(SLOT / 2, SLOT - 7);
        label.eventMode = "none";
        name.eventMode = "none";
        cell.addChild(label, name);
        cell.eventMode = "static";
        cell.cursor = "grab";
        cell.on("pointerdown", (ev: FederatedPointerEvent) => {
          ev.stopPropagation();
          this.dnd.start(ref, item.name, ev.global.x, ev.global.y);
        });
        cell.on("pointerover", () => {
          const p = cell.getGlobalPosition();
          this.tooltip.show(item.name, p.x, p.y, SLOT);
        });
        cell.on("pointerout", () => this.tooltip.hide());
      } else if (gold) {
        const coin = new Graphics();
        coin.circle(SLOT / 2, SLOT / 2 - 4, 7).fill(0xc8a84b);
        coin.circle(SLOT / 2, SLOT / 2 - 4, 7).stroke({ color: 0x10141c, width: 1.5 });
        const amt = new Text({
          text: String(gold.amount),
          style: { fontFamily: "monospace", fontSize: 8, fontWeight: "bold", fill: 0xe8e4d8 },
        });
        amt.resolution = 3;
        amt.anchor.set(0.5);
        amt.position.set(SLOT / 2, SLOT - 8);
        coin.eventMode = "none";
        amt.eventMode = "none";
        cell.addChild(coin, amt);
        cell.eventMode = "static";
        cell.cursor = "grab";
        // ARRASTAR a pilha = move/funde no destino (bolso). Clique simples NÃO
        // pega (decisão jun/2026); shift/alt+clique saqueia pro bolso sem arrastar.
        cell.on("pointerdown", (ev: FederatedPointerEvent) => {
          if (ev.shiftKey || ev.altKey) return; // deixa o pointertap saquear
          ev.stopPropagation();
          this.dnd.start(ref, String(gold.amount), ev.global.x, ev.global.y);
        });
        cell.on("pointertap", (ev: FederatedPointerEvent) => {
          if (ev.shiftKey || ev.altKey) this.send.lootGold(v.containerId, gold.slot);
        });
        cell.on("pointerover", () => {
          const p = cell.getGlobalPosition();
          this.tooltip.show(`${gold.amount} de ouro`, p.x, p.y, SLOT);
        });
        cell.on("pointerout", () => this.tooltip.hide());
      }
    }
    this.dnd.setSlots(`container:${this.containerId}`, dropSlots);
  }
}
