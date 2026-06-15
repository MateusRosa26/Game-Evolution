#!/usr/bin/env node
// Preview dos 4 MATERIAIS de parede (makeHouseWallTile integrado, cópia fiel) +
// prova de costura (3 tiles). -> _prop-parede-materiais.png
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mulberry32 = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const hash2D = (x, y, seed = 0) => { let h = seed ^ (x * 374761393) ^ (y * 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const mixHex = (a, b, t) => { const x = hx(a), y = hx(b), p2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"); return `#${p2(x[0] + (y[0] - x[0]) * t)}${p2(x[1] + (y[1] - x[1]) * t)}${p2(x[2] + (y[2] - x[2]) * t)}`; };
const rampHex = (stops, n) => { const out = []; for (let i = 0; i < n; i++) { const t = (i / (n - 1)) * (stops.length - 1), lo = Math.floor(t); out.push(mixHex(stops[lo], stops[Math.min(stops.length - 1, lo + 1)], t - lo)); } return out; };
function parse(c) { if (c[0] === "#") return [...hx(c), 1]; const m = c.match(/rgba?\(([^)]+)\)/); const a = m[1].split(",").map(Number); return [a[0], a[1], a[2], a[3] ?? 1]; }
function Canvas(w, h) { const d = new Uint8ClampedArray(w * h * 4); return { w, h, d, px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const [r, g, b, a] = parse(c); const i = (y * w + x) * 4; if (a >= 1 || d[i + 3] === 0) { d[i] = r; d[i + 1] = g; d[i + 2] = b; } else { d[i] = d[i] * (1 - a) + r * a; d[i + 1] = d[i + 1] * (1 - a) + g * a; d[i + 2] = d[i + 2] * (1 - a) + b * a; } d[i + 3] = 255; }, rect(x, y, ww, hh, c) { for (let j = 0; j < Math.round(hh); j++) for (let i = 0; i < Math.round(ww); i++) this.px(Math.round(x) + i, Math.round(y) + j, c); }, alphaAt(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? d[(y * w + x) * 4 + 3] : 0; } }; }
const PAL = { plasterDark: "#8f836b", plasterBase: "#9c9077", plasterLight: "#a99d82", stoneCrack: "#262b33", stoneDark: "#2e333d", stoneBase: "#454c58", stoneMid: "#4f5763", stoneLight: "#5a6270", trunkDark: "#2a1e14" };
const TILE_SIZE = 128, S = 4, HOUSE_WALL_H = 44 * S;
const WD8 = rampHex(["#1c1610", "#2a2016", "#3b2c1f", "#4c3a29", "#5e4a34", "#6e5740"], 8);
const IRN6 = rampHex(["#14161c", "#20242c", "#2c3340", "#3a4150", "#5a6678"], 6);
const PLR6 = rampHex(["#5f5645", "#776c58", PAL.plasterDark, PAL.plasterBase, PAL.plasterLight, "#b6ab90"], 6);
const STN6 = rampHex([PAL.stoneCrack, PAL.stoneDark, PAL.stoneBase, PAL.stoneMid, PAL.stoneLight, "#6b7280"], 6);
function beamFill(p, x0, y0, w, h) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const gx = x0 + x, gy = y0 + y; let idx = 2; const g = w >= h ? Math.sin(gy * 1.6) * 0.5 + Math.sin(gx * 0.16) * 0.4 : Math.sin(gx * 1.6) * 0.5 + Math.sin(gy * 0.16) * 0.4; if (g > 0.78) idx += 0.6; else if (g < -0.82) idx -= 0.6; if (y === 0 || x === 0) idx += 1.7; else if (y === h - 1 || x === w - 1) idx -= 1.9; p.px(gx, gy, WD8[Math.min(7, Math.max(0, Math.round(idx)))]); } }
const peg = (p, cx, cy) => { p.rect(cx - 1, cy - 1, 2, 2, WD8[1]); p.px(cx - 1, cy - 1, WD8[4]); p.px(cx, cy, WD8[0]); };

