#!/usr/bin/env node
// Preview do makeHouseWallTile JÁ INTEGRADO (cópia fiel) — ATUAL vs NOVO em lisa/
// janela/porta + 3 tiles lisos adjacentes (prova de costura do autotile).
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mulberry32 = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const mixHex = (a, b, t) => { const x = hx(a), y = hx(b), p2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"); return `#${p2(x[0] + (y[0] - x[0]) * t)}${p2(x[1] + (y[1] - x[1]) * t)}${p2(x[2] + (y[2] - x[2]) * t)}`; };
const rampHex = (stops, n) => { const out = []; for (let i = 0; i < n; i++) { const t = (i / (n - 1)) * (stops.length - 1), lo = Math.floor(t); out.push(mixHex(stops[lo], stops[Math.min(stops.length - 1, lo + 1)], t - lo)); } return out; };
function parse(c) { if (c[0] === "#") return [...hx(c), 1]; const m = c.match(/rgba?\(([^)]+)\)/); const a = m[1].split(",").map(Number); return [a[0], a[1], a[2], a[3] ?? 1]; }
function Canvas(w, h) { const d = new Uint8ClampedArray(w * h * 4); return { w, h, d, px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const [r, g, b, a] = parse(c); const i = (y * w + x) * 4; if (a >= 1 || d[i + 3] === 0) { d[i] = r; d[i + 1] = g; d[i + 2] = b; } else { d[i] = d[i] * (1 - a) + r * a; d[i + 1] = d[i + 1] * (1 - a) + g * a; d[i + 2] = d[i + 2] * (1 - a) + b * a; } d[i + 3] = 255; }, rect(x, y, ww, hh, c) { for (let j = 0; j < Math.round(hh); j++) for (let i = 0; i < Math.round(ww); i++) this.px(Math.round(x) + i, Math.round(y) + j, c); }, alphaAt(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? d[(y * w + x) * 4 + 3] : 0; } }; }
const TILE_SIZE = 128, S = 4, HOUSE_WALL_H = 44 * S;
const PAL = { plasterDark: "#8f836b", plasterBase: "#9c9077", plasterLight: "#a99d82", woodPost: "#3b2c1f", woodPostLight: "#4c3a29", trunkDark: "#2a1e14" };
const WOOD = "#3b2c1f", WOOD_LT = "#4c3a29", WOOD_DK = "#2a2016", WOOD_HI = "#5e4a34", IRON = "#20242c", IRON_HI = "#3a4150";
const WD8 = rampHex(["#1c1610", WOOD_DK, WOOD, WOOD_LT, WOOD_HI, "#6e5740"], 8);
const IRN6 = rampHex(["#14161c", IRON, "#2c3340", IRON_HI, "#5a6678"], 6);
const PLR6 = rampHex(["#5f5645", "#776c58", PAL.plasterDark, PAL.plasterBase, PAL.plasterLight, "#b6ab90"], 6);
function beamFill(p, x0, y0, w, h) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const gx = x0 + x, gy = y0 + y; let idx = 2; const g = w >= h ? Math.sin(gy * 1.6) * 0.5 + Math.sin(gx * 0.16) * 0.4 : Math.sin(gx * 1.6) * 0.5 + Math.sin(gy * 0.16) * 0.4; if (g > 0.78) idx += 0.6; else if (g < -0.82) idx -= 0.6; if (y === 0 || x === 0) idx += 1.7; else if (y === h - 1 || x === w - 1) idx -= 1.9; p.px(gx, gy, WD8[Math.min(7, Math.max(0, Math.round(idx)))]); } }
const peg = (p, cx, cy) => { p.rect(cx - 1, cy - 1, 2, 2, WD8[1]); p.px(cx - 1, cy - 1, WD8[4]); p.px(cx, cy, WD8[0]); };

