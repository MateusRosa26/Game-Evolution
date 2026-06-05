/**
 * Assets PixelLab (IA + curadoria do criador) — decisão jun/2026: a pixel art
 * de chars/mobs/cenário migra do procedural para PNGs gerados via PixelLab e
 * aprovados na pasta de candidatos. Os PNGs aprovados vivem em `img/` (o
 * .gitignore tem exceção para PNGs dentro de src) e são carregados aqui.
 *
 * Knight (knight3 "soldado comum"): walk cycle de 4 frames por direção via
 * /animate-with-text (frame 0 = idle aproximado). Oeste = flip de leste.
 * O sistema de OUTFITS por peças continua por trás (compositor procedural);
 * este visual o substitui até as peças virarem PNGs (inpaint por zonas).
 */
import { Assets, Texture } from "pixi.js";
import type { Facing } from "../../shared/types";
import tree1Url from "./img/tree1.png";
import tree2Url from "./img/tree2.png";
import e0 from "./img/walk/e0.png";
import e1 from "./img/walk/e1.png";
import e2 from "./img/walk/e2.png";
import e3 from "./img/walk/e3.png";
import n0 from "./img/walk/n0.png";
import n1 from "./img/walk/n1.png";
import n2 from "./img/walk/n2.png";
import n3 from "./img/walk/n3.png";
import s0 from "./img/walk/s0.png";
import s1 from "./img/walk/s1.png";
import s2 from "./img/walk/s2.png";
import s3 from "./img/walk/s3.png";

/**
 * Escala de render dos chars PixelLab: gerados a 64px (qualidade), exibidos
 * a 0.6 (~38px — levemente acima do tile, presença sem desproporção).
 */
export const PIXELLAB_CHAR_SCALE = 0.6;

/** Registry preenchido por loadPixellabAssets() antes do Game nascer. */
export const PIXELLAB: {
  /** Árvores do bioma ATUAL (1 tipo por bioma — coerência). */
  trees: Texture[];
  /** Reserva p/ bioma de pântano (a variação com musgo escorrendo). */
  swampTrees: Texture[];
  /** Texturas do knight por direção (4 frames de walk; 0 = idle). */
  knight: Record<Facing, Texture[]> | null;
} = {
  trees: [],
  swampTrees: [],
  knight: null,
};

/** Flip horizontal de uma textura (oeste = espelho de leste). */
function flipped(tex: Texture): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = tex.width;
  canvas.height = tex.height;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(tex.source.resource as CanvasImageSource, 0, 0);
  return Texture.from(canvas);
}

export async function loadPixellabAssets(): Promise<void> {
  const urls = [tree1Url, tree2Url, s0, s1, s2, s3, e0, e1, e2, e3, n0, n1, n2, n3];
  const tex = await Promise.all(urls.map((u) => Assets.load<Texture>(u)));
  const [t1, t2, ...k] = tex;
  PIXELLAB.trees = [t1];
  PIXELLAB.swampTrees = [t2];
  const east = k.slice(4, 8);
  PIXELLAB.knight = {
    s: k.slice(0, 4),
    e: east,
    n: k.slice(8, 12),
    w: east.map(flipped),
  };
}
