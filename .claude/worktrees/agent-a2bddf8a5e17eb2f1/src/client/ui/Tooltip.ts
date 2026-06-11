/**
 * Tooltip de item (hover) — painel pequeno com o nome do item, posicionado
 * acima do slot e preso na tela. Apresentação pura; um por jogo (compartilhado
 * pelos painéis, como o drag&drop). ✏️ stats/flavor entram quando o catálogo de
 * itens for exposto ao client (hoje o snapshot só manda nome + templateId).
 */
import { Container, Graphics, Text } from "pixi.js";
import { UI, uiText } from "./theme";

export class Tooltip {
  readonly container = new Container();
  private bg = new Graphics();
  private label: Text;
  private screenW = 0;
  private screenH = 0;

  constructor() {
    this.container.visible = false;
    this.container.eventMode = "none"; // nunca intercepta ponteiro
    this.label = new Text({ text: "", style: uiText(10, UI.text, "bold") });
    this.label.resolution = 3;
    this.container.addChild(this.bg, this.label);
  }

  resize(w: number, h: number): void {
    this.screenW = w;
    this.screenH = h;
  }

  /** Mostra `name` ancorado ACIMA do retângulo do slot (sx,sy = canto sup-esq). */
  show(name: string, slotX: number, slotY: number, slotSize: number): void {
    this.label.text = name;
    const padX = 8;
    const padY = 4;
    const w = this.label.width + padX * 2;
    const h = this.label.height + padY * 2;
    this.bg.clear();
    this.bg.roundRect(0, 0, w, h, 4).fill({ color: UI.panelBg, alpha: 0.97 });
    this.bg.roundRect(0, 0, w, h, 4).stroke({ color: UI.gold, width: 1, alpha: 0.6 });
    this.label.position.set(padX, padY);
    // acima do slot, centralizado; preso na tela
    let x = slotX + slotSize / 2 - w / 2;
    let y = slotY - h - 6;
    x = Math.max(4, Math.min(this.screenW - w - 4, x));
    if (y < 4) y = slotY + slotSize + 6; // sem espaço acima → embaixo
    y = Math.max(4, Math.min(this.screenH - h - 4, y));
    this.container.position.set(Math.round(x), Math.round(y));
    this.container.visible = true;
  }

  hide(): void {
    this.container.visible = false;
  }
}
