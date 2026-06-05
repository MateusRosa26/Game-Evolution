/**
 * Assets PixelLab (IA + curadoria do criador) — decisão jun/2026: a pixel art
 * de chars/mobs/cenário migra do procedural para PNGs gerados via PixelLab e
 * aprovados na pasta de candidatos. Os PNGs aprovados vivem em `img/` (o
 * .gitignore tem exceção para PNGs dentro de src) e são carregados aqui.
 *
 * PREVIEW do knight: por ora 1 frame por direção (sem walk cycle — animação
 * via /animate-with-skeleton é a próxima fase). O sistema de OUTFITS por
 * peças continua por trás (compositor procedural); este preview o substitui
 * visualmente até as peças virarem PNGs (inpaint por zonas — ver memória do
 * pipeline).
 */
import { Assets, Texture } from "pixi.js";
import type { Facing } from "../../shared/types";
import knightEUrl from "./img/knight_e.png";
import knightNUrl from "./img/knight_n.png";
import knightSUrl from "./img/knight_s.png";
import tree1Url from "./img/tree1.png";
import tree2Url from "./img/tree2.png";

/**
 * Escala de render dos chars PixelLab: gerados a 64px (qualidade), exibidos
 * a 0.5 (32px de largura = 1 tile) para manter a proporção do universo.
 */
export const PIXELLAB_CHAR_SCALE = 0.5;

/** Registry preenchido por loadPixellabAssets() antes do Game nascer. */
export const PIXELLAB: {
  /** Árvores do bioma ATUAL (1 tipo por bioma — coerência). */
  trees: Texture[];
  /** Reserva p/ bioma de pântano (a variação com musgo escorrendo). */
  swampTrees: Texture[];
  /** Texturas do knight por direção (1 frame — preview sem walk). */
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
  const [t1, t2, ks, ke, kn] = await Promise.all(
    [tree1Url, tree2Url, knightSUrl, knightEUrl, knightNUrl].map((u) => Assets.load<Texture>(u)),
  );
  PIXELLAB.trees = [t1];
  PIXELLAB.swampTrees = [t2];
  PIXELLAB.knight = {
    s: [ks],
    e: [ke],
    n: [kn],
    w: [flipped(ke)],
  };
}
