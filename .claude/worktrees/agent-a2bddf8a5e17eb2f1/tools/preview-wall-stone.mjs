#!/usr/bin/env node
// Preview da muralha usando o MATERIAL PixelLab (muro-topo) na estrutura
// autotile do código: topo = pedra lit; face = mesma pedra escurecida (sombra).
// Decodifica os PNGs do tileset (sem deps) e compõe um fortim → /tmp/wall-stone.png

import { readFileSync, writeFileSync } from "node:fs";
import { inflateSync, deflateSync } from "node:zlib";

// ── decode PNG (8-bit, colortype 2/6) ───────────────────────────────────────
function decodePNG(buf) {
  let p = 8, w, h, ct, idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString("ascii", p + 4, p + 8), data = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)), bpp = ct === 6 ? 4 : 3, stride = w * bpp;
  const out = new Uint8ClampedArray(w * h * 4); const cur = Buffer.alloc(stride), prev = Buffer.alloc(stride);
  let o = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[o++];
    for (let x = 0; x < stride; x++) {
      const rb = raw[o + x], a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v;
      if (f === 0) v = rb; else if (f === 1) v = rb + a; else if (f === 2) v = rb + b;
      else if (f === 3) v = rb + ((a + b) >> 1);
      else { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v = rb + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      cur[x] = v & 0xff;
    }
    for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (ct === 6) { out[i] = cur[x * 4]; out[i + 1] = cur[x * 4 + 1]; out[i + 2] = cur[x * 4 + 2]; out[i + 3] = cur[x * 4 + 3]; } else { out[i] = cur[x * 3]; out[i + 1] = cur[x * 3 + 1]; out[i + 2] = cur[x * 3 + 2]; out[i + 3] = 255; } }
    cur.copy(prev); o += stride;
  }
  return { w, h, d: out };
}

// sample com wrap (tileável) + opção de escurecer (face em sombra: multiply + hue frio)
function sample(tile, x, y, shade = 1, blue = 0) {
  const tx = ((x % tile.w) + tile.w) % tile.w, ty = ((y % tile.h) + tile.h) % tile.h;
  const i = (ty * tile.w + tx) * 4;
  return [tile.d[i] * shade, tile.d[i + 1] * shade, tile.d[i + 2] * shade + blue, tile.d[i + 3]];
}

// ── canvas RGBA ─────────────────────────────────────────────────────────────
class Buf {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  set(x, y, r, g, b, a = 255) { if (x < 0 || y < 0 || x >= this.w || y >= this.h || a === 0) return; const i = (y * this.w + x) * 4; if (a === 255) { this.d[i] = r; this.d[i + 1] = g; this.d[i + 2] = b; this.d[i + 3] = 255; } else { const af = a / 255, ia = 1 - af; this.d[i] = r * af + this.d[i] * ia; this.d[i + 1] = g * af + this.d[i + 1] * ia; this.d[i + 2] = b * af + this.d[i + 2] * ia; this.d[i + 3] = Math.max(this.d[i + 3], a); } }
  rect(x, y, w, h, r, g, b, a) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, r, g, b, a); }
  scaled(z) { const o = new Buf(this.w * z, this.h * z); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const i = (y * this.w + x) * 4; if (!this.d[i + 3]) continue; for (let yy = 0; yy < z; yy++) for (let xx = 0; xx < z; xx++) { const j = ((y * z + yy) * o.w + x * z + xx) * 4; o.d[j] = this.d[i]; o.d[j + 1] = this.d[i + 1]; o.d[j + 2] = this.d[i + 2]; o.d[j + 3] = 255; } } return o; }
}
function png(b) {
  const { w, h, d } = b, raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = d[y * w * 4 + x]; }
  const idat = deflateSync(raw), T = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
  const crc = (x) => { let c = 0xFFFFFFFF; for (const v of x) c = T[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const ch = (t, dd) => { const l = Buffer.alloc(4); l.writeUInt32BE(dd.length); const tt = Buffer.from(t), cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dd]))); return Buffer.concat([l, tt, dd, cc]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch("IHDR", ih), ch("IDAT", idat), ch("IEND", Buffer.alloc(0))]);
}

// ── carrega material de pedra ────────────────────────────────────────────────
const SET = process.argv[2] || "muro-topo";
const DIR = `design/pixellab-candidatos/tiles/${SET}`;
const TOP = decodePNG(readFileSync(`${DIR}/wang-1111.png`)); // granito lit
const OUT = [16, 20, 28]; // outline #10141c

// desenha 1 peça de muro (32x44) compondo o MATERIAL na estrutura autotile.
// wx,wy = posição no mundo (p/ amostrar o material com offset → sem repetição óbvia)
function wallTile(buf, dx, dyTop, mask, wx, wy) {
  const N = mask & 1, E = mask & 2, S = mask & 4, W = mask & 8;
  const ox = wx * 32, oy = wy * 32;
  const topEnd = S ? 44 : 13;
  // TOPO: pedra lit amostrada do material
  for (let y = 0; y < topEnd; y++) for (let x = 0; x < 32; x++) { const [r, g, b] = sample(TOP, ox + x, oy + y); buf.set(dx + x, dyTop + y, r, g, b); }
  if (!N) buf.rect(dx, dyTop + 1, 32, 1, 150, 165, 185, 200); // lip de luz norte
  if (!S) {
    // separação topo→face
    buf.rect(dx, dyTop + 11, 32, 2, 14, 17, 23, 255);
    // FACE: mesma pedra escurecida (sombra fria) + leve gradiente p/ baixo
    for (let y = 13; y < 44; y++) for (let x = 0; x < 32; x++) {
      const grad = 0.62 - (y - 13) / 31 * 0.22; // escurece pra base
      const [r, g, b] = sample(TOP, ox + x, oy + (y - 13), grad, 6);
      buf.set(dx + x, dyTop + y, r, g, b);
    }
    buf.rect(dx, dyTop + 41, 32, 3, 0, 0, 0, 100); // sombra de contato
  }
  // caps de borda
  if (!W) buf.rect(dx, dyTop, 1, 44, ...OUT, 255);
  if (!E) buf.rect(dx + 31, dyTop, 1, 44, ...OUT, 255);
  if (!N) buf.rect(dx, dyTop, 32, 1, ...OUT, 255);
}

// ── fortim ───────────────────────────────────────────────────────────────────
const FW = 16, FH = 11, wallSet = new Set();
for (let x = 2; x < FW - 2; x++) { wallSet.add(`${x},2`); if (x < 7 || x > 9) wallSet.add(`${x},${FH - 2}`); }
for (let y = 2; y < FH - 1; y++) { wallSet.add(`2,${y}`); wallSet.add(`${FW - 3},${y}`); }
const isW = (x, y) => wallSet.has(`${x},${y}`);
const scene = new Buf(FW * 32, FH * 32);
scene.rect(0, 0, FW * 32, FH * 32, 43, 63, 49, 255); // grama base
for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
  if (!isW(x, y)) continue;
  const mask = (isW(x, y - 1) ? 1 : 0) | (isW(x + 1, y) ? 2 : 0) | (isW(x, y + 1) ? 4 : 0) | (isW(x - 1, y) ? 8 : 0);
  wallTile(scene, x * 32, (y + 1) * 32 - 44, mask, x, y);
}
const outName = `/tmp/wall-${SET}.png`;
writeFileSync(outName, png(scene.scaled(3)));
console.log("ok →", outName);
