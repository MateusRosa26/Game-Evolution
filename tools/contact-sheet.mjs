#!/usr/bin/env node
// Monta um CONTACT SHEET dos candidatos de um item para curadoria visual.
// Cada candidato é ampliado (nearest) sobre fundo DIVIDIDO grama-escura | pedra-clara
// (testa o critério #3 da régua: contraste contra chão escuro E claro), numerado pelo
// índice do candidato (= sufixo do cand-XX.png, pra casar com a deleção depois).
//
// Uso: node tools/contact-sheet.mjs <item-name> [scale] [cols]
//   ex: node tools/contact-sheet.mjs espada-curta 3 4
// Saída: design/pixellab-candidatos/items/<item>/_contact.png

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { inflateSync, deflateSync } from "node:zlib";
import { categoryOf } from "./categories.mjs";

// ---- PNG decode (RGBA) ----
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
// ---- PNG encode (RGBA) ----
function png(w, h, d) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = d[y * w * 4 + x]; }
  const idat = deflateSync(raw), ct = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; ct[n] = c >>> 0; }
  const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = ct[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (t, dt) => { const len = Buffer.alloc(4); len.writeUInt32BE(dt.length); const tt = Buffer.from(t); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dt]))); return Buffer.concat([len, tt, dt, cc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// fonte 3x5 dos dígitos (para numerar as células)
const FONT = {
  0:["111","101","101","101","111"],1:["010","110","010","010","111"],
  2:["111","001","111","100","111"],3:["111","001","111","001","111"],
  4:["101","101","111","001","001"],5:["111","100","111","001","111"],
  6:["111","100","111","101","111"],7:["111","001","010","010","010"],
  8:["111","101","111","101","111"],9:["111","101","111","001","111"],
};

const ITEM = process.argv[2] || "espada-cega";
const SCALE = parseInt(process.argv[3] || "3", 10);
const COLS = parseInt(process.argv[4] || "4", 10);
const PAD = 8;          // moldura entre células
const DIGIT = 3;        // escala dos dígitos do número

// resolve o dir de candidatos: item (por categoria) ou mob (pixellab-candidatos/mobs/<id>)
function candDir(id) {
  try { return join("design", "pixellab-candidatos", "items", categoryOf(id), id); }
  catch { return join("design", "pixellab-candidatos", "mobs", id); }
}
const dir = candDir(ITEM);
const files = readdirSync(dir).filter((f) => /^cand-\d+\.png$/.test(f)).sort();
if (!files.length) { console.error(`sem candidatos em ${dir}`); process.exit(1); }

const cands = files.map((f) => ({ idx: parseInt(f.match(/(\d+)/)[1], 10), im: decodePng(readFileSync(join(dir, f))) }));
const cw = cands[0].im.w * SCALE, chh = cands[0].im.h * SCALE; // tamanho de uma célula (assume tamanhos iguais)
const rows = Math.ceil(cands.length / COLS);
const W = COLS * cw + (COLS + 1) * PAD;
const H = rows * chh + (rows + 1) * PAD;
const out = new Uint8ClampedArray(W * H * 4);

// fundo geral = outline escuro (moldura)
const FRAME = [16, 20, 28];
const GRASS = [44, 58, 38];   // grama escura
const STONE = [150, 148, 140]; // pedra clara
for (let i = 0; i < W * H; i++) { out[i * 4] = FRAME[0]; out[i * 4 + 1] = FRAME[1]; out[i * 4 + 2] = FRAME[2]; out[i * 4 + 3] = 255; }

const setpx = (x, y, r, g, b, a = 255) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const di = (y * W + x) * 4, ia = a / 255, ib = 1 - ia;
  out[di] = out[di] * ib + r * ia; out[di + 1] = out[di + 1] * ib + g * ia; out[di + 2] = out[di + 2] * ib + b * ia; out[di + 3] = 255;
};

cands.forEach((c, n) => {
  const col = n % COLS, row = Math.floor(n / COLS);
  const ox = PAD + col * (cw + PAD), oy = PAD + row * (chh + PAD);
  // fundo dividido grama | pedra
  for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) {
    const bg = x < cw / 2 ? GRASS : STONE;
    setpx(ox + x, oy + y, bg[0], bg[1], bg[2]);
  }
  // candidato ampliado nearest, alpha-blend
  const { w, h, d } = c.im;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const si = (y * w + x) * 4, a = d[si + 3];
    if (!a) continue;
    for (let sy = 0; sy < SCALE; sy++) for (let sx = 0; sx < SCALE; sx++)
      setpx(ox + x * SCALE + sx, oy + y * SCALE + sy, d[si], d[si + 1], d[si + 2], a);
  }
  // número (índice do candidato) — caixa escura + dígitos claros, canto sup. esq.
  const label = String(c.idx);
  const lw = label.length * (3 * DIGIT + DIGIT) + DIGIT, lh = 5 * DIGIT + 2 * DIGIT;
  for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) setpx(ox + x, oy + y, 12, 14, 20, 230);
  let dx = ox + DIGIT;
  for (const chr of label) {
    const g = FONT[chr];
    for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) if (g[y][x] === "1")
      for (let sy = 0; sy < DIGIT; sy++) for (let sx = 0; sx < DIGIT; sx++)
        setpx(dx + x * DIGIT + sx, oy + DIGIT + y * DIGIT + sy, 240, 222, 120);
    dx += 3 * DIGIT + DIGIT;
  }
});

const outPath = join(dir, "_contact.png");
writeFileSync(outPath, png(W, H, out));
console.log(`ok → ${outPath} (${cands.length} candidatos, ${W}x${H})`);
