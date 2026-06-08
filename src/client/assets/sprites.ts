import { Texture } from "pixi.js";
import { mulberry32, type Rng } from "../../sim/rng";
import type { Facing } from "../../shared/types";
import { PAL } from "./palette";
import { PIXELLAB } from "./pixellab";

/**
 * Toda a pixel art do jogo é gerada proceduralmente aqui, em canvases
 * offscreen → texturas Pixi. Trocar por assets desenhados no futuro é
 * só trocar a origem das texturas — o resto do jogo não sabe a diferença.
 */

// ──────────────────────────────────────────────────────────────────────
// Helper de desenho pixel a pixel
// ──────────────────────────────────────────────────────────────────────

export class Px {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly w: number;
  readonly h: number;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.canvas = document.createElement("canvas");
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext("2d")!;
  }

  px(x: number, y: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }

  rect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  fill(color: string): void {
    this.rect(0, 0, this.w, this.h, color);
  }

  /** Disco com borda irregular (blobs orgânicos para copas, rochas...). */
  blob(cx: number, cy: number, r: number, color: string, rng: Rng, rough = 1.2): void {
    for (let y = Math.floor(cy - r - 2); y <= cy + r + 2; y++) {
      for (let x = Math.floor(cx - r - 2); x <= cx + r + 2; x++) {
        const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (d <= r + (rng() - 0.5) * rough) this.px(x, y, color);
      }
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: string): void {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.px(x, y, color);
      }
    }
  }

  /** Contorno externo automático: pixel vazio vizinho de pixel opaco. */
  outline(color: string): void {
    const img = this.ctx.getImageData(0, 0, this.w, this.h);
    const a = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < this.w && y < this.h ? img.data[(y * this.w + x) * 4 + 3] : 0;
    const toPaint: [number, number][] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (a(x, y) > 0) continue;
        if (a(x - 1, y) > 60 || a(x + 1, y) > 60 || a(x, y - 1) > 60 || a(x, y + 1) > 60) {
          toPaint.push([x, y]);
        }
      }
    }
    for (const [x, y] of toPaint) this.px(x, y, color);
  }

  texture(): Texture {
    return Texture.from(this.canvas);
  }
}

// ──────────────────────────────────────────────────────────────────────
// Terreno
// ──────────────────────────────────────────────────────────────────────

function makeGrass(seed: number, flowers: boolean): Texture {
  const rng = mulberry32(seed);
  const p = new Px(32, 32);
  p.fill(PAL.grassBase);
  // manchas orgânicas suaves (2x2 / 3x2) em tons próximos — textura sem "chuvisco"
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(rng() * 31);
    const y = Math.floor(rng() * 31);
    const c = rng() < 0.55 ? PAL.grassDark : PAL.grassMid;
    p.rect(x, y, rng() < 0.5 ? 2 : 3, rng() < 0.6 ? 2 : 1, c);
  }
  // pontos de respiro (poucos)
  for (let i = 0; i < 14; i++) {
    p.px(Math.floor(rng() * 32), Math.floor(rng() * 32), rng() < 0.7 ? PAL.grassMid : PAL.grassDark);
  }
  // tufos de capim discretos
  for (let i = 0; i < 5; i++) {
    const x = 2 + Math.floor(rng() * 28);
    const y = 2 + Math.floor(rng() * 28);
    p.px(x, y, PAL.grassLight);
    p.px(x, y + 1, PAL.grassMid);
    if (rng() < 0.4) p.px(x + 1, y, PAL.grassLight);
  }
  if (flowers) {
    for (let i = 0; i < 3; i++) {
      const x = 3 + Math.floor(rng() * 26);
      const y = 3 + Math.floor(rng() * 26);
      p.px(x, y, rng() < 0.5 ? PAL.flowerGold : PAL.flowerWhite);
      p.px(x, y + 1, PAL.grassDark);
    }
  }
  return p.texture();
}

function makeDirt(seed: number): Texture {
  const rng = mulberry32(seed);
  const p = new Px(32, 32);
  p.fill(PAL.dirtBase);
  for (let i = 0; i < 110; i++) {
    const x = Math.floor(rng() * 32);
    const y = Math.floor(rng() * 32);
    const r = rng();
    p.px(x, y, r < 0.4 ? PAL.dirtDark : r < 0.8 ? PAL.dirtMid : PAL.dirtLight);
  }
  // pedrinhas
  for (let i = 0; i < 6; i++) {
    const x = 2 + Math.floor(rng() * 27);
    const y = 2 + Math.floor(rng() * 27);
    p.rect(x, y, 2, 1, PAL.dirtStone);
    p.px(x, y + 1, PAL.dirtDark);
  }
  return p.texture();
}

function makeStoneFloor(seed: number): Texture {
  const rng = mulberry32(seed);
  const p = new Px(32, 32);
  p.fill(PAL.stoneBase);
  // lajotas 16x16 em "running bond"
  for (let row = 0; row < 2; row++) {
    const offset = row % 2 === 0 ? 0 : 8;
    for (let col = -1; col < 3; col++) {
      const x = col * 16 + offset;
      const y = row * 16;
      // variação de tom por lajota (mais contraste entre peças)
      const tone = rng();
      if (tone < 0.3) p.rect(x + 1, y + 1, 15, 15, PAL.stoneMid);
      else if (tone < 0.5) p.rect(x + 1, y + 1, 15, 15, "#3d434e");
      else if (tone > 0.82) p.rect(x + 1, y + 1, 15, 15, "#4c5360");
      // junta + highlight superior
      p.rect(x, y, 16, 1, PAL.stoneDark);
      p.rect(x, y, 1, 16, PAL.stoneDark);
      p.rect(x + 1, y + 1, 14, 1, PAL.stoneLight);
      // canto inferior na sombra (profundidade)
      p.rect(x + 1, y + 15, 15, 1, "#373d47");
    }
  }
  // rachaduras e desgaste
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(rng() * 32);
    const y = Math.floor(rng() * 32);
    p.px(x, y, rng() < 0.5 ? PAL.stoneCrack : PAL.stoneLight);
  }
  return p.texture();
}

