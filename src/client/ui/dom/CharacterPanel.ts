/**
 * Painel de Personagem — versão DOM (migração da UI jun/2026). Mesma função do
 * Pixi `ui/CharacterPanel.ts`, em HTML+CSS: togglável com C, mostra classe/nível/
 * XP/cap/pontos + os 5 atributos, com botões "+" que enviam `allocateStatPoint`.
 * Vive no overlay `#ui-root` sobre o canvas; o clique é capturado pelo próprio
 * painel (pointer-events:auto) e NÃO vaza pro mundo — sem precisar de hitTest.
 */
import type { PlayerProgressState } from "../../../shared/protocol";
import { ATTRIBUTE_KEYS, type AttributeKey } from "../../../shared/types";
import { makeDomDraggable } from "./draggable";

const ATTR_LABELS: Record<AttributeKey, string> = {
  strength: "Força",
  dexterity: "Destreza",
  intelligence: "Inteligência",
  vitality: "Vitalidade",
  spirit: "Espírito",
};

const CLASS_LABEL: Record<string, string> = {
  knight: "Cavaleiro",
  mage: "Mago",
  rogue: "Ladino",
  priest: "Sacerdote",
  classless: "Sem Classe",
};

export class CharacterPanel {
  private el: HTMLDivElement;
  private summaryEl: HTMLElement;
  private valueEls = {} as Record<AttributeKey, HTMLElement>;
  private plusEls = {} as Record<AttributeKey, HTMLButtonElement>;

  constructor(root: HTMLElement, private onAllocate: (attr: AttributeKey) => void) {
    this.el = document.createElement("div");
    this.el.className = "ui-panel char-panel";
    this.el.style.display = "none";
    this.el.style.left = "16px";
    this.el.style.top = "90px";
    this.el.innerHTML =
      '<div class="ui-header" data-drag>Personagem</div>' +
      '<div class="char-summary"></div>' +
      '<div class="char-attrs"></div>';
    this.summaryEl = this.el.querySelector(".char-summary") as HTMLElement;

    const attrs = this.el.querySelector(".char-attrs") as HTMLElement;
    for (const key of ATTRIBUTE_KEYS) {
      const row = document.createElement("div");
      row.className = "attr-row";
      const label = document.createElement("span");
      label.className = "attr-label";
      label.textContent = ATTR_LABELS[key];
      const value = document.createElement("span");
      value.className = "attr-value";
      value.textContent = "0";
      const plus = document.createElement("button");
      plus.className = "attr-plus";
      plus.type = "button";
      plus.textContent = "+";
      plus.addEventListener("click", () => this.onAllocate(key));
      row.append(label, value, plus);
      attrs.appendChild(row);
      this.valueEls[key] = value;
      this.plusEls[key] = plus;
    }

    root.appendChild(this.el);
    makeDomDraggable(this.el, this.el.querySelector("[data-drag]") as HTMLElement);
  }

  get visible(): boolean {
    return this.el.style.display !== "none";
  }

  toggle(): void {
    this.el.style.display = this.visible ? "none" : "block";
  }

  setProgress(p: PlayerProgressState): void {
    // `xp`/`xpForNextLevel` são TOTAIS cumulativos; mostramos o progresso DENTRO
    // do nível atual (relativo a `xpLevelFloor`, que vem da sim).
    const xpInto = Math.max(0, p.xp - p.xpLevelFloor);
    const xpNeeded = Math.max(0, p.xpForNextLevel - p.xpLevelFloor);
    this.summaryEl.innerHTML =
      `<div class="char-class">${CLASS_LABEL[p.cls] ?? p.cls}</div>` +
      `<div>Nível ${p.level}</div>` +
      `<div>XP ${xpInto} / ${xpNeeded}</div>` +
      `<div>Cap ${p.cap.current} / ${p.cap.max}</div>` +
      `<div>Pontos livres: ${p.freeStatPoints}</div>`;

    const showPlus = p.freeStatPoints > 0;
    for (const key of ATTRIBUTE_KEYS) {
      this.valueEls[key].textContent = `${p.attributes[key]}`;
      const cost = p.statPointCosts[key] ?? 1;
      const affordable = p.freeStatPoints >= cost;
      const plus = this.plusEls[key];
      plus.style.display = showPlus ? "" : "none";
      plus.textContent = cost > 1 ? `+${cost}` : "+";
      plus.disabled = !affordable;
    }
  }

  /** DOM: o layout é CSS (sem reposicionar por screenH). No-op p/ casar com a
   *  interface do Game (que chama resize no startup e no onResize). */
  resize(_screenH: number): void {
    /* sem ação */
  }
}
