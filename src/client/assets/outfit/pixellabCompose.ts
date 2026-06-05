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
 * Classificação ESTÁVEL entre frames (a causa do glitch era o corte de
 * saturação por frame): pixel só recebe tinta se NÃO pertence a um material
 * protegido por MATIZ — capa (vermelhos, mesmo dessaturados nas sombras),
 * madeira do escudo/cabo (marrons saturados) e pele.
 */
function isPaintable(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  const hue = hueOf(r, g, b);
  // capa: qualquer vermelho, até nas sombras dessaturadas
  if ((hue >= 325 || (hue >= 0 && hue <= 25)) && sat >= 0.08) return false;
  // madeira/pele: laranjas-marrons com saturação real
  if (hue >= 15 && hue <= 55 && sat > 0.25) return false;
  // metal: cinza puro ou azul-acinzentado frio
  if (sat <= 0.14) return true;
  if (sat <= 0.32 && hue >= 170 && hue <= 280) return true;
  return false;
}

/** Recolore um frame: zonas × pixels de METAL → ramp da cor do slot. */
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

  for (let y = 0; y < h; y++) {
    const zone = ZONES.find((z) => y >= z.y0 && y < z.y1);
    if (!zone) continue;
    // De COSTAS a capa cobre torso+pernas: só a cabeça (elmo) recebe tinta —
    // pintar "através" da capa era a fonte do glitch malhado no norte.
    if (facing === "n" && zone.slot !== "head") continue;
    const ramp = ramps[zone.slot];
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 60) continue; // transparente
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (Math.max(r, g, b) < 28) continue; // outline/quase-preto fica
      if (!isPaintable(r, g, b)) continue;
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
    result[facing] = base[facing].map((t) => Texture.from(recolorFrame(t, outfit, facing)));
  }
  cache.set(key, result);
  return result;
}
