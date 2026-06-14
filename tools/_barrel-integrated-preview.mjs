#!/usr/bin/env node
// Preview do makeBarrel JÁ INTEGRADO (cópia fiel do corpo em sprites.ts) — ATUAL
// (cilindro-lata original) vs 4 variantes seedadas. -> _prop-barril-integrado.png
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mulberry32 = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
function mixHex(a, b, t) { const x = hx(a), y = hx(b), p2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"); return `#${p2(x[0] + (y[0] - x[0]) * t)}${p2(x[1] + (y[1] - x[1]) * t)}${p2(x[2] + (y[2] - x[2]) * t)}`; }
function rampHex(stops, n) { const out = []; for (let i = 0; i < n; i++) { const t = (i / (n - 1)) * (stops.length - 1), lo = Math.floor(t); out.push(mixHex(stops[lo], stops[Math.min(stops.length - 1, lo + 1)], t - lo)); } return out; }
function Canvas(w, h) {
  const d = new Uint8ClampedArray(w * h * 4);
  return {
    w, h, d,
    px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const [r, g, b] = hx(c); const i = (y * w + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; },
    rect(x, y, ww, hh, c) { for (let j = 0; j < Math.round(hh); j++) for (let i = 0; i < Math.round(ww); i++) this.px(Math.round(x) + i, Math.round(y) + j, c); },
    ellipse(cx, cy, rx, ry, c) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.px(x, y, c); },
    alphaAt(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? d[(y * w + x) * 4 + 3] : 0; },
    outline(c) { const paint = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (this.alphaAt(x, y) > 0) continue; if (this.alphaAt(x - 1, y) > 60 || this.alphaAt(x + 1, y) > 60 || this.alphaAt(x, y - 1) > 60 || this.alphaAt(x, y + 1) > 60) paint.push([x, y]); } for (const [x, y] of paint) this.px(x, y, c); },
  };
}
// paleta + rampas (idênticas ao sprites.ts)
const S = 4, WOOD = "#3b2c1f", WOOD_LT = "#4c3a29", WOOD_DK = "#2a2016", WOOD_HI = "#5e4a34", IRON = "#20242c", IRON_HI = "#3a4150", PROP_OUT = "#10141c";
const WD8 = rampHex(["#1c1610", WOOD_DK, WOOD, WOOD_LT, WOOD_HI, "#6e5740"], 8);
const IRN6 = rampHex(["#14161c", IRON, "#2c3340", IRON_HI, "#5a6678"], 6);
const RST3 = ["#3a2414", "#52331c", "#6e4626"], COOLRIM = "#2c3744";