function makeBridge(seed: number): Texture {
  const rng = mulberry32(seed);
  const p = new Px(32, 32);
  p.fill(PAL.shieldWood);
  // tábuas horizontais: sulco a cada 8px + highlight no topo de cada tábua
  for (let y = 0; y < 32; y += 8) {
    p.rect(0, y, 32, 1, PAL.shieldWoodDark);
    p.rect(0, y + 1, 32, 1, PAL.shieldWoodLight);
  }
  // veios da madeira (riscos horizontais curtos)
  for (let i = 0; i < 22; i++) {
    const x = Math.floor(rng() * 29);
    const y = Math.floor(rng() * 32);
    if (y % 8 <= 1) continue; // não sujar sulco/highlight
    p.rect(x, y, 2 + Math.floor(rng() * 3), 1, rng() < 0.6 ? PAL.shieldWoodDark : PAL.shieldWoodLight);
  }
  // pregos nas cabeceiras das tábuas
  for (let y = 4; y < 32; y += 8) {
    p.px(2, y, PAL.woodPost);
    p.px(29, y, PAL.woodPost);
  }
  return p.texture();
}

function makeSwamp(seed: number): Texture {
  const rng = mulberry32(seed);
  const p = new Px(32, 32);
  p.fill(PAL.grassDark);
  // poças paradas de água lamacenta
  for (let i = 0; i < 6; i++) {
    const x = Math.floor(rng() * 27);
    const y = Math.floor(rng() * 28);
    const w = 3 + Math.floor(rng() * 3);
    p.rect(x, y, w, 2, PAL.waterDark);
    p.rect(x + 1, y + 1, w - 2, 1, PAL.waterBase);
  }
  // lama e matéria podre
  for (let i = 0; i < 18; i++) {
    const x = Math.floor(rng() * 32);
    const y = Math.floor(rng() * 32);
    p.px(x, y, rng() < 0.5 ? PAL.dirtDark : PAL.grassMid);
  }
  // tufos de junco doentios
  for (let i = 0; i < 4; i++) {
    const x = 2 + Math.floor(rng() * 28);
    const y = 3 + Math.floor(rng() * 26);
    p.px(x, y, PAL.grassMid);
    p.px(x, y - 1, PAL.grassMid);
    p.px(x + 1, y - 2, PAL.grassDark);
  }
  return p.texture();
}

function makeWaterFrames(): Texture[] {
  const frames: Texture[] = [];
  for (let f = 0; f < 3; f++) {
    const p = new Px(32, 32);
    p.fill(PAL.waterBase);
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const w1 = Math.sin((x + y * 2.7 + f * 3.4) * 0.55);
        const w2 = Math.sin((x * 0.8 - y * 1.3 - f * 2.6) * 0.4);
        if (w1 > 0.82) p.px(x, y, PAL.waterMid);
        if (w1 > 0.96) p.px(x, y, PAL.waterLight);
        if (w2 > 0.93 && w1 > 0.4) p.px(x, y, PAL.waterDark);
      }
    }
    // brilhos pontuais
    const rng = mulberry32(900 + f);
    for (let i = 0; i < 4; i++) {
      const x = 2 + Math.floor(rng() * 27);
      const y = 2 + Math.floor(rng() * 27);
      p.rect(x, y, 2, 1, PAL.waterFoam);
    }
    frames.push(p.texture());
  }
  return frames;
}

// ──────────────────────────────────────────────────────────────────────
// Subsolo / dungeon — PLACEHOLDERS procedurais (SISTEMA-ANDARES.md).
// Travam o contrato de TileId; a arte final vem do PixelLab (create-tileset)
// sem mudar os IDs. Reaproveitam a lógica de chão/água/autotile da cidade,
// só parametrizando a paleta — distintos e legíveis, não finais.
// ──────────────────────────────────────────────────────────────────────

interface FloorPal { base: string; mid: string; dark: string; light: string; crack: string; }
interface MurkyPal { base: string; mid: string; dark: string; light: string; foam: string; }
interface DWallPal { top: string; topHi: string; joint: string; face: string; faceHi: string; faceDark: string; accent: string; }

// Chão em lajota "running bond" parametrizado (mesma estrutura do makeStoneFloor).
function makeDungeonFloor(seed: number, pal: FloorPal): Texture {
  const rng = mulberry32(seed);
  const p = new Px(32, 32);
  p.fill(pal.base);
  for (let row = 0; row < 2; row++) {
    const offset = row % 2 === 0 ? 0 : 8;
    for (let col = -1; col < 3; col++) {
      const x = col * 16 + offset;
      const y = row * 16;
      const tone = rng();
      if (tone < 0.35) p.rect(x + 1, y + 1, 15, 15, pal.mid);
      else if (tone > 0.85) p.rect(x + 1, y + 1, 15, 15, pal.light);
      p.rect(x, y, 16, 1, pal.dark);
      p.rect(x, y, 1, 16, pal.dark);
      p.rect(x + 1, y + 1, 14, 1, pal.light);
      p.rect(x + 1, y + 15, 15, 1, pal.dark);
    }
  }
  for (let i = 0; i < 16; i++) p.px(Math.floor(rng() * 32), Math.floor(rng() * 32), rng() < 0.5 ? pal.crack : pal.light);
  return p.texture();
}

// Água "suja" animada parametrizada (mesma onda do makeWaterFrames, cores próprias).
function makeMurkyWaterFrames(pal: MurkyPal): Texture[] {
  const frames: Texture[] = [];
  for (let f = 0; f < 3; f++) {
    const p = new Px(32, 32);
    p.fill(pal.base);
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const w1 = Math.sin((x + y * 2.7 + f * 3.4) * 0.55);
        const w2 = Math.sin((x * 0.8 - y * 1.3 - f * 2.6) * 0.4);
        if (w1 > 0.82) p.px(x, y, pal.mid);
        if (w1 > 0.96) p.px(x, y, pal.light);
        if (w2 > 0.93 && w1 > 0.4) p.px(x, y, pal.dark);
      }
    }
    const rng = mulberry32(1300 + f);
    for (let i = 0; i < 3; i++) p.rect(2 + Math.floor(rng() * 27), 2 + Math.floor(rng() * 27), 2, 1, pal.foam);
    frames.push(p.texture());
  }
  return frames;
}

// Autotile 16-máscaras parametrizado (mesmo contrato de máscara do makeWallTile:
// N=1,E=2,S=4,W=8; topo sempre, face só quando !S, caps onde não há vizinho).
/** hex "#rrggbb" → [r,g,b]. Usado p/ derivar gradiente de luz da paleta. */
function hexRgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

