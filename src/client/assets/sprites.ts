import { Rectangle, Texture } from "pixi.js";
import { hash2D, mulberry32, type Rng } from "../../sim/rng";
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

/**
 * Decais de SCATTER (alavanca #2 de profundidade): peças pequenas espalhadas e
 * baked no chunk do chão (custo zero em runtime) pra ele nunca ficar pelado —
 * tufos, pedrinhas, gravetos, flores, rachaduras. Fundo transparente; o
 * WorldRenderer estampa por tile com offset aleatório e densidade por terreno.
 */
function makeScatterDecals(): { grass: Texture[]; dirt: Texture[]; stone: Texture[] } {
  const make = (w: number, h: number, seed: number, draw: (p: Px, rng: Rng) => void): Texture => {
    const p = new Px(w, h);
    draw(p, mulberry32(seed));
    return p.texture();
  };
  // capim: feixe de lâminas com SOMBRA DE CONTATO na base + PONTAS iluminadas →
  // o tufo "ergue" do chão flat (o relevo que o criador curtiu).
  const tuft = (seed: number) => make(11, 11, seed, (p, rng) => {
    // sombra de contato larga e funda na base (o tufo ergue dela)
    for (let i = 0; i < 7; i++) p.px(2 + Math.floor(rng() * 7), 10, PAL.grassShade);
    for (let i = 0; i < 4; i++) p.px(3 + Math.floor(rng() * 5), 9, PAL.grassShade);
    const n = 4 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) {
      let x = 1 + Math.floor(rng() * 9);
      const hgt = 5 + Math.floor(rng() * 4);
      const lean = Math.floor(rng() * 3) - 1;
      for (let s = 0; s < hgt; s++) {
        const c = s === hgt - 1 ? (rng() < 0.55 ? PAL.grassTip : PAL.grassBlade) : s >= hgt - 3 ? PAL.grassLight : PAL.grassMid;
        p.px(x, 9 - s, c);
        if (lean && s > 0 && s % 2 === 0) x += lean;
      }
    }
  });
  // pedrinha: blob cinza com luz no topo
  const pebble = (seed: number) => make(6, 5, seed, (p, rng) => {
    p.ellipse(3, 3, 2 + (rng() < 0.5 ? 0 : 1), 1, PAL.rockBase);
    p.px(2, 2, PAL.rockTop);
    p.px(3, 4, PAL.stoneDark);
  });
  // graveto: linha marrom com bifurcação
  const twig = (seed: number) => make(10, 5, seed, (p, rng) => {
    const y = 2 + Math.floor(rng() * 2);
    p.rect(1, y, 7, 1, PAL.trunkDark);
    p.px(8, y, PAL.trunkBase);
    if (rng() < 0.6) p.px(4 + Math.floor(rng() * 3), y - 1, PAL.trunkDark);
    p.px(2, y, PAL.trunkLight);
  });
  // flor: caule + pétala clara
  const flower = (seed: number) => make(5, 7, seed, (p, rng) => {
    p.px(2, 6, PAL.grassDark);
    p.px(2, 5, PAL.grassBlade);
    p.px(2, 4, PAL.grassBlade);
    const c = rng() < 0.5 ? PAL.flowerGold : PAL.flowerWhite;
    p.px(2, 3, c); p.px(1, 2, c); p.px(3, 2, c); p.px(2, 1, c); p.px(2, 2, PAL.flowerGold);
  });
  // trevo: 3 folhinhas
  const clover = (seed: number) => make(6, 5, seed, (p, rng) => {
    const c = rng() < 0.5 ? PAL.grassBlade : PAL.grassLight;
    p.px(2, 2, c); p.px(3, 2, c); p.px(1, 3, c); p.px(4, 3, c); p.px(2, 4, PAL.grassDark);
  });
  // rachadura: fenda escura irregular
  const crack = (dark: string) => (seed: number) => make(11, 6, seed, (p, rng) => {
    let x = 1, y = 1 + Math.floor(rng() * 3);
    const len = 6 + Math.floor(rng() * 4);
    for (let s = 0; s < len; s++) {
      p.px(x, y, dark);
      x++;
      if (rng() < 0.4) y += Math.floor(rng() * 3) - 1;
      y = Math.max(0, Math.min(5, y));
    }
  });
  // entulho: punhado de cascalho
  const rubble = (lo: string, hi: string) => (seed: number) => make(8, 6, seed, (p, rng) => {
    const n = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) {
      const x = Math.floor(rng() * 7), y = Math.floor(rng() * 5);
      p.px(x, y, rng() < 0.5 ? lo : hi);
      if (rng() < 0.4) p.px(x, y + 1, PAL.stoneDark);
    }
  });
  return {
    grass: [tuft(11), tuft(12), tuft(13), pebble(21), twig(31), flower(41), flower(42), clover(51), clover(52)],
    dirt: [pebble(22), pebble(23), twig(32), crack("#2e2418")(61), rubble(PAL.dirtStone, PAL.dirtLight)(71), twig(33)],
    stone: [crack(PAL.stoneCrack)(62), rubble(PAL.stoneDark, PAL.stoneLight)(72), pebble(24)],
  };
}

