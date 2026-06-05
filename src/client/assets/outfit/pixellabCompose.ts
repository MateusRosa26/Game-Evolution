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

/** Zonas verticais no canvas 64×64 (calibradas no knight1). */
const ZONES: { slot: keyof OutfitState; y0: number; y1: number }[] = [
  { slot: "head", y0: 0, y1: 30 },
  { slot: "torso", y0: 30, y1: 47 },
  { slot: "legs", y0: 47, y1: 64 },
];

/** Pixel "metal" = dessaturado o bastante para receber a tinta do slot. */
const SATURATION_CUTOFF = 0.22;

const cache = new Map<string, Record<Facing, Texture[]>>();

function colorKey(o: OutfitState): string {
  return `${o.head.color}|${o.torso.color}|${o.legs.color}`;
}

/** Recolore um frame: zonas × pixels dessaturados → ramp da cor do slot. */
function recolorFrame(src: Texture, outfit: OutfitState): HTMLCanvasElement {
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

  for (let y = 0; y < h; y++) {
    const zone = ZONES.find((z) => y >= z.y0 && y < z.y1);
    if (!zone) continue;
    const ramp = ramps[zone.slot];
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 60) continue; // transparente
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max < 28) continue; // outline/quase-preto fica
      const sat = max === 0 ? 0 : (max - min) / max;
      if (sat > SATURATION_CUTOFF) continue; // capa/madeira/pele ficam
      // luminância → 6 faixas → tom do ramp (preserva o shading original)
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const bin = Math.min(5, Math.floor((lum / 232) * 6));
      const [nr, ng, nb] = ramp[bin];
      d[i] = nr;
      d[i + 1] = ng;
      d[i + 2] = nb;
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
    result[facing] = base[facing].map((t) => Texture.from(recolorFrame(t, outfit)));
  }
  cache.set(key, result);
  return result;
}