// Parede de subsolo DIMENSIONAL (mesma tese da muralha: face alta 32×54, luz
// direcional topo-claro→base-escura derivada da paleta, AO, sombra de contato).
function makeDungeonWallTile(mask: number, seed: number, pal: DWallPal): Texture {
  const rng = mulberry32(seed + mask * 97 + 1);
  const p = new Px(32, WALL_H);
  const N = (mask & 1) !== 0, E = (mask & 2) !== 0, S = (mask & 4) !== 0, W = (mask & 8) !== 0;
  const OUT = "#070a0f";
  const topEnd = S ? WALL_H : WALL_TOP_H;
  // TOPO
  p.rect(0, 0, 32, topEnd, pal.joint);
  for (let ry = -2; ry < topEnd; ry += 7) {
    const off = ((((ry + 2) / 7) | 0) & 1) === 0 ? 0 : 9;
    for (let rx = -off; rx < 32; rx += 13) {
      const by = ry + 1; if (by >= topEnd) continue;
      const bh = Math.min(6, topEnd - by);
      const bw = 11 + Math.floor(rng() * 3);
      p.rect(rx + 1, by, bw, bh, rng() < 0.3 ? pal.top : pal.topHi);
      p.rect(rx + 1, by, bw, 1, pal.topHi);
      if (ry >= 0) p.rect(rx, ry, bw + 2, 1, pal.joint);
      p.rect(rx, by, 1, bh, pal.joint);
    }
  }
  if (!N) p.rect(0, 1, 32, 2, pal.topHi);
  if (!S) {
    p.rect(0, WALL_TOP_H - 2, 32, 1, pal.faceDark);
    p.rect(0, WALL_TOP_H - 1, 32, 1, OUT);
    // FACE dimensional: gradiente de faceHi (claro, topo) → quase preto (base).
    const [fr, fg, fb] = hexRgb(pal.faceHi);
    const faceTop = WALL_TOP_H, faceBot = WALL_H - 1, faceH = faceBot - faceTop;
    let y = faceTop, courseIdx = 0;
    while (y < faceBot) {
      const rowH = 8 + (rng() < 0.4 ? 1 : 0);
      const yb = Math.min(rowH, faceBot - y);
      const k = 1 - 0.9 * ((y - faceTop) / faceH); // 1 (topo) → 0.1 (base)
      const offset = courseIdx % 2 === 0 ? 0 : 7;
      let x = -offset;
      while (x < 32) {
        const bw = 9 + Math.floor(rng() * 6);
        const v = k * (0.85 + rng() * 0.3);
        const R = Math.max(3, Math.floor(fr * v)), G = Math.max(4, Math.floor(fg * v)), B = Math.max(7, Math.floor(fb * v));
        const col = (a: number) => `rgb(${Math.max(0, R + a - 3)},${Math.max(0, G + a)},${Math.max(0, B + a + 6)})`;
        p.rect(x + 1, y + 1, bw - 1, yb - 1, col(0));
        p.rect(x + 1, y + 1, bw - 1, 1, col(14));        // aresta lit
        p.rect(x + 1, y + yb - 1, bw - 1, 1, col(-8));    // AO na base do bloco
        p.rect(x, y, 1, yb, OUT);
        p.rect(x, y, bw, 1, OUT);
        for (let d = 0; d < 2 + (rng() * 3 | 0); d++) {
          const px = x + 2 + (rng() * Math.max(1, bw - 3) | 0), py = y + 2 + (rng() * Math.max(1, yb - 3) | 0);
          p.px(px, py, rng() < 0.5 ? col(-6) : col(8));
        }
        x += bw;
      }
      y += rowH; courseIdx++;
    }
    p.rect(0, WALL_H - 3, 32, 3, "rgba(0,0,0,0.45)");
    p.rect(0, WALL_H - 1, 32, 1, "rgba(0,0,0,0.30)");
  }
  // nuance de identidade (musgo do esgoto / ocre da alvenaria antiga / caverna)
  if (rng() < 0.5) {
    const ax = Math.floor(rng() * 28);
    const ay = S ? Math.floor(rng() * 46) : WALL_TOP_H + Math.floor(rng() * (WALL_H - WALL_TOP_H - 4));
    for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) if (rng() < 0.6) p.px(ax + dx, ay + dy, pal.accent);
  }
  if (!W) { p.rect(0, 0, 1, WALL_H, OUT); p.rect(1, 0, 1, topEnd, pal.joint); }
  if (!E) { p.rect(31, 0, 1, WALL_H, OUT); p.rect(30, 0, 1, topEnd, pal.joint); }
  if (!N) p.rect(0, 0, 32, 1, OUT);
  return p.texture();
}

function makeDungeonWallTiles(seed: number, pal: DWallPal): Texture[][] {
  const out: Texture[][] = [];
  for (let m = 0; m < 16; m++) out.push([makeDungeonWallTile(m, seed, pal), makeDungeonWallTile(m, seed + 1000, pal)]);
  return out;
}

// Paletas de placeholder (frias/dessaturadas; identidades distintas p/ leitura de layout).
const SEWER_FLOOR_PAL: FloorPal = { base: "#2b3431", mid: "#36423e", dark: "#1a211f", light: "#46544f", crack: "#222b28" };
const CAVE_FLOOR_PAL: FloorPal = { base: "#352f28", mid: "#413a30", dark: "#1f1b15", light: "#4d4536", crack: "#261f17" };
const SEWAGE_PAL: MurkyPal = { base: "#313722", mid: "#424a2e", dark: "#20251a", light: "#525a38", foam: "#67714a" };
const DEEPWATER_PAL: MurkyPal = { base: "#131e29", mid: "#1c2c3a", dark: "#0a1018", light: "#284058", foam: "#34526b" };
const SEWER_WALL_PAL: DWallPal = { top: "#3a4642", topHi: "#4a5a54", joint: "#232c29", face: "#2a332f", faceHi: "#3a4641", faceDark: "#1c2320", accent: "#38502f" };
const OLD_MASONRY_PAL: DWallPal = { top: "#4a463a", topHi: "#5c5746", joint: "#2c281f", face: "#3a372e", faceHi: "#4a463a", faceDark: "#25221b", accent: "#6a6450" };
const CAVE_WALL_PAL: DWallPal = { top: "#3d362c", topHi: "#4c4435", joint: "#221d16", face: "#2e2a22", faceHi: "#3d362c", faceDark: "#1d1913", accent: "#4a3f2c" };