// Cor-base da LAJOTA (neutra-quente) — base do campo de pedra e da transição.
const FLAG_RGB = { r: 86, g: 83, b: 80 };

// ──────────────────────────────────────────────────────────────────────
// CAMPOS de terreno 128×128 (refactor jun/2026): em vez de tiles 32px prontos
// que REPETEM idênticos (grade mecânica), geramos um campo grande seamless e o
// cliente amostra a fatia 32px pela posição do MUNDO → pavimento/turfa CONTÍNUO,
// sem repetição por tile, com variação de larga escala. O campo fecha em 128px
// (4 tiles), repetição quase imperceptível sob scatter/luz.
// ──────────────────────────────────────────────────────────────────────
const FIELD = 128, FT = FIELD / 32; // 4×4 tiles por campo

/** Fatia o campo em FT×FT frames de 32px (índice = gx + gy*FT). */
function sliceField(big: Texture): Texture[] {
  const frames: Texture[] = [];
  for (let gy = 0; gy < FT; gy++)
    for (let gx = 0; gx < FT; gx++)
      frames.push(new Texture({ source: big.source, frame: new Rectangle(gx * 32, gy * 32, 32, 32) }));
  return frames;
}

/** Blob com wrap toroidal — fecha seamless na borda do campo. */
function wrapBlob(p: Px, cx: number, cy: number, r: number, color: string, rng: Rng, rough: number): void {
  for (let oy = -FIELD; oy <= FIELD; oy += FIELD)
    for (let ox = -FIELD; ox <= FIELD; ox += FIELD)
      if (cx + ox > -r - 2 && cx + ox < FIELD + r + 2 && cy + oy > -r - 2 && cy + oy < FIELD + r + 2)
        p.blob(cx + ox, cy + oy, r, color, rng, rough);
}