function barrelOld() { // makeBarrel() original (cilindro-lata)
  const p = Canvas(18 * S, 24 * S), cx = 9 * S, top = 5 * S, bot = 21 * S;
  const ramp = [WOOD_DK, WOOD, WOOD_LT, WOOD_HI, WOOD_LT, WOOD, WOOD, WOOD, WOOD, WOOD_DK, WOOD_DK, WOOD_DK];
  for (let i = 0; i < 12; i++) p.rect((3 + i) * S, top, S, bot - top, ramp[i]);
  for (let y = top + 4 * S; y < bot - 4 * S; y++) { p.rect(2 * S, y, S, 1, ramp[0]); p.rect(15 * S, y, S, 1, ramp[11]); }
  for (const sx of [6, 9, 12]) p.rect(sx * S, top + S, S, bot - top - 2 * S, WOOD_DK);
  for (const ay of [8, 16]) { p.rect(2 * S, ay * S, 14 * S, S, IRON_HI); p.rect(2 * S, ay * S + S, 14 * S, 2 * S, IRON); }
  p.ellipse(cx, top, 6 * S, 2.4 * S, WOOD); p.ellipse(cx, top, 5 * S, 1.8 * S, WOOD_LT);
  for (let x = cx - 3 * S; x <= cx + S; x++) p.rect(x, top - 2 * S, 1, S, WOOD_HI);
  for (let x = cx - 6 * S; x <= cx + 6 * S; x++) if (((x - cx) / (6 * S)) ** 2 <= 1) p.rect(x, top + 2 * S, 1, S, IRON);
  p.outline(PROP_OUT); return p;
}
function barrelNew(seed = 11) { // CÓPIA FIEL do makeBarrel(seed) integrado
  const W = 18 * S, H = 24 * S, p = Canvas(W, H), rng = mulberry32(seed);
  const cx = W / 2, top = Math.round(H * 0.16), bot = Math.round(H * 0.90);
  const halfW = (y) => { const t = Math.min(1, Math.max(0, (y - top) / (bot - top))); return W * 0.30 + Math.sin(Math.PI * t) * W * 0.085; };
  const aL = -0.5, NST = 9;
  const shade = (rel) => (Math.cos(Math.asin(Math.min(1, Math.max(-1, rel))) - aL) + 0.48) / 1.48 * 7;
  const seams = []; for (let k = 1; k < NST; k++) seams.push(-Math.PI / 2 + (k * Math.PI) / NST);
  for (let y = top; y <= bot; y++) { const hw = halfW(y); for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) { const rel = (x - cx) / hw; const idx = Math.round(Math.min(7, Math.max(0, shade(rel) + (Math.sin(x * 1.3 + seed) > 0.86 ? -0.5 : 0)))); p.px(x, y, rel > 0.92 ? mixHex(WD8[idx], COOLRIM, 0.4) : WD8[idx]); } }
  for (let y = top + 2; y <= bot - 2; y++) { const hw = halfW(y); for (const a of seams) { const x = Math.round(cx + Math.sin(a) * hw), bi = shade(Math.sin(a)); p.px(x, y, WD8[Math.max(0, Math.floor(bi) - 2)]); if (Math.sin(a) < 0.1) p.px(x + 1, y, WD8[Math.min(7, Math.floor(bi) + 1)]); } }
  const hoopYs = [0.16, 0.50, 0.84].map((f) => Math.round(top + (bot - top) * f)); const hg = Math.max(3, Math.round(H * 0.07));
  for (const yc of hoopYs) {
    for (let y = yc; y < yc + hg; y++) { const hw = halfW(y) + 0.5, ty = (y - yc) / (hg - 1); for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) { const rel = (x - cx) / hw; let idx = (shade(rel) / 7) * 4; if (y === yc) idx = 0.4; else if (ty < 0.34) idx += 1.6; else if (y === yc + hg - 1) idx = 0.2; let col = IRN6[Math.round(Math.min(5, Math.max(0, idx)))]; if (ty > 0.3 && rng() < 0.04) col = RST3[1 + Math.floor(rng() * 2)]; p.px(x, y, rel > 0.93 ? mixHex(col, COOLRIM, 0.4) : col); } }
    const ym = yc + Math.floor(hg / 2);
    for (const a of seams) { if (Math.abs(Math.sin(a)) > 0.85) continue; const x = Math.round(cx + Math.sin(a) * (halfW(ym) + 0.5)); p.px(x, ym - 1, IRN6[5]); p.px(x, ym, IRN6[0]); }
  }
  const lrx = halfW(top) + 0.5, lry = Math.max(3, Math.round(H * 0.085));
  for (let y = Math.floor(top - lry); y <= top + lry; y++) for (let x = Math.floor(cx - lrx); x <= cx + lrx; x++) { const e = ((x - cx) / lrx) ** 2 + ((y - top) / lry) ** 2; if (e > 1) continue; const back = (top - y) / lry, left = (cx - x) / lrx, dome = 1 - e; p.px(x, y, WD8[Math.round(Math.min(7, Math.max(1, 3.4 + back * 1.4 + left * 0.8 + dome * 0.8)))]); }
  for (let a = 0; a < 360; a += 2) { const r = a * Math.PI / 180, x = cx + Math.cos(r) * lrx, y = top + Math.sin(r) * lry; p.px(x, y, Math.sin(r) < 0 ? IRN6[3] : IRN6[1]); }
  for (let x = Math.round(cx - lrx * 0.7); x <= cx; x++) p.px(x, Math.round(top - lry), WD8[7]);
  p.outline(PROP_OUT); return p;
}
// composição
const FONT = { A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"], T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"], U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"], L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"], N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"], O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"], V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"], S: ["01111", "10000", "01110", "00001", "00001", "10001", "01110"], "#": ["01010", "11111", "01010", "01010", "11111", "01010", "00000"], "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"], "2": ["01110", "10001", "00010", "00100", "01000", "10000", "11111"], "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"], "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"], " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"] };
function text(dst, str, x, y, sc, c) { let cx = x; for (const ch of str) { const g = FONT[ch] || FONT[" "]; for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) if (g[r][col] === "1") dst.rect(cx + col * sc, y + r * sc, sc, sc, c); cx += 6 * sc; } }
const toHex = (r, g, b) => `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
function paste(dst, src, ox, oy, z) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const i = (y * src.w + x) * 4; if (src.d[i + 3] === 0) continue; const c = toHex(src.d[i], src.d[i + 1], src.d[i + 2]); for (let zy = 0; zy < z; zy++) for (let zx = 0; zx < z; zx++) dst.px(ox + x * z + zx, oy + y * z + zy, c); } }
function main() {
  const cols = [{ s: barrelOld(), n: "ATUAL", c: "#9aa0ac" }, { s: barrelNew(11), n: "NOVO s1", c: "#e8c87a" }, { s: barrelNew(29), n: "NOVO s2", c: "#e8c87a" }, { s: barrelNew(47), n: "NOVO s3", c: "#e8c87a" }, { s: barrelNew(83), n: "NOVO s4", c: "#e8c87a" }];
  const Z = 5, gap = 24, pad = 24, lblH = 24, cW = 18 * S * Z, figH = 24 * S * Z;
  const sheet = Canvas(pad * 2 + cW * cols.length + gap * (cols.length - 1), pad * 2 + figH + lblH);
  sheet.rect(0, 0, sheet.w, sheet.h, "#15171d");
  const gY = pad + figH;
  cols.forEach((c, i) => { const colX = pad + i * (cW + gap); const sw = cW * 0.6, sh = 7 * Z * 0.5; for (let yy = -sh; yy <= sh; yy++) for (let xx = -sw; xx <= sw; xx++) if ((xx / sw) ** 2 + (yy / sh) ** 2 <= 1) sheet.px(colX + cW / 2 + xx, gY - 14 + yy, "#0d0f14"); paste(sheet, c.s, colX, pad, Z); text(sheet, c.n, colX + 4, gY + 6, 2, c.c); });
  writeFileSync("design/pixellab-candidatos/_prop-barril-integrado.png", encodePng(sheet.w, sheet.h, sheet.d));
  console.log("[ok] _prop-barril-integrado.png");
}
function encodePng(w, h, d) { const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = d[y * w * 4 + x]; } const idat = deflateSync(raw), ct = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; ct[n] = c >>> 0; } const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = ct[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }; const chunk = (t, dt) => { const len = Buffer.alloc(4); len.writeUInt32BE(dt.length); const tt = Buffer.from(t); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dt]))); return Buffer.concat([len, tt, dt, cc]); }; const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]); }
main();