// ──────────────────────────────────────────────────────────────────────
// Objetos do mundo
// ──────────────────────────────────────────────────────────────────────

function makeTree(seed: number): Texture {
  const rng = mulberry32(seed);
  const p = new Px(32, 64);
  // sombra no chão
  p.ellipse(16, 57, 11, 4, "rgba(0,0,0,0.30)");
  // tronco
  p.rect(13, 38, 6, 18, PAL.trunkBase);
  p.rect(13, 38, 2, 18, PAL.trunkLight);
  p.rect(12, 52, 8, 4, PAL.trunkBase);
  p.px(11, 55, PAL.trunkDark);
  p.px(20, 55, PAL.trunkDark);
  for (let i = 0; i < 6; i++) {
    p.px(14 + Math.floor(rng() * 4), 40 + Math.floor(rng() * 14), PAL.trunkDark);
  }
  // copa — camadas de blobs (escuro → claro, luz vindo de cima/esquerda)
  p.blob(16, 30, 9, PAL.canopyDark, rng);
  p.blob(9, 25, 7, PAL.canopyDark, rng);
  p.blob(23, 25, 7, PAL.canopyDark, rng);
  p.blob(16, 18, 9, PAL.canopyDark, rng);
  p.blob(15, 17, 8, PAL.canopyBase, rng);
  p.blob(10, 24, 5, PAL.canopyBase, rng);
  p.blob(22, 23, 5, PAL.canopyBase, rng);
  p.blob(13, 15, 6, PAL.canopyMid, rng);
  p.blob(11, 21, 3, PAL.canopyMid, rng);
  p.blob(12, 13, 4, PAL.canopyLight, rng);
  for (let i = 0; i < 10; i++) {
    const x = 6 + Math.floor(rng() * 16);
    const y = 9 + Math.floor(rng() * 14);
    p.px(x, y, PAL.canopyGlint);
  }
  p.outline(PAL.outline);
  return p.texture();
}

function makeRock(seed: number): Texture {
  const rng = mulberry32(seed);
  const p = new Px(32, 32);
  p.ellipse(16, 27, 9, 3, "rgba(0,0,0,0.30)");
  p.blob(16, 20, 8, PAL.rockBase, rng);
  p.blob(15, 18, 7, PAL.rockMid, rng);
  p.blob(13, 15, 4, PAL.rockTop, rng);
  // rachaduras
  for (let i = 0; i < 5; i++) {
    p.px(10 + Math.floor(rng() * 12), 14 + Math.floor(rng() * 10), PAL.stoneCrack);
  }
  p.outline(PAL.outline);
  return p.texture();
}

/**
 * Muralha AUTOTILE (estilo Tibia). 16 peças indexadas por máscara de vizinhos
 * que TAMBÉM são muro: bit N=1, E=2, S=4, W=8.
 *
 * Modelo: a parede sempre desenha o TOPO (superfície vista de cima); a FACE
 * frontal só aparece quando NÃO há muro ao sul (senão ela fica oculta pelo muro
 * da frente). Assim uma coluna vertical mostra topos empilhados e a face só na
 * base; um run horizontal mostra topo+face contínuos. Caps de contorno onde não
 * há vizinho (W/E/N) fecham o fim do muro. Tudo dessaturado e frio (tintável
 * por cidade depois, via LUT).
 */