function makeGrassField(seed: number): Texture[] {
  const rng = mulberry32(seed);
  const p = new Px(FIELD, FIELD);
  // chão FLAT e limpo (o criador gostou do flat) — só respiro fino de valor, SEM
  // manchão grande que vira lamaçal.
  p.fill(PAL.grassBase);
  for (let i = 0; i < 300; i++) {
    const x = rng() * FIELD | 0, y = rng() * FIELD | 0;
    p.px(x, y, rng() < 0.62 ? PAL.grassDark : PAL.grassMid);
  }
  // TUFOS ERGUENDO DO CHÃO — o "3D maneiro": sombra de contato escura na base +
  // lâminas + PONTA iluminada (pega a luz) → capim levantado sobre o chão flat.
  const px = (x: number, y: number, c: string) => p.px(((x % FIELD) + FIELD) % FIELD, y, c);
  for (let i = 0; i < 165; i++) {
    const bx = rng() * FIELD | 0, by = (rng() * (FIELD - 10) | 0) + 7;
    // SOMBRA DE CONTATO larga e escura na base → o tufo "sobe" do chão flat
    for (let d = -1; d <= 2; d++) px(bx + d, by + 1, PAL.grassShade);
    px(bx, by + 2, PAL.grassShade); px(bx + 1, by + 2, PAL.grassShade);
    const n = 3 + (rng() * 3 | 0);
    for (let b = 0; b < n; b++) {
      const x = bx + (rng() * 5 | 0) - 2, h = 3 + (rng() * 3 | 0);
      for (let s = 0; s < h; s++) px(x, by - s, s >= h - 2 ? PAL.grassBlade : PAL.grassMid);
    }
    // pontas pegando luz (o brilho que dá o relevo) — ponta bem clara POPa
    px(bx, by - 3 - (rng() * 2 | 0), rng() < 0.6 ? PAL.grassTip : PAL.grassLight);
    px(bx + 1, by - 2 - (rng() * 2 | 0), PAL.grassLight);
  }
  return sliceField(p.texture());
}

function makeDirtField(seed: number): Texture[] {
  const rng = mulberry32(seed);
  const p = new Px(FIELD, FIELD);
  p.fill(PAL.dirtBase);
  // manchas grandes de valor (terra batida irregular — cavas e cristas)
  for (let i = 0; i < 10; i++) wrapBlob(p, rng() * FIELD, rng() * FIELD, 10 + rng() * 14, rng() < 0.5 ? PAL.dirtDark : PAL.dirtMid, rng, 2.8);
  for (let i = 0; i < 1100; i++) {
    const x = rng() * FIELD | 0, y = rng() * FIELD | 0, r = rng();
    p.px(x, y, r < 0.45 ? PAL.dirtDark : r < 0.8 ? PAL.dirtMid : PAL.dirtLight);
  }
  for (let i = 0; i < 110; i++) {
    const x = rng() * (FIELD - 2) | 0, y = rng() * (FIELD - 2) | 0;
    p.rect(x, y, 2, 1, PAL.dirtStone);
    p.px(x, y, PAL.dirtLight);
    p.px(x, y + 1, PAL.dirtDark);
  }
  return sliceField(p.texture());
}

