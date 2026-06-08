/**
 * PAPER-DOLL — o compositor de identidade visual do personagem (jun/2026).
 *
 * Substitui o tint por máscara (morto — o sprite de IA não tem zonas
 * separáveis; vazava e piscava). Aqui cada PEÇA de outfit é uma CAMADA
 * separada, extraída por /inpaint (zona fixa por corpo, corpo congelado fora
 * dela) — a pergunta "esse pixel é túnica?" nunca é feita em runtime.
 *
 * Composição por visual único (cacheada em LRU):
 *   corpo base → pernas → torso → cabeça   (cada peça tintada pela COR do
 *   slot via LUT de luminância — peça isolada tinge limpo por construção)
 *
 * Mapeamento sim→arte: OUTFIT_PARTS (ids canônicos da sim) → id de peça em
 * img/chars/knight/pieces/<peca>/<dir><frame>.png. Parte sem peça mapeada
 * (ex.: set knight = o próprio corpo base) compõe só o corpo.
 *
 * Online-ready: o servidor só trafega ids+cores (já no protocolo); peças são
 * assets estáticos via CDN; composição client-side 1× por visual (LRU).
 */
import { Texture } from "pixi.js";
import { OUTFIT_COLORS, type OutfitState } from "../../../shared/outfits";
import type { Facing } from "../../../shared/types";
import { PIXELLAB } from "../pixellab";
import { OutfitTextureLru } from "./lruCache";
import { shadeLutFromColor } from "./sentinels";

/** part id (sim) → peça (pasta em img/chars/knight/pieces). null = corpo base. */
const PIECE_BY_PART: Record<string, string | null> = {
  // knight/Alvorada: o corpo base JÁ é este set
  elmo_alvorada: null,
  peitoral_alvorada: null,
  grevas_alvorada: null,
  // rogue
  capuz_sombra: "cabeca-capuz-couro",
  gibao_sombra: "torso-jaqueta-couro",
  calca_sombra: "pernas-calca-couro",
  // citizen (a cara do classless)
  cabeca_cidadao: "cabeca-descoberta",
  camisa_cidadao: "torso-tunica-campones",
  calca_cidadao: "pernas-calca-pano",
  // priest
  coifa_aurora: "cabeca-capuz-couro",
  tunica_aurora: "torso-gambeson",
  saia_aurora: "pernas-calca-pano",
  // mage (chapéu arcano ✏️ aguarda peça própria)
  chapeu_arcano: null,
  robe_arcano: "torso-gambeson",
  saiote_arcano: "pernas-calca-pano",
  // ouro / vigília
  elmo_ouro: "cabeca-chapeu-ferro",
  peitoral_ouro: "torso-cota-de-malha",
  grevas_ouro: "pernas-calca-couro",
  elmo_vigilia: "cabeca-chapeu-ferro",
  peitoral_vigilia: "torso-cota-de-malha",
  grevas_vigilia: "pernas-calca-couro",
};

const cache = new OutfitTextureLru(64);

function readPixels(tex: Texture): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = tex.width;
  canvas.height = tex.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(tex.source.resource as CanvasImageSource, 0, 0);
  return ctx.getImageData(0, 0, tex.width, tex.height);
}

/** Tinge a peça inteira pela LUT de luminância (shading preservado) e compõe. */
function stampTinted(dst: ImageData, piece: Texture, lut: Uint8ClampedArray): void {
  const p = readPixels(piece);
  const d = dst.data;
  const s = p.data;
  for (let i = 0; i < s.length; i += 4) {
    if (s[i + 3] < 60) continue;
    const lum = Math.min(255, Math.round(0.299 * s[i] + 0.587 * s[i + 1] + 0.114 * s[i + 2]));
    d[i] = lut[lum * 3];
    d[i + 1] = lut[lum * 3 + 1];
    d[i + 2] = lut[lum * 3 + 2];
    d[i + 3] = s[i + 3];
  }
}

function composeFrame(base: Texture, layers: { piece: Texture; lut: Uint8ClampedArray }[]): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = base.width;
  canvas.height = base.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(base.source.resource as CanvasImageSource, 0, 0);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (const l of layers) stampTinted(img, l.piece, l.lut);
  ctx.putImageData(img, 0, 0);
  return Texture.from(canvas);
}

function keyOf(o: OutfitState): string {
  return `pd|${o.head.part}.${o.head.color}|${o.torso.part}.${o.torso.color}|${o.legs.part}.${o.legs.color}`;
}

/** Slots na ordem de empilhamento: pernas → torso → cabeça. */
function slotsOf(outfit: OutfitState) {
  return [
    { part: outfit.legs.part, color: outfit.legs.color },
    { part: outfit.torso.part, color: outfit.torso.color },
    { part: outfit.head.part, color: outfit.head.color },
  ];
}

function composeSet(
  base: Record<Facing, Texture[]>,
  pieceSets: Record<string, Record<Facing, Texture[]>>,
  outfit: OutfitState,
): Record<Facing, Texture[]> {
  const slots = slotsOf(outfit);
  const result = {} as Record<Facing, Texture[]>;
  for (const facing of ["s", "e", "n", "w"] as Facing[]) {
    result[facing] = base[facing].map((baseTex, i) => {
      const layers: { piece: Texture; lut: Uint8ClampedArray }[] = [];
      for (const s of slots) {
        const pieceId = PIECE_BY_PART[s.part];
        if (!pieceId) continue;
        // oeste usa a peça do LESTE espelhada já no carregamento (ver pixellab.ts)
        const frames = pieceSets[pieceId]?.[facing];
        if (!frames || !frames[i]) continue;
        layers.push({ piece: frames[i], lut: shadeLutFromColor(OUTFIT_COLORS[s.color] ?? "#777") });
      }
      return layers.length ? composeFrame(baseTex, layers) : baseTex;
    });
  }
  return result;
}

/**
 * Texturas do char com o outfit composto por camadas. Requer PIXELLAB.knight;
 * peças ausentes (não geradas/aprovadas ainda) degradam para o corpo base.
 */
export function paperdollTextures(outfit: OutfitState): Record<Facing, Texture[]> {
  const key = keyOf(outfit);
  const hit = cache.get(key);
  if (hit) return hit;
  const result = composeSet(PIXELLAB.knight!, PIXELLAB.knightPieces, outfit);
  cache.set(key, result);
  return result;
}

const atkCache = new OutfitTextureLru(64);

/**
 * Frames de ATAQUE compostos com as peças do outfit (golpe vestido).
 * Sem PIXELLAB.knightAttack → null (renderer não anima o golpe do char).
 */
export function paperdollAttackTextures(outfit: OutfitState): Record<Facing, Texture[]> | null {
  if (!PIXELLAB.knightAttack) return null;
  const key = `atk|${keyOf(outfit)}`;
  const hit = atkCache.get(key);
  if (hit) return hit;
  const result = composeSet(PIXELLAB.knightAttack, PIXELLAB.knightPiecesAtk, outfit);
  atkCache.set(key, result);
  return result;
}