// Altura do tile de muro (32×54): face ALTA pra dar volume (estilo Apogea/Tibia).
const WALL_H = 54;
const WALL_TOP_H = 14; // espessura do topo visto de cima
function makeWallTile(mask: number, seed: number): Texture {
  const rng = mulberry32(seed + mask * 97 + 1);
  const p = new Px(32, WALL_H);
  const N = (mask & 1) !== 0;
  const E = (mask & 2) !== 0;
  const S = (mask & 4) !== 0;
  const W = (mask & 8) !== 0;
  const OUT = "#080b10";

  // TOPO em pedra cortada (cobble): se há muro ao sul o topo desce até embaixo
  // (face oculta pelo muro da frente); senão topo fino + face ALTA.
  const topEnd = S ? WALL_H : WALL_TOP_H;
  p.rect(0, 0, 32, topEnd, "#39414d"); // argamassa/fundo escuro
  const TB: [string, string][] = [["#454f5d", "#5a6676"], ["#4c5868", "#606d7e"], ["#404a58", "#525e6e"]];
  const JOINT = "#262c34";
  for (let ry = -2; ry < topEnd; ry += 7) {
    const off = ((((ry + 2) / 7) | 0) & 1) === 0 ? 0 : 9;
    for (let rx = -off; rx < 32; rx += 13) {
      const [fill, hi] = TB[Math.floor(rng() * TB.length)];
      const bw = 11 + Math.floor(rng() * 3);
      const by = ry + 1; if (by >= topEnd) continue;
      const bh = Math.min(6, topEnd - by);
      p.rect(rx + 1, by, bw, bh, fill);
      p.rect(rx + 1, by, bw, 1, hi);
      if (ry >= 0) p.rect(rx, ry, bw + 2, 1, JOINT);
      p.rect(rx, by, 1, bh, JOINT);
      if (bh > 2 && rng() < 0.22) p.px(rx + 2 + Math.floor(rng() * Math.max(1, bw - 2)), by + 1 + Math.floor(rng() * (bh - 1)), JOINT);
    }
  }
  // lip de luz na borda NORTE só se for borda externa (topo pega a luz)
  if (!N) p.rect(0, 1, 32, 2, PAL.wallTopLight);

  if (!S) {
    // separação topo → face (sombra projetada do topo sobre a face = AO no alto)
    p.rect(0, WALL_TOP_H - 2, 32, 1, "#171b22");
    p.rect(0, WALL_TOP_H - 1, 32, 1, "#0b0e13");
    // FACE em fiadas de cantaria com LUZ DIRECIONAL dramática: alto da face
    // recebe luz (logo abaixo do topo) e ESCURECE até quase preto na base —
    // é isso que dá VOLUME de parede alta. Blocos de larguras orgânicas.
    const faceTop = WALL_TOP_H, faceBot = WALL_H - 1;
    const faceH = faceBot - faceTop;
    let y = faceTop;
    let courseIdx = 0;
    while (y < faceBot) {
      const rowH = 8 + (rng() < 0.4 ? 1 : 0);
      const yb = Math.min(rowH, faceBot - y);
      // gradiente vertical: t=0 no alto (claro) → t=1 na base (escuro)
      const t = (y - faceTop) / faceH;
      const lum = 58 - 50 * t; // 58 → 8 (quase preto na base)
      const offset = courseIdx % 2 === 0 ? 0 : 7;
      let x = -offset;
      while (x < 32) {
        const bw = 9 + Math.floor(rng() * 6); // blocos de tamanhos VARIADOS (orgânico)
        const v = lum * (0.86 + rng() * 0.28); // variação por bloco
        const base = Math.max(5, Math.floor(v));
        const col = (a: number) => `rgb(${Math.max(0, base + a - 4)},${Math.max(0, base + a)},${Math.max(0, base + a + 8)})`; // frio
        p.rect(x + 1, y + 1, bw - 1, yb - 1, col(0));
        p.rect(x + 1, y + 1, bw - 1, 1, col(11));          // aresta lit no topo do bloco
        p.rect(x + 1, y + yb - 1, bw - 1, 1, col(-7));      // base do bloco em sombra (AO)
        p.rect(x, y, 1, yb, "#0a0d13");                     // junta vertical (esquerda)
        p.rect(x, y, bw, 1, "#0a0d13");                     // junta horizontal (topo)
        // textura/dithering interno
        for (let d = 0; d < 2 + (rng() * 3 | 0); d++) {
          const px = x + 2 + (rng() * Math.max(1, bw - 3) | 0), py = y + 2 + (rng() * Math.max(1, yb - 3) | 0);
          p.px(px, py, rng() < 0.5 ? col(-5) : col(6));
        }
        x += bw;
      }
      y += rowH; courseIdx++;
    }
    // sombra de contato funda na base (encontro com o chão)
    p.rect(0, WALL_H - 3, 32, 3, "rgba(0,0,0,0.45)");
    p.rect(0, WALL_H - 1, 32, 1, "rgba(0,0,0,0.30)");
  }

  // ── NUANCE: musgo frio (junta do topo e base da face) + rachadura ──
  const MOSS = ["#2c3a2b", "#384a36", "#243527"];
  if (rng() < 0.5) {
    const spots = 1 + Math.floor(rng() * 3);
    for (let k = 0; k < spots; k++) {
      const mx = Math.floor(rng() * 28);
      const my = S ? Math.floor(rng() * 38) : WALL_TOP_H + 2 + Math.floor(rng() * (WALL_H - WALL_TOP_H - 6));
      const ch = 2 + Math.floor(rng() * 2), cw = 2 + Math.floor(rng() * 3);
      for (let dy = 0; dy < ch; dy++) for (let dx = 0; dx < cw; dx++) if (rng() < 0.6) p.px(mx + dx, my + dy, MOSS[Math.floor(rng() * MOSS.length)]);
    }
  }
  if (!S && rng() < 0.4) { // rachadura descendo a face
    let cx = 5 + Math.floor(rng() * 22), cy = WALL_TOP_H + 2;
    const len = 8 + Math.floor(rng() * 12);
    for (let s = 0; s < len && cy < WALL_H - 3; s++) { p.px(cx, cy, "#070a0f"); if (rng() < 0.4) p.px(cx + 1, cy, "#070a0f"); cy++; cx += Math.floor(rng() * 3) - 1; }
  }

  // CAPS onde não há vizinho — fecham o fim do muro
  if (!W) { p.rect(0, 0, 1, WALL_H, OUT); p.rect(1, 0, 1, topEnd, "#39414d"); }
  if (!E) { p.rect(31, 0, 1, WALL_H, OUT); p.rect(30, 0, 1, topEnd, "#39414d"); }
  if (!N) p.rect(0, 0, 32, 1, OUT);

  return p.texture();
}

/** 16 máscaras × 3 variantes (musgo/rachadura/blocos diferentes por seed). */
function makeWallTiles(): Texture[][] {
  const out: Texture[][] = [];
  for (let m = 0; m < 16; m++) out.push([makeWallTile(m, 500), makeWallTile(m, 1500), makeWallTile(m, 2500)]);
  return out;
}

/**
 * Portão da muralha (procedural, casa com makeWallTile): lintel de pedra (mesmo
 * cobble) + postes de pedra nas laterais + porta de madeira reforçada com ferro.
 * `wTiles` de largura; anchor bottom como o muro (32×48 por tile).
 */
function makeGate(wTiles: number, seed: number): Texture {
  const rng = mulberry32(seed);
  const W = wTiles * 32, H = 48;
  const p = new Px(W, H);
  const OUT = "#10141c", POST = 9;
  const TB: [string, string][] = [["#414956", "#525c6a"], ["#485160", "#586473"], ["#3d4450", "#4b5563"]];
  // LINTEL de pedra no topo (full width)
  p.rect(0, 0, W, 14, "#3b424e");
  for (let ry = -2; ry < 14; ry += 7) for (let rx = -((((ry + 2) / 7) | 0) & 1 ? 9 : 0); rx < W; rx += 13) {
    const [fill, hi] = TB[Math.floor(rng() * TB.length)]; const bw = 11 + Math.floor(rng() * 3); const by = ry + 1; if (by >= 14) continue; const bh = Math.min(6, 14 - by);
    p.rect(rx + 1, by, bw, bh, fill); p.rect(rx + 1, by, bw, 1, hi); if (ry >= 0) p.rect(rx, ry, bw + 2, 1, "#2f3640"); p.rect(rx, by, 1, bh, "#2f3640");
  }
  p.rect(0, 13, W, 1, "#0c0f15");
  // POSTES de pedra (faces escuras) nas laterais
  for (const px0 of [0, W - POST]) for (let row = 0; row < 4; row++) {
    const y = 14 + row * 8, base = Math.floor(46 * (1 - row * 0.16));
    p.rect(px0, y, POST, 8, `rgb(${base},${base + 6},${base + 15})`);
    p.rect(px0, y, POST, 1, `rgb(${base + 10},${base + 16},${base + 26})`);
    p.rect(px0, y, POST, 1, "#0c0f15");
  }
  // PORTA de madeira reforçada (entre os postes)
  const dx0 = POST, dw = W - POST * 2, mid = dx0 + (dw >> 1);
  p.rect(dx0, 14, dw, H - 14, "#3b2c1f");
  for (let x = dx0; x < dx0 + dw; x += 5) p.rect(x, 14, 1, H - 14, x % 2 ? "#2a1e14" : "#4c3a29");
  for (const by of [20, 34]) { p.rect(dx0, by, dw, 3, "#23262d"); for (let x = dx0 + 2; x < dx0 + dw; x += 6) { p.px(x, by, "#3a3f48"); p.px(x, by + 2, "#15171c"); } }
  p.rect(mid, 14, 1, H - 14, "#1a130c");
  for (const dxr of [-5, -4, 4, 5]) p.px(mid + dxr, 28, "#23262d");
  p.rect(0, 14, dx0, 1, "#0c0f15"); p.rect(W - POST, 14, 1, H - 14, "#0c0f15");
  // contorno e sombra
  p.rect(0, 0, 1, H, OUT); p.rect(W - 1, 0, 1, H, OUT); p.rect(0, 0, W, 1, OUT); p.rect(0, H - 3, W, 3, "rgba(0,0,0,0.4)");
  return p.texture();
}

