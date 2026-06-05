/**
 * Integra o sprite PixelLab do personagem com o sistema de OUTFIT (cores da
 * grade curada por slot).
 *
 * Técnica: recoloração por ZONAS VERTICAIS (cabeça/torso/pernas — o mesmo
 * contrato de slots do catálogo) aplicada SOMENTE aos pixels DESSATURADOS
 * (o metal da armadura). Capa, escudo de madeira, pele e detalhes saturados
 * ficam intactos — são equipamento/assinatura, não tinta.
 *
 * O ramp da cor escolhida vem de rampFromColor (hue-shift automático — as
 * regras de ofício valem para qualquer cor da grade). Mapeamento por
 * luminância em 6 faixas → 6 tons do ramp.
 *
 * TROCA DE PEÇAS entre classes (capuz de rogue no corpo do knight) é fase
 * futura via inpaint por zonas (gerações independentes não alinham pose
 * para corte direto) — ver memória do pipeline.
 */
import { Texture } from "pixi.js";
import { OUTFIT_COLORS, type OutfitState } from "../../../shared/outfits";
import type { Facing } from "../../../shared/types";
import { PIXELLAB } from "../pixellab";
import { rampFromColor } from "./sentinels";

type Box = [x0: number, y0: number, x1: number, y1: number];

/**
 * CAIXAS de pintura por facing/slot, MEDIDAS nos frames do knight1 (debug
 * pixel a pixel). Espada e escudo ficam majoritariamente FORA das caixas;
 * dentro delas a cobertura é contínua (mata os "flecks" que escapavam da
 * classificação por material). De costas só o elmo pinta (capa é capa).
 */
const PAINT_BOXES: Record<string, { slot: keyof OutfitState; boxes: Box[] }[]> = {
  s: [
    { slot: "head", boxes: [[16, 0, 50, 30]] },
    { slot: "torso", boxes: [[10, 30, 28, 46]] },
    { slot: "legs", boxes: [[14, 48, 48, 62]] },
  ],
  e: [
    { slot: "head", boxes: [[16, 0, 46, 30]] },
    { slot: "torso", boxes: [[12, 30, 36, 46]] },
    { slot: "legs", boxes: [[14, 46, 42, 62]] },
  ],
  // oeste = textura espelhada de leste → caixas espelhadas (64 - x)
  w: [
    { slot: "head", boxes: [[18, 0, 48, 30]] },
    { slot: "torso", boxes: [[28, 30, 52, 46]] },
    { slot: "legs", boxes: [[22, 46, 50, 62]] },
  ],
  n: [{ slot: "head", boxes: [[16, 0, 48, 28]] }],
};

const cache = new Map<string, Record<Facing, Texture[]>>();

function colorKey(o: OutfitState): string {
  return `${o.head.color}|${o.torso.color}|${o.legs.color}`;
}

/** Matiz (0–360) de um pixel; -1 para cinza puro. */
function hueOf(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return -1;
  let hh: number;
  if (max === r) hh = ((g - b) / d) % 6;
  else if (max === g) hh = (b - r) / d + 2;
  else hh = (r - g) / d + 4;
  return ((hh * 60) + 360) % 360;
}

/**
 * Proteções DENTRO das caixas (assinaturas que nunca recebem tinta):
 * specular/lâmina (quase-branco), vermelho forte (echarpe/capa) e
 * marrom-madeira/couro saturado (escudo, botas).
 */
function isProtected(r: number, g: number, b: number): boolean {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  // Só specular VERDADEIRO (quase-branco) fica — proteger brilhos médios
  // (lum~190-220, o domo do elmo) deixava uma "bola" prata no meio quando
  // o jogador escolhia cores escuras; o brilho agora é pintado pelo tom
  // claro do próprio ramp (preto vira preto-com-brilho, não preto-com-bola).
  if (lum >= 225) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const hue = hueOf(r, g, b);
  if ((hue >= 325 || (hue >= 0 && hue <= 20)) && sat >= 0.22) return true; // vermelho
  if (hue >= 15 && hue <= 55 && sat >= 0.35) return true; // madeira/couro
  return sat > 0.5; // qualquer cor muito saturada é assinatura, não aço
}

/** Recolore um frame: CAIXAS por facing × pixels não-protegidos → ramp. */
function recolorFrame(src: Texture, outfit: OutfitState, facing: Facing): HTMLCanvasElement {
  const w = src.width;
  const h = src.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(src.source.resource as CanvasImageSource, 0, 0);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  const ramps = {
    head: rampFromColor(OUTFIT_COLORS[outfit.head.color] ?? "#777"),
    torso: rampFromColor(OUTFIT_COLORS[outfit.torso.color] ?? "#777"),
    legs: rampFromColor(OUTFIT_COLORS[outfit.legs.color] ?? "#777"),
  };

  for (const { slot, boxes } of PAINT_BOXES[facing] ?? []) {
    const ramp = ramps[slot];
    for (const [x0, y0, x1, y1] of boxes) {
      for (let y = y0; y < y1 && y < h; y++) {
        for (let x = x0; x < x1 && x < w; x++) {
          const i = (y * w + x) * 4;
          if (d[i + 3] < 60) continue; // transparente
          const r = d[i], g = d[i + 1], b = d[i + 2];
          if (Math.max(r, g, b) < 28) continue; // outline/quase-preto fica
          if (isProtected(r, g, b)) continue;
          // luminância → 6 faixas → tom do ramp (preserva o shading)
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const bin = Math.min(5, Math.floor((lum / 200) * 6));
          const [nr, ng, nb] = ramp[bin];
          d[i] = nr;
          d[i + 1] = ng;
          d[i + 2] = nb;
        }
      }
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/**
 * Texturas do personagem PixelLab com as CORES do outfit aplicadas
 * (cacheadas por combinação de cores). Requer PIXELLAB.knight carregado.
 */
export function pixellabOutfitTextures(outfit: OutfitState): Record<Facing, Texture[]> {
  const key = colorKey(outfit);
  const hit = cache.get(key);
  if (hit) return hit;
  const base = PIXELLAB.knight!;
  const result = {} as Record<Facing, Texture[]>;
  for (const facing of ["s", "n", "e", "w"] as Facing[]) {
    result[facing] = base[facing].map((t) => Texture.from(recolorFrame(t, outfit, facing)));
  }
  cache.set(key, result);
  return result;
}
