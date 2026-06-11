#!/usr/bin/env node
// Preview do enxaimel (timber-frame) procedural: parede autotile (taipa + vigas),
// janela, porta. Renderiza uma casa-amostra (perímetro + chão + porta + janelas).
// → /tmp/house.png

import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

class Buf {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  parse(c) { if (c[0] === "#") return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 255]; const m = c.match(/rgba?\(([^)]+)\)/); const p = m[1].split(",").map((s) => parseFloat(s.trim())); return [p[0], p[1], p[2], p.length > 3 ? Math.round(p[3] * 255) : 255]; }
  px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const [r, g, b, a] = this.parse(c); const i = (y * this.w + x) * 4; if (a === 255) { this.d[i] = r; this.d[i + 1] = g; this.d[i + 2] = b; this.d[i + 3] = 255; } else { const af = a / 255, ia = 1 - af; this.d[i] = r * af + this.d[i] * ia; this.d[i + 1] = g * af + this.d[i + 1] * ia; this.d[i + 2] = b * af + this.d[i + 2] * ia; this.d[i + 3] = Math.max(this.d[i + 3], a); } }
  rect(x, y, w, h, c) { for (let j = 0; j < Math.round(h); j++) for (let i = 0; i < Math.round(w); i++) this.px(Math.round(x) + i, Math.round(y) + j, c); }
  fill(c) { this.rect(0, 0, this.w, this.h, c); }
  blit(s, dx, dy) { for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) { const i = (y * s.w + x) * 4; if (s.d[i + 3] > 0) this.px(dx + x, dy + y, `rgba(${s.d[i]},${s.d[i + 1]},${s.d[i + 2]},${s.d[i + 3] / 255})`); } }
  scaledTo(z) { const o = new Buf(this.w * z, this.h * z); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const i = (y * this.w + x) * 4; if (!this.d[i + 3]) continue; const c = `rgba(${this.d[i]},${this.d[i + 1]},${this.d[i + 2]},${this.d[i + 3] / 255})`; for (let yy = 0; yy < z; yy++) for (let xx = 0; xx < z; xx++) o.px(x * z + xx, y * z + yy, c); } return o; }
}
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function png(b) { const { w, h, d } = b, raw = Buffer.alloc((w * 4 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = d[y * w * 4 + x]; } const idat = deflateSync(raw), T = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; } const crc = (x) => { let c = 0xFFFFFFFF; for (const v of x) c = T[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }; const ch = (t, dd) => { const l = Buffer.alloc(4); l.writeUInt32BE(dd.length); const tt = Buffer.from(t), cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dd]))); return Buffer.concat([l, tt, dd, cc]); }; const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6; return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch("IHDR", ih), ch("IDAT", idat), ch("IEND", Buffer.alloc(0))]); }

