#!/usr/bin/env node
// Preview dos sprites de item de PRODUÇÃO (32px) ampliados nearest sobre fundo grama|pedra.
// Uso: node tools/preview-items.mjs <item1> <item2> ...   (sem args = todos)
//   ex: node tools/preview-items.mjs machado-de-mao clava cajado-simples adaga
// Saída: /tmp/items-preview.png

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { inflateSync, deflateSync } from "node:zlib";

function decodePng(buf) {
  let pos = 8, w = 0, h = 0, ct = 6; const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    else if (type === "IDAT") idat.push(data); else if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)), ch = ct === 6 ? 4 : 3, stride = w * ch;
  const out = new Uint8ClampedArray(w * h * 4), cur = new Uint8Array(stride), prev = new Uint8Array(stride);
  let rp = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[rp++];
    for (let x = 0; x < stride; x++) {
      const rb = raw[rp++], a = x >= ch ? cur[x - ch] : 0, b = prev[x], c = x >= ch ? prev[x - ch] : 0;
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
function png(w, h, d) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = d[y * w * 4 + x]; }
  const idat = deflateSync(raw), ct = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; ct[n] = c >>> 0; }
  const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = ct[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (t, dt) => { const len = Buffer.alloc(4); len.writeUInt32BE(dt.length); const tt = Buffer.from(t); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dt]))); return Buffer.concat([len, tt, dt, cc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const ITEMS_DIR = join("src", "client", "assets", "img", "items");
// varre subpastas de categoria → mapa basename → caminho
function walk(dir) {
  const out = {};
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) Object.assign(out, walk(p));
    else if (e.name.endsWith(".png")) out[e.name.replace(/\.png$/, "")] = p;
  }
  return out;
}
const FILES = walk(ITEMS_DIR);
let names = process.argv.slice(2);
if (!names.length) names = Object.keys(FILES).sort();
const S = 8, CELL = 32 * S, PAD = 8, COLS = Math.min(names.length, 6);
const rows = Math.ceil(names.length / COLS);
const W = COLS * CELL + (COLS + 1) * PAD, H = rows * CELL + (rows + 1) * PAD;
const o = new Uint8ClampedArray(W * H * 4);
const FRAME = [16, 20, 28], G = [44, 58, 38], T = [150, 148, 140];
for (let i = 0; i < W * H; i++) { o[i * 4] = FRAME[0]; o[i * 4 + 1] = FRAME[1]; o[i * 4 + 2] = FRAME[2]; o[i * 4 + 3] = 255; }
const setpx = (x, y, r, g, b, a = 255) => { if (x < 0 || y < 0 || x >= W || y >= H) return; const di = (y * W + x) * 4, ia = a / 255, ib = 1 - ia; o[di] = o[di] * ib + r * ia; o[di + 1] = o[di + 1] * ib + g * ia; o[di + 2] = o[di + 2] * ib + b * ia; o[di + 3] = 255; };

names.forEach((nm, n) => {
  const col = n % COLS, row = Math.floor(n / COLS);
  const ox = PAD + col * (CELL + PAD), oy = PAD + row * (CELL + PAD);
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) { const bg = x < CELL / 2 ? G : T; setpx(ox + x, oy + y, bg[0], bg[1], bg[2]); }
  const path = FILES[nm];
  if (!path) { console.warn(`[aviso] sprite não encontrado: ${nm}`); return; }
  const im = decodePng(readFileSync(path));
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    const si = (y * im.w + x) * 4, a = im.d[si + 3]; if (!a) continue;
    for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) setpx(ox + x * S + sx, oy + y * S + sy, im.d[si], im.d[si + 1], im.d[si + 2], a);
  }
});
writeFileSync("/tmp/items-preview.png", png(W, H, o));
console.log(`ok → /tmp/items-preview.png (${names.join(", ")})`);
