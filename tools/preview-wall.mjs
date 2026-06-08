#!/usr/bin/env node
// Preview headless da muralha autotile: porta FIELMENTE o makeWallTile de
// sprites.ts pra um buffer RGBA → PNG, sem depender do browser. Gera:
//   /tmp/wall-masks.png  — as 16 máscaras ampliadas (rotuladas)
//   /tmp/wall-fort.png   — um fortim montado (autotile real) sobre grama
// Objetivo: validar conectividade/leitura antes de aprovar. NÃO é o código de
// produção (esse é sprites.ts) — é um espelho pra enxergar.

import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const WALL_TOP = "#566070", WALL_TOP_LIGHT = "#677182";

// ── mini-canvas RGBA ────────────────────────────────────────────────────────
class Buf {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  parse(c) {
    if (c[0] === "#") return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 255];
    let m = c.match(/rgba?\(([^)]+)\)/);
    const p = m[1].split(",").map((s) => parseFloat(s.trim()));
    return [p[0], p[1], p[2], p.length > 3 ? Math.round(p[3] * 255) : 255];
  }
  px(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const [r, g, b, a] = this.parse(c); const i = (y * this.w + x) * 4;
    if (a === 255) { this.d[i] = r; this.d[i + 1] = g; this.d[i + 2] = b; this.d[i + 3] = 255; return; }
    const af = a / 255, ia = 1 - af; // blend over
    this.d[i] = r * af + this.d[i] * ia; this.d[i + 1] = g * af + this.d[i + 1] * ia;
    this.d[i + 2] = b * af + this.d[i + 2] * ia; this.d[i + 3] = Math.max(this.d[i + 3], a);
  }
  rect(x, y, w, h, c) { for (let j = 0; j < Math.round(h); j++) for (let i = 0; i < Math.round(w); i++) this.px(Math.round(x) + i, Math.round(y) + j, c); }
  fill(c) { this.rect(0, 0, this.w, this.h, c); }
  blit(src, dx, dy) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const i = (y * src.w + x) * 4; if (src.d[i + 3] > 0) this.px(dx + x, dy + y, `rgba(${src.d[i]},${src.d[i + 1]},${src.d[i + 2]},${src.d[i + 3] / 255})`); } }
  scaledTo(z) { const o = new Buf(this.w * z, this.h * z); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const i = (y * this.w + x) * 4; if (this.d[i + 3] === 0) continue; const c = `rgba(${this.d[i]},${this.d[i + 1]},${this.d[i + 2]},${this.d[i + 3] / 255})`; for (let yy = 0; yy < z; yy++) for (let xx = 0; xx < z; xx++) o.px(x * z + xx, y * z + yy, c); } return o; }
}