// Piso de pedra = LAJES IRREGULARES encaixadas (Voronoi/crazy-paving), NÃO grade
// de retângulos (que o criador achou feia). Cada laje: corpo próprio, topo
// pegando luz, juntas fundas escuras nas outras bordas → encaixe orgânico com
// volume, estilo dungeon/tavern de referência. Sementes em grade jittered com
// wrap TOROIDAL → o campo 128 fecha seamless.
function makeStoneField(seed: number): Texture[] {
  const p = new Px(FIELD, FIELD);
  const cb = (n: number) => Math.max(0, Math.min(255, n | 0));
  const JOINT = "#080a0e";
  const GS = 24; // espaçamento médio das lajes (px) — lajes GRANDES, leitura calma
  const cols = Math.round(FIELD / GS), rows = Math.round(FIELD / GS);
  const seeds: { x: number; y: number; tone: number; warm: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      seeds.push({
        x: (c + 0.5) * (FIELD / cols) + (hash2D(c, r, seed) - 0.5) * GS * 0.9,
        y: (r + 0.5) * (FIELD / rows) + (hash2D(c, r, seed + 1) - 0.5) * GS * 0.9,
        tone: 0.76 + hash2D(c, r, seed + 2) * 0.5,
        warm: hash2D(c, r, seed + 3) < 0.35 ? 8 : 0,
      });
    }
  }
  const cellOf = (px: number, py: number): number => {
    let best = 0, bd = 1e9;
    for (let i = 0; i < seeds.length; i++) {
      let dx = Math.abs(px - seeds[i].x); if (dx > FIELD / 2) dx = FIELD - dx; // toroidal
      let dy = Math.abs(py - seeds[i].y); if (dy > FIELD / 2) dy = FIELD - dy;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  };
  const cm = new Int16Array(FIELD * FIELD);
  for (let y = 0; y < FIELD; y++) for (let x = 0; x < FIELD; x++) cm[y * FIELD + x] = cellOf(x, y);
  const at = (x: number, y: number) => cm[((y + FIELD) % FIELD) * FIELD + ((x + FIELD) % FIELD)];
  for (let y = 0; y < FIELD; y++) {
    for (let x = 0; x < FIELD; x++) {
      const id = cm[y * FIELD + x];
      const s = seeds[id];
      const R = cb(FLAG_RGB.r * s.tone + s.warm), G = cb(FLAG_RGB.g * s.tone + s.warm * 0.5), B = cb(FLAG_RGB.b * s.tone);
      const up = at(x, y - 1) !== id, dn = at(x, y + 1) !== id, lf = at(x - 1, y) !== id, rt = at(x + 1, y) !== id;
      const edgeTL = up || lf, edgeBR = dn || rt;
      // VOLUME forte (como a face da parede): lip iluminado no topo-esq, junta
      // FUNDA na base-dir, e uma sombra interna logo acima da junta (a pedra
      // "sobe"). Junta dupla no canto onde 2 bordas se cruzam.
      let col: string;
      if (edgeBR) {
        col = JOINT;
      } else if (edgeTL) {
        col = `rgb(${cb(R + 34)},${cb(G + 34)},${cb(B + 35)})`; // lip de luz
      } else if (at(x + 1, y) !== id || at(x, y + 1) !== id || at(x + 2, y) !== id || at(x, y + 2) !== id) {
        col = `rgb(${cb(R - 22)},${cb(G - 21)},${cb(B - 18)})`; // sombra interna sob o lip (base-dir)
      } else if (hash2D(x, y, seed + 9) < 0.06) {
        col = `rgb(${cb(R - 11)},${cb(G - 10)},${cb(B - 8)})`; // grão sutil
      } else {
        col = `rgb(${R},${G},${B})`;
      }
      p.px(x, y, col);
    }
  }
  return sliceField(p.texture());
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
  // (sombra de contato vem da camada `shadows` do WorldRenderer — suave e vaza)
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
  // (sombra de contato vem da camada `shadows` do WorldRenderer)
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
    // separação topo → face
    p.rect(0, WALL_TOP_H - 2, 32, 1, "#161a21");
    p.rect(0, WALL_TOP_H - 1, 32, 1, "#0a0d12");
    const faceTop = WALL_TOP_H, faceBot = WALL_H - 1, faceH = faceBot - faceTop;
    const cb = (n: number) => Math.max(0, Math.min(255, n | 0));
    // PEDRAS ORGÂNICAS (Voronoi): sementes em running-bond jittered → células
    // irregulares que se ENCAIXAM (não grade/LEGO). Cada pedra: topo com luz,
    // juntas escuras nos vãos, corpo com tom próprio + gradiente direcional.
    const seeds: { x: number; y: number; tone: number; warm: number }[] = [];
    const srows = Math.round(faceH / 9) + 1;
    for (let r = -1; r <= srows; r++) {
      for (let c = -1; c <= 4; c++) {
        seeds.push({
          x: c * 8 + ((r & 1) ? 4 : 0) + (rng() * 6 - 3),
          y: faceTop + r * 9 + (rng() * 5 - 2.5),
          tone: 0.64 + rng() * 0.46,
          warm: rng() < 0.26 ? 5 : 0,
        });
      }
    }
    const cellOf = (px: number, py: number): number => {
      let best = 0, bd = 1e9;
      for (let i = 0; i < seeds.length; i++) {
        const dx = px - seeds[i].x, dy = (py - seeds[i].y) * 1.18; // achata → pedras mais largas
        const d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = i; }
      }
      return best;
    };
    const cmap = new Int16Array(32 * faceH);
    for (let yy = 0; yy < faceH; yy++) for (let xx = 0; xx < 32; xx++) cmap[yy * 32 + xx] = cellOf(xx, faceTop + yy);
    for (let yy = 0; yy < faceH; yy++) {
      const py = faceTop + yy;
      const t = yy / faceH;
      for (let xx = 0; xx < 32; xx++) {
        const id = cmap[yy * 32 + xx];
        const s = seeds[id];
        const v = s.tone * (1 - 0.5 * t); // gradiente direcional (volume)
        const R = cb(60 * v + s.warm), G = cb(64 * v + s.warm * 0.4), B = cb(76 * v + 5);
        const up = yy > 0 ? cmap[(yy - 1) * 32 + xx] : -1;
        const dn = yy < faceH - 1 ? cmap[(yy + 1) * 32 + xx] : id;
        const lf = xx > 0 ? cmap[yy * 32 + xx - 1] : id;
        const rt = xx < 31 ? cmap[yy * 32 + xx + 1] : id;
        let col: string;
        if (up !== id) col = `rgb(${cb(R + 27)},${cb(G + 28)},${cb(B + 29)})`;     // topo da pedra = LUZ
        else if (dn !== id || lf !== id || rt !== id) col = "#0a0d12";              // junta = mortar escuro
        else if (rng() < 0.09) col = `rgb(${cb(R - 9)},${cb(G - 8)},${cb(B - 6)})`;  // grit sutil
        else col = `rgb(${R},${G},${B})`;
        p.px(xx, py, col);
      }
    }
    // weathering ESPARSO e limpo: poucas rachaduras + musgo acumulando na base
    const mossC = ["#2c3a2b", "#384a36", "#243527"];
    for (let k = 0; k < 2; k++) if (rng() < 0.55) {
      let cx = 4 + (rng() * 24 | 0), cy = faceTop + 3;
      const len = 8 + (rng() * 14 | 0);
      for (let s = 0; s < len && cy < faceBot - 1; s++) { p.px(cx, cy, "#080b10"); cy++; cx += (rng() * 3 | 0) - 1; }
    }
    for (let x = 0; x < 32; x++) if (rng() < 0.2) p.px(x, faceBot - 1 - (rng() * 2 | 0), mossC[rng() * mossC.length | 0]);
    p.rect(0, WALL_H - 3, 32, 3, "rgba(0,0,0,0.5)"); // sombra de contato funda
    p.rect(0, WALL_H - 1, 32, 1, "rgba(0,0,0,0.35)");
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

