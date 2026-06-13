#!/usr/bin/env node
// Mock de ESCALA 1:1 — coloca o char de referência (128) e um mob em vários tamanhos
// sobre uma grade de tiles 128px, ancorados no chão, pra o criador cravar a proporção.
// NÃO é arte final: as % servem só pra DECIDIR o tamanho-alvo (depois a arte é gerada nesse
// tamanho, não downscalada). Uso: node tools/mock-escala.mjs <mob.png> <char.png>

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

// bbox dos pixels não-transparentes
function bbox(im) {
  let x0 = im.w, y0 = im.h, x1 = 0, y1 = 0;
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) {
    if (im.d[(y * im.w + x) * 4 + 3] > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

const TILE = 128;
const CELLS = [["char", null], ["100%", 1.0], ["75%", 0.75], ["55%", 0.55]];
const GROUND = [60, 66, 72]; // chão cinza-neutro
const LINE = [92, 100, 108];

const mob = decodePng(readFileSync(process.argv[2]));
const char = decodePng(readFileSync(process.argv[3]));

const W = TILE * CELLS.length, H = TILE;
const out = new Uint8ClampedArray(W * H * 4);
// chão + grade
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 4, grid = x % TILE === 0 || y % TILE === 0 || x % TILE === TILE - 1;
  const c = grid ? LINE : GROUND;
  out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = 255;
}
// blit nearest, ancorado no CHÃO (base da bbox na linha de baixo do tile, margem 6px)
function blit(im, scale, cellX) {
  const bb = bbox(im);
  const dw = Math.round(bb.w * scale), dh = Math.round(bb.h * scale);
  const baseY = H - 6;                       // linha do chão
  const dx0 = cellX + Math.round((TILE - dw) / 2);
  const dy0 = baseY - dh;
  for (let yy = 0; yy < dh; yy++) for (let xx = 0; xx < dw; xx++) {
    const sx = bb.x0 + Math.floor(xx / scale), sy = bb.y0 + Math.floor(yy / scale);
    const si = (sy * im.w + sx) * 4, a = im.d[si + 3];
    if (a < 16) continue;
    const px = dx0 + xx, py = dy0 + yy; if (px < 0 || px >= W || py < 0 || py >= H) continue;
    const di = (py * W + px) * 4, af = a / 255;
    out[di] = im.d[si] * af + out[di] * (1 - af);
    out[di + 1] = im.d[si + 1] * af + out[di + 1] * (1 - af);
    out[di + 2] = im.d[si + 2] * af + out[di + 2] * (1 - af);
    out[di + 3] = 255;
  }
}
CELLS.forEach(([_, sc], i) => blit(sc === null ? char : mob, sc === null ? 1.0 : sc, i * TILE));

const fout = "design/pixellab-candidatos/mobs/aranha/_mock-escala.png";
writeFileSync(fout, png(W, H, out));
console.log(`mock salvo: ${fout} (${W}x${H}) — células: ${CELLS.map(c => c[0]).join(" | ")}`);
