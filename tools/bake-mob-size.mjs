#!/usr/bin/env node
// Bakeia um candidato de mob no TAMANHO-ALVO (figura escalada, ancorada no chão, centrada,
// num canvas 128 transparente) → vira o estático canônico nativo (render 1:1, sem scale em runtime).
// Uso: node tools/bake-mob-size.mjs <src.png> <scale> <out.png>

import { readFileSync, writeFileSync } from "node:fs";
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
function bbox(im) {
  let x0 = im.w, y0 = im.h, x1 = 0, y1 = 0;
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.d[(y * im.w + x) * 4 + 3] > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

const CANVAS = 128, GROUND_MARGIN = 8;
const src = decodePng(readFileSync(process.argv[2]));
const scale = parseFloat(process.argv[3] || "0.55");
const outPath = process.argv[4] || "out.png";

const bb = bbox(src);
const dw = Math.round(bb.w * scale), dh = Math.round(bb.h * scale);
const out = new Uint8ClampedArray(CANVAS * CANVAS * 4); // transparente
const dx0 = Math.round((CANVAS - dw) / 2);
const dy0 = CANVAS - GROUND_MARGIN - dh;
for (let yy = 0; yy < dh; yy++) for (let xx = 0; xx < dw; xx++) {
  const sx = bb.x0 + Math.min(bb.w - 1, Math.floor(xx / scale)), sy = bb.y0 + Math.min(bb.h - 1, Math.floor(yy / scale));
  const si = (sy * src.w + sx) * 4; if (src.d[si + 3] < 16) continue;
  const px = dx0 + xx, py = dy0 + yy, di = (py * CANVAS + px) * 4;
  out[di] = src.d[si]; out[di + 1] = src.d[si + 1]; out[di + 2] = src.d[si + 2]; out[di + 3] = src.d[si + 3];
}
writeFileSync(outPath, png(CANVAS, CANVAS, out));
console.log(`baked: ${outPath} — figura ${dw}x${dh} em canvas ${CANVAS} (scale ${scale}, src bbox ${bb.w}x${bb.h})`);
