#!/usr/bin/env node
// Recria o sprite 32px de PRODUÇÃO a partir do master 96px já aprovado
// (design/pixellab-candidatos/items/<id>/aprovado-<id>.png) → img/items/<categoria>/<id>.png.
// Útil para recuperar arquivo corrompido (hazard OneDrive/renameSync) ou re-downscale.
// Uso: node tools/refinalize-from-master.mjs <id> [<id>...]   (sem args = todos com master)

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { inflateSync, deflateSync } from "node:zlib";
import { ITEM_CATEGORY, categoryOf } from "./categories.mjs";

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
function downscale(src, target) {
  const { w, h, d } = src, f = Math.round(w / target);
  const out = new Uint8ClampedArray(target * target * 4);
  for (let oy = 0; oy < target; oy++) for (let ox = 0; ox < target; ox++) {
    let sr = 0, sg = 0, sb = 0, sa = 0, n = 0;
    for (let yy = 0; yy < f; yy++) for (let xx = 0; xx < f; xx++) {
      const sx = ox * f + xx, sy = oy * f + yy; if (sx >= w || sy >= h) continue;
      const si = (sy * w + sx) * 4, a = d[si + 3]; sr += d[si] * a; sg += d[si + 1] * a; sb += d[si + 2] * a; sa += a; n++;
    }
    const di = (oy * target + ox) * 4; out[di + 3] = Math.round(sa / n);
    if (sa > 0) { out[di] = Math.round(sr / sa); out[di + 1] = Math.round(sg / sa); out[di + 2] = Math.round(sb / sa); }
  }
  return { w: target, h: target, d: out };
}

const STAGE = join("design", "pixellab-candidatos", "items");
const masterPath = (id) => join(STAGE, ITEM_CATEGORY[id], id, `aprovado-${id}.png`);
let ids = process.argv.slice(2);
if (!ids.length) ids = Object.keys(ITEM_CATEGORY).filter((id) => existsSync(masterPath(id)));

for (const id of ids) {
  const master = masterPath(id);
  if (!existsSync(master)) { console.warn(`[pula] ${id}: sem master`); continue; }
  const cat = categoryOf(id);
  const dir = join("src", "client", "assets", "img", "items", cat);
  mkdirSync(dir, { recursive: true });
  const src = decodePng(readFileSync(master));
  const small = downscale(src, 32);
  writeFileSync(join(dir, `${id}.png`), png(small.w, small.h, small.d));
  console.log(`[ok] ${cat}/${id}.png (downscale ${src.w}→32 do master)`);
}
