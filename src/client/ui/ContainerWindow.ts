/**
 * Janela de CONTAINER (bolso/mochila/cadáver) — uma por container aberto
 * (estilo Tibia; DESIGN-ITENS "cada uma abre sua janela").
 *
 * Grade de slots: item = quadradinho com iniciais + tooltip nome; pilha
 * fungível (`stack`: comida/reagente/poção) = mesmo ícone do item + o NÚMERO da
 * contagem no canto inferior-direito (estilo Tibia, só quando >1); pilha de
 * gold = moeda com a quantia (clique = saquear). Drag & drop via ItemDnD.
 * Apresentação pura: tudo vira comando pra sim.
 */
import { Container, FederatedPointerEvent, Graphics, Sprite, Text } from "pixi.js";
import type { ContainerView, ItemRef } from "../../shared/protocol";
import { hex, PAL } from "../assets/palette";
import { PIXELLAB } from "../assets/pixellab";
import { makeDraggable } from "./draggable";
import type { ItemDnD } from "./dnd";
import { fitSpriteToSlot, panelFrame, slot } from "./theme";
import type { Tooltip } from "./Tooltip";

const COLS = 4;
const SLOT = 64; // remaster 128px (jun/2026): densidade de UI subiu p/ compor com o mundo
const GAP = 6;
const PAD = 12;
const HEADER_H = 24;

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
      useItem: (ref: ItemRef) => void;
      openItemContainer: (instanceId: number) => void;
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
      const filled = !!(
        v.items.find((it) => it.slot === i) ||
        v.stacks.find((s) => s.slot === i) ||
        v.goldPiles.find((g) => g.slot === i)
      );
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
      const stack = v.stacks.find((s) => s.slot === i);
      const gold = v.goldPiles.find((g) => g.slot === i);
      if (item) {
        // sprite real do item (img/items/<id>.png) quando existir; senão o
        // placeholder de iniciais + nome (itens ainda sem arte aprovada).
        this.drawItemIcon(cell, item.templateId, item.name);
        cell.eventMode = "static";
        cell.cursor = "grab";
        cell.on("pointerdown", (ev: FederatedPointerEvent) => {
          ev.stopPropagation();
          // Botão direito: bag → ABRE (vê dentro); senão USAR (a sim ignora item
          // sem efeito de uso).
          if (ev.button === 2) {
            if (item.isContainer) this.send.openItemContainer(item.instanceId);
            else this.send.useItem(ref);
            return;
          }
          this.dnd.start(ref, item.name, ev.global.x, ev.global.y, item.templateId);
        });
        cell.on("pointerover", () => {
          const p = cell.getGlobalPosition();
          this.tooltip.show(item.name, p.x, p.y, SLOT);
        });
        cell.on("pointerout", () => this.tooltip.hide());
      } else if (stack) {
        // pilha fungível (comida/reagente/poção): MESMO ícone do item + a
        // contagem no canto inferior-direito (estilo Tibia, só quando >1).
        // Arrastar move a pilha INTEIRA (a sim funde/transborda no destino);
        // split por quantidade fica ✏️ futuro. Botão direito = usar 1 unidade
        // (consumível) — a sim decrementa a pilha e zera o slot ao chegar a 0.
        this.drawItemIcon(cell, stack.templateId, stack.name);
        if (stack.count > 1) cell.addChild(stackBadge(stack.count));
        cell.eventMode = "static";
        cell.cursor = "grab";
        cell.on("pointerdown", (ev: FederatedPointerEvent) => {
          ev.stopPropagation();
          if (ev.button === 2) {
            this.send.useItem(ref);
            return;
          }
          this.dnd.start(ref, stack.name, ev.global.x, ev.global.y, stack.templateId);
        });
        cell.on("pointerover", () => {
          const p = cell.getGlobalPosition();
          this.tooltip.show(`${stack.name} (${stack.count})`, p.x, p.y, SLOT);
        });
        cell.on("pointerout", () => this.tooltip.hide());
      } else if (gold) {
        const coin = new Graphics();
        coin.circle(SLOT / 2, SLOT / 2 - 6, 13).fill(0xc8a84b);
        coin.circle(SLOT / 2, SLOT / 2 - 6, 13).stroke({ color: 0x10141c, width: 2 });
        const amt = new Text({
          text: String(gold.amount),
          style: { fontFamily: "monospace", fontSize: 11, fontWeight: "bold", fill: 0xe8e4d8 },
        });
        amt.resolution = 3;
        amt.anchor.set(0.5);
        amt.position.set(SLOT / 2, SLOT - 12);
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

  /**
   * Desenha o conteúdo visual de um item/pilha num slot: o sprite real
   * (`img/items/<id>.png`) quando há arte aprovada; senão o placeholder de
   * iniciais + nome. Compartilhado pelo render de item e de pilha fungível (a
   * pilha é o mesmo ícone + a contagem por cima — desenhada pelo chamador).
   */
  private drawItemIcon(cell: Container, templateId: string, name: string): void {
    const tex = PIXELLAB.items[templateId];
    if (tex) {
      const spr = new Sprite(tex);
      spr.anchor.set(0.5);
      fitSpriteToSlot(spr, SLOT);
      spr.position.set(SLOT / 2, SLOT / 2);
      spr.eventMode = "none";
      cell.addChild(spr);
      return;
    }
    const label = new Text({
      text: name.slice(0, 2).toUpperCase(),
      style: { fontFamily: "monospace", fontSize: 18, fontWeight: "bold", fill: 0xe8e4d8 },
    });
    label.resolution = 3;
    label.anchor.set(0.5);
    label.position.set(SLOT / 2, SLOT / 2 - 6);
    const nameText = new Text({
      text: name.length > 9 ? name.slice(0, 9) + "…" : name,
      style: { fontFamily: "monospace", fontSize: 8, fill: hex(PAL.attrLabel) },
    });
    nameText.resolution = 3;
    nameText.anchor.set(0.5);
    nameText.position.set(SLOT / 2, SLOT - 11);
    label.eventMode = "none";
    nameText.eventMode = "none";
    cell.addChild(label, nameText);
  }
}

/**
 * Badge de contagem de pilha (estilo Tibia): pílula escura no canto inferior-
 * direito do slot com o número. Sem interação (o slot inteiro é a área de
 * clique/drag).
 */
function stackBadge(count: number): Container {
  const badge = new Container();
  const txt = new Text({
    text: String(count),
    style: { fontFamily: "monospace", fontSize: 11, fontWeight: "bold", fill: 0xe8e4d8 },
  });
  txt.resolution = 3;
  txt.anchor.set(1, 1); // ancorado pelo canto inferior-direito
  const padX = 3;
  const bw = txt.width + padX * 2;
  const bh = txt.height + 2;
  const bx = SLOT - 3; // margem do canto
  const by = SLOT - 3;
  const bg = new Graphics();
  bg.roundRect(bx - bw, by - bh, bw, bh, 3).fill({ color: 0x10141c, alpha: 0.82 });
  bg.roundRect(bx - bw, by - bh, bw, bh, 3).stroke({ color: 0x2c3545, width: 1 });
  txt.position.set(bx - padX, by - 1);
  badge.addChild(bg, txt);
  badge.eventMode = "none";
  return badge;
}
