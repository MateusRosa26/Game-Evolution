#!/usr/bin/env node
// Preview do makeChest JÁ INTEGRADO (cópia fiel) — ATUAL vs NOVO, fechado + aberto.
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mulberry32 = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const mixHex = (a, b, t) => { const x = hx(a), y = hx(b), p2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"); return `#${p2(x[0] + (y[0] - x[0]) * t)}${p2(x[1] + (y[1] - x[1]) * t)}${p2(x[2] + (y[2] - x[2]) * t)}`; };
const rampHex = (stops, n) => { const out = []; for (let i = 0; i < n; i++) { const t = (i / (n - 1)) * (stops.length - 1), lo = Math.floor(t); out.push(mixHex(stops[lo], stops[Math.min(stops.length - 1, lo + 1)], t - lo)); } return out; };
function Canvas(w, h) { const d = new Uint8ClampedArray(w * h * 4); return { w, h, d, px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const [r, g, b] = hx(c); const i = (y * w + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; }, rect(x, y, ww, hh, c) { for (let j = 0; j < Math.round(hh); j++) for (let i = 0; i < Math.round(ww); i++) this.px(Math.round(x) + i, Math.round(y) + j, c); }, alphaAt(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? d[(y * w + x) * 4 + 3] : 0; }, outline(c) { const pa = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (this.alphaAt(x, y) > 0) continue; if (this.alphaAt(x - 1, y) > 60 || this.alphaAt(x + 1, y) > 60 || this.alphaAt(x, y - 1) > 60 || this.alphaAt(x, y + 1) > 60) pa.push([x, y]); } for (const [x, y] of pa) this.px(x, y, c); } }; }
const S = 4, WOOD = "#3b2c1f", WOOD_LT = "#4c3a29", WOOD_DK = "#2a2016", WOOD_HI = "#5e4a34", IRON = "#20242c", IRON_HI = "#3a4150", PROP_OUT = "#10141c";
const FITTING = "#6b5a3a", FITTING_HI = "#8a7448", FITTING_DK = "#3e3322", PIT_DK = "#0a0d12";
const WD8 = rampHex(["#1c1610", WOOD_DK, WOOD, WOOD_LT, WOOD_HI, "#6e5740"], 8);
const IRN6 = rampHex(["#14161c", IRON, "#2c3340", IRON_HI, "#5a6678"], 6);
const RST3 = ["#3a2414", "#52331c", "#6e4626"], COOLRIM = "#2c3744";
const BRZ6 = rampHex(["#2f2412", "#3e3322", "#6b5a3a", "#8a7448", "#c2a052", "#ecd488"], 6);