function makeWall(mask, seed, feature, material = "enxaimel") { // CÓPIA FIEL
  const SC = TILE_SIZE / 32, rng = mulberry32(seed + mask * 31 + 1), HH = HOUSE_WALL_H, p = Canvas(TILE_SIZE, HH);
  const N = (mask & 1) !== 0, W = (mask & 8) !== 0, E = (mask & 2) !== 0, BEAMD = PAL.trunkDark, OUT = "#10141c";
  const TOPH = 7 * SC, midY = 40 * SC, postW = 3 * SC, postsX = [0, 14, 29].map((s) => s * SC), aoR = 5 * SC / 4;
  const nz = (x, y) => Math.sin(x * 0.09 + 1.7) * 0.4 + Math.sin(y * 0.12 + 0.5) * 0.32 + Math.sin((x + y) * 0.05) * 0.4 + Math.sin(x * 0.3 - y * 0.18) * 0.14;
  const plaster = (yTop, yBot, dirty) => {
    for (let y = yTop; y < yBot; y++) for (let x = 0; x < TILE_SIZE; x++) { let v = (dirty ? 2.3 : 2.9) + nz(x, y) + (rng() - 0.5) * (dirty ? 0.8 : 0.4); let dx = Infinity; for (const px of postsX) dx = Math.min(dx, Math.abs(x - (px + postW)), Math.abs(x - px)); if (dx < aoR) v -= (aoR - dx) / aoR * 1.4; if (y > yBot - 5 * SC) v -= (y - (yBot - 5 * SC)) / (5 * SC) * 1.0; const vv = Math.min(5, Math.max(0, v)), lo = Math.floor(vv); p.px(x, y, PLR6[Math.min(5, lo + (vv - lo > 0.5 ? 1 : 0))]); }
    for (let c = 0; c < (dirty ? 3 : 1); c++) { let cxk = (5 + rng() * 22) * SC; for (let y = yTop + 4 * SC; y < yBot - 4 * SC; y++) { cxk += rng() < 0.4 ? (rng() < 0.5 ? -1 : 1) : 0; p.px(cxk, y, PLR6[0]); if (rng() < 0.25) p.px(cxk + 1, y, PLR6[1]); } }
    if (dirty) for (let i = 0; i < 16; i++) p.px(rng() * TILE_SIZE, yTop + rng() * (yBot - yTop), PLR6[0]);
  };
  const ashlar = (yTop, yBot) => {
    p.rect(0, yTop, TILE_SIZE, yBot - yTop, STN6[0]); const BH = 7 * SC, BW = 15 * SC;
    for (let ry = yTop; ry < yBot; ry += BH) { const rowIdx = Math.round((ry - yTop) / BH), off = rowIdx % 2 ? (BW / 2) | 0 : 0; for (let bx = -BW; bx < TILE_SIZE; bx += BW) { const x0 = bx + off + SC, bw = BW - 2 * SC, tone = hash2D(rowIdx, (bx / BW) | 0, seed); for (let yy = SC; yy < BH - SC; yy++) for (let xx = 0; xx < bw; xx++) { const x = x0 + xx, y = ry + yy; if (x < 0 || x >= TILE_SIZE || y < yTop || y >= yBot) continue; let idx = 2.4 + tone * 0.9; if (yy < SC + 1) idx += 1.3; else if (yy >= BH - 2 * SC) idx -= 1.2; if (xx < 1 || xx >= bw - 1) idx -= 0.9; p.px(x, y, STN6[Math.min(5, Math.max(0, Math.round(idx)))]); } } }
  };
  const timber = (yBot, thin) => { const pw = thin ? 2 * SC : postW; beamFill(p, 0, 0, TILE_SIZE, TOPH); if (!N) p.rect(0, SC, TILE_SIZE, SC, WD8[5]); beamFill(p, 0, TOPH, TILE_SIZE, 3 * SC); if (yBot >= midY + 4 * SC) beamFill(p, 0, midY, TILE_SIZE, 4 * SC); for (const px of postsX) beamFill(p, Math.min(px, TILE_SIZE - pw), TOPH, pw, yBot - TOPH); for (const px of postsX) { const cxp = Math.min(px, TILE_SIZE - pw) + 1; peg(p, cxp, TOPH + 2 * SC); if (yBot >= midY) peg(p, cxp, midY + 2 * SC); } };
  if (material === "pedra") { ashlar(0, HH); p.rect(0, TOPH - SC, TILE_SIZE, 2 * SC, STN6[4]); }
  else if (material === "meia_pedra") { const halfY = Math.round(HH * 0.52); ashlar(halfY, HH); plaster(TOPH, halfY, false); timber(halfY, false); p.rect(0, halfY - SC, TILE_SIZE, 2 * SC, STN6[4]); }
  else { plaster(TOPH, HH, material === "taipa_pobre"); timber(HH, material === "taipa_pobre"); }
  if (feature === "window") { const wx = 9 * SC, wy = 15 * SC, ww = 14 * SC, wh = 18 * SC; for (let y = wy; y < wy + wh; y++) for (let x = wx; x < wx + ww; x++) p.px(x, y, mixHex("#16202c", "#2c3e50", ((x - wx) / ww + (wy + wh - y) / wh) / 2)); for (let i = 0; i < 6; i++) p.px(wx + 1 + Math.floor(rng() * (ww - 2)), wy + 1 + Math.floor(rng() * (wh - 2)), rng() < 0.4 ? "#cfe0ea" : "#7f9fb0"); beamFill(p, wx - SC, wy - SC, ww + 2 * SC, SC); beamFill(p, wx - SC, wy + wh, ww + 2 * SC, SC); beamFill(p, wx - SC, wy - SC, SC, wh + 2 * SC); beamFill(p, wx + ww, wy - SC, SC, wh + 2 * SC); for (let y = wy; y < wy + wh; y++) p.px(wx + ww / 2 - 1, y, WD8[1]); for (let x = wx; x < wx + ww; x++) p.px(x, wy + wh / 2, WD8[1]); p.rect(wx - SC, wy + wh + SC, ww + 2 * SC, SC, "rgba(0,0,0,0.3)"); }
  p.rect(0, 38 * SC, TILE_SIZE, 2 * SC, "rgba(0,0,0,0.18)"); p.rect(0, 41 * SC, TILE_SIZE, 3 * SC, "rgba(0,0,0,0.35)");
  if (!W) { p.rect(0, 0, 2 * SC, HH, BEAMD); p.rect(0, 0, SC, HH, OUT); }
  if (!E) { p.rect(TILE_SIZE - 2 * SC, 0, 2 * SC, HH, BEAMD); p.rect(TILE_SIZE - SC, 0, SC, HH, OUT); }
  if (!N) p.rect(0, 0, TILE_SIZE, SC, OUT);
  return p;
}
const FONT = { A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"], E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"], N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"], X: ["10001", "01010", "00100", "00100", "00100", "01010", "10001"], I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"], M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"], L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"], P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"], D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"], R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"], T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"], B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"], U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"], O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"], "_": ["00000", "00000", "00000", "00000", "00000", "00000", "11111"], " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"] };
const toHex = (r, g, b) => `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
function text(dst, str, x, y, sc, c) { let cx = x; for (const ch of str) { const g = FONT[ch] || FONT[" "]; for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) if (g[r][col] === "1") dst.rect(cx + col * sc, y + r * sc, sc, sc, c); cx += 6 * sc; } }
function paste(dst, src, ox, oy, z) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const i = (y * src.w + x) * 4; if (src.d[i + 3] === 0) continue; const c = toHex(src.d[i], src.d[i + 1], src.d[i + 2]); for (let zy = 0; zy < z; zy++) for (let zx = 0; zx < z; zx++) dst.px(ox + x * z + zx, oy + y * z + zy, c); } }
function main() {
  const mats = [["enxaimel", "ENXAIMEL"], ["pedra", "PEDRA"], ["taipa_pobre", "TAIPA_POBRE"], ["meia_pedra", "MEIA_PEDRA"]];
  const Z = 2, pad = 22, gx = 24, gy = 36, cW = TILE_SIZE * Z, cH = HOUSE_WALL_H * Z;
  const sheet = Canvas(pad * 2 + cW * 2 + gx, pad * 2 + (cH + gy) * 2);
  sheet.rect(0, 0, sheet.w, sheet.h, "#15171d");
  mats.forEach(([m, lbl], i) => { const col = i % 2, row = (i / 2) | 0, ox = pad + col * (cW + gx), oy = pad + row * (cH + gy); paste(sheet, makeWall(0xA, 700, i === 0 ? "window" : null, m), ox, oy, Z); text(sheet, lbl, ox + 4, oy + cH + 6, 2, "#e8c87a"); });
  writeFileSync("design/pixellab-candidatos/_prop-parede-materiais.png", encodePng(sheet.w, sheet.h, sheet.d));
  console.log("[ok] _prop-parede-materiais.png");
}
function encodePng(w, h, d) { const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = d[y * w * 4 + x]; } const idat = deflateSync(raw), ct = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; ct[n] = c >>> 0; } const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = ct[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }; const chunk = (t, dt) => { const len = Buffer.alloc(4); len.writeUInt32BE(dt.length); const tt = Buffer.from(t); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dt]))); return Buffer.concat([len, tt, dt, cc]); }; const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]); }
main();