// mulberry32 — mesmo RNG do projeto (rng.ts)
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ── PORT FIEL do makeWallTile (sprites.ts) ──────────────────────────────────
function makeWallTile(mask, seed) {
  const rng = mulberry32(seed + mask * 97 + 1);
  const p = new Buf(32, 44);
  const N = (mask & 1) !== 0, E = (mask & 2) !== 0, S = (mask & 4) !== 0, W = (mask & 8) !== 0;
  const OUT = "#10141c";
  const topEnd = S ? 44 : 13;
  p.rect(0, 0, 32, topEnd, "#3b424e");
  const TB = [["#414956", "#525c6a"], ["#485160", "#586473"], ["#3d4450", "#4b5563"]];
  const JOINT = "#2f3640";
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
  if (!N) p.rect(0, 1, 32, 2, WALL_TOP_LIGHT);
  if (!S) {
    p.rect(0, 11, 32, 1, "#1a1e26"); p.rect(0, 12, 32, 1, "#0e1117");
    for (let row = 0; row < 4; row++) {
      const y = 13 + row * 8, offset = row % 2 === 0 ? 0 : 8, shade = 1 - row * 0.16, base = Math.floor(46 * shade);
      for (let col = -1; col < 3; col++) {
        const x = col * 16 + offset;
        p.rect(x + 1, y + 1, 15, 7, `rgb(${base},${base + 6},${base + 15})`);
        p.rect(x + 1, y + 1, 15, 1, `rgb(${base + 10},${base + 16},${base + 26})`);
        p.rect(x, y, 16, 1, "#0c0f15"); p.rect(x, y, 1, 8, "#0c0f15");
        if (rng() < 0.5) p.px(x + 2 + Math.floor(rng() * 12), y + 2 + Math.floor(rng() * 5), "#0c0f15");
      }
    }
    p.rect(0, 41, 32, 3, "rgba(0,0,0,0.38)");
  }
  const MOSS = ["#2c3a2b", "#384a36", "#243527"];
  if (rng() < 0.55) {
    const spots = 1 + Math.floor(rng() * 3);
    for (let k = 0; k < spots; k++) {
      const mx = Math.floor(rng() * 28), my = Math.floor(rng() * (S ? 38 : 10));
      const ch = 2 + Math.floor(rng() * 2), cw = 2 + Math.floor(rng() * 3);
      for (let dy = 0; dy < ch; dy++) for (let dx = 0; dx < cw; dx++) if (rng() < 0.7) p.px(mx + dx, my + dy, MOSS[Math.floor(rng() * MOSS.length)]);
    }
  }
  if (!S && rng() < 0.7) for (let x = 0; x < 32; x++) if (rng() < 0.28) p.px(x, 38 + Math.floor(rng() * 3), MOSS[Math.floor(rng() * MOSS.length)]);
  if (!S && rng() < 0.35) { let cx = 5 + Math.floor(rng() * 22), cy = 15; const len = 6 + Math.floor(rng() * 8); for (let s = 0; s < len && cy < 42; s++) { p.px(cx, cy, "#0c0f15"); if (rng() < 0.4) p.px(cx + 1, cy, "#0c0f15"); cy++; cx += Math.floor(rng() * 3) - 1; } }

  if (!W) { p.rect(0, 0, 1, 44, OUT); p.rect(1, 0, 1, topEnd, "#3a414d"); }
  if (!E) { p.rect(31, 0, 1, 44, OUT); p.rect(30, 0, 1, topEnd, "#3a414d"); }
  if (!N) p.rect(0, 0, 32, 1, OUT);
  return p;
}