function chestOld(open) { // makeChest original verbatim
  const p = Canvas(30 * S, 26 * S), x0 = 3 * S, w = 24 * S, bodyTop = 12 * S, bodyBot = 24 * S;
  for (let x = x0; x < x0 + w; x++) { const t = (x - x0) / w; const c = t < 0.12 ? WOOD_DK : t < 0.28 ? WOOD : t < 0.5 ? WOOD_LT : t < 0.8 ? WOOD : WOOD_DK; p.rect(x, bodyTop, S, bodyBot - bodyTop, c); }
  for (const jx of [9, 15, 21]) p.rect(jx * S, bodyTop + S, S, bodyBot - bodyTop - 2 * S, WOOD_DK);
  p.rect(x0, bodyTop, w, S, WOOD_HI); p.rect(x0, bodyBot - S, w, S, WOOD_DK);
  p.rect(x0, bodyTop, 2 * S, bodyBot - bodyTop, FITTING); p.rect(x0, bodyTop, S, bodyBot - bodyTop, FITTING_HI); p.rect(x0 + w - 2 * S, bodyTop, 2 * S, bodyBot - bodyTop, FITTING_DK);
  if (!open) { const lidTop = 4 * S, lidBot = 13 * S; for (let y = lidTop; y < lidBot; y++) { const k = (y - lidTop) / (lidBot - lidTop); const inset = Math.round((1 - Math.sin(k * Math.PI * 0.5)) * 2 * S); for (let x = x0 + inset; x < x0 + w - inset; x++) { const t = (x - x0) / w; const lit = k < 0.18 || t < 0.2; p.px(x, y, lit ? WOOD_HI : t < 0.5 ? WOOD_LT : t < 0.8 ? WOOD : WOOD_DK); } } p.rect(x0 + 2 * S, lidTop + S, S, lidBot - lidTop - S, FITTING_DK); p.rect(x0 + w - 3 * S, lidTop + S, S, lidBot - lidTop - S, FITTING_DK); p.rect(13 * S, lidTop, 4 * S, S, FITTING_HI); p.rect(13 * S, 10 * S, 4 * S, 5 * S, FITTING); p.rect(13 * S, 10 * S, 4 * S, S, FITTING_HI); p.rect(14 * S, 12 * S, 2 * S, 2 * S, PIT_DK); p.px(15 * S, 13 * S, FITTING_DK); }
  else { p.rect(x0 + 2 * S, bodyTop - S, w - 4 * S, 3 * S, PIT_DK); p.rect(x0 + 3 * S, bodyTop, w - 6 * S, S, "#141821"); const tlx = x0 + 3 * S, trx = x0 + w - 3 * S, lidY = 2 * S, lidH = 8 * S; for (let y = 0; y < lidH; y++) { const shrink = Math.round((y / lidH) * 2 * S); for (let x = tlx + shrink; x < trx - shrink; x++) p.px(x, lidY + y, y < S ? WOOD_LT : y < 2 * S ? WOOD : WOOD_DK); } p.rect(tlx, lidY, trx - tlx, S, WOOD_HI); p.rect(13 * S, lidY, 4 * S, lidH - S, FITTING_DK); p.rect(x0 + 4 * S, bodyTop - 2 * S, 2 * S, 2 * S, FITTING); p.rect(x0 + w - 6 * S, bodyTop - 2 * S, 2 * S, 2 * S, FITTING); }
  p.outline(PROP_OUT); return p;
}
function chestNew(open) { // CÓPIA FIEL do makeChest(open) integrado
  const W = 30 * S, H = 26 * S, p = Canvas(W, H), rng = mulberry32(open ? 2 : 7);
  const cx = W / 2, x0 = 12, w = 96, bodyTop = 50, bodyBot = 98, cl = (v, m) => Math.min(m, Math.max(0, v));
  const straps = [x0 + 4, cx, x0 + w - 5];
  const strapV = (bxC, yA, yB) => { const BW = 3; for (let y = yA; y < yB; y++) for (let dx = -BW; dx <= BW; dx++) { const u = (dx + BW) / (2 * BW); let idx = u < 0.2 ? 4 : u > 0.82 ? 1 : 2 + (u < 0.5 ? 0.5 : 0); if (y === yA || y === yB - 1) idx = 0.5; p.px(bxC + dx, y, IRN6[Math.round(cl(idx, 5))]); } for (let y = yA + 7; y < yB - 4; y += 16) { p.px(bxC - 1, y, IRN6[4]); p.px(bxC, y, IRN6[5]); p.px(bxC + 1, y, IRN6[1]); p.px(bxC, y + 1, IRN6[0]); } };
  const feet = () => { for (const fx of [x0, x0 + w - 8]) for (let y = bodyBot - 1; y < bodyBot + 3; y++) for (let x = fx; x < fx + 8; x++) { const u = (x - fx) / 8; p.px(x, y, IRN6[y === bodyBot + 2 ? 0 : u < 0.3 ? 4 : u > 0.78 ? 1 : 2]); } };
  const nBoard = 5, bw = w / nBoard;
  for (let x = x0; x < x0 + w; x++) { const u = (x - x0) / w; let base = 1.9 + (1 - Math.abs(u - 0.34) * 1.7) * 3.4; const inB = ((x - x0) % bw) / bw; if (inB < 0.08) base += 0.9; else if (inB > 0.9) base -= 2.1; for (let y = bodyTop; y < bodyBot; y++) { let idx = base; if (y === bodyTop) idx += 0.6; else if (y >= bodyBot - 2) idx -= 1.6; if (u > 0.93) idx *= 0.55; p.px(x, y, WD8[Math.round(cl(idx, 7))]); } }
  if (!open) {
    const lidBot = bodyTop, lidFrontTop = 30, lidRy = 14;
    for (let x = x0; x < x0 + w; x++) { const u = (x - x0) / w; for (let y = lidFrontTop; y < lidBot; y++) { const vy = (y - lidFrontTop) / (lidBot - lidFrontTop); const idx = Math.round(cl(2.7 + (0.5 - Math.abs(u - 0.33)) * 1.7 - vy * 1.2, 7)); p.px(x, y, u > 0.92 ? mixHex(WD8[idx], COOLRIM, 0.4) : WD8[idx]); } }
    for (let y = lidFrontTop - lidRy; y <= lidFrontTop + lidRy - 6; y++) for (let x = x0; x < x0 + w; x++) { const ex = (x - cx) / (w / 2 - 1), ey = (y - lidFrontTop) / lidRy; if (ex * ex + ey * ey > 1) continue; const back = (lidFrontTop - y) / lidRy, left = (cx - x) / (w / 2); p.px(x, y, WD8[Math.round(cl(5.0 + back * 1.1 + left * 0.5, 7))]); }
    for (const dx of [-32, -14, 0, 14, 32]) for (let y = lidFrontTop - lidRy + 1; y < lidFrontTop; y++) { const x = cx + dx, ex = (x - cx) / (w / 2 - 1), ey = (y - lidFrontTop) / lidRy; if (ex * ex + ey * ey <= 0.92) p.px(x, y, WD8[3]); }
    for (let x = cx - 28; x < cx + 4; x++) p.px(x, lidFrontTop - lidRy, "#8a7556");
    for (let x = x0 + 1; x < x0 + w - 1; x++) { p.px(x, bodyTop, WD8[0]); p.px(x, bodyTop + 1, WD8[1]); }
    const strapTop = lidFrontTop - lidRy + 3;
    for (const bxC of straps) strapV(bxC, strapTop, bodyBot); feet();
    const lkw = 18, lkh = 24, lkx = cx - lkw / 2, lky = lidBot - 9;
    for (let y = lky; y < lky + lkh; y++) for (let x = lkx; x < lkx + lkw; x++) { const u = (x - lkx) / lkw, v = (y - lky) / lkh; if (v < 0.24 && Math.abs(u - 0.5) / 0.5 > Math.sin((v / 0.24) * Math.PI / 2)) continue; const idx = cl(3.0 + (0.5 - Math.abs(u - 0.30)) * 2.3 - v * 0.8 + (y === lky || x === lkx ? 1.2 : 0) - (y === lky + lkh - 1 || x === lkx + lkw - 1 ? 1.5 : 0), 5); p.px(x, y, BRZ6[Math.round(idx)]); }
    const hxh = cx, hy = lky + 12; for (let yy = -3; yy <= 5; yy++) for (let xx = -2; xx <= 2; xx++) { if ((yy < 1 && xx * xx + yy * yy <= 4) || (yy >= 1 && Math.abs(xx) <= 1)) p.px(hxh + xx, hy + yy, PIT_DK); }
    p.px(hxh - 1, hy - 2, BRZ6[5]); p.px(lkx + 3, lky + 3, "#fbe6b0"); p.px(lkx + 2, lky + 3, BRZ6[5]); p.px(lkx + 3, lky + 2, BRZ6[5]);
  } else {
    for (const bxC of straps) strapV(bxC, bodyTop, bodyBot); feet();
    p.rect(x0 + 3, bodyTop - 2, w - 6, 6, PIT_DK); p.rect(x0 + 5, bodyTop, w - 10, 2, "#141821");
    const lrBot = bodyTop - 2, lrTop = 6, rdome = (x) => { const side = (w / 2) - Math.abs(x - cx); let te = lrTop; if (side < 10) te += (10 - side) * 0.9; return Math.round(te); };
    for (let x = x0 + 1; x < x0 + w - 1; x++) { const te = rdome(x), u = (x - x0) / w; for (let y = te; y < lrBot; y++) { const vy = (y - te) / (lrBot - te); p.px(x, y, WD8[Math.round(cl(1.8 + vy * 2.4 + (0.5 - Math.abs(u - 0.4)) * 0.9, 7))]); } }
    for (let x = x0 + 2; x < x0 + w - 2; x++) { p.px(x, rdome(x), WD8[2]); p.px(x, lrBot - 1, WD8[6]); }
    for (const bxC of straps) for (let y = rdome(bxC) + 1; y < lrBot - 1; y++) { p.px(bxC, y, IRN6[2]); p.px(bxC - 1, y, IRN6[1]); }
    for (const hxg of [x0 + 8, x0 + w - 11]) { p.rect(hxg, bodyTop - 3, 4, 4, IRN6[2]); p.px(hxg, bodyTop - 3, IRN6[4]); }
  }
  p.outline(PROP_OUT); return p;
}
const FONT = { A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"], T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"], U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"], L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"], N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"], O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"], V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"], F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"], E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"], C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"], H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"], D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"], B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"], R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"], " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"] };
const toHex = (r, g, b) => `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
function text(dst, str, x, y, sc, c) { let cx = x; for (const ch of str) { const g = FONT[ch] || FONT[" "]; for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) if (g[r][col] === "1") dst.rect(cx + col * sc, y + r * sc, sc, sc, c); cx += 6 * sc; } }
function paste(dst, src, ox, oy, z) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const i = (y * src.w + x) * 4; if (src.d[i + 3] === 0) continue; const c = toHex(src.d[i], src.d[i + 1], src.d[i + 2]); for (let zy = 0; zy < z; zy++) for (let zx = 0; zx < z; zx++) dst.px(ox + x * z + zx, oy + y * z + zy, c); } }
function main() {
  // FECHADO e ABERTO em escalas (1/2/3×) — checar profundidade 1:1 + silhueta casando
  const closed = chestNew(false), opened = chestNew(true), W = 120, H = 104, pad = 24, gap = 20, zs = [1, 2, 3];
  const rowW = zs.reduce((a, z) => a + W * z + gap, 0), maxZ = Math.max(...zs);
  const sheet = Canvas(pad * 2 + rowW, pad * 2 + (H * maxZ + 30) * 2);
  sheet.rect(0, 0, sheet.w, sheet.h, "#15171d");
  [[closed, "FECHADO"], [opened, "ABERTO"]].forEach(([src, name], r) => {
    let ox = pad; const by = pad + (H * maxZ + 30) * r + H * maxZ;
    for (const z of zs) { paste(sheet, src, ox, by - H * z, z); text(sheet, name + " " + z + "X", ox + 4, by + 6, 2, r ? "#88c8a0" : "#e8c87a"); ox += W * z + gap; }
  });
  writeFileSync("design/pixellab-candidatos/_prop-bau-escalas.png", encodePng(sheet.w, sheet.h, sheet.d));
  console.log("[ok] _prop-bau-escalas.png");
}
function encodePng(w, h, d) { const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = d[y * w * 4 + x]; } const idat = deflateSync(raw), ct = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; ct[n] = c >>> 0; } const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = ct[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }; const chunk = (t, dt) => { const len = Buffer.alloc(4); len.writeUInt32BE(dt.length); const tt = Buffer.from(t); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dt]))); return Buffer.concat([len, tt, dt, cc]); }; const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]); }
main();
