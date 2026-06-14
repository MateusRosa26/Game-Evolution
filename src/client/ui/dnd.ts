/**
 * Drag & drop de ITENS (decidido jun/2026 — UI completa desde o MVP).
 *
 * Apresentação pura: as janelas registram seus slots (área de tela + ItemRef);
 * arrastar de um slot com conteúdo cria um fantasma; soltar sobre outro slot
 * registrado dispara `moveItem(from, to)` — e a SIM valida tudo (distância,
 * posse, tipo). Aqui não existe regra de item nenhuma.
 */
import { Container, Graphics, Text } from "pixi.js";
import type { ItemRef } from "../../shared/protocol";

export interface DropSlot {
  /** Área em coordenadas de TELA (recalculada pelo dono a cada layout). */
  bounds: () => { x: number; y: number; w: number; h: number };
  ref: ItemRef;
}

export class ItemDnD {
  /** Camada do fantasma (screen-space, acima de tudo). */
  readonly ghostLayer = new Container();
  private slots: DropSlot[] = [];
  private drag: { from: ItemRef; ghost: Container } | null = null;

  constructor(
    private onMove: (from: ItemRef, to: ItemRef) => void,
    /** Soltou FORA de qualquer slot (sobre o mundo) — o dono decide (largar no chão). */
    private onDropOutside?: (from: ItemRef, sx: number, sy: number) => void,
  ) {
    this.ghostLayer.eventMode = "none";
  }

  /** Janela registra/atualiza seus slots (substitui os do mesmo dono). */
  setSlots(owner: string, slots: DropSlot[]): void {
    this.slots = this.slots.filter((s) => (s as DropSlot & { owner?: string }).owner !== owner);
    for (const s of slots) (s as DropSlot & { owner?: string }).owner = owner;
    this.slots.push(...slots);
  }

  clearOwner(owner: string): void {
    this.setSlots(owner, []);
  }

  /** Inicia um arrasto a partir de um slot com conteúdo. */
  start(from: ItemRef, label: string, sx: number, sy: number): void {
    this.cancel();
    const ghost = new Container();
    const g = new Graphics();
    g.roundRect(-14, -14, 28, 28, 4).fill({ color: 0x1a1e28, alpha: 0.9 });
    g.roundRect(-14, -14, 28, 28, 4).stroke({ color: 0xc8a84b, width: 1.5 });
    const t = new Text({
      text: label.slice(0, 2).toUpperCase(),
      style: { fontFamily: "monospace", fontSize: 10, fontWeight: "bold", fill: 0xe8e4d8 },
    });
    t.anchor.set(0.5);
    t.resolution = 2;
    ghost.addChild(g, t);
    ghost.position.set(sx, sy);
    this.ghostLayer.addChild(ghost);
    this.drag = { from, ghost };
  }

  move(sx: number, sy: number): void {
    this.drag?.ghost.position.set(sx, sy);
  }

  /** Solta: acha o slot sob o cursor e pede o move (a sim decide). */
  drop(sx: number, sy: number): boolean {
    if (!this.drag) return false;
    const from = this.drag.from;
    this.cancel();
    for (const s of this.slots) {
      const b = s.bounds();
      if (sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h) {
        // soltar no próprio lugar = no-op
        if (JSON.stringify(s.ref) === JSON.stringify(from)) return true;
        this.onMove(from, s.ref);
        return true;
      }
    }
    // Nenhum slot sob o cursor → soltou no mundo: o dono decide (largar no chão).
    this.onDropOutside?.(from, sx, sy);
    return false;
  }

  get dragging(): boolean {
    return this.drag !== null;
  }

  cancel(): void {
    if (this.drag) {
      this.drag.ghost.destroy({ children: true });
      this.drag = null;
    }
  }
}
