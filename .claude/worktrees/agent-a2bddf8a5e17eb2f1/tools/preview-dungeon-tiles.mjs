#!/usr/bin/env node
// Preview headless dos PLACEHOLDERS de subsolo (SISTEMA-ANDARES) — espelha FIEL
// os makers de sprites.ts (makeDungeonFloor / makeMurkyWaterFrames /
// makeDungeonWallTile) pra um PNG, sem browser. NÃO é o código de produção —
// é um espelho pra aprovar/reprovar antes de mandar pro PixelLab /create-tileset.
//   /tmp/dungeon-tiles.png
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

// ── mini-canvas RGBA (igual ao preview-wall.mjs) ────────────────────────────
class Buf {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  parse(c) {
    if (c[0] === "#") return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 255];
    const m = c.match(/rgba?\(([^)]+)\)/); const p = m[1].split(",").map((s) => parseFloat(s.trim()));
    return [p[0], p[1], p[2], p.length > 3 ? Math.round(p[3] * 255) : 255];
  }
  px(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const [r, g, b, a] = this.parse(c); const i = (y * this.w + x) * 4;
    if (a === 255) { this.d[i] = r; this.d[i + 1] = g; this.d[i + 2] = b; this.d[i + 3] = 255; return; }
    const af = a / 255, ia = 1 - af;
    this.d[i] = r * af + this.d[i] * ia; this.d[i + 1] = g * af + this.d[i + 1] * ia;
    this.d[i + 2] = b * af + this.d[i + 2] * ia; this.d[i + 3] = Math.max(this.d[i + 3], a);
  }
  rect(x, y, w, h, c) { for (let j = 0; j < Math.round(h); j++) for (let i = 0; i < Math.round(w); i++) this.px(Math.round(x) + i, Math.round(y) + j, c); }
  fill(c) { this.rect(0, 0, this.w, this.h, c); }
  blit(src, dx, dy) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const i = (y * src.w + x) * 4; if (src.d[i + 3] > 0) this.px(dx + x, dy + y, `rgba(${src.d[i]},${src.d[i + 1]},${src.d[i + 2]},${src.d[i + 3] / 255})`); } }
  scaledTo(z) { const o = new Buf(this.w * z, this.h * z); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const i = (y * this.w + x) * 4; if (this.d[i + 3] === 0) continue; const c = `rgba(${this.d[i]},${this.d[i + 1]},${this.d[i + 2]},${this.d[i + 3] / 255})`; for (let yy = 0; yy < z; yy++) for (let xx = 0; xx < z; xx++) o.px(x * z + xx, y * z + yy, c); } return o; }
}
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ── PORT FIEL dos makers de subsolo (sprites.ts) ────────────────────────────
function makeDungeonFloor(seed, pal) {
  const rng = mulberry32(seed); const p = new Buf(32, 32); p.fill(pal.base);
  for (let row = 0; row < 2; row++) { const offset = row % 2 === 0 ? 0 : 8;
    for (let col = -1; col < 3; col++) { const x = col * 16 + offset, y = row * 16; const tone = rng();
      if (tone < 0.35) p.rect(x + 1, y + 1, 15, 15, pal.mid); else if (tone > 0.85) p.rect(x + 1, y + 1, 15, 15, pal.light);
      p.rect(x, y, 16, 1, pal.dark); p.rect(x, y, 1, 16, pal.dark); p.rect(x + 1, y + 1, 14, 1, pal.light); p.rect(x + 1, y + 15, 15, 1, pal.dark);
    } }
  for (let i = 0; i < 16; i++) p.px(Math.floor(rng() * 32), Math.floor(rng() * 32), rng() < 0.5 ? pal.crack : pal.light);
  return p;
}
function makeMurkyWater(pal, f) {
  const p = new Buf(32, 32); p.fill(pal.base);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const w1 = Math.sin((x + y * 2.7 + f * 3.4) * 0.55), w2 = Math.sin((x * 0.8 - y * 1.3 - f * 2.6) * 0.4);
    if (w1 > 0.82) p.px(x, y, pal.mid); if (w1 > 0.96) p.px(x, y, pal.light); if (w2 > 0.93 && w1 > 0.4) p.px(x, y, pal.dark);
  }
  const rng = mulberry32(1300 + f); for (let i = 0; i < 3; i++) p.rect(2 + Math.floor(rng() * 27), 2 + Math.floor(rng() * 27), 2, 1, pal.foam);
  return p;
}
function makeDungeonWallTile(mask, seed, pal) {
  const rng = mulberry32(seed + mask * 97 + 1); const p = new Buf(32, 44);
  const N = (mask & 1) !== 0, E = (mask & 2) !== 0, S = (mask & 4) !== 0, W = (mask & 8) !== 0; const OUT = "#10141c";
  const topEnd = S ? 44 : 13; p.rect(0, 0, 32, topEnd, pal.joint);
  for (let ry = -2; ry < topEnd; ry += 7) { const off = ((((ry + 2) / 7) | 0) & 1) === 0 ? 0 : 9;
    for (let rx = -off; rx < 32; rx += 13) { const by = ry + 1; if (by >= topEnd) continue; const bh = Math.min(6, topEnd - by); const bw = 11 + Math.floor(rng() * 3);
      p.rect(rx + 1, by, bw, bh, rng() < 0.3 ? pal.top : pal.topHi); p.rect(rx + 1, by, bw, 1, pal.topHi);
      if (ry >= 0) p.rect(rx, ry, bw + 2, 1, pal.joint); p.rect(rx, by, 1, bh, pal.joint);
    } }
  if (!N) p.rect(0, 1, 32, 2, pal.topHi);
  if (!S) { p.rect(0, 11, 32, 1, pal.faceDark); p.rect(0, 12, 32, 1, OUT);
    for (let row = 0; row < 4; row++) { const y = 13 + row * 8, offset = row % 2 === 0 ? 0 : 8;
      for (let col = -1; col < 3; col++) { const x = col * 16 + offset;
        p.rect(x + 1, y + 1, 15, 7, row < 2 ? pal.face : pal.faceDark); p.rect(x + 1, y + 1, 15, 1, pal.faceHi);
        p.rect(x, y, 16, 1, OUT); p.rect(x, y, 1, 8, OUT);
        if (rng() < 0.4) p.px(x + 2 + Math.floor(rng() * 12), y + 2 + Math.floor(rng() * 5), OUT);
      } }
    p.rect(0, 41, 32, 3, "rgba(0,0,0,0.38)");
  }
  if (rng() < 0.5) { const ax = Math.floor(rng() * 28), ay = Math.floor(rng() * (S ? 38 : 10));
    for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) if (rng() < 0.6) p.px(ax + dx, ay + dy, pal.accent); }
  if (!W) { p.rect(0, 0, 1, 44, OUT); p.rect(1, 0, 1, topEnd, pal.joint); }
  if (!E) { p.rect(31, 0, 1, 44, OUT); p.rect(30, 0, 1, topEnd, pal.joint); }
  if (!N) p.rect(0, 0, 32, 1, OUT);
  return p;
}