// ── PNG encoder (zlib + CRC manual) ─────────────────────────────────────────
function png(buf) {
  const { w, h, d } = buf;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = d[y * w * 4 + x]; }
  const idat = deflateSync(raw);
  const crcTable = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = crcTable[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const t = Buffer.from(type); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([len, t, data, cc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// ── 1) grid das 16 máscaras (rotulado por código N E S W) ───────────────────
const Z = 4, PAD = 6, COLS = 8;
const cellW = 32 * Z + PAD, cellH = 44 * Z + PAD + 10;
const sheet = new Buf(COLS * cellW + PAD, 2 * cellH + PAD);
sheet.fill("#1a1d24");
for (let m = 0; m < 16; m++) {
  const t = makeWallTile(m, 500).scaledTo(Z);
  const cx = (m % COLS) * cellW + PAD, cy = Math.floor(m / COLS) * cellH + PAD;
  sheet.blit(t, cx, cy);
}
writeFileSync("/tmp/wall-masks.png", png(sheet));

// ── Portão procedural (casa com a muralha): lintel de pedra + postes + porta de madeira ──
function makeGate(wTiles, seed) {
  const rng = mulberry32(seed);
  const W = wTiles * 32, H = 48, p = new Buf(W, H);
  const OUT = "#10141c", POST = 9;
  // LINTEL de pedra no topo (mesmo cobble do muro), full width
  const TB = [["#414956", "#525c6a"], ["#485160", "#586473"], ["#3d4450", "#4b5563"]];
  p.rect(0, 0, W, 14, "#3b424e");
  for (let ry = -2; ry < 14; ry += 7) for (let rx = -((((ry + 2) / 7) | 0) & 1 ? 9 : 0); rx < W; rx += 13) {
    const [fill, hi] = TB[Math.floor(rng() * TB.length)]; const bw = 11 + Math.floor(rng() * 3); const by = ry + 1; if (by >= 14) continue; const bh = Math.min(6, 14 - by);
    p.rect(rx + 1, by, bw, bh, fill); p.rect(rx + 1, by, bw, 1, hi); if (ry >= 0) p.rect(rx, ry, bw + 2, 1, "#2f3640"); p.rect(rx, by, 1, bh, "#2f3640");
  }
  p.rect(0, 13, W, 1, "#0c0f15");
  // POSTES de pedra (faces escuras) nas laterais
  for (const px0 of [0, W - POST]) {
    for (let row = 0; row < 4; row++) {
      const y = 14 + row * 8, base = Math.floor(46 * (1 - row * 0.16));
      p.rect(px0, y, POST, 8, `rgb(${base},${base + 6},${base + 15})`);
      p.rect(px0, y, POST, 1, `rgb(${base + 10},${base + 16},${base + 26})`);
      p.rect(px0, y, POST, 1, "#0c0f15");
    }
  }
  // PORTA de madeira reforçada (entre os postes)
  const dx0 = POST, dw = W - POST * 2, mid = dx0 + (dw >> 1);
  p.rect(dx0, 14, dw, H - 14, "#3b2c1f"); // base de madeira
  for (let x = dx0; x < dx0 + dw; x += 5) p.rect(x, 14, 1, H - 14, x % 2 ? "#2a1e14" : "#4c3a29"); // tábuas verticais
  for (const by of [20, 34]) { p.rect(dx0, by, dw, 3, "#23262d"); for (let x = dx0 + 2; x < dx0 + dw; x += 6) { p.px(x, by, "#3a3f48"); p.px(x, by + 2, "#15171c"); } } // bandas de ferro + cravos
  p.rect(mid, 14, 1, H - 14, "#1a130c"); // fenda central entre as duas folhas
  p.px(mid - 4, 28, "#23262d"); p.px(mid - 5, 28, "#23262d"); p.px(mid + 4, 28, "#23262d"); p.px(mid + 5, 28, "#23262d"); // argolas
  p.rect(0, 14, dx0, 1, "#0c0f15"); p.rect(W - POST, 14, 1, H - 14, "#0c0f15");
  // contorno e sombra
  p.rect(0, 0, 1, H, OUT); p.rect(W - 1, 0, 1, H, OUT); p.rect(0, 0, W, 1, OUT); p.rect(0, H - 3, W, 3, "rgba(0,0,0,0.4)");
  return p;
}

// ── 2) fortim montado (autotile REAL sobre grama) ───────────────────────────
const FW = 16, FH = 11;
const wallSet = new Set();
// retângulo de muralha com uma abertura (portão) no sul
for (let x = 2; x < FW - 2; x++) { wallSet.add(`${x},2`); if (x < 7 || x > 9) wallSet.add(`${x},${FH - 2}`); }
for (let y = 2; y < FH - 1; y++) { wallSet.add(`2,${y}`); wallSet.add(`${FW - 3},${y}`); }
const isW = (x, y) => wallSet.has(`${x},${y}`);
const scene = new Buf(FW * 32, FH * 32);
scene.fill("#2b3f31"); // grama base (cor do palette)
for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
  if (!isW(x, y)) continue;
  const mask = (isW(x, y - 1) ? 1 : 0) | (isW(x + 1, y) ? 2 : 0) | (isW(x, y + 1) ? 4 : 0) | (isW(x - 1, y) ? 8 : 0);
  const seed = 500 + ((x * 73 + y * 131) % 3) * 1000; // varia variante por posição (igual ao engine)
  const t = makeWallTile(mask, seed);
  scene.blit(t, x * 32, (y + 1) * 32 - 44); // anchor bottom no tile (igual ao engine)
}
// portão de 3 tiles no vão sul (x 7..9)
const gate = makeGate(3, 909);
scene.blit(gate, 7 * 32, (FH - 1) * 32 - 48);
writeFileSync("/tmp/wall-fort.png", png(scene.scaledTo(3)));

// Referência de PEDRA CINZA da muralha (topo cheio, mask 15 = sem face/caps) —
// 32×32 p/ ancorar geração de tiles de subsolo (coerência com a cidade).
const ref = new Buf(32, 32); ref.blit(makeWallTile(15, 700), 0, 0);
writeFileSync("design/pixellab-candidatos/tiles/muralha-ref.png", png(ref));
console.log("ok → /tmp/wall-masks.png, /tmp/wall-fort.png e design/.../muralha-ref.png");