/**
 * Parede de ENXAIMEL (taipa + vigas) para casas — autotile, modular. Diferente
 * da muralha: a casa é um cômodo, então TODA parede mostra a face de taipa
 * (não só o sul). `feature`: "window" | "door" | null. mask N=1,E=2,S=4,W=8.
 */
function makeHouseWallTile(mask: number, seed: number, feature: "window" | "door" | null): Texture {
  const rng = mulberry32(seed + mask * 31 + 1);
  const p = new Px(32, 44);
  const N = (mask & 1) !== 0, W = (mask & 8) !== 0, E = (mask & 2) !== 0;
  const PLA = [PAL.plasterDark, PAL.plasterBase, PAL.plasterLight];
  const BEAM = PAL.woodPost, BEAML = PAL.woodPostLight, BEAMD = PAL.trunkDark, OUT = "#10141c";
  const TOPH = 7;
  // viga superior fina (frechal visto de cima)
  p.rect(0, 0, 32, TOPH, BEAM);
  for (let i = 0; i < 10; i++) p.px(Math.floor(rng() * 32), Math.floor(rng() * TOPH), rng() < 0.5 ? BEAML : BEAMD);
  if (!N) p.rect(0, 1, 32, 1, BEAML);
  // FACE de taipa SEMPRE (enquadrada por vigas)
  for (let y = TOPH; y < 44; y++) for (let x = 0; x < 32; x++) p.px(x, y, PLA[Math.floor(rng() * PLA.length)]);
  p.rect(0, TOPH, 32, 3, BEAM); p.rect(0, TOPH, 32, 1, BEAML);
  p.rect(0, 40, 32, 4, BEAM); p.rect(0, 40, 32, 1, BEAMD);
  for (const sx of [0, 14, 29]) { p.rect(sx, TOPH, 3, 44 - TOPH, BEAM); p.rect(sx, TOPH, 1, 44 - TOPH, BEAML); }
  if (feature === "window") {
    p.rect(9, 16, 14, 16, "#1a2026"); p.rect(9, 16, 14, 1, "#0d1116");
    p.rect(8, 15, 16, 1, BEAM); p.rect(8, 32, 16, 1, BEAM); p.rect(8, 15, 1, 18, BEAM); p.rect(23, 15, 1, 18, BEAM);
    p.rect(15, 16, 1, 16, BEAM); p.rect(9, 23, 14, 1, BEAM);
    p.px(11, 18, "#39505e"); p.px(12, 18, "#39505e"); p.px(18, 18, "#39505e");
  } else if (feature === "door") {
    p.rect(9, 12, 14, 32, BEAM);
    for (let x = 10; x < 23; x += 3) p.rect(x, 13, 1, 30, x % 2 ? BEAMD : BEAML);
    p.rect(9, 20, 14, 2, BEAMD); p.rect(9, 34, 14, 2, BEAMD);
    p.px(20, 29, "#caa64a"); p.px(20, 30, "#8d7330");
  }
  p.rect(0, 38, 32, 2, "rgba(0,0,0,0.18)");
  p.rect(0, 41, 32, 3, "rgba(0,0,0,0.35)");
  if (!W) { p.rect(0, 0, 2, 44, BEAMD); p.rect(0, 0, 1, 44, OUT); }
  if (!E) { p.rect(30, 0, 2, 44, BEAMD); p.rect(31, 0, 1, 44, OUT); }
  if (!N) p.rect(0, 0, 32, 1, OUT);
  return p.texture();
}

/** 16 máscaras × 3 variantes de parede de enxaimel (sem feature). */
function makeHouseWalls(): Texture[][] {
  const out: Texture[][] = [];
  for (let m = 0; m < 16; m++) out.push([makeHouseWallTile(m, 700, null), makeHouseWallTile(m, 1700, null), makeHouseWallTile(m, 2700, null)]);
  return out;
}

function makeTorchFrames(): Texture[] {
  const frames: Texture[] = [];
  for (let f = 0; f < 3; f++) {
    const rng = mulberry32(500 + f * 7);
    const p = new Px(32, 40);
    // base de pedra
    p.rect(13, 35, 7, 3, PAL.stoneMid);
    p.rect(13, 35, 7, 1, PAL.stoneLight);
    // poste
    p.rect(15, 14, 3, 22, PAL.woodPost);
    p.rect(15, 14, 1, 22, PAL.woodPostLight);
    // braçadeira
    p.rect(14, 14, 5, 2, PAL.metal);
    // chama (oscila por frame)
    const fx = 16 + (f === 1 ? -1 : f === 2 ? 1 : 0);
    const h = f === 1 ? 9 : 8;
    p.ellipse(fx, 9, 3, Math.floor(h / 2) + 1, PAL.flameEdge);
    p.ellipse(fx, 10, 2, 3, PAL.flameBody);
    p.rect(fx - 1, 9, 2, 3, PAL.flameCore);
    // faíscas
    for (let i = 0; i < 2; i++) {
      p.px(fx - 3 + Math.floor(rng() * 6), 3 + Math.floor(rng() * 4), PAL.flameBody);
    }
    p.outline(PAL.outline);
    frames.push(p.texture());
  }
  return frames;
}

