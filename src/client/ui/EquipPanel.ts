/**
 * Painel de EQUIPAMENTO (tecla E) — os 11 slots no layout documentado em
 * DESIGN-ITENS.md (espelho do Tibia):
 *
 *   [Colar]      [Capacete]    [Mochila]
 *   [Mão 1]      [Armadura]    [Mão 2]
 *   [Anel 1]     [Calça]       [Anel 2]
 *   [Utilitário] [Botas]
 *
 * Slots são alvos/origens de drag & drop (ItemDnD). Apresentação pura.
 */
import { Container, FederatedPointerEvent, Graphics, Sprite, Text } from "pixi.js";
import type { EntityState, EquipSlot, ItemRef } from "../../shared/protocol";
import { hex, PAL } from "../assets/palette";
import { PIXELLAB } from "../assets/pixellab";
import { makeDraggable } from "./draggable";
import type { ItemDnD } from "./dnd";
import { fitSpriteToSlot, panelFrame, slot } from "./theme";
import { drawEquipIcon, SLOT_ICON_EMPTY, SLOT_ICON_FILLED } from "./slotIcons";
import type { Tooltip } from "./Tooltip";

const SLOT = 48; // reduzido (jun/2026): o equip a 64 ficava grande demais mesmo com UI_SCALE
const ICON_BASE = 36; // silhuetas de slotIcons.ts foram desenhadas p/ ~36px → escala = SLOT/ICON_BASE
const GAP = 8;
const PAD = 12;
const HEADER_H = 24;

const LAYOUT: { slot: EquipSlot; col: number; row: number; label: string }[] = [
  { slot: "necklace", col: 0, row: 0, label: "Colar" },
  { slot: "helmet", col: 1, row: 0, label: "Capacete" },
  { slot: "backpack", col: 2, row: 0, label: "Mochila" },
  { slot: "hand1", col: 0, row: 1, label: "Mão 1" },
  { slot: "armor", col: 1, row: 1, label: "Armadura" },
  { slot: "hand2", col: 2, row: 1, label: "Mão 2" },
  { slot: "ring1", col: 0, row: 2, label: "Anel 1" },
  { slot: "legs", col: 1, row: 2, label: "Calça" },
  { slot: "ring2", col: 2, row: 2, label: "Anel 2" },
  { slot: "utility", col: 0, row: 3, label: "Utilit." },
  { slot: "boots", col: 1, row: 3, label: "Botas" },
];

export class EquipPanel {
  readonly container = new Container();
  private bg = new Graphics();
  private title: Text;
  private slotLayer = new Container();
  private state: EntityState | null = null;
  private userPos: { x: number; y: number } | null = null;
  private screenW = 0;
  /** Minimizado = só a barra de título (estilo Tibia). */
  private collapsed = false;
  private minBtn = new Graphics();

