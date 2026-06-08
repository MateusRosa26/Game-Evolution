/**
 * Ícones-silhueta dos slots de equipamento (estilo Tibia): desenhados em cinza
 * quando o slot está VAZIO (placeholder do que vai ali) e numa cor "vestida"
 * quando ocupado — sem texto. Silhuetas procedurais simples (régua do diretor:
 * legível em ~36px). Substituíveis por sprites de item reais no futuro.
 */
import { Graphics } from "pixi.js";
import type { EquipSlot } from "../../shared/protocol";

/** Cinza do placeholder (slot vazio) e cor "vestida" (slot ocupado). */
export const SLOT_ICON_EMPTY = 0x39414f;
export const SLOT_ICON_FILLED = 0xbfc6d2;

/** Desenha a silhueta do slot `slot` centrada em (cx, cy) no Graphics `g`. */
export function drawEquipIcon(g: Graphics, slot: EquipSlot, cx: number, cy: number, color: number): void {
  const fill = { color, alpha: 0.9 } as const;
  const line = (w: number) => ({ color, width: w, alpha: 0.9 }) as const;
  switch (slot) {
    case "helmet":
      g.ellipse(cx, cy - 2, 7, 6).fill(fill);
      g.rect(cx - 8, cy + 2.5, 16, 2.5).fill(fill);
      break;
    case "armor":
      g.poly([cx - 8, cy - 6, cx - 3, cy - 8, cx + 3, cy - 8, cx + 8, cy - 6, cx + 6, cy + 7, cx - 6, cy + 7]).fill(fill);
      break;
    case "legs":
      g.rect(cx - 6, cy - 7, 4.5, 14).fill(fill);
      g.rect(cx + 1.5, cy - 7, 4.5, 14).fill(fill);
      break;
    case "boots":
      g.rect(cx - 3.5, cy - 8, 5, 12).fill(fill);
      g.rect(cx - 3.5, cy + 1, 11, 4).fill(fill);
      break;
    case "necklace":
      g.moveTo(cx - 7, cy - 7).lineTo(cx, cy + 1).lineTo(cx + 7, cy - 7).stroke(line(2));
      g.circle(cx, cy + 5, 3).fill(fill);
      break;
    case "ring1":
    case "ring2":
      g.circle(cx, cy + 1, 5.5).stroke(line(2.5));
      g.circle(cx, cy - 6, 2).fill(fill);
      break;
    case "hand1": // arma (espada)
      g.poly([cx - 1.5, cy - 9, cx + 1.5, cy - 9, cx, cy - 12]).fill(fill);
      g.rect(cx - 1.5, cy - 9, 3, 13).fill(fill);
      g.rect(cx - 5, cy + 3, 10, 2.5).fill(fill);
      g.rect(cx - 1, cy + 5, 2, 4).fill(fill);
      g.circle(cx, cy + 9, 2).fill(fill);
      break;
    case "hand2": // escudo
      g.poly([cx - 7, cy - 7, cx + 7, cy - 7, cx + 7, cy - 1, cx, cy + 8, cx - 7, cy - 1]).fill(fill);
      break;
    case "backpack":
      g.roundRect(cx - 7, cy - 7, 14, 6, 3).fill(fill); // tampa
      g.roundRect(cx - 7, cy - 4, 14, 12, 3).fill(fill); // corpo
      break;
    case "utility": // bolsa utilitária
      g.rect(cx - 4, cy - 6, 8, 3).fill(fill); // cordão
      g.roundRect(cx - 6, cy - 3, 12, 11, 4).fill(fill); // bolsa
      break;
  }
}
