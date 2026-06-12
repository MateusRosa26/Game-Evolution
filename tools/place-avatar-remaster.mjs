#!/usr/bin/env node
// Coloca os walk frames de um avatar base no worktree do REMASTER (128px) como
// set de char: downscale 252→126 (fator 2, crisp) + naming do loader (s0..n3).
// W = flip automático no loader. Uso: node tools/place-avatar-remaster.mjs <id> [set]

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { inflateSync, deflateSync } from "node:zlib";

const SRC = "/mnt/c/Users/mateu/OneDrive/Desktop/Rpg/design/pixellab-candidatos/chars/base-avatar";
const RM = join(homedir(), "rpg-worktrees/remaster/src/client/assets/img/chars");

function decodePng(buf) {
  let pos = 8, w = 0, h = 0, ct = 6; const idat = [];
  while (pos < buf.length) { const len = buf.readUInt32BE(pos), type = buf.toString("ascii", pos + 4, pos + 8); const data = buf.subarray(pos + 8, pos + 8 + len); if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; } else if (type === "IDAT") idat.push(data); else if (type === "IEND") break; pos += 12 + len; }
  const raw = inflateSync(Buffer.concat(idat)), ch = ct === 6 ? 4 : 3, stride = w * ch;
  const out = new Uint8ClampedArray(w * h * 4), cur = new Uint8Array(stride), prev = new Uint8Array(stride); let rp = 0;
  for (let y = 0; y < h; y++) { const f = raw[rp++]; for (let x = 0; x < stride; x++) { const rb = raw[rp++], a = x >= ch ? cur[x - ch] : 0, b = prev[x], c = x >= ch ? prev[x - ch] : 0; let v = rb; if (f === 1) v = rb + a; else if (f === 2) v = rb + b; else if (f === 3) v = rb + ((a + b) >> 1); else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = rb + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); } cur[x] = v & 255; } for (let x = 0; x < w; x++) { const si = x * ch, di = (y * w + x) * 4; out[di] = cur[si]; out[di + 1] = cur[si + 1]; out[di + 2] = cur[si + 2]; out[di + 3] = ch === 4 ? cur[si + 3] : 255; } prev.set(cur); }
  return { w, h, d: out };
}
function png(w, h, d) {
  const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = d[y * w * 4 + x]; }
  const idat = deflateSync(raw), ct = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; ct[n] = c >>> 0; }
  const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = ct[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (t, dt) => { const len = Buffer.alloc(4); len.writeUInt32BE(dt.length); const tt = Buffer.from(t); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dt]))); return Buffer.concat([len, tt, dt, cc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}
// crop por janela [x0,y0,x1,y1] (sem resample — nativo crisp)
function crop(src, x0, y0, x1, y1) {
  const w = x1 - x0 + 1, h = y1 - y0 + 1, out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = ((y0 + y) * src.w + (x0 + x)) * 4, di = (y * w + x) * 4;
    out[di] = src.d[s]; out[di + 1] = src.d[s + 1]; out[di + 2] = src.d[s + 2]; out[di + 3] = src.d[s + 3];
  }
  return { w, h, d: out };
}

const id = process.argv[2] || "homem-jovem";
const set = process.argv[3] || "aldeao";
const dirMap = { south: "s", east: "e", north: "n" };
const outDir = join(RM, set, "walk");
mkdirSync(outDir, { recursive: true });

// 1) carrega os 12 frames e calcula a UNION bbox (enquadramento consistente entre frames)
const frames = [];
let gx0 = 1e9, gy0 = 1e9, gx1 = -1, gy1 = -1;
for (const [long, short] of Object.entries(dirMap)) {
  for (let f = 0; f < 4; f++) {
    const img = decodePng(readFileSync(join(SRC, `rotations-${id}`, `walk-${long}-0${f}.png`)));
    frames.push({ short, f, img });
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
      if (img.d[(y * img.w + x) * 4 + 3] > 16) { if (x < gx0) gx0 = x; if (x > gx1) gx1 = x; if (y < gy0) gy0 = y; if (y > gy1) gy1 = y; }
    }
  }
}
// nearest-neighbor scale (upscale fracionário p/ preview de tamanho)
function scaleNearest(src, dw, dh) {
  const out = new Uint8ClampedArray(dw * dh * 4);
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const sx = Math.min(src.w - 1, Math.floor((x * src.w) / dw)), sy = Math.min(src.h - 1, Math.floor((y * src.h) / dh));
    const s = (sy * src.w + sx) * 4, di = (y * dw + x) * 4;
    out[di] = src.d[s]; out[di + 1] = src.d[s + 1]; out[di + 2] = src.d[s + 2]; out[di + 3] = src.d[s + 3];
  }
  return { w: dw, h: dh, d: out };
}
const lowestRow = (img) => { for (let y = img.h - 1; y >= 0; y--) for (let x = 0; x < img.w; x++) if (img.d[(y * img.w + x) * 4 + 3] > 8) return y; return img.h - 1; };

// 2) X e TOPO globais (enquadramento consistente); BASE por frame (pé de cada frame
//    na borda de baixo → anchor 0.5,1 aterra cada frame, sem flutuar).
//    Escala uniforme p/ figura ~TARGET_H (todos pelo MESMO fator → escala consistente).
const TARGET_H = 144; // ~1.125 tile (entre o native 127=1 tile e o 160=1.25 tile)
const factor = TARGET_H / (gy1 - gy0 + 1); // 127 → 160 ≈ 1.26×
for (const { short, f, img } of frames) {
  const fb = lowestRow(img);
  const c = crop(img, gx0, gy0, gx1, fb);
  const s = scaleNearest(c, Math.round(c.w * factor), Math.round(c.h * factor));
  writeFileSync(join(outDir, `${short}${f}.png`), png(s.w, s.h, s.d));
}
console.log(`[ok] 12 frames · figura ${gx1 - gx0 + 1}x${gy1 - gy0 + 1}→~${Math.round((gx1 - gx0 + 1) * factor)}x${TARGET_H}px (upscale ${factor.toFixed(2)}×) · base por frame → ${outDir}`);
