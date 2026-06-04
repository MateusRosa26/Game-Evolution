import { Container, FederatedPointerEvent, Graphics, Text } from "pixi.js";
import {
  OUTFIT_COLORS,
  OUTFIT_PART_BY_ID,
  partsForSlot,
  structuredCloneOutfit,
  type OutfitSlot,
  type OutfitState,
} from "../../shared/outfits";
import { hex, PAL } from "../assets/palette";
import { makeDraggable } from "./draggable";

const SLOT_LABELS: Record<OutfitSlot, string> = {
  head: "Cabeça",
  torso: "Peito",
  legs: "Pernas",
};
const SLOTS: OutfitSlot[] = ["head", "torso", "legs"];

const PANEL_W = 248;
const HEADER_H = 26;
const ROW_H = 30;
const PAD = 14;
// grade de cores: 13 colunas × 8 fileiras de swatches
const SW = 15;
const SW_GAP = 2;
const GRID_COLS = 13;

interface SlotRow {
  label: Text;
  partName: Text;
  prev: Graphics;
  prevText: Text;
  next: Graphics;
  nextText: Text;
  hitArea: Graphics;
}

/**
 * Janela de outfit (togglável com O) — estilo Tibia: peça por slot + cor da
 * grade curada. Mostra SÓ peças possuídas (wardrobe do snapshot); toda
 * mudança envia `setOutfit` (a sim valida posse/cor — aqui ZERO regra).
 */
export class OutfitPanel {
  readonly container = new Container();

  private bg = new Graphics();
  private headerText: Text;
  private hintText: Text;
  private rows: Record<OutfitSlot, SlotRow>;
  private colorGrid = new Graphics();
  private outfit: OutfitState | null = null;
  private wardrobe: string[] = [];
  private selectedSlot: OutfitSlot = "torso";
  private screenW = 0;
  private screenH = 0;
  /** Posição escolhida pelo usuário ao arrastar (null = default à direita). */
  private userPos: { x: number; y: number } | null = null;

  constructor(private onSetOutfit: (outfit: OutfitState) => void) {
    this.container.visible = false;
    this.container.addChild(this.bg);
    makeDraggable(this.container, HEADER_H, (x, y) => {
      this.userPos = { x, y };
    });

    this.headerText = new Text({
      text: "Outfit",
      style: {
        fontFamily: "monospace",
        fontSize: 11,
        fontWeight: "bold",
        fill: hex(PAL.levelGold),
        stroke: { color: 0x10141c, width: 2 },
      },
    });
    this.headerText.resolution = 3;
    this.headerText.anchor.set(0, 0.5);
    this.container.addChild(this.headerText);

    this.hintText = new Text({
      text: "clique no slot p/ escolher a cor",
      style: {
        fontFamily: "monospace",
        fontSize: 7,
        fill: hex(PAL.attrLabel),
        stroke: { color: 0x10141c, width: 2 },
      },
    });
    this.hintText.resolution = 3;
    this.container.addChild(this.hintText);

    this.rows = {} as Record<OutfitSlot, SlotRow>;
    for (const slot of SLOTS) {
      const label = new Text({
        text: SLOT_LABELS[slot],
        style: {
          fontFamily: "monospace",
          fontSize: 9,
          fill: hex(PAL.attrLabel),
          stroke: { color: 0x10141c, width: 2 },
        },
      });
      label.resolution = 3;
      label.anchor.set(0, 0.5);

      const partName = new Text({
        text: "—",
        style: {
          fontFamily: "monospace",
          fontSize: 8,
          fontWeight: "bold",
          fill: hex(PAL.attrValue),
          stroke: { color: 0x10141c, width: 2 },
        },
      });
      partName.resolution = 3;
      partName.anchor.set(0.5, 0.5);

      const mkArrow = (dir: -1 | 1): [Graphics, Text] => {
        const g = new Graphics();
        g.eventMode = "static";
        g.cursor = "pointer";
        g.on("pointertap", () => this.cyclePart(slot, dir));
        const t = new Text({
          text: dir < 0 ? "<" : ">",
          style: { fontFamily: "monospace", fontSize: 11, fontWeight: "bold", fill: 0xeef4e6 },
        });
        t.resolution = 3;
        t.anchor.set(0.5, 0.5);
        t.eventMode = "none";
        return [g, t];
      };
      const [prev, prevText] = mkArrow(-1);
      const [next, nextText] = mkArrow(1);

      // área clicável da linha: seleciona o slot para a grade de cores
      const hitArea = new Graphics();
      hitArea.eventMode = "static";
      hitArea.cursor = "pointer";
      hitArea.on("pointertap", () => {
        this.selectedSlot = slot;
        this.layout();
      });

      this.container.addChild(hitArea, label, partName, prev, prevText, next, nextText);
      this.rows[slot] = { label, partName, prev, prevText, next, nextText, hitArea };
    }

    this.colorGrid.eventMode = "static";
    this.colorGrid.cursor = "pointer";
    this.colorGrid.on("pointertap", (ev: FederatedPointerEvent) => {
      const local = this.colorGrid.toLocal(ev.global);
      const col = Math.floor(local.x / (SW + SW_GAP));
      const row = Math.floor(local.y / (SW + SW_GAP));
      const index = row * GRID_COLS + col;
      if (col < 0 || col >= GRID_COLS || index < 0 || index >= OUTFIT_COLORS.length) return;
      this.applyColor(index);
    });
    this.container.addChild(this.colorGrid);
  }

