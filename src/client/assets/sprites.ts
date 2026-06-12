import { Rectangle, Texture } from "pixi.js";
import { TILE_SIZE } from "../../shared/constants";
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
export function makeScatterDecals(): { grass: Texture[]; dirt: Texture[]; stone: Texture[]; sewer: Texture[]; cave: Texture[] } {
  const make = (w: number, h: number, seed: number, draw: (p: Px, rng: Rng) => void): Texture => {
    const p = new Px(w, h);
    draw(p, mulberry32(seed));
    return p.texture();
  };
  // remaster 128: cada peça escala por S (dimensões/coords) e por S² (contagens
  // por área) — a 128 ficavam confete se ficassem nos tamanhos fixos de 32px.
  // bloco S×S desenhado num ponto (preserva o "pixel grosso" da arte original).
  const blk = (p: Px, x: number, y: number, c: string) => p.rect(x * S, y * S, S, S, c);
  // capim: feixe de lâminas com SOMBRA DE CONTATO na base + PONTAS iluminadas →
  // o tufo "ergue" do chão flat (o relevo que o criador curtiu).
  const tuft = (seed: number) => make(11 * S, 11 * S, seed, (p, rng) => {
    // sombra de contato larga e funda na base (o tufo ergue dela)
    for (let i = 0; i < 7 * S * S; i++) blk(p, 2 + Math.floor(rng() * 7), 10, PAL.grassShade);
    for (let i = 0; i < 4 * S * S; i++) blk(p, 3 + Math.floor(rng() * 5), 9, PAL.grassShade);
    const n = 4 + Math.floor(rng() * 3);
    for (let i = 0; i < n; i++) {
      let x = 1 + Math.floor(rng() * 9);
      const hgt = 5 + Math.floor(rng() * 4);
      const lean = Math.floor(rng() * 3) - 1;
      for (let s = 0; s < hgt; s++) {
        const c = s === hgt - 1 ? (rng() < 0.55 ? PAL.grassTip : PAL.grassBlade) : s >= hgt - 3 ? PAL.grassLight : PAL.grassMid;
        blk(p, x, 9 - s, c);
        if (lean && s > 0 && s % 2 === 0) x += lean;
      }
    }
  });
  // pedrinha: blob cinza com luz no topo
  const pebble = (seed: number) => make(6 * S, 5 * S, seed, (p, rng) => {
    p.ellipse(3 * S, 3 * S, (2 + (rng() < 0.5 ? 0 : 1)) * S, S, PAL.rockBase);
    blk(p, 2, 2, PAL.rockTop);
    blk(p, 3, 4, PAL.stoneDark);
  });
  // graveto: linha marrom com bifurcação
  const twig = (seed: number) => make(10 * S, 5 * S, seed, (p, rng) => {
    const y = 2 + Math.floor(rng() * 2);
    p.rect(S, y * S, 7 * S, S, PAL.trunkDark);
    blk(p, 8, y, PAL.trunkBase);
    if (rng() < 0.6) blk(p, 4 + Math.floor(rng() * 3), y - 1, PAL.trunkDark);
    blk(p, 2, y, PAL.trunkLight);
  });
  // flor: caule + pétala clara
  const flower = (seed: number) => make(5 * S, 7 * S, seed, (p, rng) => {
    blk(p, 2, 6, PAL.grassDark);
    blk(p, 2, 5, PAL.grassBlade);
    blk(p, 2, 4, PAL.grassBlade);
    const c = rng() < 0.5 ? PAL.flowerGold : PAL.flowerWhite;
    blk(p, 2, 3, c); blk(p, 1, 2, c); blk(p, 3, 2, c); blk(p, 2, 1, c); blk(p, 2, 2, PAL.flowerGold);
  });
  // trevo: 3 folhinhas
  const clover = (seed: number) => make(6 * S, 5 * S, seed, (p, rng) => {
    const c = rng() < 0.5 ? PAL.grassBlade : PAL.grassLight;
    blk(p, 2, 2, c); blk(p, 3, 2, c); blk(p, 1, 3, c); blk(p, 4, 3, c); blk(p, 2, 4, PAL.grassDark);
  });
  // rachadura: fenda escura irregular
  const crack = (dark: string) => (seed: number) => make(11 * S, 6 * S, seed, (p, rng) => {
    let x = 1, y = 1 + Math.floor(rng() * 3);
    const len = 6 + Math.floor(rng() * 4);
    for (let s = 0; s < len; s++) {
      blk(p, x, y, dark);
      x++;
      if (rng() < 0.4) y += Math.floor(rng() * 3) - 1;
      y = Math.max(0, Math.min(5, y));
    }
  });
  // entulho: punhado de cascalho
  const rubble = (lo: string, hi: string) => (seed: number) => make(8 * S, 6 * S, seed, (p, rng) => {
    const n = (3 + Math.floor(rng() * 3)) * S * S;
    for (let i = 0; i < n; i++) {
      const x = Math.floor(rng() * 7), y = Math.floor(rng() * 5);
      blk(p, x, y, rng() < 0.5 ? lo : hi);
      if (rng() < 0.4) blk(p, x, y + 1, PAL.stoneDark);
    }
  });
  // ── decais de SUBSOLO ──────────────────────────────────────────────
  // limo: mancha de musgo úmido (base verde-escura + brilho), sombra de contato
  const moss = (seed: number) => make(9 * S, 7 * S, seed, (p, rng) => {
    p.ellipse(4 * S, 4 * S, 3 * S, 2 * S, "#2c3724"); // sombra/base
    p.ellipse(4 * S, 3 * S, 3 * S, 2 * S, "#36442b");
    for (let i = 0; i < 7 * S * S; i++) blk(p, 1 + Math.floor(rng() * 7), 1 + Math.floor(rng() * 4), rng() < 0.5 ? "#47592f" : "#3d4d29");
    blk(p, 3, 2, "#5a6d3c"); // ponta iluminada
  });
  // poça: lâmina d'água parada — escura, reflexo de luz no topo-esq (lê como água)
  const puddle = (seed: number) => make(15 * S, 10 * S, seed, (p) => {
    p.ellipse(7 * S, 5 * S, 6 * S, 4 * S, "#161d24"); // água escura
    p.ellipse(7 * S, 5 * S, 5 * S, 3 * S, "#202c35");
    p.ellipse(7 * S, 5 * S, 3 * S, S, "#2b3a45"); // fundo
    p.rect(4 * S, 3 * S, 3 * S, S, "#4f6271"); // reflexo de luz na lâmina
    blk(p, 5, 4, "#3a4c5a");
  });
  // mancha úmida: respingo escuro irregular (alvenaria molhada)
  const damp = (dark: string) => (seed: number) => make(10 * S, 8 * S, seed, (p, rng) => {
    for (let i = 0; i < 12 * S * S; i++) blk(p, Math.floor(rng() * 10), Math.floor(rng() * 8), dark);
  });
  // mineral: lasca clara que brilha na rocha da caverna
  const mineral = (seed: number) => make(5 * S, 4 * S, seed, (p, rng) => {
    blk(p, 2, 1, "#7c8aa0"); blk(p, 2, 2, "#9aa6ba"); blk(p, 1, 2, "#6a7689");
    if (rng() < 0.5) blk(p, 3, 2, "#8893a6");
  });
  return {
    grass: [tuft(11), tuft(12), tuft(13), pebble(21), twig(31), flower(41), flower(42), clover(51), clover(52)],
    dirt: [pebble(22), pebble(23), twig(32), crack("#2e2418")(61), rubble(PAL.dirtStone, PAL.dirtLight)(71), twig(33)],
    stone: [crack(PAL.stoneCrack)(62), rubble(PAL.stoneDark, PAL.stoneLight)(72), pebble(24)],
    // limo > poça (poça mais rara): musgo repetido pesa a probabilidade pro limo
    sewer: [moss(81), moss(82), moss(83), damp("#2a3340")(84), puddle(85), pebble(25)],
    cave: [rubble("#5a5040", "#8a7f68")(86), crack("#1c1710")(87), mineral(88), rubble("#4a4234", "#6e6450")(89)],
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
// Remaster 64px: o campo escala com TILE_SIZE pra manter 4×4 tiles por campo
// (FIELD = 4·TILE_SIZE = 256 @64px), dobrando a resolução-fonte sem aumentar a
// repetição. A fatia é do tamanho do tile do mundo, não mais 32 literal.
const FT = 4; // 4×4 tiles por campo
const FIELD = TILE_SIZE * FT;

/** Fatia o campo em FT×FT frames de TILE_SIZE px (índice = gx + gy*FT). */
function sliceField(big: Texture): Texture[] {
  const frames: Texture[] = [];
  for (let gy = 0; gy < FT; gy++)
    for (let gx = 0; gx < FT; gx++)
      frames.push(new Texture({ source: big.source, frame: new Rectangle(gx * TILE_SIZE, gy * TILE_SIZE, TILE_SIZE, TILE_SIZE) }));
  return frames;
}

/** Blob com wrap toroidal — fecha seamless na borda do campo. */
function wrapBlob(p: Px, cx: number, cy: number, r: number, color: string, rng: Rng, rough: number): void {
  for (let oy = -FIELD; oy <= FIELD; oy += FIELD)
    for (let ox = -FIELD; ox <= FIELD; ox += FIELD)
      if (cx + ox > -r - 2 && cx + ox < FIELD + r + 2 && cy + oy > -r - 2 && cy + oy < FIELD + r + 2)
        p.blob(cx + ox, cy + oy, r, color, rng, rough);
}

// S = fator de densidade do remaster (1 @32px-tile, 2 @64px). Tudo que era contado
// ou dimensionado pra 32 escala por S (tamanhos) ou S² (contagens por área).
const S = TILE_SIZE / 32;

function makeGrassField(seed: number): Texture[] {
  const rng = mulberry32(seed);
  const p = new Px(FIELD, FIELD);
  // chão FLAT e limpo (o criador gostou do flat) — só respiro fino de valor, SEM
  // manchão grande que vira lamaçal.
  p.fill(PAL.grassBase);
  for (let i = 0; i < Math.round(300 * S * S); i++) {
    const x = rng() * FIELD | 0, y = rng() * FIELD | 0;
    p.px(x, y, rng() < 0.62 ? PAL.grassDark : PAL.grassMid);
  }
  // TUFOS ERGUENDO DO CHÃO — o "3D maneiro": sombra de contato escura na base +
  // lâminas + PONTA iluminada (pega a luz) → capim levantado sobre o chão flat.
  const px = (x: number, y: number, c: string) => p.px(((x % FIELD) + FIELD) % FIELD, y, c);
  for (let i = 0; i < Math.round(165 * S * S); i++) {
    const bx = rng() * FIELD | 0, by = (rng() * (FIELD - 10 * S) | 0) + 7 * S;
    // SOMBRA DE CONTATO larga e escura na base → o tufo "sobe" do chão flat
    for (let d = -S; d <= 2 * S; d++) px(bx + d, by + 1, PAL.grassShade);
    for (let d = 0; d <= S; d++) { px(bx + d, by + 2, PAL.grassShade); px(bx + d, by + 1 + S, PAL.grassShade); }
    const n = 3 + (rng() * 3 | 0);
    for (let b = 0; b < n; b++) {
      const x = bx + (rng() * 5 * S | 0) - 2 * S, h = (3 + (rng() * 3 | 0)) * S;
      for (let s = 0; s < h; s++) px(x, by - s, s >= h - 2 * S ? PAL.grassBlade : PAL.grassMid);
    }
    // pontas pegando luz (o brilho que dá o relevo) — ponta bem clara POPa
    px(bx, by - 3 * S - (rng() * 2 | 0), rng() < 0.6 ? PAL.grassTip : PAL.grassLight);
    px(bx + 1, by - 2 * S - (rng() * 2 | 0), PAL.grassLight);
  }
  return sliceField(p.texture());
}

function makeDirtField(seed: number): Texture[] {
  const rng = mulberry32(seed);
  const p = new Px(FIELD, FIELD);
  p.fill(PAL.dirtBase);
  // manchas grandes de valor (terra batida irregular — cavas e cristas)
  for (let i = 0; i < Math.round(10 * S * S); i++) wrapBlob(p, rng() * FIELD, rng() * FIELD, (10 + rng() * 14) * S, rng() < 0.5 ? PAL.dirtDark : PAL.dirtMid, rng, 2.8 * S);
  for (let i = 0; i < Math.round(1100 * S * S); i++) {
    const x = rng() * FIELD | 0, y = rng() * FIELD | 0, r = rng();
    p.px(x, y, r < 0.45 ? PAL.dirtDark : r < 0.8 ? PAL.dirtMid : PAL.dirtLight);
  }
  for (let i = 0; i < Math.round(110 * S * S); i++) {
    const x = rng() * (FIELD - 2 * S) | 0, y = rng() * (FIELD - 2 * S) | 0;
    p.rect(x, y, 2 * S, S, PAL.dirtStone);
    p.px(x, y, PAL.dirtLight);
    p.px(x, y + S, PAL.dirtDark);
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
  const GS = 24 * S; // espaçamento médio das lajes (px) — lajes GRANDES, leitura calma
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
  // Lookup espacial: a semente mais próxima está sempre na vizinhança 3×3 de
  // células (jitter < ½ célula), então varro 9 sementes em vez de cols×rows.
  // Mesmo resultado do brute-force, ~3× menos trabalho. Índice = r·cols + c.
  const cellW = FIELD / cols, cellH = FIELD / rows;
  const cellOf = (px: number, py: number): number => {
    let best = 0, bd = 1e9;
    const qc = Math.floor(px / cellW), qr = Math.floor(py / cellH);
    for (let dr = -1; dr <= 1; dr++) {
      const rr = (((qr + dr) % rows) + rows) % rows;
      for (let dc = -1; dc <= 1; dc++) {
        const i = rr * cols + ((((qc + dc) % cols) + cols) % cols);
        const s = seeds[i];
        let dx = Math.abs(px - s.x); if (dx > FIELD / 2) dx = FIELD - dx; // toroidal
        let dy = Math.abs(py - s.y); if (dy > FIELD / 2) dy = FIELD - dy;
        const d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = i; }
      }
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
      let col: string;
      if (edgeBR) {
        col = JOINT;
      } else if (edgeTL) {
        col = `rgb(${cb(R + 34)},${cb(G + 34)},${cb(B + 35)})`; // lip de luz
      } else if (at(x + 1, y) !== id || at(x, y + 1) !== id || at(x + 2, y) !== id || at(x, y + 2) !== id) {
        col = `rgb(${cb(R - 22)},${cb(G - 21)},${cb(B - 18)})`; // sombra interna sob o lip
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

// Chão de SUBSOLO (esgoto/caverna): rocha ORGÂNICA mosqueada — lumps arredondados
// encaixados, NÃO laje retangular (que repetiria igual à pedra da cidade). Mesmo
// motor Voronoi-toroidal do piso de pedra, mas sombreado como MONTÍCULO: o centro
// do lump pega luz (topo-esq), recesso fundo entre lumps → rocha úmida e abaulada.
// Limo (blobs verdes) e poças (brilho úmido) são camadas opcionais por cima — o
// chão "vivo" do esgoto sem repetir a superfície. Fecha seamless em 128 (toroidal).
export interface RockOpts {
  base: { r: number; g: number; b: number };
  joint: string; // recesso fundo entre lumps
  pebble: string; // cascalho solto (specks claros)
  gs: number; // tamanho médio do lump (px) — menor = cobble miúdo
}

function makeOrganicRockField(seed: number, o: RockOpts): Texture[] {
  return sliceField(buildRockField(seed, o).texture());
}

/** Desenha o campo 128×128 de rocha orgânica (separado p/ preview de dev). */
export function buildRockField(seed: number, o: RockOpts): Px {
  const rng = mulberry32(seed);
  const p = new Px(FIELD, FIELD);
  const cb = (n: number) => Math.max(0, Math.min(255, n | 0));
  const { r: BR, g: BG, b: BB } = o.base;
  const cols = Math.round(FIELD / (o.gs * S)), rows = Math.round(FIELD / (o.gs * S));
  const cw = FIELD / cols, ch = FIELD / rows;
  const seeds: { x: number; y: number; tone: number }[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      seeds.push({
        x: (c + 0.5) * cw + (hash2D(c, r, seed) - 0.5) * cw * 0.92,
        y: (r + 0.5) * ch + (hash2D(c, r, seed + 1) - 0.5) * ch * 0.92,
        tone: 0.9 + hash2D(c, r, seed + 2) * 0.16, // variação de valor CALMA (não patchwork)
      });
  const half = FIELD / 2;
  const [JR, JG, JB] = hexRgb(o.joint);
  const TAU = Math.PI * 2;
  // DOMAIN WARP periódico (seamless): ondula a coord antes do Voronoi → fronteiras
  // orgânicas, não reta de "crazy-paving". O termo de wx depende SÓ de y e o de wy
  // SÓ de x → pré-computo por linha/coluna (2·FIELD sin/cos em vez de 4·FIELD²).
  const warpX = new Float64Array(FIELD), warpY = new Float64Array(FIELD);
  for (let i = 0; i < FIELD; i++) {
    warpX[i] = Math.sin((TAU * 3 * i) / FIELD + seed) * 2.4 * S + Math.sin((TAU * 7 * i) / FIELD) * 1.1 * S;
    warpY[i] = Math.cos((TAU * 3 * i) / FIELD + seed) * 2.4 * S + Math.cos((TAU * 7 * i) / FIELD) * 1.1 * S;
  }
  for (let y = 0; y < FIELD; y++) {
    const wxRow = warpX[y]; // wx = x + warpX[y] (constante na linha)
    for (let x = 0; x < FIELD; x++) {
      const wx = x + wxRow, wy = y + warpY[x];
      // 1º e 2º vizinhos (distância TOROIDAL) → fronteira = sqrt(d2) − sqrt(d1).
      // Lookup espacial 5×5: warp + 2º-vizinho cabem na vizinhança (jitter+warp <
      // 1 célula), varro 25 sementes em vez de cols×rows. Índice = r·cols + c.
      const qc = Math.floor(wx / cw), qr = Math.floor(wy / ch);
      let b1 = 1e9, b2 = 1e9, id = 0, sox = 0, soy = 0;
      for (let dr = -2; dr <= 2; dr++) {
        const rr = (((qr + dr) % rows) + rows) % rows;
        for (let dc = -2; dc <= 2; dc++) {
          const i = rr * cols + ((((qc + dc) % cols) + cols) % cols);
          let dx = wx - seeds[i].x; if (dx > half) dx -= FIELD; else if (dx < -half) dx += FIELD;
          let dy = wy - seeds[i].y; if (dy > half) dy -= FIELD; else if (dy < -half) dy += FIELD;
          const d = dx * dx + dy * dy;
          if (d < b1) { b2 = b1; b1 = d; id = i; sox = dx; soy = dy; }
          else if (d < b2) { b2 = d; }
        }
      }
      const s = seeds[id];
      const edge = Math.sqrt(b2) - Math.sqrt(b1); // ~0 na fronteira entre lumps
      // corpo do lump: mid-tone CALMO + volume leve (topo-esq) + grão fino dois-lados —
      // SEM rim claro (era o que dava cara de cerâmica trincada).
      const dir = -(sox + soy) * 0.42;
      const grain = (hash2D(x, y, seed + 7) - 0.5) * 9;
      let R = BR * s.tone + dir + grain, G = BG * s.tone + dir + grain, B = BB * s.tone + dir + grain;
      // recesso ESCURO e SUAVE entre os lumps (gradiente p/ a junta, não linha dura) —
      // é a sombra que arredonda a pedra e dá a leitura "rocha úmida abaulada". Junta
      // ESTREITA e não-100% inky (t teto 0.85) → grout sutil, pedra miúda.
      if (edge < 2.6 * S) {
        const t = (1 - edge / (2.6 * S)) * 0.85; // 0..0.85 (não chega ao preto puro)
        R = R * (1 - t) + JR * t; G = G * (1 - t) + JG * t; B = B * (1 - t) + JB * t;
      }
      p.px(x, y, `rgb(${cb(R)},${cb(G)},${cb(B)})`);
    }
  }
  // cascalho solto: specks esparsos (pegam luz / caem na junta) — sem virar grade.
  // Limo e poças NÃO entram aqui: vêm da camada de SCATTER por tile (makeScatterDecals)
  // → evitam a repetição em grade que aparecia ao bakear no campo de 128.
  for (let i = 0; i < Math.round(90 * S * S); i++) {
    const x = rng() * FIELD | 0, y = rng() * FIELD | 0;
    p.px(x, y, rng() < 0.5 ? o.pebble : o.joint);
  }
  return p;
}

function makeBridge(seed: number): Texture {
  const rng = mulberry32(seed);
  const p = new Px(TILE_SIZE, TILE_SIZE);
  p.fill(PAL.shieldWood);
  // tábuas horizontais: sulco a cada 8px + highlight no topo de cada tábua
  for (let y = 0; y < TILE_SIZE; y += 8 * S) {
    p.rect(0, y, TILE_SIZE, S, PAL.shieldWoodDark);
    p.rect(0, y + S, TILE_SIZE, S, PAL.shieldWoodLight);
  }
  // veios da madeira (riscos horizontais curtos)
  for (let i = 0; i < Math.round(22 * S * S); i++) {
    const x = Math.floor(rng() * (TILE_SIZE - 3 * S));
    const y = Math.floor(rng() * TILE_SIZE);
    if (y % (8 * S) <= S) continue; // não sujar sulco/highlight
    p.rect(x, y, (2 + Math.floor(rng() * 3)) * S, S, rng() < 0.6 ? PAL.shieldWoodDark : PAL.shieldWoodLight);
  }
  // pregos nas cabeceiras das tábuas
  for (let y = 4 * S; y < TILE_SIZE; y += 8 * S) {
    p.rect(2 * S, y, S, S, PAL.woodPost);
    p.rect(TILE_SIZE - 3 * S, y, S, S, PAL.woodPost);
  }
  return p.texture();
}

function makeSwamp(seed: number): Texture {
  const rng = mulberry32(seed);
  const p = new Px(TILE_SIZE, TILE_SIZE);
  p.fill(PAL.grassDark);
  // poças paradas de água lamacenta
  for (let i = 0; i < Math.round(6 * S * S); i++) {
    const x = Math.floor(rng() * (TILE_SIZE - 5 * S));
    const y = Math.floor(rng() * (TILE_SIZE - 4 * S));
    const w = (3 + Math.floor(rng() * 3)) * S;
    p.rect(x, y, w, 2 * S, PAL.waterDark);
    p.rect(x + S, y + S, w - 2 * S, S, PAL.waterBase);
  }
  // lama e matéria podre
  for (let i = 0; i < Math.round(18 * S * S); i++) {
    const x = Math.floor(rng() * TILE_SIZE);
    const y = Math.floor(rng() * TILE_SIZE);
    p.rect(x, y, S, S, rng() < 0.5 ? PAL.dirtDark : PAL.grassMid);
  }
  // tufos de junco doentios
  for (let i = 0; i < Math.round(4 * S * S); i++) {
    const x = 2 * S + Math.floor(rng() * (28 * S));
    const y = 3 * S + Math.floor(rng() * (26 * S));
    p.rect(x, y, S, S, PAL.grassMid);
    p.rect(x, y - S, S, S, PAL.grassMid);
    p.rect(x + S, y - 2 * S, S, S, PAL.grassDark);
  }
  return p.texture();
}

function makeWaterFrames(): Texture[] {
  const frames: Texture[] = [];
  for (let f = 0; f < 3; f++) {
    const p = new Px(TILE_SIZE, TILE_SIZE);
    p.fill(PAL.waterBase);
    for (let y = 0; y < TILE_SIZE; y++) {
      for (let x = 0; x < TILE_SIZE; x++) {
        const w1 = Math.sin((x + y * 2.7 + f * 3.4 * S) * (0.55 / S));
        const w2 = Math.sin((x * 0.8 - y * 1.3 - f * 2.6 * S) * (0.4 / S));
        if (w1 > 0.82) p.px(x, y, PAL.waterMid);
        if (w1 > 0.96) p.px(x, y, PAL.waterLight);
        if (w2 > 0.93 && w1 > 0.4) p.px(x, y, PAL.waterDark);
      }
    }
    // brilhos pontuais
    const rng = mulberry32(900 + f);
    for (let i = 0; i < Math.round(4 * S * S); i++) {
      const x = 2 + Math.floor(rng() * (TILE_SIZE - 5));
      const y = 2 + Math.floor(rng() * (TILE_SIZE - 5));
      p.rect(x, y, 2 * S, S, PAL.waterFoam);
    }
    frames.push(p.texture());
  }
  return frames;
}

// ──────────────────────────────────────────────────────────────────────
// Subsolo / dungeon — PROCEDURAL (SISTEMA-ANDARES.md). Chão de rocha orgânica
// (makeOrganicRockField, abaixo) + água suja + paredes dimensionais. Mesma
// qualidade de volume do terreno da superfície; tilesets PixelLab descartados
// (jun/2026) por chaparem e repetirem — o procedural é mais bonito e seamless.
// ──────────────────────────────────────────────────────────────────────

interface MurkyPal { base: string; mid: string; dark: string; light: string; foam: string; }
interface DWallPal { top: string; topHi: string; joint: string; face: string; faceHi: string; faceDark: string; accent: string; }

// Água "suja" animada (esgoto/poça funda). 3 frames (casa com o contador global de
// água do WorldRenderer). NÃO preenche o tile com onda (vira treliça/tricô): é uma
// superfície ESCURA quase uniforme + manchas de tom orgânicas (profundidade/escuma)
// + GLINTS de crista esparsos que derivam com o fluxo + bolhas que sobem. Manchas/
// glints/bolhas têm posição FIXA (seedada) e só derivam por frame → não tremelicam.
// Tudo seamless em 32px (wrap toroidal).
export function makeMurkyWaterFrames(pal: MurkyPal): Texture[] {
  const NF = 3;
  // remaster 128: canvas D=TILE_SIZE, posições/wrap derivam de D, contagens ×S²
  const D = TILE_SIZE;
  // granulado de profundidade: ESTÁTICO e de baixo contraste (mid sobre base) — dá
  // textura sem manchão; cobertura baixa esconde a repetição do tile.
  const grain = Array.from({ length: 40 * S * S }, (_, i) => ({ x: (hash2D(i, 0, 74) * D) | 0, y: (hash2D(i, 1, 74) * D) | 0 }));
  // ripples (glints de crista): traços curtos claros que DERIVAM com o fluxo — o que
  // dá a leitura "água parada brilhando", sem listra/treliça.
  const ripples = Array.from({ length: 9 * S * S }, (_, i) => ({ x: hash2D(i, 0, 73) * D, y: (hash2D(i, 1, 73) * D) | 0, len: (2 + ((hash2D(i, 2, 73) * 3) | 0)) * S }));
  const bubbles = Array.from({ length: 5 * S * S }, (_, i) => ({ x: (hash2D(i, 0, 72) * D) | 0, y: hash2D(i, 1, 72) * D }));
  const frames: Texture[] = [];
  for (let f = 0; f < NF; f++) {
    const p = new Px(D, D);
    p.fill(pal.base);
    const dx = f * 3 * S; // deriva horizontal do fluxo
    // 1. granulado sutil (estático) — só mid, baixo contraste
    for (const g of grain) p.rect(g.x, g.y, S, S, pal.mid);
    // 2. ripples: dash claro com sombra logo abaixo (crista pegando luz), derivam
    for (const rp of ripples) {
      const rx = ((((rp.x + dx) % D) + D) % D) | 0;
      for (let k = 0; k < rp.len; k++) {
        const xx = (rx + k) % D;
        p.rect(xx, rp.y, 1, S, pal.light);
        p.rect(xx, (rp.y + S) % D, 1, S, pal.mid);
      }
    }
    // 3. bolhas/foam que sobem devagar
    for (const b of bubbles) p.rect(b.x, ((((b.y - f * 2 * S) % D) + D) % D) | 0, S, S, pal.foam);
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

// Parede de subsolo — pedra ÚMIDA CONTÍNUA (sem grid de tijolos: o criador achou o
// padrão de blocos forçado). Face mosqueada com volume direcional (topo claro→base),
// rachaduras GRANDES jagged (a feature visual), musgo CREEPING subindo da base e das
// fendas (fino/dessaturado, não bolha) e estrias de grime. Referência Tibia/Apogea:
// muro de masmorra liso, velho e podre. 32×54, ancorado embaixo.
export function makeDungeonWallTile(mask: number, seed: number, pal: DWallPal): Texture {
  const SC = TILE_SIZE / 32; // fator de escala do remaster (S local é o vizinho sul, abaixo)
  const rng = mulberry32(seed + mask * 97 + 1);
  const p = new Px(TILE_SIZE, WALL_H);
  const cb = (n: number) => Math.max(0, Math.min(255, n | 0));
  const N = (mask & 1) !== 0, E = (mask & 2) !== 0, S = (mask & 4) !== 0, W = (mask & 8) !== 0;
  const OUT = "#070a0f";
  const topEnd = S ? WALL_H : WALL_TOP_H;
  const [fr, fg, fb] = hexRgb(pal.faceHi);
  const [tr, tg, tb] = hexRgb(pal.top);
  const [mr, mg, mb] = hexRgb(pal.accent); // musgo / líquen / ocre

  // ── TOPO (espessura vista de cima): pedra mosqueada escura, NÃO tijolos ──
  for (let y = 0; y < topEnd; y++)
    for (let x = 0; x < TILE_SIZE; x++) {
      const n = (hash2D(x, y, seed + 3) - 0.5) * 0.28;
      const v = 0.72 + n;
      p.px(x, y, `rgb(${cb(tr * v)},${cb(tg * v)},${cb(tb * v)})`);
    }
  if (!N) p.rect(0, 0, TILE_SIZE, SC, pal.topHi); // quina superior pega luz

  if (!S) {
    const faceTop = WALL_TOP_H, faceBot = WALL_H - SC, faceH = faceBot - faceTop;
    p.rect(0, faceTop - SC, TILE_SIZE, SC, OUT); // quina topo→face (sombra dura)
    const tone = (v: number) => `rgb(${cb(fr * v)},${cb(fg * v)},${cb(fb * v)})`;
    // 1. PEDRA contínua: gradiente vertical (topo claro→base) + mottle fino+manchão
    for (let y = faceTop; y < faceBot; y++) {
      const k = 1 - 0.5 * ((y - faceTop) / faceH); // 1 (topo) → 0.5 (base)
      for (let x = 0; x < TILE_SIZE; x++) {
        const n = (hash2D(x, y, seed + 5) - 0.5) * 0.22 + (hash2D((x / SC) >> 2, (y / SC) >> 1, seed + 6) - 0.5) * 0.2;
        p.px(x, y, tone(Math.max(0.14, k * (0.82 + n))));
      }
    }
    // 2. RACHADURAS: poucas e GRANDES, jagged, com aresta iluminada (profundidade de fenda)
    for (let c = 0, nc = 2 + ((rng() * 2) | 0); c < nc; c++) {
      let cx = (3 + rng() * 26) * SC, cy = faceTop + rng() * 5 * SC;
      let dir = (rng() - 0.5) * 0.7;
      for (let s = 0, steps = (faceH * (0.55 + rng() * 0.45)) | 0; s < steps && cy < faceBot; s++) {
        const ix = cx | 0, iy = cy | 0;
        p.rect(ix, iy, SC, SC, OUT); // fenda
        p.rect(ix + SC, iy, SC, SC, tone(0.5)); // lip iluminado (lado leste da fenda pega luz)
        cy += 1; cx = Math.max(SC, Math.min(TILE_SIZE - 2 * SC, cx + (dir + (rng() - 0.5) * 0.7) * SC));
        dir = Math.max(-0.9, Math.min(0.9, dir + (rng() - 0.5) * 0.4));
        if (rng() < 0.07) { // galho
          let bx = cx, by = cy;
          for (let b = 0, bl = 3 + ((rng() * 5) | 0); b < bl && by < faceBot; b++) { p.rect(bx | 0, by | 0, SC, SC, OUT); bx += (rng() < 0.5 ? 0.8 : -0.8) * SC; by += 0.6 * SC; }
        }
      }
    }
    // 3. CHIPS: lascas rasas (recesso escuro + lip claro acima) — desgaste pontual
    for (let i = 0, n = 2 + ((rng() * 3) | 0); i < n; i++) {
      const w = (3 + ((rng() * 5) | 0)) * SC, h = (2 + ((rng() * 3) | 0)) * SC;
      const x = SC + ((rng() * (30 * SC - w)) | 0), y = faceTop + 2 * SC + ((rng() * (faceH - h - 3 * SC)) | 0);
      p.rect(x, y, w, h, tone(0.3)); // recesso
      p.rect(x, y - SC, w, SC, tone(0.72)); // lip lit acima
    }
    // 4. MUSGO creeping: colunas finas subindo da base e das fendas, irregulares e
    //    dessaturadas, mais largas embaixo, com pontas claras. NÃO bolha redonda.
    for (let i = 0, n = 4 + ((rng() * 4) | 0); i < n; i++) {
      const baseX = SC + ((rng() * 30 * SC) | 0);
      const climb = 4 + ((rng() * 11) | 0);
      for (let s = 0; s < climb; s++) {
        const y = faceBot - SC - s * SC;
        const spread = 1 + (((climb - s) / climb) * 3) | 0; // alarga embaixo
        for (let dx = -spread; dx <= spread; dx++) {
          if (rng() < 0.5) continue; // textura esparsa (não preenche)
          const x = baseX + (dx + (rng() < 0.3 ? (rng() < 0.5 ? 1 : -1) : 0)) * SC;
          const lit = rng() < 0.28;
          p.rect(x, y, SC, SC, `rgb(${cb(mr + (lit ? 14 : -10))},${cb(mg + (lit ? 18 : -8))},${cb(mb - 8)})`);
        }
      }
    }
    // 5. GRIME: estrias úmidas escuras escorrendo do topo
    for (let i = 0; i < 3; i++) {
      const sx = 2 * SC + ((rng() * 28 * SC) | 0);
      for (let s = 0, sh = (6 + ((rng() * 22) | 0)) * SC; s < sh && faceTop + s < faceBot; s += SC) if (rng() < 0.72) p.rect(sx, faceTop + s, SC, SC, tone(0.4));
    }
    p.rect(0, WALL_H - 3 * SC, TILE_SIZE, 3 * SC, "rgba(0,0,0,0.45)"); // sombra de contato
    p.rect(0, WALL_H - SC, TILE_SIZE, SC, "rgba(0,0,0,0.30)");
  }
  if (!W) p.rect(0, 0, SC, WALL_H, OUT);
  if (!E) p.rect(TILE_SIZE - SC, 0, SC, WALL_H, OUT);
  if (!N) p.rect(0, 0, TILE_SIZE, SC, OUT);
  return p.texture();
}

function makeDungeonWallTiles(seed: number, pal: DWallPal): Texture[][] {
  const out: Texture[][] = [];
  for (let m = 0; m < 16; m++) out.push([makeDungeonWallTile(m, seed, pal), makeDungeonWallTile(m, seed + 1000, pal)]);
  return out;
}

// Chão de subsolo procedural (makeOrganicRockField): esgoto = slate frio úmido com
// limo+poças; caverna = rocha quente seca, lumps maiores. Identidades distintas.
export const SEWER_ROCK: RockOpts = { base: { r: 96, g: 106, b: 120 }, joint: "#232c37", pebble: "#aeb8c6", gs: 10 };
export const CAVE_ROCK: RockOpts = { base: { r: 78, g: 69, b: 56 }, joint: "#221c14", pebble: "#94886e", gs: 14 };
export const SEWAGE_PAL: MurkyPal = { base: "#313722", mid: "#424a2e", dark: "#20251a", light: "#525a38", foam: "#67714a" };
export const DEEPWATER_PAL: MurkyPal = { base: "#131e29", mid: "#1c2c3a", dark: "#0a1018", light: "#284058", foam: "#34526b" };
export const SEWER_WALL_PAL: DWallPal = { top: "#3a4642", topHi: "#4a5a54", joint: "#232c29", face: "#2a332f", faceHi: "#3a4641", faceDark: "#1c2320", accent: "#38502f" };
export const OLD_MASONRY_PAL: DWallPal = { top: "#4a463a", topHi: "#5c5746", joint: "#2c281f", face: "#3a372e", faceHi: "#4a463a", faceDark: "#25221b", accent: "#6a6450" };
const CAVE_WALL_PAL: DWallPal = { top: "#3d362c", topHi: "#4c4435", joint: "#221d16", face: "#2e2a22", faceHi: "#3d362c", faceDark: "#1d1913", accent: "#4a3f2c" };

// ──────────────────────────────────────────────────────────────────────
// Objetos do mundo
// ──────────────────────────────────────────────────────────────────────

function makeTree(seed: number): Texture {
  const rng = mulberry32(seed);
  const p = new Px(32 * S, 64 * S);
  // (sombra de contato vem da camada `shadows` do WorldRenderer — suave e vaza)
  // tronco
  p.rect(13 * S, 38 * S, 6 * S, 18 * S, PAL.trunkBase);
  p.rect(13 * S, 38 * S, 2 * S, 18 * S, PAL.trunkLight);
  p.rect(12 * S, 52 * S, 8 * S, 4 * S, PAL.trunkBase);
  p.rect(11 * S, 55 * S, S, S, PAL.trunkDark);
  p.rect(20 * S, 55 * S, S, S, PAL.trunkDark);
  for (let i = 0; i < Math.round(6 * S * S); i++) {
    p.rect((14 + Math.floor(rng() * 4)) * S, (40 + Math.floor(rng() * 14)) * S, S, S, PAL.trunkDark);
  }
  // copa — camadas de blobs (escuro → claro, luz vindo de cima/esquerda)
  p.blob(16 * S, 30 * S, 9 * S, PAL.canopyDark, rng);
  p.blob(9 * S, 25 * S, 7 * S, PAL.canopyDark, rng);
  p.blob(23 * S, 25 * S, 7 * S, PAL.canopyDark, rng);
  p.blob(16 * S, 18 * S, 9 * S, PAL.canopyDark, rng);
  p.blob(15 * S, 17 * S, 8 * S, PAL.canopyBase, rng);
  p.blob(10 * S, 24 * S, 5 * S, PAL.canopyBase, rng);
  p.blob(22 * S, 23 * S, 5 * S, PAL.canopyBase, rng);
  p.blob(13 * S, 15 * S, 6 * S, PAL.canopyMid, rng);
  p.blob(11 * S, 21 * S, 3 * S, PAL.canopyMid, rng);
  p.blob(12 * S, 13 * S, 4 * S, PAL.canopyLight, rng);
  for (let i = 0; i < Math.round(10 * S * S); i++) {
    const x = (6 + Math.floor(rng() * 16)) * S;
    const y = (9 + Math.floor(rng() * 14)) * S;
    p.rect(x, y, S, S, PAL.canopyGlint);
  }
  p.outline(PAL.outline);
  return p.texture();
}

function makeRock(seed: number): Texture {
  const rng = mulberry32(seed);
  const p = new Px(32 * S, 32 * S);
  // (sombra de contato vem da camada `shadows` do WorldRenderer)
  p.blob(16 * S, 20 * S, 8 * S, PAL.rockBase, rng);
  p.blob(15 * S, 18 * S, 7 * S, PAL.rockMid, rng);
  p.blob(13 * S, 15 * S, 4 * S, PAL.rockTop, rng);
  // rachaduras
  for (let i = 0; i < Math.round(5 * S * S); i++) {
    p.rect((10 + Math.floor(rng() * 12)) * S, (14 + Math.floor(rng() * 10)) * S, S, S, PAL.stoneCrack);
  }
  p.outline(PAL.outline);
  return p.texture();
}

// ──────────────────────────────────────────────────────────────────────
// Mobília urbana (kit de feira: barril / caixa / tenda)
// ──────────────────────────────────────────────────────────────────────
// Portado do protótipo aprovado (prop-preview): madeira reusa a paleta central
// (woodPost/woodPostLight); ferro/linho/pano são específicos do kit. Luz vem de
// cima-esquerda. Outline desenhado à mão como backing rect (a silhueta depende
// dele, não do contorno automático). Anchor (0.5,1) no WorldRenderer.
const PROP_OUT = PAL.outline;
const WOOD = PAL.woodPost, WOOD_LT = PAL.woodPostLight, WOOD_DK = "#2a2016", WOOD_HI = "#5e4a34";
const IRON = "#20242c", IRON_HI = "#3a4150";
const LINEN = "#b8a784", LINEN_SH = "#8f8060", LINEN_HI = "#cdbf9d";
const CLOTH = "#9a4f3c", CLOTH_SH = "#6e3a2c"; // vermelho-poeira dessaturado (acento quente)

// Light GLOBAL top-left, mesma da árvore/muro. Estes três são desenhados em
// LOW-TOP-DOWN (vê-se a face de topo + a frente), pra casar a perspectiva do
// mundo procedural — não em elevação frontal. `p.outline` fecha a silhueta.

/** Barril (18×24): tampa elíptica visível no topo + cilindro com a luz
 *  envolvendo (highlight à esquerda do centro) + dois aros de ferro. */
function makeBarrel(): Texture {
  const p = new Px(18 * S, 24 * S);
  const cx = 9 * S;
  const top = 5 * S, bot = 21 * S;
  // ramp do cilindro (luz top-left → pico perto de x=6): 12 colunas (corpo x 3..14)
  const ramp = [WOOD_DK, WOOD, WOOD_LT, WOOD_HI, WOOD_LT, WOOD, WOOD, WOOD, WOOD, WOOD_DK, WOOD_DK, WOOD_DK];
  for (let i = 0; i < 12; i++) p.rect((3 + i) * S, top, S, bot - top, ramp[i]);
  // barriga: 1px pra fora nos lados no meio (silhueta arredondada)
  for (let y = top + 4 * S; y < bot - 4 * S; y++) {
    p.rect(2 * S, y, S, 1, ramp[0]);
    p.rect(15 * S, y, S, 1, ramp[11]);
  }
  // costuras de duela (tábuas) entre os aros
  for (const sx of [6, 9, 12]) p.rect(sx * S, top + S, S, bot - top - 2 * S, WOOD_DK);
  // aros de ferro (2) — topo do aro pega luz
  for (const ay of [8, 16]) {
    p.rect(2 * S, ay * S, 14 * S, S, IRON_HI);
    p.rect(2 * S, ay * S + S, 14 * S, 2 * S, IRON);
  }
  // tampa elíptica no topo (a chave do low-top-down)
  p.ellipse(cx, top, 6 * S, 2.4 * S, WOOD);
  p.ellipse(cx, top, 5 * S, 1.8 * S, WOOD_LT);
  for (let x = cx - 3 * S; x <= cx + S; x++) p.rect(x, top - 2 * S, 1, S, WOOD_HI); // crista lit (back rim)
  for (let x = cx - 6 * S; x <= cx + 6 * S; x++) if (((x - cx) / (6 * S)) ** 2 <= 1) p.rect(x, top + 2 * S, 1, S, IRON); // aro da tampa
  p.outline(PROP_OUT);
  return p.texture();
}

/** Caixa/engradado (18×17): face de topo (encara o céu → mais clara) + face
 *  frontal com X de reforço; quina topo→frente marcada vende o 3/4. */
function makeCrate(): Texture {
  const p = new Px(18 * S, 17 * S);
  // face de topo (leve overhang) — y 2..5
  const topRows = [[3, 14], [3, 14], [3, 14], [4, 13]];
  for (let r = 0; r < topRows.length; r++) {
    const [a, b] = topRows[r];
    p.rect(a * S, (2 + r) * S, (b - a + 1) * S, S, r < 2 ? WOOD_HI : WOOD_LT);
  }
  for (const sx of [7, 10]) p.rect(sx * S, 2 * S, S, 4 * S, WOOD_LT); // ripas do topo
  // face frontal — y 6..14
  p.rect(3 * S, 6 * S, 12 * S, 9 * S, WOOD);
  p.rect(3 * S, 6 * S, 12 * S, S, WOOD_DK); // quina topo→frente (vende o 3/4)
  p.rect(3 * S, 6 * S, 2 * S, 9 * S, WOOD_LT); // poste esq (luz)
  p.rect(13 * S, 6 * S, 2 * S, 9 * S, WOOD_DK); // poste dir (sombra)
  p.rect(3 * S, 13 * S, 12 * S, 2 * S, WOOD_DK); // base em sombra
  for (let i = 0; i < 8 * S; i++) {
    p.rect((5 * S + i), 7 * S + i, S, S, WOOD_HI); // X de reforço (diagonal lit)
    p.rect((12 * S - i), 7 * S + i, S, S, WOOD_DK);
  }
  for (const [x, y] of [[4, 7], [13, 7], [4, 13], [13, 13]] as const) p.rect(x * S, y * S, S, S, IRON_HI); // pregos
  p.outline(PROP_OUT);
  return p.texture();
}

/** Tenda/banca de feira (46×42): toldo com TOPO visível (3/4) + franja
 *  escalopada + balcão de tábuas com mercadoria encostada. */
function makeStall(): Texture {
  const p = new Px(46 * S, 42 * S);
  // postes (atrás)
  for (const px of [8, 35]) {
    p.rect(px * S, 17 * S, 2 * S, 21 * S, WOOD);
    p.rect((px + 1) * S, 17 * S, S, S, WOOD_DK);
    p.rect(px * S, 17 * S, 2 * S, S, WOOD_LT);
  }
  const bands = 6, bw = 40 * S / bands;
  // topo do toldo visível (plano superior recuado, em sombra leve → vende o 3/4)
  for (let b = 0; b < bands; b++) {
    const isL = b % 2 === 0;
    const x0 = 3 * S + Math.round(b * bw), x1 = 3 * S + Math.round((b + 1) * bw);
    p.rect(x0 + S, 2 * S, x1 - x0, 3 * S, isL ? LINEN_SH : CLOTH_SH);
  }
  // frente do toldo (caída) — y 5..14
  for (let b = 0; b < bands; b++) {
    const isL = b % 2 === 0;
    const col = isL ? LINEN : CLOTH, sh = isL ? LINEN_SH : CLOTH_SH, hi = isL ? LINEN_HI : CLOTH;
    const x0 = 3 * S + Math.round(b * bw), x1 = 3 * S + Math.round((b + 1) * bw);
    p.rect(x0, 5 * S, x1 - x0, 10 * S, col);
    p.rect(x0, 5 * S, x1 - x0, S, hi); // crista
    p.rect(x0, 14 * S, x1 - x0, S, sh); // borda frontal
    const sc = (x0 + x1) >> 1;
    for (let k = 0; k < 4; k++) p.rect(sc - (3 - k) * S, (15 + k) * S, ((3 - k) * 2 + 1) * S, S, sh); // franja
  }
  // balcão — tampo lit (visto de cima) + face de tábuas
  p.rect(7 * S, 27 * S, 32 * S, 4 * S, WOOD_LT);
  p.rect(7 * S, 27 * S, 32 * S, S, WOOD_HI);
  p.rect(7 * S, 31 * S, 32 * S, 7 * S, WOOD);
  for (let i = 0; i < 6; i++) p.rect((10 + i * 5) * S, 31 * S, S, 7 * S, WOOD_DK); // juntas das tábuas
  p.rect(7 * S, 37 * S, 32 * S, S, WOOD_DK);
  // mercadoria (sacos) sobre o tampo, no vão aberto
  for (const sx of [13, 20, 27]) {
    p.rect((sx + 1) * S, 22 * S, 3 * S, 5 * S, LINEN);
    p.rect((sx + 1) * S, 22 * S, S, S, LINEN_HI);
    p.rect((sx + 1) * S, 26 * S, 3 * S, S, LINEN_SH);
  }
  p.outline(PROP_OUT);
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
// Altura do tile de muro (32×54 @32px): face ALTA pra dar volume (estilo Apogea/Tibia).
const WALL_H = 54 * S;
const WALL_TOP_H = 14 * S; // espessura do topo visto de cima
function makeWallTile(mask: number, seed: number): Texture {
  const SC = TILE_SIZE / 32; // escala do remaster (S local = vizinho sul)
  const rng = mulberry32(seed + mask * 97 + 1);
  const p = new Px(TILE_SIZE, WALL_H);
  const N = (mask & 1) !== 0;
  const E = (mask & 2) !== 0;
  const S = (mask & 4) !== 0;
  const W = (mask & 8) !== 0;
  const OUT = "#080b10";

  // TOPO em pedra cortada (cobble): se há muro ao sul o topo desce até embaixo
  // (face oculta pelo muro da frente); senão topo fino + face ALTA.
  const topEnd = S ? WALL_H : WALL_TOP_H;
  p.rect(0, 0, TILE_SIZE, topEnd, "#39414d"); // argamassa/fundo escuro
  const TB: [string, string][] = [["#454f5d", "#5a6676"], ["#4c5868", "#606d7e"], ["#404a58", "#525e6e"]];
  const JOINT = "#262c34";
  for (let ry = -2 * SC; ry < topEnd; ry += 7 * SC) {
    const off = ((((ry + 2 * SC) / (7 * SC)) | 0) & 1) === 0 ? 0 : 9 * SC;
    for (let rx = -off; rx < TILE_SIZE; rx += 13 * SC) {
      const [fill, hi] = TB[Math.floor(rng() * TB.length)];
      const bw = (11 + Math.floor(rng() * 3)) * SC;
      const by = ry + SC; if (by >= topEnd) continue;
      const bh = Math.min(6 * SC, topEnd - by);
      p.rect(rx + SC, by, bw, bh, fill);
      p.rect(rx + SC, by, bw, SC, hi);
      if (ry >= 0) p.rect(rx, ry, bw + 2 * SC, SC, JOINT);
      p.rect(rx, by, SC, bh, JOINT);
      if (bh > 2 * SC && rng() < 0.22) p.rect(rx + 2 * SC + Math.floor(rng() * Math.max(1, bw - 2 * SC)), by + SC + Math.floor(rng() * (bh - SC)), SC, SC, JOINT);
    }
  }
  // lip de luz na borda NORTE só se for borda externa (topo pega a luz)
  if (!N) p.rect(0, SC, TILE_SIZE, 2 * SC, PAL.wallTopLight);

  if (!S) {
    // separação topo → face
    p.rect(0, WALL_TOP_H - 2 * SC, TILE_SIZE, SC, "#161a21");
    p.rect(0, WALL_TOP_H - SC, TILE_SIZE, SC, "#0a0d12");
    const faceTop = WALL_TOP_H, faceBot = WALL_H - SC, faceH = faceBot - faceTop;
    const cb = (n: number) => Math.max(0, Math.min(255, n | 0));
    // PEDRAS ORGÂNICAS (Voronoi): sementes em running-bond jittered → células
    // irregulares que se ENCAIXAM (não grade/LEGO). Cada pedra: topo com luz,
    // juntas escuras nos vãos, corpo com tom próprio + gradiente direcional.
    const seeds: { x: number; y: number; tone: number; warm: number }[] = [];
    const srows = Math.round(faceH / (9 * SC)) + 1;
    for (let r = -1; r <= srows; r++) {
      for (let c = -1; c <= 4; c++) {
        seeds.push({
          x: c * 8 * SC + ((r & 1) ? 4 * SC : 0) + (rng() * 6 - 3) * SC,
          y: faceTop + r * 9 * SC + (rng() * 5 - 2.5) * SC,
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
    const cmap = new Int16Array(TILE_SIZE * faceH);
    for (let yy = 0; yy < faceH; yy++) for (let xx = 0; xx < TILE_SIZE; xx++) cmap[yy * TILE_SIZE + xx] = cellOf(xx, faceTop + yy);
    for (let yy = 0; yy < faceH; yy++) {
      const py = faceTop + yy;
      const t = yy / faceH;
      for (let xx = 0; xx < TILE_SIZE; xx++) {
        const id = cmap[yy * TILE_SIZE + xx];
        const s = seeds[id];
        const v = s.tone * (1 - 0.5 * t); // gradiente direcional (volume)
        const R = cb(60 * v + s.warm), G = cb(64 * v + s.warm * 0.4), B = cb(76 * v + 5);
        const up = yy > 0 ? cmap[(yy - 1) * TILE_SIZE + xx] : -1;
        const dn = yy < faceH - 1 ? cmap[(yy + 1) * TILE_SIZE + xx] : id;
        const lf = xx > 0 ? cmap[yy * TILE_SIZE + xx - 1] : id;
        const rt = xx < TILE_SIZE - 1 ? cmap[yy * TILE_SIZE + xx + 1] : id;
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
      let cx = 4 * SC + (rng() * 24 * SC | 0), cy = faceTop + 3 * SC;
      const len = (8 + (rng() * 14 | 0)) * SC;
      for (let s = 0; s < len && cy < faceBot - SC; s++) { p.rect(cx, cy, SC, SC, "#080b10"); cy++; cx += ((rng() * 3 | 0) - 1) * SC; }
    }
    for (let x = 0; x < TILE_SIZE; x += SC) if (rng() < 0.2) p.rect(x, faceBot - SC - (rng() * 2 | 0) * SC, SC, SC, mossC[rng() * mossC.length | 0]);
    p.rect(0, WALL_H - 3 * SC, TILE_SIZE, 3 * SC, "rgba(0,0,0,0.5)"); // sombra de contato funda
    p.rect(0, WALL_H - SC, TILE_SIZE, SC, "rgba(0,0,0,0.35)");
  }

  // ── NUANCE: musgo frio (junta do topo e base da face) + rachadura ──
  const MOSS = ["#2c3a2b", "#384a36", "#243527"];
  if (rng() < 0.5) {
    const spots = 1 + Math.floor(rng() * 3);
    for (let k = 0; k < spots; k++) {
      const mx = Math.floor(rng() * 28 * SC);
      const my = S ? Math.floor(rng() * 38 * SC) : WALL_TOP_H + 2 * SC + Math.floor(rng() * (WALL_H - WALL_TOP_H - 6 * SC));
      const ch = (2 + Math.floor(rng() * 2)) * SC, cw = (2 + Math.floor(rng() * 3)) * SC;
      for (let dy = 0; dy < ch; dy += SC) for (let dx = 0; dx < cw; dx += SC) if (rng() < 0.6) p.rect(mx + dx, my + dy, SC, SC, MOSS[Math.floor(rng() * MOSS.length)]);
    }
  }
  if (!S && rng() < 0.4) { // rachadura descendo a face
    let cx = 5 * SC + Math.floor(rng() * 22 * SC), cy = WALL_TOP_H + 2 * SC;
    const len = (8 + Math.floor(rng() * 12)) * SC;
    for (let s = 0; s < len && cy < WALL_H - 3 * SC; s++) { p.rect(cx, cy, SC, SC, "#070a0f"); if (rng() < 0.4) p.rect(cx + SC, cy, SC, SC, "#070a0f"); cy++; cx += (Math.floor(rng() * 3) - 1) * SC; }
  }

  // CAPS onde não há vizinho — fecham o fim do muro
  if (!W) { p.rect(0, 0, SC, WALL_H, OUT); p.rect(SC, 0, SC, topEnd, "#39414d"); }
  if (!E) { p.rect(TILE_SIZE - SC, 0, SC, WALL_H, OUT); p.rect(TILE_SIZE - 2 * SC, 0, SC, topEnd, "#39414d"); }
  if (!N) p.rect(0, 0, TILE_SIZE, SC, OUT);

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
  const SC = TILE_SIZE / 32;
  const rng = mulberry32(seed);
  const W = wTiles * TILE_SIZE, H = 48 * SC, LH = 14 * SC; // LH = altura do lintel
  const p = new Px(W, H);
  const OUT = "#10141c", POST = 9 * SC;
  const TB: [string, string][] = [["#414956", "#525c6a"], ["#485160", "#586473"], ["#3d4450", "#4b5563"]];
  // LINTEL de pedra no topo (full width)
  p.rect(0, 0, W, LH, "#3b424e");
  for (let ry = -2 * SC; ry < LH; ry += 7 * SC) for (let rx = -((((ry + 2 * SC) / (7 * SC)) | 0) & 1 ? 9 * SC : 0); rx < W; rx += 13 * SC) {
    const [fill, hi] = TB[Math.floor(rng() * TB.length)]; const bw = (11 + Math.floor(rng() * 3)) * SC; const by = ry + SC; if (by >= LH) continue; const bh = Math.min(6 * SC, LH - by);
    p.rect(rx + SC, by, bw, bh, fill); p.rect(rx + SC, by, bw, SC, hi); if (ry >= 0) p.rect(rx, ry, bw + 2 * SC, SC, "#2f3640"); p.rect(rx, by, SC, bh, "#2f3640");
  }
  p.rect(0, LH - SC, W, SC, "#0c0f15");
  // POSTES de pedra (faces escuras) nas laterais
  for (const px0 of [0, W - POST]) for (let row = 0; row < 4; row++) {
    const y = LH + row * 8 * SC, base = Math.floor(46 * (1 - row * 0.16));
    p.rect(px0, y, POST, 8 * SC, `rgb(${base},${base + 6},${base + 15})`);
    p.rect(px0, y, POST, SC, `rgb(${base + 10},${base + 16},${base + 26})`);
    p.rect(px0, y, POST, SC, "#0c0f15");
  }
  // PORTA de madeira reforçada (entre os postes)
  const dx0 = POST, dw = W - POST * 2, mid = dx0 + (dw >> 1);
  p.rect(dx0, LH, dw, H - LH, "#3b2c1f");
  for (let x = dx0; x < dx0 + dw; x += 5 * SC) p.rect(x, LH, SC, H - LH, (x / SC) % 2 ? "#2a1e14" : "#4c3a29");
  for (const by of [20 * SC, 34 * SC]) { p.rect(dx0, by, dw, 3 * SC, "#23262d"); for (let x = dx0 + 2 * SC; x < dx0 + dw; x += 6 * SC) { p.rect(x, by, SC, SC, "#3a3f48"); p.rect(x, by + 2 * SC, SC, SC, "#15171c"); } }
  p.rect(mid, LH, SC, H - LH, "#1a130c");
  for (const dxr of [-5, -4, 4, 5]) p.rect(mid + dxr * SC, 28 * SC, SC, SC, "#23262d");
  p.rect(0, LH, dx0, SC, "#0c0f15"); p.rect(W - POST, LH, SC, H - LH, "#0c0f15");
  // contorno e sombra
  p.rect(0, 0, SC, H, OUT); p.rect(W - SC, 0, SC, H, OUT); p.rect(0, 0, W, SC, OUT); p.rect(0, H - 3 * SC, W, 3 * SC, "rgba(0,0,0,0.4)");
  return p.texture();
}

/**
 * Parede de ENXAIMEL (taipa + vigas) para casas — autotile, modular. Diferente
 * da muralha: a casa é um cômodo, então TODA parede mostra a face de taipa
 * (não só o sul). `feature`: "window" | "door" | null. mask N=1,E=2,S=4,W=8.
 */
function makeHouseWallTile(mask: number, seed: number, feature: "window" | "door" | null): Texture {
  const SC = TILE_SIZE / 32;
  const rng = mulberry32(seed + mask * 31 + 1);
  const HH = 44 * SC; // altura do tile de parede de casa
  const p = new Px(TILE_SIZE, HH);
  const N = (mask & 1) !== 0, W = (mask & 8) !== 0, E = (mask & 2) !== 0;
  const PLA = [PAL.plasterDark, PAL.plasterBase, PAL.plasterLight];
  const BEAM = PAL.woodPost, BEAML = PAL.woodPostLight, BEAMD = PAL.trunkDark, OUT = "#10141c";
  const TOPH = 7 * SC;
  // viga superior fina (frechal visto de cima)
  p.rect(0, 0, TILE_SIZE, TOPH, BEAM);
  for (let i = 0; i < Math.round(10 * SC * SC); i++) p.rect(Math.floor(rng() * TILE_SIZE), Math.floor(rng() * TOPH), SC, SC, rng() < 0.5 ? BEAML : BEAMD);
  if (!N) p.rect(0, SC, TILE_SIZE, SC, BEAML);
  // FACE de taipa SEMPRE (enquadrada por vigas)
  for (let y = TOPH; y < HH; y++) for (let x = 0; x < TILE_SIZE; x++) p.px(x, y, PLA[Math.floor(rng() * PLA.length)]);
  p.rect(0, TOPH, TILE_SIZE, 3 * SC, BEAM); p.rect(0, TOPH, TILE_SIZE, SC, BEAML);
  p.rect(0, 40 * SC, TILE_SIZE, 4 * SC, BEAM); p.rect(0, 40 * SC, TILE_SIZE, SC, BEAMD);
  for (const sx of [0, 14, 29]) { p.rect(sx * SC, TOPH, 3 * SC, HH - TOPH, BEAM); p.rect(sx * SC, TOPH, SC, HH - TOPH, BEAML); }
  if (feature === "window") {
    p.rect(9 * SC, 16 * SC, 14 * SC, 16 * SC, "#1a2026"); p.rect(9 * SC, 16 * SC, 14 * SC, SC, "#0d1116");
    p.rect(8 * SC, 15 * SC, 16 * SC, SC, BEAM); p.rect(8 * SC, 32 * SC, 16 * SC, SC, BEAM); p.rect(8 * SC, 15 * SC, SC, 18 * SC, BEAM); p.rect(23 * SC, 15 * SC, SC, 18 * SC, BEAM);
    p.rect(15 * SC, 16 * SC, SC, 16 * SC, BEAM); p.rect(9 * SC, 23 * SC, 14 * SC, SC, BEAM);
    p.rect(11 * SC, 18 * SC, SC, SC, "#39505e"); p.rect(12 * SC, 18 * SC, SC, SC, "#39505e"); p.rect(18 * SC, 18 * SC, SC, SC, "#39505e");
  } else if (feature === "door") {
    p.rect(9 * SC, 12 * SC, 14 * SC, 32 * SC, BEAM);
    for (let x = 10 * SC; x < 23 * SC; x += 3 * SC) p.rect(x, 13 * SC, SC, 30 * SC, (x / SC) % 2 ? BEAMD : BEAML);
    p.rect(9 * SC, 20 * SC, 14 * SC, 2 * SC, BEAMD); p.rect(9 * SC, 34 * SC, 14 * SC, 2 * SC, BEAMD);
    p.rect(20 * SC, 29 * SC, SC, SC, "#caa64a"); p.rect(20 * SC, 30 * SC, SC, SC, "#8d7330");
  }
  p.rect(0, 38 * SC, TILE_SIZE, 2 * SC, "rgba(0,0,0,0.18)");
  p.rect(0, 41 * SC, TILE_SIZE, 3 * SC, "rgba(0,0,0,0.35)");
  if (!W) { p.rect(0, 0, 2 * SC, HH, BEAMD); p.rect(0, 0, SC, HH, OUT); }
  if (!E) { p.rect(TILE_SIZE - 2 * SC, 0, 2 * SC, HH, BEAMD); p.rect(TILE_SIZE - SC, 0, SC, HH, OUT); }
  if (!N) p.rect(0, 0, TILE_SIZE, SC, OUT);
  return p.texture();
}

/** 16 máscaras × 3 variantes de parede de enxaimel (sem feature). */
function makeHouseWalls(): Texture[][] {
  const out: Texture[][] = [];
  for (let m = 0; m < 16; m++) out.push([makeHouseWallTile(m, 700, null), makeHouseWallTile(m, 1700, null), makeHouseWallTile(m, 2700, null)]);
  return out;
}

/** Overhang do telhado em px (cobre os topos da parede norte). */
export const ROOF_OVERHANG = 22 * S;

/**
 * TELHADO de edifício (jun/2026): telha gasta dark-medieval, gerado no tamanho
 * do prédio. Espigão claro no centro + beirais escuros + fiadas de telha + uma
 * sombra de contato projetada na base. Some quando o player entra (WorldRenderer).
 * Quente (telha/madeira) pra contrastar com a pedra fria das paredes.
 */
export function makeRoof(wTiles: number, hTiles: number, seed: number): Texture {
  const W = wTiles * TILE_SIZE, H = hTiles * TILE_SIZE + ROOF_OVERHANG;
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
  const SW = 11 * S, RH = 6 * S;
  for (let ry = -RH; ry < H; ry += RH) {
    const rowIdx = Math.round((ry + RH) / RH);
    const off = rowIdx % 2 ? (SW / 2) | 0 : 0;
    const lumY = slopeAt(ry + RH / 2);
    for (let sx = -SW; sx < W + SW; sx += SW) {
      const x0 = sx + off;
      const dX = Math.abs(x0 + SW / 2 - W / 2) / (W / 2);
      const tone = lumY * (1 - dX * 0.16) * (0.9 + ((hash2D(rowIdx, (sx / SW) | 0, seed) * 0.2)));
      for (let yy = 0; yy < RH + S; yy++) {
        const y = ry + yy; if (y < 0 || y >= H) continue;
        for (let xx = S; xx < SW; xx++) {
          const x = x0 + xx; if (x < 0 || x >= W) continue;
          let l = tone;
          if (yy < S) l *= 1.18;              // aresta de cima da telha (luz)
          else if (yy >= RH - S) l *= 0.6;    // sombra da sobreposição da fiada de cima
          if (xx >= SW - S) l *= 0.7;         // sulco vertical entre telhas
          p.px(x, y, col(l));
        }
      }
    }
  }
  // ESPIGÃO (ridge cap): faixa clara no topo + sombra funda logo abaixo (volume)
  for (let x = 0; x < W; x++) {
    p.rect(x, ridgeY - 2 * S, 1, S, `rgb(${cb(baseR * 1.3)},${cb(baseG * 1.25)},${cb(baseB * 1.2)})`);
    p.rect(x, ridgeY - S, 1, S, `rgb(${cb(baseR * 1.45)},${cb(baseG * 1.4)},${cb(baseB * 1.32)})`);
    p.rect(x, ridgeY, 1, S, `rgb(${cb(baseR * 0.5)},${cb(baseG * 0.5)},${cb(baseB * 0.5)})`);
    if (x % (4 * S) === 0) p.rect(x, ridgeY - S, S, S, `rgb(${cb(baseR * 0.9)},${cb(baseG * 0.9)},${cb(baseB * 0.9)})`); // entalhe do cap
  }
  // BEIRAIS: borda escura nos 4 lados (trim) + outline
  for (let x = 0; x < W; x++) { p.rect(x, 0, 1, S, "#160f0b"); p.rect(x, H - S, 1, S, "#0e0a07"); }
  for (let y = 0; y < H; y++) { p.rect(0, y, S, 1, "#160f0b"); p.rect(W - S, y, S, 1, "#160f0b"); }
  // sombra de contato projetada na base (o beiral da frente sombreia o chão)
  p.rect(0, H - 3 * S, W, 2 * S, "rgba(0,0,0,0.38)");
  return p.texture();
}

function makeTorchFrames(): Texture[] {
  const frames: Texture[] = [];
  for (let f = 0; f < 3; f++) {
    const rng = mulberry32(500 + f * 7);
    const p = new Px(32 * S, 40 * S);
    // base de pedra
    p.rect(13 * S, 35 * S, 7 * S, 3 * S, PAL.stoneMid);
    p.rect(13 * S, 35 * S, 7 * S, S, PAL.stoneLight);
    // poste
    p.rect(15 * S, 14 * S, 3 * S, 22 * S, PAL.woodPost);
    p.rect(15 * S, 14 * S, S, 22 * S, PAL.woodPostLight);
    // braçadeira
    p.rect(14 * S, 14 * S, 5 * S, 2 * S, PAL.metal);
    // chama (oscila por frame)
    const fx = 16 * S + (f === 1 ? -S : f === 2 ? S : 0);
    const h = (f === 1 ? 9 : 8) * S;
    p.ellipse(fx, 9 * S, 3 * S, Math.floor(h / 2) + S, PAL.flameEdge);
    p.ellipse(fx, 10 * S, 2 * S, 3 * S, PAL.flameBody);
    p.rect(fx - S, 9 * S, 2 * S, 3 * S, PAL.flameCore);
    // faíscas
    for (let i = 0; i < Math.round(2 * S * S); i++) {
      p.rect(fx - 3 * S + Math.floor(rng() * 6) * S, 3 * S + Math.floor(rng() * 4) * S, S, S, PAL.flameBody);
    }
    p.outline(PAL.outline);
    frames.push(p.texture());
  }
  return frames;
}

// ──────────────────────────────────────────────────────────────────────
// Rato — família Bestial, T1 ("o primeiro sangue do jogador")
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
// TESTE (remaster 128px) — char PROCEDURAL nativo a 128×192 (1.5 tile, o
// "overflow" estilo Apogea que o PixelLab NÃO alcança pelo teto de 128px).
// Avaliar se char procedural ganha valor na densidade alta. Aço frio + tabardo
// quente, luz global topo-esq, fresta em T com olhos âmbar (cânone do knight),
// outline #10141c. Sul desenhado; demais direções derivam (placeholder do teste).
// ──────────────────────────────────────────────────────────────────────
function drawKnight128(p: Px): void {
  const cx = 64;
  // RAMPS hue-shifted (sombra fria/dessat, luz quente). Aço, tabardo, couro, ouro, madeira.
  const st = ["#202935", "#33414f", "#4d6076", "#74879f", "#a6b8cd", "#d6e2ef"]; // aço 0..5
  const tb = ["#46221d", "#6b3127", "#8f4334", "#b35a44", "#d2785a"];            // tabardo 0..4
  const lt = ["#26190f", "#3e2c1b", "#5e442b", "#7e6038"];                       // couro 0..3
  const go = ["#7a5b26", "#b8902f", "#e6c46e", "#fff0bf"];                       // ouro 0..3
  const wd = ["#2c1d12", "#412c1a", "#5e4326", "#7c5d38"];                       // madeira 0..3
  const eye = "#ffd86e", eyeHi = "#fff2c0";

  // sombra de contato é adicionada pelo EntityRenderer; aqui só a figura.

  // ── PERNAS: grevas (cilindros) + sabatão pontudo. Pernas longas (heroico). ──
  for (const sgn of [-1, 1]) {
    const lx = cx + sgn * 12;
    // sabatão (pé de placa, pontudo pra frente)
    p.ellipse(lx, 182, 11, 5, st[1]);
    p.ellipse(lx - 2, 181, 7, 3, st[3]);
    p.rect(lx - 9, 184, 18, 3, st[0]);
    // greva cilíndrica: sombra-dir, mid, luz-esq, spec
    p.rect(lx - 8, 134, 16, 48, st[1]);
    p.rect(lx - 8, 134, 11, 48, st[2]);
    p.rect(lx - 8, 134, 4, 48, st[3]);
    p.rect(lx - 7, 134, 2, 48, st[4]);
    p.rect(lx + 5, 134, 3, 48, st[0]);
    // poleyn (joelheira) — disco com rim de luz
    p.ellipse(lx, 150, 9, 7, st[2]);
    p.ellipse(lx - 2, 148, 6, 4, st[4]);
    p.ellipse(lx, 153, 7, 2, st[0]);
  }

  // ── TABARDO (cloth quente) sobre as coxas, com dobras e bainha trimada ──
  // silhueta do tecido (trapézio que alarga embaixo)
  for (let y = 116; y < 168; y++) {
    const w = 13 + (y - 116) * 0.28;
    p.rect(cx - w, y, w * 2, 1, tb[2]);
  }
  // dobras: faixas verticais de sombra + luz
  for (const [dx, c] of [[-10, tb[1]], [-3, tb[3]], [4, tb[1]], [10, tb[0]]] as const) {
    for (let y = 118; y < 166; y++) { const w = 1 + ((y - 116) / 50); p.rect(cx + dx, y, w, 1, c as string); }
  }
  p.rect(cx - 5, 117, 6, 50, tb[3]); // realce central
  // bainha em V com trim de ouro
  for (let i = -22; i <= 22; i += 1) { const yy = 162 + Math.abs(i) * 0.18; p.px(cx + i, yy | 0, tb[0]); p.px(cx + i, (yy | 0) - 1, go[1]); }

  // ── FAULDS (placas da cintura, sobre o topo do tabardo) ──
  for (const sgn of [-1, 1]) {
    p.ellipse(cx + sgn * 9, 118, 11, 8, st[2]);
    p.ellipse(cx + sgn * 9, 115, 10, 5, st[3]);
    p.ellipse(cx + sgn * 9, 121, 11, 3, st[0]);
  }

  // ── PEITORAL (cuirass musculada): peitorais + cume + rim inferior ──
  p.ellipse(cx, 96, 23, 22, st[1]);          // massa base
  p.ellipse(cx, 95, 21, 20, st[2]);          // mid
  p.ellipse(cx - 9, 90, 9, 9, st[3]);        // peitoral esq (luz)
  p.ellipse(cx - 10, 88, 5, 5, st[4]);
  p.ellipse(cx + 8, 91, 8, 8, st[2]);        // peitoral dir (mais escuro)
  p.rect(cx - 1, 76, 3, 38, st[4]);          // cume central brilhante
  p.px(cx, 80, st[5]); p.px(cx, 92, st[5]);
  p.ellipse(cx + 15, 102, 7, 13, st[0]);     // sombra flanco dir
  p.ellipse(cx, 114, 20, 5, st[0]);          // rim inferior (sombra sob o peito)
  p.ellipse(cx, 112, 18, 3, st[1]);
  // gorjal/colar
  p.ellipse(cx, 76, 12, 5, st[1]);
  p.ellipse(cx, 74, 11, 3, st[3]);

  // ── PAULDRONS (ombreiras): 2 lames curvas, rim de luz, mais largas que o torso ──
  for (const sgn of [-1, 1]) {
    const sx = cx + sgn * 24;
    p.ellipse(sx, 86, 13, 12, st[1]);
    p.ellipse(sx, 84, 12, 10, st[2]);
    p.ellipse(sx - sgn * 3, 80, 8, 6, sgn < 0 ? st[4] : st[3]); // luz mais forte no esq
    p.ellipse(sx, 90, 13, 4, st[0]);          // lame inferior (sombra)
    p.ellipse(sx, 88, 12, 2, st[3]);          // rim da lame
    p.px(sx - sgn * 6, 79, st[5]);
  }

  // ── BRAÇOS (cilindros) + gauntlets. Esq segura espada, dir segura escudo. ──
  for (const sgn of [-1, 1]) {
    const ax = cx + sgn * 25;
    p.rect(ax - 5, 92, 10, 32, st[1]);
    p.rect(ax - 5, 92, 6, 32, st[2]);
    p.rect(ax - 5, 92, 2, 32, sgn < 0 ? st[3] : st[2]);
    p.rect(ax + 3, 92, 2, 32, st[0]);
    p.ellipse(ax, 106, 6, 5, st[2]);          // couter (cotovelo)
    p.ellipse(ax - 2, 104, 3, 3, st[4]);
    // gauntlet
    p.ellipse(ax, 126, 6, 5, st[2]);
    p.ellipse(ax - 1, 125, 4, 3, st[3]);
  }

  // ── ESPADA na mão esquerda do viewer (cx-25), ponta pra baixo, descansando ──
  {
    const hx = cx - 25;
    // lâmina
    p.rect(hx - 2, 130, 5, 44, st[2]);
    p.rect(hx - 1, 130, 2, 44, st[4]);        // fuller/luz central
    p.rect(hx + 2, 130, 1, 44, st[0]);
    p.ellipse(hx, 174, 2, 4, st[3]);          // ponta
    // guarda cruzada (ouro)
    p.rect(hx - 8, 127, 16, 3, go[1]);
    p.rect(hx - 8, 127, 16, 1, go[2]);
    // punho (couro) + pomo (ouro)
    p.rect(hx - 2, 120, 4, 7, lt[2]);
    p.ellipse(hx, 118, 3, 3, go[2]);
    p.px(hx - 1, 117, go[3]);
  }

  // ── ESCUDO heater na mão direita do viewer (cx+27), com emblema ──
  {
    const sx = cx + 30;
    // silhueta: topo reto, afina pra ponta embaixo
    for (let y = 98; y < 150; y++) {
      const t = (y - 98) / 52;
      const w = 15 * (1 - t * t * 0.85);
      p.rect(sx - w, y, w * 2, 1, wd[1]);
    }
    // bisel: madeira clara em cima, escura embaixo-dir
    for (let y = 98; y < 124; y++) { const t = (y - 98) / 52; const w = 15 * (1 - t * t * 0.85); p.rect(sx - w + 1, y, 3, 1, wd[2]); }
    p.ellipse(sx, 144, 4, 6, wd[0]);
    // borda de aço
    for (let y = 98; y < 150; y++) {
      const t = (y - 98) / 52; const w = 15 * (1 - t * t * 0.85);
      p.px(sx - w, y, st[3]); p.px(sx + w - 1, y, st[1]);
    }
    p.rect(sx - 15, 98, 30, 2, st[3]);        // borda superior iluminada
    // emblema: chevron/cruz quente (ouro) — "design", não forma jogada
    p.rect(sx - 2, 104, 4, 30, go[1]);
    p.rect(sx - 10, 112, 20, 4, go[1]);
    p.rect(sx - 1, 105, 2, 28, go[2]);
    p.rect(sx - 9, 113, 18, 2, go[2]);
    // boss central
    p.ellipse(sx, 122, 4, 4, st[2]);
    p.ellipse(sx - 1, 121, 2, 2, st[4]);
  }

  // ── ELMO (great helm/barbute): domo esférico + visor + olhos + crista ──
  p.ellipse(cx, 50, 20, 25, st[1]);           // base
  p.ellipse(cx, 49, 18, 23, st[2]);           // mid
  p.ellipse(cx - 6, 43, 11, 14, st[3]);       // luz topo-esq
  p.ellipse(cx - 8, 39, 6, 7, st[4]);
  p.px(cx - 9, 37, st[5]);                    // spec
  p.ellipse(cx + 9, 56, 7, 13, st[0]);        // sombra dir
  // brow ridge (aresta da testa)
  p.ellipse(cx, 44, 16, 3, st[0]);
  p.ellipse(cx, 43, 15, 1, st[4]);
  // visor: vertical + a fenda dos olhos
  p.rect(cx - 1, 46, 3, 28, "#0a0e15");
  p.rect(cx - 13, 56, 26, 5, "#0a0e15");
  // olhos âmbar com glow
  p.rect(cx - 9, 57, 4, 3, eye); p.px(cx - 8, 57, eyeHi);
  p.rect(cx + 6, 57, 4, 3, eye); p.px(cx + 8, 57, eyeHi);
  // queixo do elmo (placa inferior)
  p.ellipse(cx, 70, 13, 6, st[1]);
  p.ellipse(cx, 68, 11, 3, st[2]);
  // crista/plume (acento quente) — dá flair
  p.ellipse(cx, 26, 4, 8, tb[2]);
  for (let y = 18; y < 34; y++) { p.px(cx - 1, y, tb[3]); p.px(cx, y, tb[1]); }
  p.px(cx - 1, 18, go[2]);
}

export function makeProcKnight128(): Record<Facing, Texture[]> {
  const p = new Px(128, 192);
  drawKnight128(p);
  p.outline("#10141c");
  const tex = p.texture();
  const flip = new Px(128, 192);
  flip.ctx.translate(128, 0);
  flip.ctx.scale(-1, 1);
  flip.ctx.drawImage(p.canvas, 0, 0);
  const texW = flip.texture();
  // teste: figura sul reusada em todas as direções (julgar o LOOK; direções depois)
  return { s: [tex], n: [tex], e: [tex], w: [texW] };
}

// ──────────────────────────────────────────────────────────────────────
// Utilitários visuais
// ──────────────────────────────────────────────────────────────────────

/** Marcador de alvo estilo Tibia: quadrado vermelho de cantos (sobre o mob). */
function makeTargetMarker(): Texture {
  const p = new Px(TILE_SIZE, TILE_SIZE);
  const c = "#d83a3a";
  const s = "rgba(0,0,0,0.6)";
  const hi = TILE_SIZE - 2; // canto oposto
  const arm = 8 * S; // comprimento do braço do canto
  for (const [ox, oy, dx, dy] of [
    [1, 1, 1, 1],
    [hi, 1, -1, 1],
    [1, hi, 1, -1],
    [hi, hi, -1, -1],
  ] as const) {
    for (let i = 0; i < arm; i++) {
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
  // remaster 128: canvas e features derivam de TILE_SIZE/S (era fixo 32px)
  const p = new Px(TILE_SIZE, TILE_SIZE);
  const cx = 15.5 * S, cy = 15.5 * S, R = 13 * S;
  const IRON = "#3b414b", IRON_LO = "#252a31", IRON_HI = "#5b626d", PIT = "#06080c";
  p.ellipse(cx, cy, R, R, IRON_LO);        // aro externo
  p.ellipse(cx, cy, R - 1.5 * S, R - 1.5 * S, IRON);
  p.ellipse(cx, cy, R - 3 * S, R - 3 * S, PIT);    // poço escuro
  // GRADE: barras de ferro atravessando o poço (topo da barra pega luz)
  for (let by = -8 * S; by <= 8 * S; by += 4 * S) {
    const half = Math.round(Math.sqrt(Math.max(0, (R - 3 * S) * (R - 3 * S) - by * by)));
    const y = Math.round(cy + by);
    for (let x = Math.round(cx) - half; x <= Math.round(cx) + half; x++) {
      for (let t = 0; t < S; t++) p.px(x, y + t, IRON);
      for (let t = 0; t < S; t++) p.px(x, y - 1 - t, IRON_HI);
    }
  }
  // aro: luz no topo-esq, sombra na base-dir (volume)
  for (let a = 0; a < 360; a += 5 / S) {
    const rad = (a * Math.PI) / 180, c = Math.cos(rad), s = Math.sin(rad);
    for (let t = 0; t < S; t++)
      p.px(Math.round(cx + c * (R - t)), Math.round(cy + s * (R - t)), c + s < -0.3 ? IRON_HI : c + s > 0.3 ? "#1a1e24" : IRON_LO);
  }
  p.outline(PAL.outline);
  return p.texture();
}

/** Escada de pedra descendo pro escuro (degraus recuando). Pisar = desce; clicar = sobe. */
function makeStairs(): Texture {
  // remaster 128: canvas e features derivam de TILE_SIZE/S (era fixo 32px)
  const p = new Px(TILE_SIZE, TILE_SIZE);
  p.rect(3 * S, 3 * S, 26 * S, 26 * S, "#2a2f37");
  p.rect(4 * S, 4 * S, 24 * S, 24 * S, "#070a0e"); // poço escuro
  const steps = ["#5a6270", "#4f5763", "#454c58", "#3a414c", "#30353f"];
  for (let i = 0; i < steps.length; i++) {
    const y = 5 * S + i * 4 * S;
    p.rect(5 * S, y, 22 * S, 3 * S, steps[i]);
    p.rect(5 * S, y, 22 * S, S, "#6c7482"); // aresta de cima do degrau pega luz
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

/**
 * Partícula de impacto de combate — disco BRANCO macio (radial), tintável por
 * tipo de dano no runtime (faísca/brasa/gota/fagulha). Base branca pra a tint
 * multiplicar limpo; alpha radial dá o miolo quente e a borda que esvanece.
 */
function makeSpark(): Texture {
  const size = 8;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.5, "rgba(255,255,255,0.85)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(c);
}

/**
 * Estilhaço de impacto — losango cristalino BRANCO de bordas duras (gelo/físico).
 * Miolo cheio + borda translúcida; tintado por tipo no runtime.
 */
function makeShard(): Texture {
  const p = new Px(7, 7);
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 7; x++) {
      const d = Math.abs(x - 3) + Math.abs(y - 3);
      if (d <= 1) p.px(x, y, "#ffffff");
      else if (d <= 3) p.px(x, y, "rgba(255,255,255,0.78)");
    }
  }
  return p.texture();
}

/** Cursor de tile (cantos em L). */
function makeTileCursor(): Texture {
  // remaster 128: canvas e braços dos cantos escalam por S (era fixo 32px)
  const p = new Px(TILE_SIZE, TILE_SIZE);
  const E = TILE_SIZE - 1;
  const c = "rgba(232,217,168,0.95)";
  const s = "rgba(0,0,0,0.5)";
  const arm = 7 * S; // comprimento do braço em L
  for (const [ox, oy, dx, dy] of [
    [0, 0, 1, 1],
    [E, 0, -1, 1],
    [0, E, 1, -1],
    [E, E, -1, -1],
  ] as const) {
    for (let i = 0; i < arm; i++) {
      for (let t = 0; t < S; t++) {
        p.px(ox + dx * i, oy + dy * t, c);
        p.px(ox + dx * t, oy + dy * i, c);
        p.px(ox + dx * i, oy + dy * (S + t), s);
        p.px(ox + dx * (S + t), oy + dy * i, s);
      }
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
    const p = new Px(TILE_SIZE, TILE_SIZE);
    if (nw + ne + sw + se === 0 || nw + ne + sw + se === 4) { out.push(p.texture()); continue; }
    for (let py = 0; py < TILE_SIZE; py++) {
      for (let px = 0; px < TILE_SIZE; px++) {
        const u = px / (TILE_SIZE - 1), v = py / (TILE_SIZE - 1);
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
    const p = new Px(TILE_SIZE, TILE_SIZE);
    if (nw + ne + sw + se === 0 || nw + ne + sw + se === 4) { out.push(p.texture()); continue; }
    for (let py = 0; py < TILE_SIZE; py++) {
      for (let px = 0; px < TILE_SIZE; px++) {
        const u = px / (TILE_SIZE - 1), v = py / (TILE_SIZE - 1);
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
  /** Mobília urbana (kit de feira), anchor bottom: barril / caixa / tenda. */
  barrel: Texture;
  crate: Texture;
  stall: Texture;
  /** Muralha autotile: 16 máscaras (N=1,E=2,S=4,W=8) × variantes de nuance. */
  walls: Texture[][];
  // ── Subsolo (procedural; rocha orgânica + água suja) — SISTEMA-ANDARES.md ──
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
  /** Partículas de impacto de combate (tintadas por tipo de dano no render). */
  spark: Texture;
  shard: Texture;
  tileCursor: Texture;
  targetMarker: Texture;
  /** Boeiro/grade da descida pro esgoto. */
  manhole: Texture;
  /** Escada (descida/subida entre andares). */
  stairs: Texture;
  shadow: Texture;
  /** Decais espalhados no chão (baked no chunk): grama/terra/pedra/esgoto/caverna. */
  scatter: { grass: Texture[]; dirt: Texture[]; stone: Texture[]; sewer: Texture[]; cave: Texture[] };
  /** Transição dual-grid de StoneFloor sobre grama/terra: 16 códigos de canto. */
  stoneTransition: Texture[];
  /** Transição grama↔terra (16 códigos de canto) — procedural, casa com o campo. */
  dirtTransition: Texture[];
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
    barrel: makeBarrel(),
    crate: makeCrate(),
    stall: makeStall(),
    walls: makeWallTiles(),
    // Esgoto/caverna: rocha orgânica procedural (campo 128 seamless, sliced em 16).
    sewerFloor: makeOrganicRockField(801, SEWER_ROCK),
    caveFloor: makeOrganicRockField(811, CAVE_ROCK),
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
    spark: makeSpark(),
    shard: makeShard(),
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
