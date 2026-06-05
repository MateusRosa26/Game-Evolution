/**
 * Integra o sprite PixelLab do personagem com o sistema de OUTFIT (cores da
 * grade curada por slot) — VIA MÁSCARAS DE TINTURA pré-computadas (decisão
 * com o criador: o "recorte perfeito" estilo canais de outfit do Tibia).
 *
 * As máscaras (img/walk/mask_*.png) são geradas OFFLINE por segmentação
 * pixel-perfeita (flood-fill com os outlines pretos como paredes + correções)
 * e congeladas como assets: R=elmo, G=torso, B=pernas. Runtime = lookup:
 * pixel no canal → ramp da cor do slot (por luminância, preserva o shading).
 * Pixel fora dos canais NUNCA é tingido (lâmina, escudo, capa, pele) —
 * determinístico, sem furos, sem vazamento, para sempre.
 *
 * Equipamento visual (espada/escudo do sprite) acompanha o outfit do corpo —
 * nuance aceita pelo criador (Tibia/Apogea funcionam assim); o equipamento
 * REAL continua sendo o da sim.
 */
import { Texture } from "pixi.js";
import { OUTFIT_COLORS, type OutfitState } from "../../../shared/outfits";
import type { Facing } from "../../../shared/types";
import { PIXELLAB } from "../pixellab";
import { OutfitTextureLru } from "./lruCache";
import { rampFromColor } from "./sentinels";

// LRU com teto: combinações de cores são abertas — sem limite, cada combo
// vira texturas GPU vivas pra sempre (ver lruCache.ts para o caveat de online).
const cache = new OutfitTextureLru(64);

function colorKey(o: OutfitState): string {
  return `${o.head.color}|${o.torso.color}|${o.legs.color}`;
}

/** Lê os pixels de uma textura para um canvas + ImageData. */
function readPixels(tex: Texture): { canvas: HTMLCanvasElement; data: ImageData } {
  const canvas = document.createElement("canvas");
  canvas.width = tex.width;
  canvas.height = tex.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(tex.source.resource as CanvasImageSource, 0, 0);
  return { canvas, data: ctx.getImageData(0, 0, tex.width, tex.height) };
}

/** Recolore um frame guiado pela MÁSCARA (R=head, G=torso, B=legs). */
function recolorFrame(src: Texture, maskTex: Texture, outfit: OutfitState): HTMLCanvasElement {
  const { canvas, data: img } = readPixels(src);
  const { data: mask } = readPixels(maskTex);
  const d = img.data;
  const m = mask.data;

  const ramps = [
    rampFromColor(OUTFIT_COLORS[outfit.head.color] ?? "#777"), // R
    rampFromColor(OUTFIT_COLORS[outfit.torso.color] ?? "#777"), // G
    rampFromColor(OUTFIT_COLORS[outfit.legs.color] ?? "#777"), // B
  ];

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 60) continue;
    const ch = m[i] > 127 ? 0 : m[i + 1] > 127 ? 1 : m[i + 2] > 127 ? 2 : -1;
    if (ch < 0) continue;
    const r = d[i], g = d[i + 1], b = d[i + 2];
    // luminância → 6 faixas → tom do ramp (preserva o shading original)
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const bin = Math.min(5, Math.floor((lum / 200) * 6));
    const [nr, ng, nb] = ramps[ch][bin];
    d[i] = nr;
    d[i + 1] = ng;
    d[i + 2] = nb;
  }
  canvas.getContext("2d")!.putImageData(img, 0, 0);
  return canvas;
}

/**
 * Texturas do personagem PixelLab com as CORES do outfit aplicadas
 * (cacheadas por combinação de cores). Requer knight + knightMasks carregados.
 */
export function pixellabOutfitTextures(outfit: OutfitState): Record<Facing, Texture[]> {
  const key = colorKey(outfit);
  const hit = cache.get(key);
  if (hit) return hit;
  const base = PIXELLAB.knight!;
  const masks = PIXELLAB.knightMasks!;
  const result = {} as Record<Facing, Texture[]>;
  for (const facing of ["s", "n", "e", "w"] as Facing[]) {
    result[facing] = base[facing].map((t, i) =>
      Texture.from(recolorFrame(t, masks[facing][i], outfit)),
    );
  }
  cache.set(key, result);
  return result;
}
