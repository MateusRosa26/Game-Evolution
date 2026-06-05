/**
 * Compositor de outfits: peças (em sentinelas) → recolor → composição →
 * texturas por facing/frame, com CACHE por combinação (peças × cores são
 * combinatórias demais para pré-gerar; o pipeline procedural gera em ~ms).
 */
import { Texture } from "pixi.js";
import type { Facing } from "../../../shared/types";
import { OUTFIT_COLORS, type OutfitState } from "../../../shared/outfits";
import { PAL } from "../palette";
import { Px } from "../sprites";
import { drawHeldEquipment, PART_DRAW, type PartFacing } from "./parts";
import { OutfitTextureLru } from "./lruCache";
import { recolorCanvas } from "./sentinels";

export type OutfitTextures = Record<Facing, Texture[]>;

// LRU com teto: combinações peças×cores são abertas — sem limite, cada combo
// vira texturas GPU vivas pra sempre (ver lruCache.ts para o caveat de online).
const cache = new OutfitTextureLru(64);

function keyOf(outfit: OutfitState, weaponTemplateId: string | null): string {
  const o = outfit;
  return (
    `${o.head.part}.${o.head.color}|${o.torso.part}.${o.torso.color}|` +
    `${o.legs.part}.${o.legs.color}|${weaponTemplateId ?? "-"}`
  );
}

/** Desenha UMA peça recolorida num canvas próprio (32×32). */
function pieceCanvas(
  partId: string,
  colorIndex: number,
  facing: PartFacing,
  frame: number,
): HTMLCanvasElement {
  const p = new Px(32, 32);
  const draw = PART_DRAW[partId];
  if (draw) draw(p, facing, frame);
  recolorCanvas(p.canvas, OUTFIT_COLORS[colorIndex] ?? OUTFIT_COLORS[4]);
  return p.canvas;
}

/** Compõe um frame completo: pernas → torso → cabeça → equipamento → outline. */
function composeFrame(
  outfit: OutfitState,
  weaponTemplateId: string | null,
  facing: PartFacing,
  frame: number,
): Px {
  const p = new Px(32, 32);
  // ordem de pintura: pernas embaixo, cabeça por cima (gola sobrepõe), equip no topo
  p.ctx.drawImage(pieceCanvas(outfit.legs.part, outfit.legs.color, facing, frame), 0, 0);
  p.ctx.drawImage(pieceCanvas(outfit.torso.part, outfit.torso.color, facing, frame), 0, 0);
  p.ctx.drawImage(pieceCanvas(outfit.head.part, outfit.head.color, facing, frame), 0, 0);
  drawHeldEquipment(p, facing, frame, weaponTemplateId);
  p.outline(PAL.outline);
  return p;
}

/**
 * Texturas do outfit (todas as direções × 3 frames), cacheadas pela
 * combinação completa. `weaponTemplateId` vem do snapshot (`weapon`).
 */
export function outfitTextures(
  outfit: OutfitState,
  weaponTemplateId: string | null,
): OutfitTextures {
  const key = keyOf(outfit, weaponTemplateId);
  const hit = cache.get(key);
  if (hit) return hit;

  const result: Partial<OutfitTextures> = {};
  const eastCanvases: HTMLCanvasElement[] = [];
  for (const facing of ["s", "n", "e"] as const) {
    const frames: Texture[] = [];
    for (let f = 0; f < 3; f++) {
      const p = composeFrame(outfit, weaponTemplateId, facing, f);
      if (facing === "e") eastCanvases.push(p.canvas);
      frames.push(p.texture());
    }
    result[facing] = frames;
  }
  // west = flip de east
  result.w = eastCanvases.map((src) => {
    const p = new Px(32, 32);
    p.ctx.translate(32, 0);
    p.ctx.scale(-1, 1);
    p.ctx.drawImage(src, 0, 0);
    return p.texture();
  });

  const tex = result as OutfitTextures;
  cache.set(key, tex);
  return tex;
}