/** Overhang do telhado em px (cobre os topos da parede norte). */
export const ROOF_OVERHANG = 22;

/**
 * TELHADO de edifício (jun/2026): telha gasta dark-medieval, gerado no tamanho
 * do prédio. Espigão claro no centro + beirais escuros + fiadas de telha + uma
 * sombra de contato projetada na base. Some quando o player entra (WorldRenderer).
 * Quente (telha/madeira) pra contrastar com a pedra fria das paredes.
 */
export function makeRoof(wTiles: number, hTiles: number, seed: number): Texture {
  const W = wTiles * 32, H = hTiles * 32 + ROOF_OVERHANG;
  const p = new Px(W, H);
  const cb = (n: number) => Math.max(0, Math.min(255, n | 0));
  const baseR = 122, baseG = 86, baseB = 66; // telha/madeira gasta, quente
  const ridgeY = Math.round(H / 2);
  const col = (l: number) => `rgb(${cb(baseR * l)},${cb(baseG * l)},${cb(baseB * l)})`;
  const slopeAt = (y: number) => {
    const dY = Math.abs(y - ridgeY) / (H / 2);
    return 1 - dY * dY * 0.6; // água de telhado: clara no espigão, escura no beiral
  };
  p.fill(col(0.45)); // fundo escuro (vão entre telhas)
  // TELHAS INDIVIDUAIS sobrepostas (fiadas com offset tipo tijolo): cada telha
  // tem aresta de cima iluminada + sombra de sobreposição embaixo + topo
  // arredondado → lê como telhado, não como tábua corrida.
  const SW = 11, RH = 6;
  for (let ry = -RH; ry < H; ry += RH) {
    const rowIdx = Math.round((ry + RH) / RH);
    const off = rowIdx % 2 ? (SW / 2) | 0 : 0;
    const lumY = slopeAt(ry + RH / 2);
    for (let sx = -SW; sx < W + SW; sx += SW) {
      const x0 = sx + off;
      const dX = Math.abs(x0 + SW / 2 - W / 2) / (W / 2);
      const tone = lumY * (1 - dX * 0.16) * (0.9 + ((hash2D(rowIdx, (sx / SW) | 0, seed) * 0.2)));
      for (let yy = 0; yy < RH + 1; yy++) {
        const y = ry + yy; if (y < 0 || y >= H) continue;
        for (let xx = 1; xx < SW; xx++) {
          const x = x0 + xx; if (x < 0 || x >= W) continue;
          let l = tone;
          if (yy === 0) l *= 1.18;            // aresta de cima da telha (luz)
          else if (yy >= RH - 1) l *= 0.6;    // sombra da sobreposição da fiada de cima
          if (xx === SW - 1) l *= 0.7;        // sulco vertical entre telhas
          p.px(x, y, col(l));
        }
      }
    }
  }
  // ESPIGÃO (ridge cap): faixa clara no topo + sombra funda logo abaixo (volume)
  for (let x = 0; x < W; x++) {
    p.px(x, ridgeY - 2, `rgb(${cb(baseR * 1.3)},${cb(baseG * 1.25)},${cb(baseB * 1.2)})`);
    p.px(x, ridgeY - 1, `rgb(${cb(baseR * 1.45)},${cb(baseG * 1.4)},${cb(baseB * 1.32)})`);
    p.px(x, ridgeY, `rgb(${cb(baseR * 0.5)},${cb(baseG * 0.5)},${cb(baseB * 0.5)})`);
    if (x % 4 === 0) p.px(x, ridgeY - 1, `rgb(${cb(baseR * 0.9)},${cb(baseG * 0.9)},${cb(baseB * 0.9)})`); // entalhe do cap
  }
  // BEIRAIS: borda escura nos 4 lados (trim) + outline
  for (let x = 0; x < W; x++) { p.px(x, 0, "#160f0b"); p.px(x, H - 1, "#0e0a07"); }
  for (let y = 0; y < H; y++) { p.px(0, y, "#160f0b"); p.px(W - 1, y, "#160f0b"); }
  // sombra de contato projetada na base (o beiral da frente sombreia o chão)
  p.rect(0, H - 3, W, 2, "rgba(0,0,0,0.38)");
  return p.texture();
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

/**
 * BOEIRO (descida pro esgoto): grade de ferro redonda sobre poço escuro —
 * sinaliza "aqui se desce". Desce ao CLICAR (não ao pisar). Aro com luz NO.
 */
function makeManhole(): Texture {
  const p = new Px(32, 32);
  const cx = 15.5, cy = 15.5, R = 13;
  const IRON = "#3b414b", IRON_LO = "#252a31", IRON_HI = "#5b626d", PIT = "#06080c";
  p.ellipse(cx, cy, R, R, IRON_LO);        // aro externo
  p.ellipse(cx, cy, R - 1.5, R - 1.5, IRON);
  p.ellipse(cx, cy, R - 3, R - 3, PIT);    // poço escuro
  // GRADE: barras de ferro atravessando o poço (topo da barra pega luz)
  for (let by = -8; by <= 8; by += 4) {
    const half = Math.round(Math.sqrt(Math.max(0, (R - 3) * (R - 3) - by * by)));
    const y = Math.round(cy + by);
    for (let x = Math.round(cx) - half; x <= Math.round(cx) + half; x++) {
      p.px(x, y, IRON);
      p.px(x, y - 1, IRON_HI);
    }
  }
  // aro: luz no topo-esq, sombra na base-dir (volume)
  for (let a = 0; a < 360; a += 5) {
    const rad = (a * Math.PI) / 180, c = Math.cos(rad), s = Math.sin(rad);
    p.px(Math.round(cx + c * R), Math.round(cy + s * R), c + s < -0.3 ? IRON_HI : c + s > 0.3 ? "#1a1e24" : IRON_LO);
  }
  p.outline(PAL.outline);
  return p.texture();
}

/** Escada de pedra descendo pro escuro (degraus recuando). Pisar = desce; clicar = sobe. */
function makeStairs(): Texture {
  const p = new Px(32, 32);
  p.rect(3, 3, 26, 26, "#2a2f37");
  p.rect(4, 4, 24, 24, "#070a0e"); // poço escuro
  const steps = ["#5a6270", "#4f5763", "#454c58", "#3a414c", "#30353f"];
  for (let i = 0; i < steps.length; i++) {
    const y = 5 + i * 4;
    p.rect(5, y, 22, 3, steps[i]);
    p.rect(5, y, 22, 1, "#6c7482"); // aresta de cima do degrau pega luz
  }
  p.outline(PAL.outline);
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
/**
 * Transição DUAL-GRID procedural de StoneFloor (alavanca #4): 16 tiles indexados
 * por código de cantos (nw|ne<<1|sw<<2|se<<3). A pedra (terreno "alto") transborda
 * organicamente sobre grama/terra (base) — banda de pedra straddling a fronteira,
 * com linha de contato escura (AO) e sombrinha no terreno baixo. Deep-high e
 * deep-low ficam transparentes (a base cobble/grama aparece). Custo zero (sem
 * PixelLab); coerente com a tese "terreno mais alto vaza no mais baixo".
 */
function makeStoneTransition(seed: number): Texture[] {
  const out: Texture[] = [];
  const nz = (x: number, y: number): number => {
    let h = (x * 374761393 + y * 668265263 + seed * 362437) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  for (let code = 0; code < 16; code++) {
    const nw = code & 1, ne = (code >> 1) & 1, sw = (code >> 2) & 1, se = (code >> 3) & 1;
    const p = new Px(32, 32);
    if (nw + ne + sw + se === 0 || nw + ne + sw + se === 4) { out.push(p.texture()); continue; }
    for (let py = 0; py < 32; py++) {
      for (let px = 0; px < 32; px++) {
        const u = px / 31, v = py / 31;
        const b = nw * (1 - u) * (1 - v) + ne * u * (1 - v) + sw * (1 - u) * v + se * u * v;
        const t = b + (nz(px >> 1, py >> 1) - 0.5) * 0.30; // jitter em clusters 2px
        if (t > 0.46 && b < 0.84) {
          const r = nz(px, py);
          const cb = (n: number) => Math.max(0, Math.min(255, n | 0));
          const k = r < 0.2 ? 26 : r > 0.82 ? -16 : 0; // lit / shad / body — casa com a lajota
          p.px(px, py, `rgb(${cb(FLAG_RGB.r + k)},${cb(FLAG_RGB.g + k)},${cb(FLAG_RGB.b + k)})`);
          if (t < 0.56) p.px(px, py, "#1a1c1f"); // contato/AO na borda externa (junta)
        } else if (t > 0.3 && t <= 0.46) {
          p.px(px, py, "rgba(10,14,20,0.28)"); // sombra da pedra no terreno baixo
        }
      }
    }
    out.push(p.texture());
  }
  return out;
}

/**
 * Transição GRAMA↔TERRA procedural (substitui o wang PixelLab v4, que destoava
 * dos campos novos com a borda amarela). Terra (nível 1) transborda na grama com
 * borda TERROSA escura + sombrinha quente — casa com o campo de terra novo.
 */
function makeDirtTransition(seed: number): Texture[] {
  const out: Texture[] = [];
  const nz = (x: number, y: number): number => {
    let h = (x * 374761393 + y * 668265263 + seed * 362437) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  for (let code = 0; code < 16; code++) {
    const nw = code & 1, ne = (code >> 1) & 1, sw = (code >> 2) & 1, se = (code >> 3) & 1;
    const p = new Px(32, 32);
    if (nw + ne + sw + se === 0 || nw + ne + sw + se === 4) { out.push(p.texture()); continue; }
    for (let py = 0; py < 32; py++) {
      for (let px = 0; px < 32; px++) {
        const u = px / 31, v = py / 31;
        const b = nw * (1 - u) * (1 - v) + ne * u * (1 - v) + sw * (1 - u) * v + se * u * v;
        const t = b + (nz(px >> 1, py >> 1) - 0.5) * 0.32;
        if (t > 0.46 && b < 0.85) {
          const r = nz(px, py);
          p.px(px, py, r < 0.22 ? PAL.dirtLight : r > 0.8 ? PAL.dirtDark : r < 0.55 ? PAL.dirtBase : PAL.dirtMid);
          if (t < 0.54) p.px(px, py, PAL.dirtDark); // borda externa = terra escura (não amarelo)
        } else if (t > 0.3 && t <= 0.46) {
          p.px(px, py, "rgba(12,9,5,0.22)"); // sombrinha quente da terra na grama
        }
      }
    }
    out.push(p.texture());
  }
  return out;
}

/**
 * Sombra de contato SUAVE e FRIA (constituição: sombra puxa pro azul). Gradiente
 * radial achatado em elipse, alpha caindo a zero na borda → vaza pro chão vizinho
 * sem corte duro. Textura única; cada consumidor define width/height conforme o
 * objeto (árvore grande, rocha média, entidade pequena). É a base da profundidade
 * percebida — objeto que não pinga sombra "flutua".
 */
function makeShadow(): Texture {
  const w = 96, h = 48;
  const p = new Px(w, h);
  const ctx = p.ctx;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(1, h / w); // achata o círculo → elipse
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
  g.addColorStop(0, "rgba(6,10,18,0.62)");
  g.addColorStop(0.5, "rgba(8,12,20,0.42)");
  g.addColorStop(0.82, "rgba(8,12,20,0.15)");
  g.addColorStop(1, "rgba(8,12,20,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
  /** Boeiro/grade da descida pro esgoto. */
  manhole: Texture;
  /** Escada (descida/subida entre andares). */
  stairs: Texture;
  shadow: Texture;
  /** Decais espalhados no chão (baked no chunk): grama/terra/pedra. */
  scatter: { grass: Texture[]; dirt: Texture[]; stone: Texture[] };
  /** Transição dual-grid de StoneFloor sobre grama/terra: 16 códigos de canto. */
  stoneTransition: Texture[];
  /** Transição grama↔terra (16 códigos de canto) — procedural, casa com o campo. */
  dirtTransition: Texture[];
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
  // Campos 128×128 amostrados por posição de mundo (16 frames cada): chão CONTÍNUO
  // sem repetição por tile. Flores agora vêm do scatter, não de variante de grama.
  const grassFrames = makeGrassField(101);
  return {
    grass: grassFrames,
    grassFlowers: grassFrames,
    dirt: makeDirtField(202),
    stoneFloor: makeStoneField(404),
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
    manhole: makeManhole(),
    stairs: makeStairs(),
    shadow: makeShadow(),
    scatter: makeScatterDecals(),
    stoneTransition: makeStoneTransition(404),
    dirtTransition: makeDirtTransition(303),
  };
}

// DEV: os sprites são gerados UMA vez no boot (createSprites), então o HMR de
// módulo do Vite NÃO os regenera — sem isto, editar tile/paleta não muda nada na
// aba aberta (só num reload manual). Força reload completo quando este arquivo OU
// a paleta (dependência) mudam.
if (import.meta.hot) import.meta.hot.accept(() => location.reload());