function wallOld(mask, seed, feature) {
  const SC = TILE_SIZE / 32, rng = mulberry32(seed + mask * 31 + 1), HH = HOUSE_WALL_H, p = Canvas(TILE_SIZE, HH);
  const N = (mask & 1) !== 0, W = (mask & 8) !== 0, E = (mask & 2) !== 0;
  const PLA = [PAL.plasterDark, PAL.plasterBase, PAL.plasterLight], BEAM = PAL.woodPost, BEAML = PAL.woodPostLight, BEAMD = PAL.trunkDark, OUT = "#10141c", TOPH = 7 * SC;
  p.rect(0, 0, TILE_SIZE, TOPH, BEAM);
  for (let i = 0; i < Math.round(10 * SC * SC); i++) p.rect(Math.floor(rng() * TILE_SIZE), Math.floor(rng() * TOPH), SC, SC, rng() < 0.5 ? BEAML : BEAMD);
  if (!N) p.rect(0, SC, TILE_SIZE, SC, BEAML);
  for (let y = TOPH; y < HH; y++) for (let x = 0; x < TILE_SIZE; x++) p.px(x, y, PLA[Math.floor(rng() * PLA.length)]);
  p.rect(0, TOPH, TILE_SIZE, 3 * SC, BEAM); p.rect(0, TOPH, TILE_SIZE, SC, BEAML);
  p.rect(0, 40 * SC, TILE_SIZE, 4 * SC, BEAM); p.rect(0, 40 * SC, TILE_SIZE, SC, BEAMD);
  for (const sx of [0, 14, 29]) { p.rect(sx * SC, TOPH, 3 * SC, HH - TOPH, BEAM); p.rect(sx * SC, TOPH, SC, HH - TOPH, BEAML); }
  if (feature === "window") { p.rect(9 * SC, 16 * SC, 14 * SC, 16 * SC, "#1a2026"); p.rect(9 * SC, 16 * SC, 14 * SC, SC, "#0d1116"); p.rect(8 * SC, 15 * SC, 16 * SC, SC, BEAM); p.rect(8 * SC, 32 * SC, 16 * SC, SC, BEAM); p.rect(8 * SC, 15 * SC, SC, 18 * SC, BEAM); p.rect(23 * SC, 15 * SC, SC, 18 * SC, BEAM); p.rect(15 * SC, 16 * SC, SC, 16 * SC, BEAM); p.rect(9 * SC, 23 * SC, 14 * SC, SC, BEAM); p.rect(11 * SC, 18 * SC, SC, SC, "#39505e"); p.rect(12 * SC, 18 * SC, SC, SC, "#39505e"); p.rect(18 * SC, 18 * SC, SC, SC, "#39505e"); }
  else if (feature === "door") { p.rect(9 * SC, 12 * SC, 14 * SC, 32 * SC, BEAM); for (let x = 10 * SC; x < 23 * SC; x += 3 * SC) p.rect(x, 13 * SC, SC, 30 * SC, (x / SC) % 2 ? BEAMD : BEAML); p.rect(9 * SC, 20 * SC, 14 * SC, 2 * SC, BEAMD); p.rect(9 * SC, 34 * SC, 14 * SC, 2 * SC, BEAMD); p.rect(20 * SC, 29 * SC, SC, SC, "#caa64a"); p.rect(20 * SC, 30 * SC, SC, SC, "#8d7330"); }
  p.rect(0, 38 * SC, TILE_SIZE, 2 * SC, "rgba(0,0,0,0.18)"); p.rect(0, 41 * SC, TILE_SIZE, 3 * SC, "rgba(0,0,0,0.35)");
  if (!W) { p.rect(0, 0, 2 * SC, HH, BEAMD); p.rect(0, 0, SC, HH, OUT); }
  if (!E) { p.rect(TILE_SIZE - 2 * SC, 0, 2 * SC, HH, BEAMD); p.rect(TILE_SIZE - SC, 0, SC, HH, OUT); }
  if (!N) p.rect(0, 0, TILE_SIZE, SC, OUT);
  return p;
}
function wallNew(mask, seed, feature) { // CÓPIA FIEL do integrado
  const SC = TILE_SIZE / 32, rng = mulberry32(seed + mask * 31 + 1), HH = HOUSE_WALL_H, p = Canvas(TILE_SIZE, HH);
  const N = (mask & 1) !== 0, W = (mask & 8) !== 0, E = (mask & 2) !== 0, BEAMD = PAL.trunkDark, OUT = "#10141c";
  const TOPH = 7 * SC, midY = 40 * SC, postW = 3 * SC, postsX = [0, 14, 29].map((s) => s * SC);
  const nz = (x, y) => Math.sin(x * 0.09 + 1.7) * 0.4 + Math.sin(y * 0.12 + 0.5) * 0.32 + Math.sin((x + y) * 0.05) * 0.4 + Math.sin(x * 0.3 - y * 0.18) * 0.14;
  const aoR = 5 * SC / 4;
  for (let y = TOPH; y < HH; y++) for (let x = 0; x < TILE_SIZE; x++) { let v = 2.9 + nz(x, y) + (rng() - 0.5) * 0.4; let dx = Infinity; for (const px of postsX) dx = Math.min(dx, Math.abs(x - (px + postW)), Math.abs(x - px)); if (dx < aoR) v -= (aoR - dx) / aoR * 1.4; if (Math.abs(y - midY) < 5 * SC) v -= (5 * SC - Math.abs(y - midY)) / (5 * SC) * 0.5; if (y > HH - 5 * SC) v -= (y - (HH - 5 * SC)) / (5 * SC) * 1.0; const vv = Math.min(5, Math.max(0, v)), lo = Math.floor(vv); p.px(x, y, PLR6[Math.min(5, lo + (vv - lo > 0.5 ? 1 : 0))]); }
  { const bx = (rng() < 0.5 ? 9 : 20) * SC; let cxk = bx; for (let y = 14 * SC; y < 36 * SC; y++) { cxk += rng() < 0.4 ? (rng() < 0.5 ? -1 : 1) : 0; p.px(cxk, y, PLR6[0]); if (rng() < 0.25) p.px(cxk + 1, y, PLR6[1]); } }
  beamFill(p, 0, 0, TILE_SIZE, TOPH); if (!N) p.rect(0, SC, TILE_SIZE, SC, WD8[5]);
  beamFill(p, 0, TOPH, TILE_SIZE, 3 * SC); beamFill(p, 0, midY, TILE_SIZE, 4 * SC);
  for (const px of postsX) beamFill(p, Math.min(px, TILE_SIZE - postW), TOPH, postW, HH - TOPH);
  for (const px of postsX) { const cxp = Math.min(px, TILE_SIZE - postW) + 1; peg(p, cxp, TOPH + 2 * SC); peg(p, cxp, midY + 2 * SC); }
  if (feature === "window") { const wx = 9 * SC, wy = 15 * SC, ww = 14 * SC, wh = 18 * SC; for (let y = wy; y < wy + wh; y++) for (let x = wx; x < wx + ww; x++) p.px(x, y, mixHex("#16202c", "#2c3e50", ((x - wx) / ww + (wy + wh - y) / wh) / 2)); for (let i = 0; i < 6; i++) p.px(wx + 1 + Math.floor(rng() * (ww - 2)), wy + 1 + Math.floor(rng() * (wh - 2)), rng() < 0.4 ? "#cfe0ea" : "#7f9fb0"); beamFill(p, wx - SC, wy - SC, ww + 2 * SC, SC); beamFill(p, wx - SC, wy + wh, ww + 2 * SC, SC); beamFill(p, wx - SC, wy - SC, SC, wh + 2 * SC); beamFill(p, wx + ww, wy - SC, SC, wh + 2 * SC); for (let y = wy; y < wy + wh; y++) p.px(wx + ww / 2 - 1, y, WD8[1]); for (let x = wx; x < wx + ww; x++) p.px(x, wy + wh / 2, WD8[1]); p.rect(wx - SC, wy + wh + SC, ww + 2 * SC, SC, "rgba(0,0,0,0.3)"); }
  else if (feature === "door") { const dx0 = 9 * SC, dw = 14 * SC, dy0 = 12 * SC, dyb = HH - 1, dh = dyb - dy0; for (let x = dx0; x < dx0 + dw; x++) { const u = (x - dx0) / dw, inPl = (x - dx0) % (3 * SC) / (3 * SC); let base = 1.6 + (1 - Math.abs(u - 0.34) * 1.9) * 3.0 + (inPl < 0.12 ? 0.7 : inPl > 0.88 ? -1.2 : 0); for (let y = dy0; y < dyb; y++) p.px(x, y, WD8[Math.min(7, Math.max(0, Math.round(base + (y === dy0 ? 1 : y === dyb - 1 ? -1.4 : 0))))]); } beamFill(p, dx0 - SC, dy0 - SC, dw + 2 * SC, SC); beamFill(p, dx0 - SC, dy0 - SC, SC, dh + SC); beamFill(p, dx0 + dw, dy0 - SC, SC, dh + SC); for (const by of [dy0 + 6 * SC, dyb - 8 * SC]) { for (let y = by; y < by + 2 * SC; y++) for (let x = dx0; x < dx0 + dw; x++) { const ty = (y - by) / (2 * SC - 1); p.px(x, y, IRN6[y === by ? 0 : ty < 0.5 ? 4 : 1]); } for (let k = 2 * SC; k < dw; k += 4 * SC) { p.px(dx0 + k, by, IRN6[5]); p.px(dx0 + k, by + 1, IRN6[0]); } } for (let a = 0; a < 360; a += 12) p.px(dx0 + dw - 4 * SC + Math.cos(a * Math.PI / 180) * 1.6 * SC, (dy0 + dyb) / 2 + Math.sin(a * Math.PI / 180) * 1.6 * SC, IRN6[3]); }
  p.rect(0, 38 * SC, TILE_SIZE, 2 * SC, "rgba(0,0,0,0.18)"); p.rect(0, 41 * SC, TILE_SIZE, 3 * SC, "rgba(0,0,0,0.35)");
  if (!W) { p.rect(0, 0, 2 * SC, HH, BEAMD); p.rect(0, 0, SC, HH, OUT); }
  if (!E) { p.rect(TILE_SIZE - 2 * SC, 0, 2 * SC, HH, BEAMD); p.rect(TILE_SIZE - SC, 0, SC, HH, OUT); }
  if (!N) p.rect(0, 0, TILE_SIZE, SC, OUT);
  return p;
}
const FONT = { A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"], T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"], U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"], L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"], N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"], O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"], V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"], I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"], S: ["01111", "10000", "01110", "00001", "00001", "10001", "01110"], J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"], E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"], P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"], R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"], D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"], C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"], M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"], " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"] };
const toHex = (r, g, b) => `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
function text(dst, str, x, y, sc, c) { let cx = x; for (const ch of str) { const g = FONT[ch] || FONT[" "]; for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) if (g[r][col] === "1") dst.rect(cx + col * sc, y + r * sc, sc, sc, c); cx += 6 * sc; } }
function paste(dst, src, ox, oy, z) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const i = (y * src.w + x) * 4; if (src.d[i + 3] === 0) continue; const c = toHex(src.d[i], src.d[i + 1], src.d[i + 2]); for (let zy = 0; zy < z; zy++) for (let zx = 0; zx < z; zx++) dst.px(ox + x * z + zx, oy + y * z + zy, c); } }
function main() {
  const Z = 2, pad = 20, gx = 26, gy = 34, cW = TILE_SIZE * Z, cH = HOUSE_WALL_H * Z;
  const rows = [["LISA", null], ["JANELA", "window"], ["PORTA", "door"]];
  // costura: 3 tiles adjacentes NOVO lisos (E-end | meio | W-end)
  const seamMasks = [0x2, 0xA, 0x8]; // E só | W+E | W só
  const sheetW = pad * 2 + cW * 2 + gx;
  const sheetH = pad * 2 + rows.length * (cH + gy) + cH + gy + 30;
  const sheet = Canvas(sheetW, sheetH);
  sheet.rect(0, 0, sheet.w, sheet.h, "#15171d");
  rows.forEach(([name, feat], r) => { const oy = pad + r * (cH + gy); paste(sheet, wallOld(0xA, 700, feat), pad, oy, Z); paste(sheet, wallNew(0xA, 700, feat), pad + cW + gx, oy, Z); text(sheet, name + " ATUAL", pad + 4, oy + cH + 6, 2, "#9aa0ac"); text(sheet, name + " NOVO", pad + cW + gx + 4, oy + cH + 6, 2, "#e8c87a"); });
  const sy = pad + rows.length * (cH + gy); for (let i = 0; i < 3; i++) paste(sheet, wallNew(seamMasks[i], 700 + i, null), pad + i * cW, sy, Z); text(sheet, "COSTURA NOVO 3 TILES", pad + 4, sy + cH + 6, 2, "#88c888");
  writeFileSync("design/pixellab-candidatos/_prop-parede-integrado.png", encodePng(sheet.w, sheet.h, sheet.d));
  console.log("[ok] _prop-parede-integrado.png");
}
function encodePng(w, h, d) { const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = d[y * w * 4 + x]; } const idat = deflateSync(raw), ct = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; ct[n] = c >>> 0; } const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = ct[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }; const chunk = (t, dt) => { const len = Buffer.alloc(4); len.writeUInt32BE(dt.length); const tt = Buffer.from(t); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dt]))); return Buffer.concat([len, tt, dt, cc]); }; const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]); }
main();