  get visible(): boolean {
    return this.container.visible;
  }

  toggle(): void {
    this.container.visible = !this.container.visible;
    if (this.container.visible) this.layout();
  }

  /** Alimentado pelo snapshot (outfit atual + guarda-roupa do jogador). */
  setState(outfit: OutfitState | undefined, wardrobe: string[] | undefined): void {
    if (outfit) this.outfit = outfit;
    if (wardrobe) this.wardrobe = wardrobe;
    if (this.container.visible) this.layout();
  }

  resize(screenW: number, screenH: number): void {
    this.screenW = screenW;
    this.screenH = screenH;
    if (this.container.visible) this.layout();
  }

  /** Cicla a peça do slot entre as POSSUÍDAS (apresentação; a sim revalida). */
  private cyclePart(slot: OutfitSlot, dir: -1 | 1): void {
    if (!this.outfit) return;
    const owned = partsForSlot(slot).filter((p) => this.wardrobe.includes(p.id));
    if (owned.length === 0) return;
    const cur = owned.findIndex((p) => p.id === this.outfit![slot].part);
    const next = owned[(cur + dir + owned.length) % owned.length];
    const o = structuredCloneOutfit(this.outfit);
    o[slot] = { part: next.id, color: o[slot].color };
    this.onSetOutfit(o);
  }

  private applyColor(index: number): void {
    if (!this.outfit) return;
    const o = structuredCloneOutfit(this.outfit);
    o[this.selectedSlot] = { part: o[this.selectedSlot].part, color: index };
    this.onSetOutfit(o);
  }

