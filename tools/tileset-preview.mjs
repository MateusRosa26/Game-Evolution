#!/usr/bin/env node
// Preview de um tileset Wang gerado (16 wang-*.png) → 1 PNG ampliado pra curadoria:
//   - grid das 16 máscaras
//   - patch 5×5 do tile base (wang-0000) pra checar costura (seamless?)
// Uso: node tools/tileset-preview.mjs <pastaDoTileset>
//   ex.: node tools/tileset-preview.mjs design/pixellab-candidatos/tiles/esgoto-chao
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { inflateSync, deflateSync } from "node:zlib";

// ── decoder PNG mínimo (8-bit, color type 2/6, todos os 5 filtros) ──────────
function decodePng(buf) {
  let pos = 8, w = 0, h = 0, ct = 6; const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos); const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const ch = ct === 6 ? 4 : 3, stride = w * ch;
  const out = new Uint8ClampedArray(w * h * 4);
  const cur = new Uint8Array(stride), prev = new Uint8Array(stride);
  let rp = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[rp++];
    for (let x = 0; x < stride; x++) {
      const rb = raw[rp++]; const a = x >= ch ? cur[x - ch] : 0, b = prev[x], c = x >= ch ? prev[x - ch] : 0;
      let v = rb;
      if (f === 1) v = rb + a; else if (f === 2) v = rb + b; else if (f === 3) v = rb + ((a + b) >> 1);
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = rb + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      cur[x] = v & 255;
    }
    for (let x = 0; x < w; x++) { const si = x * ch, di = (y * w + x) * 4; out[di] = cur[si]; out[di + 1] = cur[si + 1]; out[di + 2] = cur[si + 2]; out[di + 3] = ch === 4 ? cur[si + 3] : 255; }
    prev.set(cur);
  }
  return { w, h, d: out };
}

// ── canvas + encoder (igual aos outros previews) ────────────────────────────
class Buf {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  fill(r, g, b) { for (let i = 0; i < this.w * this.h; i++) { this.d[i * 4] = r; this.d[i * 4 + 1] = g; this.d[i * 4 + 2] = b; this.d[i * 4 + 3] = 255; } }
  blit(src, dx, dy) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const si = (y * src.w + x) * 4; if (src.d[si + 3] === 0) continue; const di = ((dy + y) * this.w + (dx + x)) * 4; if (dx + x < 0 || dy + y < 0 || dx + x >= this.w || dy + y >= this.h) continue; this.d[di] = src.d[si]; this.d[di + 1] = src.d[si + 1]; this.d[di + 2] = src.d[si + 2]; this.d[di + 3] = 255; } }
  scaledTo(z) { const o = new Buf(this.w * z, this.h * z); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const si = (y * this.w + x) * 4; for (let yy = 0; yy < z; yy++) for (let xx = 0; xx < z; xx++) { const di = ((y * z + yy) * o.w + (x * z + xx)) * 4; o.d[di] = this.d[si]; o.d[di + 1] = this.d[si + 1]; o.d[di + 2] = this.d[si + 2]; o.d[di + 3] = this.d[si + 3]; } } return o; }
}
function png(buf) { const { w, h, d } = buf; const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = d[y * w * 4 + x]; }
  const idat = deflateSync(raw); const ct = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; ct[n] = c >>> 0; }
  const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = ct[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (t, dt) => { const len = Buffer.alloc(4); len.writeUInt32BE(dt.length); const tt = Buffer.from(t); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dt]))); return Buffer.concat([len, tt, dt, cc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]); }

// ── montagem ─────────────────────────────────────────────────────────────────
const dir = process.argv[2];
if (!dir) { console.error("uso: node tools/tileset-preview.mjs <pastaDoTileset>"); process.exit(1); }
const load = (name) => decodePng(readFileSync(join(dir, name)));
const files = readdirSync(dir).filter((f) => /^wang-\d{4}\.png$/.test(f)).sort();
const tiles = files.map(load);
const TS = tiles[0].w; // 32

// grid 8×2 das 16 máscaras
const COLS = 8, PAD = 4;
const cellW = TS + PAD, cellH = TS + PAD;
const gridW = COLS * cellW + PAD, gridH = 2 * cellH + PAD;
// patch 5×5 do tile base (wang-0000) p/ checar costura
const base = tiles[files.indexOf("wang-0000.png")] || tiles[0];
const PN = 5, patchW = PN * TS, patchH = PN * TS;

const W = Math.max(gridW, patchW + 2 * PAD), H = gridH + PAD + patchH + PAD;
const sheet = new Buf(W, H); sheet.fill(0x15, 0x17, 0x24);
tiles.forEach((t, i) => sheet.blit(t, PAD + (i % COLS) * cellW, PAD + Math.floor(i / COLS) * cellH));
for (let y = 0; y < PN; y++) for (let x = 0; x < PN; x++) sheet.blit(base, PAD + x * TS, gridH + PAD + y * TS);

const out = join(dir, "_preview.png");
writeFileSync(out, png(sheet.scaledTo(5)));
console.log(`ok → ${out}  (${files.length} tiles, ${TS}px)`);