  constructor(
    private dnd: ItemDnD,
    private tooltip: Tooltip,
  ) {
    // Dock fixo à direita (estilo Apogea): sempre visível, embaixo do minimapa.
    this.container.visible = true;
    this.container.addChild(this.bg, this.slotLayer);
    makeDraggable(this.container, HEADER_H, (x, y) => {
      this.userPos = { x, y };
      this.layout();
    });
    this.title = new Text({
      text: "Equipamento",
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

    // Botão de MINIMIZAR (colapsa pra barra estilo Tibia). stopPropagation no
    // pointerdown p/ não iniciar o drag do painel (ambos no header).
    this.minBtn.eventMode = "static";
    this.minBtn.cursor = "pointer";
    const minLabel = new Text({
      text: "—",
      style: { fontFamily: "monospace", fontSize: 13, fontWeight: "bold", fill: hex(PAL.attrLabel), stroke: { color: 0x10141c, width: 2 } },
    });
    minLabel.anchor.set(0.5);
    minLabel.resolution = 3;
    minLabel.eventMode = "none";
    this.minBtn.addChild(minLabel);
    this.minBtn.on("pointerdown", (e) => e.stopPropagation());
    this.minBtn.on("pointertap", (e) => {
      e.stopPropagation();
      this.collapsed = !this.collapsed;
      (this.minBtn.children[0] as Text).text = this.collapsed ? "+" : "—";
      this.layout();
    });
    this.container.addChild(this.minBtn);
  }

  get visible(): boolean {
    return this.container.visible;
  }

  toggle(): void {
    this.container.visible = !this.container.visible;
    if (!this.container.visible) this.dnd.clearOwner("equip");
    this.layout();
  }

  setState(me: EntityState | undefined): void {
    if (!me) return;
    const key = JSON.stringify(me.equipment ?? {});
    const old = JSON.stringify(this.state?.equipment ?? {});
    this.state = me;
    if (this.container.visible && key !== old) this.layout();
  }

  resize(w: number, _h: number): void {
    this.screenW = w;
    if (this.container.visible) this.layout();
  }

  private layout(): void {
    if (!this.container.visible) return;
    const w = PAD * 2 + 3 * SLOT + 2 * GAP;
    const fullH = HEADER_H + PAD + 4 * (SLOT + GAP + 10) + PAD - GAP;
    const h = this.collapsed ? HEADER_H : fullH;
    // default: docado à direita, logo abaixo do minimapa.
    const pos = this.userPos ?? { x: this.screenW - w - 12, y: 216 };
    this.container.position.set(pos.x, pos.y);

    panelFrame(this.bg, w, h);
    this.title.position.set(PAD, HEADER_H / 2);
    this.drawMinBtn(w);

    this.slotLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    // colapsado = só a barra de título: esconde os slots e libera o DnD deles.
    if (this.collapsed) {
      this.dnd.clearOwner("equip");
      return;
    }
    const equip = this.state?.equipment ?? {};
    const dropSlots = [];
    for (const cellDef of LAYOUT) {
      const sx = PAD + cellDef.col * (SLOT + GAP);
      const sy = HEADER_H + PAD + cellDef.row * (SLOT + GAP + 10);
      const item = equip[cellDef.slot];
      const cell = new Graphics();
      slot(cell, 0, 0, SLOT, !!item);
      // Sprite real do item equipado quando houver arte; senão a silhueta do tipo
      // do slot (cinza se vazio, "vestida" se ocupado).
      const tex = item ? PIXELLAB.items[item.templateId] : undefined;
      if (tex) {
        const spr = new Sprite(tex);
        spr.anchor.set(0.5);
        fitSpriteToSlot(spr, SLOT);
        spr.position.set(SLOT / 2, SLOT / 2);
        spr.eventMode = "none";
        cell.addChild(spr);
      } else {
        // silhueta desenhada em Graphics próprio centrado em (0,0) e escalado p/ o slot.
        // Sombra deslocada ATRÁS (dá profundidade/definição) + silhueta por cima —
        // sem isso a forma chapada some no fundo escuro do slot ("apagada").
        const icon = new Graphics();
        drawEquipIcon(icon, cellDef.slot, 0.7, 0.8, 0x090c12);
        drawEquipIcon(icon, cellDef.slot, 0, 0, item ? SLOT_ICON_FILLED : SLOT_ICON_EMPTY);
        icon.scale.set(SLOT / ICON_BASE);
        icon.position.set(SLOT / 2, SLOT / 2);
        icon.eventMode = "none";
        cell.addChild(icon);
      }
      cell.position.set(sx, sy);
      this.slotLayer.addChild(cell);

      const ref: ItemRef = { kind: "equip", slot: cellDef.slot };
      dropSlots.push({
        ref,
        bounds: () => {
          const p = cell.getGlobalPosition();
          return { x: p.x, y: p.y, w: SLOT, h: SLOT };
        },
      });

      if (item) {
        cell.eventMode = "static";
        cell.cursor = "grab";
        cell.on("pointerdown", (ev: FederatedPointerEvent) => {
          ev.stopPropagation();
          this.dnd.start(ref, item.name, ev.global.x, ev.global.y, item.templateId);
        });
        cell.on("pointerover", () => {
          const p = cell.getGlobalPosition();
          this.tooltip.show(item.name, p.x, p.y, SLOT);
        });
        cell.on("pointerout", () => this.tooltip.hide());
      }
    }
    this.dnd.setSlots("equip", dropSlots);
  }

  private drawMinBtn(w: number): void {
    const bs = 16;
    this.minBtn.clear();
    this.minBtn.roundRect(0, 0, bs, bs, 3).fill(hex(PAL.panelHeader));
    this.minBtn.roundRect(0, 0, bs, bs, 3).stroke({ color: hex(PAL.panelBorder), width: 1 });
    this.minBtn.position.set(w - bs - 6, Math.round((HEADER_H - bs) / 2));
    const t = this.minBtn.children[0] as Text | undefined;
    if (t) t.position.set(bs / 2, bs / 2 - 1);
  }

  /** Empurra/puxa o painel SE o topo dele estiver colado na base do minimapa
   *  (gap ≤ TOL) — chamado quando o minimapa redimensiona. Senão não mexe (o
   *  usuário arrastou o equip pra outro lugar). */
  shiftIfDockedAt(minimapBottomBefore: number, minimapBottomAfter: number): void {
    const TOL = 16;
    const gap = this.container.y - minimapBottomBefore;
    if (Math.abs(gap) > TOL) return; // não está colado
    this.userPos = { x: this.container.x, y: minimapBottomAfter + gap };
    this.layout();
  }
}