  private layout(): void {
    const rowsTop = HEADER_H + 20;
    const gridRows = Math.ceil(OUTFIT_COLORS.length / GRID_COLS);
    const gridH = gridRows * (SW + SW_GAP);
    const gridTop = rowsTop + SLOTS.length * ROW_H + 10;
    const panelH = gridTop + gridH + PAD;
    // posição do usuário (drag) ou default ancorado à direita (DESIGN-VISUAL)
    const x = this.userPos?.x ?? Math.max(12, this.screenW - PANEL_W - 16);
    const y = this.userPos?.y ?? Math.max(12, (this.screenH - panelH) / 2);
    this.container.position.set(x, y);

    this.bg.clear();
    this.bg.roundRect(0, 0, PANEL_W, panelH, 7).fill({ color: hex(PAL.panelBg), alpha: 0.95 });
    this.bg.roundRect(0, 0, PANEL_W, panelH, 7).stroke({ color: hex(PAL.panelBorder), width: 2 });
    this.bg.roundRect(0, 0, PANEL_W, HEADER_H, 7).fill(hex(PAL.panelHeader));
    this.bg
      .moveTo(PAD, HEADER_H)
      .lineTo(PANEL_W - PAD, HEADER_H)
      .stroke({ color: hex(PAL.panelBorder), width: 1 });

    this.headerText.position.set(PAD, HEADER_H / 2);
    this.hintText.position.set(PAD, HEADER_H + 4);

    for (let i = 0; i < SLOTS.length; i++) {
      const slot = SLOTS[i];
      const row = this.rows[slot];
      const cy = rowsTop + i * ROW_H + ROW_H / 2;
      const selected = slot === this.selectedSlot;

      // fundo da linha (slot selecionado = destacado)
      row.hitArea.clear();
      row.hitArea
        .roundRect(PAD - 6, cy - ROW_H / 2 + 3, PANEL_W - PAD * 2 + 12, ROW_H - 6, 4)
        .fill({ color: selected ? hex(PAL.panelHeader) : 0x000000, alpha: selected ? 1 : 0.001 });
      if (selected) {
        row.hitArea
          .roundRect(PAD - 6, cy - ROW_H / 2 + 3, PANEL_W - PAD * 2 + 12, ROW_H - 6, 4)
          .stroke({ color: hex(PAL.levelGold), width: 1 });
      }

      row.label.position.set(PAD, cy);

      const arrow = 16;
      const prevX = 86;
      const nextX = PANEL_W - PAD - arrow;
      this.drawArrow(row.prev, prevX, cy - arrow / 2, arrow);
      this.drawArrow(row.next, nextX, cy - arrow / 2, arrow);
      row.prevText.position.set(prevX + arrow / 2, cy);
      row.nextText.position.set(nextX + arrow / 2, cy);

      const def = this.outfit ? OUTFIT_PART_BY_ID[this.outfit[slot].part] : undefined;
      row.partName.text = def?.name ?? "—";
      row.partName.position.set((prevX + arrow + nextX) / 2, cy);
      // amostra da cor atual do slot
      if (this.outfit) {
        row.hitArea
          .rect(PAD + 50, cy - 5, 10, 10)
          .fill(OUTFIT_COLORS[this.outfit[slot].color] ?? "#000")
          .rect(PAD + 50, cy - 5, 10, 10)
          .stroke({ color: 0x10141c, width: 1 });
      }
    }

    // grade de cores
    this.colorGrid.position.set(PAD, gridTop);
    this.colorGrid.clear();
    const selColor = this.outfit ? this.outfit[this.selectedSlot].color : -1;
    for (let i = 0; i < OUTFIT_COLORS.length; i++) {
      const cx = (i % GRID_COLS) * (SW + SW_GAP);
      const cyG = Math.floor(i / GRID_COLS) * (SW + SW_GAP);
      this.colorGrid.rect(cx, cyG, SW, SW).fill(OUTFIT_COLORS[i]);
      this.colorGrid
        .rect(cx, cyG, SW, SW)
        .stroke({ color: i === selColor ? hex(PAL.levelGold) : 0x10141c, width: i === selColor ? 2 : 1 });
    }
  }

  private drawArrow(g: Graphics, x: number, y: number, size: number): void {
    g.position.set(x, y);
    g.clear();
    g.roundRect(0, 0, size, size, 3).fill(hex(PAL.btnPlus));
    g.roundRect(0, 0, size, size / 2, 3).fill({ color: hex(PAL.btnPlusLight), alpha: 0.6 });
    g.roundRect(0, 0, size, size, 3).stroke({ color: 0x10141c, width: 1.5 });
  }
}