// ──────────────────────────────────────────────────────────────────────
// Rato Lanhoso — família Bestial, T1 ("o primeiro sangue do jogador")
// 4 direções × 3 frames, mesmo contrato visual do cavaleiro.
// ──────────────────────────────────────────────────────────────────────

/**
 * Bicho pequeno e baixo no chão. frame 0 = parado; 1/2 = patas alternadas
 * (correria). Desenhado de frente (s), costas (n) e perfil (e); oeste = flip.
 */
function drawRat(p: Px, facing: Exclude<Facing, "w">, frame: number, rng: Rng): void {
  // corre baixinho: leve bob vertical
  const bob = frame === 0 ? 0 : frame === 1 ? -1 : 0;
  const cy = 22 + bob; // centro do corpo, perto do chão

  if (facing === "e") {
    // ── perfil ──
    // cauda fina atrás
    p.rect(7, cy, 4, 1, PAL.ratTail);
    p.px(6, cy - 1, PAL.ratTail);
    p.px(5, cy - 2, PAL.ratTail);
    // corpo (elipse achatada)
    p.ellipse(16, cy, 7, 4, PAL.ratBase);
    p.ellipse(16, cy - 1, 6, 3, PAL.ratMid);
    p.rect(13, cy - 2, 5, 1, PAL.ratLight);
    p.rect(13, cy + 2, 8, 1, PAL.ratBelly);
    // patas (alternadas)
    const f1 = frame === 1 ? 1 : 0;
    const f2 = frame === 2 ? 1 : 0;
    p.rect(12, cy + 3 + f1, 2, 2, PAL.ratBase);
    p.rect(19, cy + 3 + f2, 2, 2, PAL.ratBase);
    // cabeça à frente, focinho
    p.ellipse(23, cy, 4, 3, PAL.ratMid);
    p.px(26, cy, PAL.ratBelly); // focinho
    p.px(27, cy, PAL.outline); // narina
    p.rect(21, cy - 4, 2, 2, PAL.ratEar); // orelha
    p.px(24, cy - 1, PAL.ratEye); // olho
    return;
  }

  if (facing === "s") {
    // ── de frente: cabeça grande, orelhas, corpo atrás ──
    p.ellipse(16, cy + 1, 6, 4, PAL.ratBase);
    p.rect(11, cy + 3, 10, 1, PAL.ratBelly);
    // cabeça
    p.ellipse(16, cy - 3, 5, 4, PAL.ratMid);
    p.ellipse(16, cy - 4, 4, 3, PAL.ratLight);
    // orelhas
    p.rect(11, cy - 7, 3, 3, PAL.ratEar);
    p.rect(18, cy - 7, 3, 3, PAL.ratEar);
    p.px(12, cy - 6, PAL.ratBelly);
    p.px(19, cy - 6, PAL.ratBelly);
    // olhos + focinho
    p.px(14, cy - 3, PAL.ratEye);
    p.px(18, cy - 3, PAL.ratEye);
    p.px(16, cy - 1, PAL.outline);
    // patinhas alternadas
    const f1 = frame === 1 ? 1 : 0;
    const f2 = frame === 2 ? 1 : 0;
    p.rect(12, cy + 4 - f1, 2, 2, PAL.ratBase);
    p.rect(18, cy + 4 - f2, 2, 2, PAL.ratBase);
    return;
  }

  // ── NORTH (costas): corpo + cauda subindo, orelhas por trás ──
  p.ellipse(16, cy, 6, 4, PAL.ratBase);
  p.ellipse(16, cy - 1, 6, 3, PAL.ratMid);
  p.rect(11, cy - 3, 10, 1, PAL.ratLight);
  // orelhas
  p.rect(11, cy - 6, 3, 3, PAL.ratEar);
  p.rect(18, cy - 6, 3, 3, PAL.ratEar);
  // cauda subindo
  p.px(16, cy + 4, PAL.ratTail);
  p.px(17, cy + 5, PAL.ratTail);
  p.px(18, cy + 6, PAL.ratTail);
  const f1 = frame === 1 ? 1 : 0;
  const f2 = frame === 2 ? 1 : 0;
  p.rect(12, cy + 3 - f1, 2, 2, PAL.ratBase);
  p.rect(18, cy + 3 - f2, 2, 2, PAL.ratBase);
  // pelos eriçados ("lanhoso")
  for (let i = 0; i < 4; i++) p.px(12 + Math.floor(rng() * 9), cy - 4 - Math.floor(rng() * 2), PAL.ratLight);
}

function makeRatTextures(): Record<Facing, Texture[]> {
  const result: Partial<Record<Facing, Texture[]>> = {};
  const eastCanvases: HTMLCanvasElement[] = [];
  for (const facing of ["s", "n", "e"] as const) {
    const frames: Texture[] = [];
    for (let f = 0; f < 3; f++) {
      const rng = mulberry32(700 + f);
      const p = new Px(32, 32);
      drawRat(p, facing, f, rng);
      p.outline(PAL.outline);
      if (facing === "e") eastCanvases.push(p.canvas);
      frames.push(p.texture());
    }
    result[facing] = frames;
  }
  result.w = eastCanvases.map((src) => {
    const p = new Px(32, 32);
    p.ctx.translate(32, 0);
    p.ctx.scale(-1, 1);
    p.ctx.drawImage(src, 0, 0);
    return p.texture();
  });
  return result as Record<Facing, Texture[]>;
}

// ──────────────────────────────────────────────────────────────────────
// Utilitários visuais
// ──────────────────────────────────────────────────────────────────────

/** Marcador de alvo estilo Tibia: quadrado vermelho de cantos (sobre o mob). */
function makeTargetMarker(): Texture {
  const p = new Px(32, 32);
  const c = "#d83a3a";
  const s = "rgba(0,0,0,0.6)";
  for (const [ox, oy, dx, dy] of [
    [1, 1, 1, 1],
    [30, 1, -1, 1],
    [1, 30, 1, -1],
    [30, 30, -1, -1],
  ] as const) {
    for (let i = 0; i < 8; i++) {
      p.px(ox + dx * i, oy, c);
      p.px(ox, oy + dy * i, c);
      p.px(ox + dx * i, oy + dy, s);
      p.px(ox + dx, oy + dy * i, s);
    }
  }
  return p.texture();
}