// ── ENXAIMEL: parede autotile (taipa + vigas) ───────────────────────────────
// Paleta: taipa quente dessaturada + viga de madeira escura. mask N=1,E=2,S=4,W=8.
const PLASTER = ["#8f836b", "#9c9077", "#a99d82"]; // ramp de taipa
const BEAM = "#3b2c1f", BEAML = "#4c3a29", BEAMD = "#2a1e14", OUT = "#10141c";
function houseWall(mask, seed, feature /* "window"|"door"|null */) {
  const rng = mulberry32(seed + mask * 31 + 1);
  const p = new Buf(32, 44);
  const N = mask & 1, E = mask & 2, S = mask & 4, W = mask & 8;
  const TOPH = 7; // viga superior fina (sempre) — a casa é um cômodo: toda parede mostra a face
  // TOPO = viga superior (frechal visto de cima), fina
  p.rect(0, 0, 32, TOPH, BEAM);
  for (let i = 0; i < 10; i++) p.px(Math.floor(rng() * 32), Math.floor(rng() * TOPH), rng() < 0.5 ? BEAML : BEAMD);
  if (!N) p.rect(0, 1, 32, 1, BEAML);
  // FACE de enxaimel SEMPRE (taipa enquadrada por vigas) — virada pro interior
  for (let y = TOPH; y < 44; y++) for (let x = 0; x < 32; x++) p.px(x, y, PLASTER[Math.floor(rng() * PLASTER.length)]);
  // frechal (topo da face) e baldrame (base)
  p.rect(0, TOPH, 32, 3, BEAM); p.rect(0, TOPH, 32, 1, BEAML);
  p.rect(0, 40, 32, 4, BEAM); p.rect(0, 40, 32, 1, BEAMD);
  // montantes verticais (studs): bordas + centro
  for (const sx of [0, 14, 29]) { p.rect(sx, TOPH, 3, 44 - TOPH, BEAM); p.rect(sx, TOPH, 1, 44 - TOPH, BEAML); }
  if (feature === "window") {
    p.rect(9, 16, 14, 16, "#1a2026"); p.rect(9, 16, 14, 1, "#0d1116");
    p.rect(8, 15, 16, 1, BEAM); p.rect(8, 32, 16, 1, BEAM); p.rect(8, 15, 1, 18, BEAM); p.rect(23, 15, 1, 18, BEAM);
    p.rect(15, 16, 1, 16, BEAM); p.rect(9, 23, 14, 1, BEAM); // cruz (mullion)
    p.px(11, 18, "#39505e"); p.px(12, 18, "#39505e"); p.px(18, 18, "#39505e"); // reflexo frio
  } else if (feature === "door") {
    p.rect(9, 12, 14, 32, BEAM);
    for (let x = 10; x < 23; x += 3) p.rect(x, 13, 1, 30, x % 2 ? BEAMD : BEAML);
    p.rect(9, 20, 14, 2, BEAMD); p.rect(9, 34, 14, 2, BEAMD); // travessas
    p.px(20, 29, "#caa64a"); p.px(20, 30, "#8d7330"); // maçaneta de latão
  }
  // leve sombra interna na base (profundidade) + contato
  p.rect(0, 38, 32, 2, "rgba(0,0,0,0.18)");
  p.rect(0, 41, 32, 3, "rgba(0,0,0,0.35)");
  // CAPS (postes de canto reforçados onde não há vizinho)
  if (!W) { p.rect(0, 0, 2, 44, BEAMD); p.rect(0, 0, 1, 44, OUT); }
  if (!E) { p.rect(30, 0, 2, 44, BEAMD); p.rect(31, 0, 1, 44, OUT); }
  if (!N) p.rect(0, 0, 32, 1, OUT);
  return p;
}

// ── casa-amostra: 8x5, perímetro de enxaimel + chão de tábua + porta + janelas ──
const HW = 8, HH = 5, set = new Set();
for (let x = 0; x < HW; x++) { set.add(`${x},0`); set.add(`${x},${HH - 1}`); }
for (let y = 0; y < HH; y++) { set.add(`0,${y}`); set.add(`${HW - 1},${y}`); }
const isW = (x, y) => set.has(`${x},${y}`);
const door = [3, HH - 1]; // porta no centro-sul
const windows = new Set(["1,0", "6,0", "0,2", "7,2"]); // janelas
const PAD = 2;
const scene = new Buf((HW + PAD * 2) * 32, (HH + PAD * 2) * 32 + 14);
scene.fill("#2b3f31"); // grama
// chão interno (tábua de madeira clara)
for (let y = 1; y < HH - 1; y++) for (let x = 1; x < HW - 1; x++) {
  const px = (x + PAD) * 32, py = (y + PAD) * 32 + 14;
  scene.rect(px, py, 32, 32, "#6b5740");
  for (let i = 0; i < 32; i += 4) scene.rect(px, py + i, 32, 1, "#5a4a35");
}
for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) {
  if (!isW(x, y) || (x === door[0] && y === door[1])) continue;
  const mask = (isW(x, y - 1) ? 1 : 0) | (isW(x + 1, y) ? 2 : 0) | (isW(x, y + 1) ? 4 : 0) | (isW(x - 1, y) ? 8 : 0);
  const feat = windows.has(`${x},${y}`) ? "window" : null;
  const t = houseWall(mask, 700 + ((x * 7 + y * 13) % 3) * 1000, feat);
  scene.blit(t, (x + PAD) * 32, (y + 1 + PAD) * 32 - 44 + 14);
}
// porta (na parede sul)
{
  const [dx, dy] = door;
  const mask = (isW(dx, dy - 1) ? 1 : 0) | (isW(dx + 1, dy) ? 2 : 0) | (isW(dx, dy + 1) ? 4 : 0) | (isW(dx - 1, dy) ? 8 : 0);
  const t = houseWall(mask, 700, "door");
  scene.blit(t, (dx + PAD) * 32, (dy + 1 + PAD) * 32 - 44 + 14);
}
writeFileSync("/tmp/house.png", png(scene.scaledTo(3)));
console.log("ok → /tmp/house.png");