// ── paletas (idênticas a sprites.ts) ────────────────────────────────────────
const SEWER_FLOOR = { base: "#2b3431", mid: "#36423e", dark: "#1a211f", light: "#46544f", crack: "#222b28" };
const CAVE_FLOOR = { base: "#352f28", mid: "#413a30", dark: "#1f1b15", light: "#4d4536", crack: "#261f17" };
const SEWAGE = { base: "#313722", mid: "#424a2e", dark: "#20251a", light: "#525a38", foam: "#67714a" };
const DEEPWATER = { base: "#131e29", mid: "#1c2c3a", dark: "#0a1018", light: "#284058", foam: "#34526b" };
const SEWER_WALL = { top: "#3a4642", topHi: "#4a5a54", joint: "#232c29", face: "#2a332f", faceHi: "#3a4641", faceDark: "#1c2320", accent: "#38502f" };
const OLD_MASONRY = { top: "#4a463a", topHi: "#5c5746", joint: "#2c281f", face: "#3a372e", faceHi: "#4a463a", faceDark: "#25221b", accent: "#6a6450" };
const CAVE_WALL = { top: "#3d362c", topHi: "#4c4435", joint: "#221d16", face: "#2e2a22", faceHi: "#3d362c", faceDark: "#1d1913", accent: "#4a3f2c" };