/** Gradiente radial para as luzes (branco → transparente, falloff suave). */
function makeLightTexture(): Texture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(0.7, "rgba(255,255,255,0.18)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(c);
}

/** Cursor de tile (cantos em L). */
function makeTileCursor(): Texture {
  const p = new Px(32, 32);
  const c = "rgba(232,217,168,0.95)";
  const s = "rgba(0,0,0,0.5)";
  for (const [ox, oy, dx, dy] of [
    [0, 0, 1, 1],
    [31, 0, -1, 1],
    [0, 31, 1, -1],
    [31, 31, -1, -1],
  ] as const) {
    for (let i = 0; i < 7; i++) {
      p.px(ox + dx * i, oy, c);
      p.px(ox, oy + dy * i, c);
      p.px(ox + dx * i, oy + dy, s);
      p.px(ox + dx, oy + dy * i, s);
    }
  }
  return p.texture();
}

/** Sombra elíptica para entidades. */
function makeShadow(): Texture {
  const p = new Px(24, 10);
  p.ellipse(12, 5, 10, 4, "rgba(0,0,0,0.35)");
  return p.texture();
}

// ──────────────────────────────────────────────────────────────────────
// Bundle
// ──────────────────────────────────────────────────────────────────────

export interface SpriteLibrary {
  grass: Texture[];
  grassFlowers: Texture[];
  dirt: Texture[];
  stoneFloor: Texture[];
  waterFrames: Texture[];
  bridge: Texture[];
  swamp: Texture[];
  trees: Texture[];
  rocks: Texture[];
  /** Muralha autotile: 16 máscaras (N=1,E=2,S=4,W=8) × variantes de nuance. */
  walls: Texture[][];
  // ── Subsolo (placeholders; PixelLab depois) — SISTEMA-ANDARES.md ──
  sewerFloor: Texture[];
  caveFloor: Texture[];
  sewageFrames: Texture[];
  deepWaterFrames: Texture[];
  /** Paredes de subsolo: 16 máscaras × variantes (mesmo contrato da muralha). */
  sewerWalls: Texture[][];
  oldMasonryWalls: Texture[][];
  caveWalls: Texture[][];
  /** Portão da muralha (3 tiles de largura), anchor bottom. */
  gate: Texture;
  /** Parede de enxaimel das casas: 16 máscaras × variantes (face pra dentro). */
  houseWalls: Texture[][];
  /** Variantes de parede de enxaimel com porta / janela (segmento horizontal E|W). */
  houseDoor: Texture;
  houseWindow: Texture;
  torchFrames: Texture[];
  // Personagem: texturas vêm do compositor de OUTFITS (assets/outfit/compose.ts)
  rat: Record<Facing, Texture[]>;
  light: Texture;
  tileCursor: Texture;
  targetMarker: Texture;
  shadow: Texture;
}

/**
 * Variantes de chão PLANO a partir de um tileset Wang do PixelLab (par `pair`):
 * usa as tiles puras (0000/1111) + algumas mistas como variação espalhada (musgo
 * etc.). Null se o tileset não foi carregado → o chamador cai no procedural.
 * (A transição Wang dual-grid de subsolo entra na Fase 1 do render, junto do layout.)
 */
function wangFloorVariants(pair: string): Texture[] | null {
  const set = PIXELLAB.wang[pair];
  if (!set) return null;
  const tex = ["0000", "1111", "0011", "1100", "0110", "1001"].map((c) => set[c]).filter(Boolean);
  return tex.length ? tex : null;
}

export function createSprites(): SpriteLibrary {
  return {
    grass: [makeGrass(11, false), makeGrass(22, false), makeGrass(33, false), makeGrass(44, false)],
    grassFlowers: [makeGrass(55, true), makeGrass(66, true)],
    dirt: [makeDirt(10), makeDirt(20), makeDirt(30)],
    stoneFloor: [makeStoneFloor(7), makeStoneFloor(14), makeStoneFloor(21)],
    waterFrames: makeWaterFrames(),
    bridge: [makeBridge(601), makeBridge(602)],
    swamp: [makeSwamp(701), makeSwamp(702), makeSwamp(703)],
    // Árvores: PixelLab (curadoria) quando carregadas; fallback procedural.
    trees: PIXELLAB.trees.length > 0 ? PIXELLAB.trees : [makeTree(101), makeTree(202), makeTree(303)],
    rocks: [makeRock(401), makeRock(402)],
    walls: makeWallTiles(),
    // Esgoto: tileset PixelLab aprovado (jun/2026) quando carregado; fallback procedural.
    sewerFloor: wangFloorVariants("esgoto-chao") ?? [makeDungeonFloor(801, SEWER_FLOOR_PAL), makeDungeonFloor(802, SEWER_FLOOR_PAL), makeDungeonFloor(803, SEWER_FLOOR_PAL)],
    // Caverna: tileset PixelLab ancorado (v3, jun/2026) quando carregado; fallback procedural.
    caveFloor: wangFloorVariants("caverna-chao") ?? [makeDungeonFloor(811, CAVE_FLOOR_PAL), makeDungeonFloor(812, CAVE_FLOOR_PAL), makeDungeonFloor(813, CAVE_FLOOR_PAL)],
    sewageFrames: makeMurkyWaterFrames(SEWAGE_PAL),
    deepWaterFrames: makeMurkyWaterFrames(DEEPWATER_PAL),
    sewerWalls: makeDungeonWallTiles(820, SEWER_WALL_PAL),
    oldMasonryWalls: makeDungeonWallTiles(830, OLD_MASONRY_PAL),
    caveWalls: makeDungeonWallTiles(840, CAVE_WALL_PAL),
    gate: makeGate(3, 909),
    houseWalls: makeHouseWalls(),
    houseDoor: makeHouseWallTile(0b1010, 700, "door"), // segmento E|W (parede reta)
    houseWindow: makeHouseWallTile(0b1010, 700, "window"),
    torchFrames: makeTorchFrames(),
    rat: makeRatTextures(),
    light: makeLightTexture(),
    tileCursor: makeTileCursor(),
    targetMarker: makeTargetMarker(),
    shadow: makeShadow(),
  };
}
