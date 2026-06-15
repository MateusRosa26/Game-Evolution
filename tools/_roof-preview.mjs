#!/usr/bin/env node
// Preview dos 4 estilos de telhado (makeRoof integrado, cópia fiel). -> _prop-telhados.png
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function parse(c) { if (c[0] === "#") return [...hx(c), 1]; const m = c.match(/rgba?\(([^)]+)\)/); const a = m[1].split(",").map(Number); return [a[0], a[1], a[2], a[3] ?? 1]; }
function Canvas(w, h) { const d = new Uint8ClampedArray(w * h * 4); return { w, h, d, px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const [r, g, b, a] = parse(c); const i = (y * w + x) * 4; if (a >= 1 || d[i + 3] === 0) { d[i] = r; d[i + 1] = g; d[i + 2] = b; } else { d[i] = d[i] * (1 - a) + r * a; d[i + 1] = d[i + 1] * (1 - a) + g * a; d[i + 2] = d[i + 2] * (1 - a) + b * a; } d[i + 3] = 255; }, rect(x, y, ww, hh, c) { for (let j = 0; j < Math.round(hh); j++) for (let i = 0; i < Math.round(ww); i++) this.px(Math.round(x) + i, Math.round(y) + j, c); }, fill(c) { this.rect(0, 0, w, h, c); } }; }
const hash2D = (x, y, seed = 0) => { let h = seed ^ (x * 374761393) ^ (y * 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const TILE_SIZE = 128, S = 4, ROOF_OVERHANG = 22 * S;

function makeRoof(wTiles, hTiles, seed, style = "telha") { // CÓPIA FIEL do sprites.ts
  const W = wTiles * TILE_SIZE, H = hTiles * TILE_SIZE + ROOF_OVERHANG, p = Canvas(W, H);
  const cb = (n) => Math.max(0, Math.min(255, n | 0));
  const ridgeY = Math.round(H / 2);
  const slopeAt = (y) => { const dY = Math.abs(y - ridgeY) / (H / 2); return 1 - dY * dY * 0.6; };
  const BASE = { telha: [122, 86, 66], colmo: [158, 130, 80], ardosia: [84, 95, 112], tabua: [98, 76, 54] };
  const [baseR, baseG, baseB] = BASE[style];
  const col = (l) => `rgb(${cb(baseR * l)},${cb(baseG * l)},${cb(baseB * l)})`;
  p.fill(col(style === "telha" ? 0.45 : style === "tabua" ? 0.42 : 0.5));
  if (style === "colmo") {
    for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) p.px(x, y, col(slopeAt(y) * (0.84 + hash2D((x / (2 * S)) | 0, (y / S) | 0, seed) * 0.32)));
    for (let x = 0; x < W; x += S) { if (hash2D(x, 7, seed) < 0.42) for (let y = S; y < H - S; y++) p.px(x, y, col(slopeAt(y) * 0.68)); }
    for (let x = 0; x < W; x++) { p.rect(x, ridgeY - 3 * S, 1, 2 * S, col(1.22 + hash2D(x, 9, seed) * 0.12)); p.rect(x, ridgeY - S, 1, S, col(0.62)); }
    for (let x = 0; x < W; x++) { const frill = Math.round((1.2 + Math.sin(x * 0.35) + hash2D(x, 3, seed) * 1.8) * S); for (let y = H - S - frill; y < H; y++) p.px(x, y, y >= H - 2 ? "#0e0a07" : col(slopeAt(H - S) * 0.7)); }
  } else {
    const SW = style === "ardosia" ? 9 * S : style === "tabua" ? 13 * S : 11 * S;
    const RH = style === "ardosia" ? 5 * S : style === "tabua" ? 7 * S : 6 * S;
    const topL = style === "ardosia" ? 1.12 : style === "tabua" ? 1.12 : 1.18;
    const rand = style === "ardosia" ? 0.12 : style === "tabua" ? 0.26 : 0.2;
    for (let ry = -RH; ry < H; ry += RH) {
      const rowIdx = Math.round((ry + RH) / RH), off = rowIdx % 2 ? (SW / 2) | 0 : 0, lumY = slopeAt(ry + RH / 2);
      for (let sx = -SW; sx < W + SW; sx += SW) {
        const x0 = sx + off, dX = Math.abs(x0 + SW / 2 - W / 2) / (W / 2);
        const tone = lumY * (1 - dX * 0.16) * (0.88 + hash2D(rowIdx, (sx / SW) | 0, seed) * rand);
        for (let yy = 0; yy < RH + S; yy++) { const y = ry + yy; if (y < 0 || y >= H) continue; for (let xx = S; xx < SW; xx++) { const x = x0 + xx; if (x < 0 || x >= W) continue; let l = tone; if (yy < S) l *= topL; else if (yy >= RH - S) l *= 0.6; if (xx >= SW - S) l *= 0.7; if (style === "tabua" && xx % (3 * S) === S && hash2D(x, y, seed) < 0.3) l *= 0.82; p.px(x, y, col(l)); } }
      }
    }
    if (style === "ardosia") { for (let x = 0; x < W; x++) { p.rect(x, ridgeY - 2 * S, 1, S, col(1.2)); p.rect(x, ridgeY - S, 1, S, col(1.35)); p.rect(x, ridgeY, 1, S, col(0.5)); if (x % (6 * S) === 0) p.rect(x, ridgeY - 2 * S, S, 2 * S, col(0.82)); } }
    else { for (let x = 0; x < W; x++) { p.rect(x, ridgeY - 2 * S, 1, S, col(1.3)); p.rect(x, ridgeY - S, 1, S, col(1.45)); p.rect(x, ridgeY, 1, S, col(0.5)); if (x % (4 * S) === 0) p.rect(x, ridgeY - S, S, S, col(0.9)); } }
  }
  const trim = style === "ardosia" ? "#14171c" : "#160f0b";
  for (let x = 0; x < W; x++) { p.rect(x, 0, 1, S, trim); if (style !== "colmo") p.rect(x, H - S, 1, S, "#0e0a07"); }
  for (let y = 0; y < H; y++) { p.rect(0, y, S, 1, trim); p.rect(W - S, y, S, 1, trim); }
  p.rect(0, H - 3 * S, W, 2 * S, "rgba(0,0,0,0.38)");
  return p;
}
const FONT = { A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"], T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"], E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"], L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"], H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"], C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"], O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"], M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"], R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"], D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"], S: ["01111", "10000", "01110", "00001", "00001", "10001", "01110"], I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"], B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"], U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"], "Á": ["00100", "01110", "10001", "11111", "10001", "10001", "10001"], "Ó": ["00100", "01110", "10001", "10001", "10001", "10001", "01110"], " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"] };
const toHex = (r, g, b) => `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
function text(dst, str, x, y, sc, c) { let cx = x; for (const ch of str) { const g = FONT[ch] || FONT[" "]; for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) if (g[r][col] === "1") dst.rect(cx + col * sc, y + r * sc, sc, sc, c); cx += 6 * sc; } }
function paste(dst, src, ox, oy) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const i = (y * src.w + x) * 4; if (src.d[i + 3] === 0) continue; dst.px(ox + x, oy + y, toHex(src.d[i], src.d[i + 1], src.d[i + 2])); } }
function main() {
  const styles = ["telha", "colmo", "ardosia", "tabua"], labels = ["TELHA", "COLMO", "ARDOSIA", "TABUA"];
  const wT = 3, hT = 2, RW = wT * TILE_SIZE, RH = hT * TILE_SIZE + ROOF_OVERHANG, pad = 26, gx = 30, gy = 40;
  const sheet = Canvas(pad * 2 + RW * 2 + gx, pad * 2 + RH * 2 + gy);
  sheet.fill("#15171d");
  styles.forEach((st, i) => { const col = i % 2, row = (i / 2) | 0; const ox = pad + col * (RW + gx), oy = pad + row * (RH + gy); paste(sheet, makeRoof(wT, hT, 700 + i * 13, st), ox, oy); text(sheet, labels[i], ox + 4, oy + RH + 6, 3, "#e8c87a"); });
  writeFileSync("design/pixellab-candidatos/_prop-telhados.png", encodePng(sheet.w, sheet.h, sheet.d));
  console.log("[ok] _prop-telhados.png");
}
function encodePng(w, h, d) { const raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = d[y * w * 4 + x]; } const idat = deflateSync(raw), ct = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; ct[n] = c >>> 0; } const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = ct[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }; const chunk = (t, dt) => { const len = Buffer.alloc(4); len.writeUInt32BE(dt.length); const tt = Buffer.from(t); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dt]))); return Buffer.concat([len, tt, dt, cc]); }; const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]); }
main();