// ── helpers de montagem ─────────────────────────────────────────────────────
function floorVariants(pal, base) { return [makeDungeonFloor(base, pal), makeDungeonFloor(base + 1, pal), makeDungeonFloor(base + 2, pal)]; }
function patch(tiles, cols, rows) { const b = new Buf(cols * 32, rows * 32);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) b.blit(tiles[(x * 73 + y * 131) % tiles.length], x * 32, y * 32); return b; }
function wallRoom(wallPal, floorTiles, cols, rows) {
  const TILE = 32, HEAD = 12; const b = new Buf(cols * TILE, rows * TILE + HEAD); b.fill("#0a0c10");
  const isW = (x, y) => x === 0 || y === 0 || x === cols - 1 || y === rows - 1;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) b.blit(floorTiles[(x * 73 + y * 131) % floorTiles.length], x * TILE, HEAD + y * TILE);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { if (!isW(x, y)) continue;
    const mask = (isW(x, y - 1) ? 1 : 0) | (isW(x + 1, y) ? 2 : 0) | (isW(x, y + 1) ? 4 : 0) | (isW(x - 1, y) ? 8 : 0);
    const seed = 820 + ((x * 73 + y * 131) % 2) * 1000;
    b.blit(makeDungeonWallTile(mask, seed, wallPal), x * TILE, HEAD + (y + 1) * TILE - 44);
  }
  return b;
}

// ── PNG encoder ──────────────────────────────────────────────────────────────
function png(buf) { const { w, h, d } = buf; const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = d[y * w * 4 + x]; }
  const idat = deflateSync(raw); const ct = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; ct[n] = c >>> 0; }
  const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = ct[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (t, dt) => { const len = Buffer.alloc(4); len.writeUInt32BE(dt.length); const tt = Buffer.from(t); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dt]))); return Buffer.concat([len, tt, dt, cc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]); }

// ── contact sheet ─────────────────────────────────────────────────────────────
const PAD = 6, GAP = 8;
const sewerF = floorVariants(SEWER_FLOOR, 801), caveF = floorVariants(CAVE_FLOOR, 811);
const patches = [
  patch(sewerF, 3, 3),                              // SewerFloor
  patch(caveF, 3, 3),                               // CaveFloor
  patch([makeMurkyWater(SEWAGE, 0)], 3, 3),         // Sewage
  patch([makeMurkyWater(DEEPWATER, 0)], 3, 3),      // DeepWater
];
const rooms = [
  wallRoom(SEWER_WALL, sewerF, 6, 4),               // SewerWall (sobre chão de esgoto)
  wallRoom(OLD_MASONRY, sewerF, 6, 4),              // OldMasonryWall
  wallRoom(CAVE_WALL, caveF, 6, 4),                 // CaveWall (sobre chão de caverna)
];
const topH = 96, roomH = 4 * 32 + 12, roomW = 6 * 32;
const topW = PAD + patches.length * (96 + GAP);
const botW = PAD + rooms.length * (roomW + GAP);
const W = Math.max(topW, botW), H = PAD + topH + GAP + roomH + PAD;
const sheet = new Buf(W, H); sheet.fill("#15171c");
patches.forEach((p, i) => sheet.blit(p, PAD + i * (96 + GAP), PAD));
rooms.forEach((r, i) => sheet.blit(r, PAD + i * (roomW + GAP), PAD + topH + GAP));
writeFileSync("/tmp/dungeon-tiles.png", png(sheet.scaledTo(3)));
console.log("ok → /tmp/dungeon-tiles.png");
console.log("topo (esq→dir): SewerFloor · CaveFloor · Sewage · DeepWater");
console.log("salas (esq→dir): SewerWall · OldMasonryWall · CaveWall");
