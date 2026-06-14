#!/usr/bin/env node
// DEMO comparativo PORTA + PAREDE DE CASA (enxaimel): ATUAL (porte verbatim de
// sprites.ts, S=4) vs BOM (remaster detalhe nativo 128px). Standalone.
//   node tools/wall-door-remaster-demo.mjs -> design/pixellab-candidatos/_prop-parede-porta.png
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const lerp = (a, b, t) => a + (b - a) * t;
const toRGB = (c) => (typeof c === "string" ? hex(c) : c);
const mix = (c1, c2, t) => { const a = toRGB(c1), b = toRGB(c2); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; };
const mul = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

function Canvas(w, h) {
  const d = new Uint8ClampedArray(w * h * 4);
  return {
    w, h, d,
    px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const [r, g, b] = toRGB(c); const i = (y * w + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; },
    pxa(x, y, c, a) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const [r, g, b] = toRGB(c); const i = (y * w + x) * 4; const ba = d[i + 3] / 255; d[i] = lerp(d[i], r, a); d[i + 1] = lerp(d[i + 1], g, a); d[i + 2] = lerp(d[i + 2], b, a); d[i + 3] = Math.max(d[i + 3], a * 255); if (ba === 0) { d[i] = r; d[i + 1] = g; d[i + 2] = b; } },
    rect(x, y, ww, hh, c) { x = Math.round(x); y = Math.round(y); ww = Math.round(ww); hh = Math.round(hh); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) this.px(x + i, y + j, c); },
    recta(x, y, ww, hh, c, a) { x = Math.round(x); y = Math.round(y); ww = Math.round(ww); hh = Math.round(hh); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) this.pxa(x + i, y + j, c, a); },
    alphaAt(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? d[(y * w + x) * 4 + 3] : 0; },
    outline(c, sel) { const paint = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (this.alphaAt(x, y) > 0) continue; if (this.alphaAt(x - 1, y) > 60 || this.alphaAt(x + 1, y) > 60 || this.alphaAt(x, y - 1) > 60 || this.alphaAt(x, y + 1) > 60) { const lit = sel && (this.alphaAt(x + 1, y) > 60 || this.alphaAt(x, y + 1) > 60); paint.push([x, y, lit ? sel : c]); } } for (const [x, y, col] of paint) this.px(x, y, col); },
  };
}

// ---------- paleta do projeto ----------
const WOOD = "#3b2c1f", WOOD_LT = "#4c3a29", WOOD_DK = "#2a2016", WOOD_HI = "#5e4a34", TRUNK = "#2a1e14";
const PLA = ["#8f836b", "#9c9077", "#a99d82"];
const FIT = "#6b5a3a", FIT_HI = "#8a7448", FIT_DK = "#3e3322";
const OUT = "#10141c";
const S = 4, TILE = 128, HH = 44 * S; // 176

// ======================================================================
// ATUAL — portes verbatim
// ======================================================================
function doorOld() {
  const W = TILE, H = HH, p = Canvas(W, H);
  const FRAME = WOOD, FRAME_HI = WOOD_LT, FRAME_DK = WOOD_DK, FRAME_TOP = WOOD_HI;
  const TOPH = 7 * S, JAMB_W = 3 * S, headH = 4 * S, sillH = 4 * S;
  p.rect(0, 0, W, TOPH, FRAME); p.rect(0, 0, W, S, FRAME_TOP);
  p.rect(0, 0, JAMB_W, H, FRAME); p.rect(0, 0, S, H, FRAME_HI);
  p.rect(W - JAMB_W, 0, JAMB_W, H, FRAME); p.rect(W - S, 0, S, H, FRAME_DK);
  p.rect(JAMB_W, TOPH, W - 2 * JAMB_W, headH, FRAME); p.rect(JAMB_W, TOPH, W - 2 * JAMB_W, S, FRAME_HI); p.rect(JAMB_W, TOPH + headH - S, W - 2 * JAMB_W, S, FRAME_DK);
  const ox = JAMB_W, ow = W - 2 * JAMB_W, oy = TOPH + headH, oBot = H - sillH, oh = oBot - oy;
  for (let x = ox; x < ox + ow; x++) { const t = (x - ox) / ow; const c = t < 0.16 ? WOOD_LT : t < 0.72 ? WOOD : WOOD_DK; p.rect(x, oy, S, oh, c); }
  for (let sx = ox + Math.round(ow / 5); sx < ox + ow - S; sx += Math.round(ow / 5)) p.rect(sx, oy, S, oh, WOOD_DK);
  p.rect(ox, oy, ow, S, WOOD_HI); p.rect(ox, oBot - S, ow, S, WOOD_DK);
  for (const by of [oy + 6 * S, oBot - 8 * S]) { p.rect(ox, by, ow, 2 * S, FIT); p.rect(ox, by, ow, S, FIT_HI); p.rect(ox, by + 2 * S, ow, S, FIT_DK); for (let k = 2 * S; k < ow; k += 5 * S) { p.rect(ox + k, by, S, S, FIT_HI); } }
  const rx = ox + ow - 5 * S, ry = oy + oh / 2 - S; p.rect(rx, ry, 4 * S, S, FIT); p.rect(rx, ry, 4 * S, S, FIT_HI); p.rect(rx, ry + S, S, 3 * S, FIT); p.rect(rx + 3 * S, ry + S, S, 3 * S, FIT); p.rect(rx, ry + 4 * S, 4 * S, S, FIT_DK);
  for (const hy of [oy + 4 * S, oBot - 6 * S]) { p.rect(ox, hy, 3 * S, 2 * S, FIT); p.rect(ox, hy, 3 * S, S, FIT_HI); }
  p.rect(0, H - sillH, W, sillH, FRAME_DK); p.rect(0, H - sillH, W, S, FRAME); p.recta(0, H - 2 * S, W, 2 * S, "#000000", 0.32);
  p.outline(OUT);
  return p;
}
function wallOld(feature) {
  const SC = S, p = Canvas(TILE, HH), rng = mul(700 + 5 * 31 + 1);
  const BEAM = WOOD, BEAML = WOOD_LT, BEAMD = TRUNK, TOPH = 7 * SC;
  p.rect(0, 0, TILE, TOPH, BEAM);
  for (let i = 0; i < Math.round(10 * SC * SC); i++) p.rect(Math.floor(rng() * TILE), Math.floor(rng() * TOPH), SC, SC, rng() < 0.5 ? BEAML : BEAMD);
  p.rect(0, SC, TILE, SC, BEAML);
  for (let y = TOPH; y < HH; y++) for (let x = 0; x < TILE; x++) p.px(x, y, PLA[Math.floor(rng() * PLA.length)]);
  p.rect(0, TOPH, TILE, 3 * SC, BEAM); p.rect(0, TOPH, TILE, SC, BEAML);
  p.rect(0, 40 * SC, TILE, 4 * SC, BEAM); p.rect(0, 40 * SC, TILE, SC, BEAMD);
  for (const sx of [0, 14, 29]) { p.rect(sx * SC, TOPH, 3 * SC, HH - TOPH, BEAM); p.rect(sx * SC, TOPH, SC, HH - TOPH, BEAML); }
  if (feature === "window") {
    p.rect(9 * SC, 16 * SC, 14 * SC, 16 * SC, "#1a2026"); p.rect(9 * SC, 16 * SC, 14 * SC, SC, "#0d1116");
    p.rect(8 * SC, 15 * SC, 16 * SC, SC, BEAM); p.rect(8 * SC, 32 * SC, 16 * SC, SC, BEAM); p.rect(8 * SC, 15 * SC, SC, 18 * SC, BEAM); p.rect(23 * SC, 15 * SC, SC, 18 * SC, BEAM);
    p.rect(15 * SC, 16 * SC, SC, 16 * SC, BEAM); p.rect(9 * SC, 23 * SC, 14 * SC, SC, BEAM);
    p.rect(11 * SC, 18 * SC, SC, SC, "#39505e"); p.rect(12 * SC, 18 * SC, SC, SC, "#39505e"); p.rect(18 * SC, 18 * SC, SC, SC, "#39505e");
  }
  p.recta(0, 38 * SC, TILE, 2 * SC, "#000000", 0.18); p.recta(0, 41 * SC, TILE, 3 * SC, "#000000", 0.35);
  p.outline(OUT);
  return p;
}

// ======================================================================
// BOM — remaster nativo 128px
// ======================================================================
const wramp = ["#211910", "#2e2417", "#3b2c1f", "#48382a", "#564231", "#655240", "#776449"]; // 7, hue-shift
const pramp = ["#564e3f", "#6f6553", "#857a64", "#9c9077", "#a99d82", "#b6ab90"]; // taipa 6 níveis
// VIGA com bevel limpo (top/esq lit, base/dir sombra) + grão SUTIL determinístico
function beam(p, x0, y0, w, h, vert) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const gx = x0 + x, gy = y0 + y;
    let idx = 2;
    const g = vert ? Math.sin(gx * 1.7) * 0.5 + Math.sin(gy * 0.18) * 0.4 : Math.sin(gy * 1.7) * 0.5 + Math.sin(gx * 0.16) * 0.4;
    if (g > 0.75) idx += 0.7; else if (g < -0.8) idx -= 0.7; // estria longitudinal rara
    if (y === 0 || x === 0) idx += 1.8;             // aresta iluminada
    else if (y === 1 || x === 1) idx += 0.7;
    if (y === h - 1 || x === w - 1) idx -= 2.0;      // aresta em sombra
    p.px(gx, gy, wramp[Math.min(6, Math.max(0, Math.round(idx)))]);
  }
}
// CAVILHA (treenail) nas junções
function peg(p, cx, cy) { p.rect(cx - 1, cy - 1, 2, 2, wramp[1]); p.px(cx - 1, cy - 1, wramp[4]); p.px(cx, cy, wramp[0]); }
// PAINEL DE REBOCO trowelado, rebaixado (AO nas bordas) + sujeira na base + rachadura ocasional
function plasterBay(p, x0, y0, x1, y1, rng, crack) {
  const nz = (x, y) => Math.sin(x * 0.09 + 1.7) * 0.4 + Math.sin(y * 0.12 + 0.5) * 0.32 + Math.sin((x + y) * 0.05) * 0.4 + Math.sin(x * 0.3 - y * 0.18) * 0.14;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    let v = 2.9 + nz(x, y) + (rng() - 0.5) * 0.4;
    const e = Math.min(x - x0, x1 - 1 - x, y - y0, y1 - 1 - y);
    if (e < 5) v -= (5 - e) * 0.30;                 // AO: painel rebaixado entre as vigas
    if (y > y1 - 8) v -= (y - (y1 - 8)) / 8 * 1.5;  // umidade/sujeira na base
    v = Math.min(5, Math.max(0, v));
    const lo = Math.floor(v), f = v - lo, d = f > 0.45 && f < 0.55 ? (x + y) & 1 : f >= 0.55 ? 1 : 0;
    p.px(x, y, pramp[Math.min(5, lo + d)]);
  }
  if (crack) { let cx2 = (x0 + x1) / 2 + (rng() - 0.5) * (x1 - x0) * 0.4; for (let y = y0 + 4; y < y1 - 6; y++) { cx2 += rng() < 0.4 ? (rng() < 0.5 ? -1 : 1) : 0; p.px(cx2, y, pramp[0]); if (rng() < 0.25) p.px(cx2 + 1, y, pramp[1]); } }
  for (let i = 0; i < 5; i++) if (rng() < 0.7) { const mx = x0 + 2 + rng() * (x1 - x0 - 4), my = y1 - 2 - rng() * 8; p.pxa(mx, my, "#444a30", 0.3); } // limo na base
}

function wallNew(feature) {
  const p = Canvas(TILE, HH), rng = mul(feature === "window" ? 99 : 55);
  const TOPH = 7 * S, headBot = 10 * S, sillTop = 40 * S; // frechal, base da verga, topo da soleira
  const studs = feature === "window" ? [0, 116] : [0, 58, 116]; // janela = vão central (sem poste do meio)
  // 1) PAINÉIS de reboco entre os postes (cada vão com AO próprio = rebaixado)
  for (let i = 0; i < studs.length - 1; i++) plasterBay(p, studs[i] + 12, headBot, studs[i + 1], sillTop, rng, rng() < 0.5);
  // 2) VIGAS: frechal + verga + soleira + postes, com bevel/grão limpos
  beam(p, 0, 0, TILE, TOPH);             // frechal (topo)
  beam(p, 0, TOPH, TILE, headBot - TOPH); // verga sob o frechal
  beam(p, 0, sillTop, TILE, HH - sillTop); // soleira (base)
  for (const sx of studs) beam(p, Math.min(sx, TILE - 12), TOPH, 12, sillTop - TOPH); // postes
  // 3) CAVILHAS nas junções poste×viga
  for (const sx of studs) { const cx = Math.min(sx, TILE - 12) + 6; peg(p, cx, TOPH + 4); peg(p, cx, sillTop - 4); }
  // 4) JANELA (só na variante) — vão recuado, vidro frio, caixilho, cruzeta, peitoril
  if (feature === "window") {
    const wx = 42, wy = 56, ww = 44, wh = 60;
    p.recta(wx - 3, wy - 3, ww + 6, wh + 6, "#000000", 0.35); // AO do recuo
    for (let y = wy; y < wy + wh; y++) for (let x = wx; x < wx + ww; x++) p.px(x, y, mix("#243039", "#3a4f5c", ((x - wx) / ww + (wy + wh - y) / wh) / 2)); // vidro
    for (let i = 0; i < 7; i++) p.px(wx + 2 + rng() * (ww - 4), wy + 2 + rng() * wh * 0.5, "#86a6b6"); // reflexos
    beam(p, wx - 3, wy - 3, ww + 6, 4); beam(p, wx - 3, wy + wh - 1, ww + 6, 4); // caixilho h
    beam(p, wx - 3, wy - 3, 4, wh + 6); beam(p, wx + ww - 1, wy - 3, 4, wh + 6); // caixilho v
    for (let y = wy; y < wy + wh; y++) { p.px(wx + ww / 2 - 1, y, wramp[1]); p.px(wx + ww / 2, y, wramp[3]); } // montante
    for (let x = wx; x < wx + ww; x++) { p.px(x, wy + wh / 2 - 1, wramp[1]); p.px(x, wy + wh / 2, wramp[3]); }   // travessa
    beam(p, wx - 5, wy + wh + 1, ww + 10, 4); p.recta(wx - 5, wy + wh + 5, ww + 10, 3, "#000000", 0.3); // peitoril + sombra
  }
  // 5) sombra de contato na base
  p.recta(0, HH - 4, TILE, 4, "#000000", 0.22); p.recta(0, HH - 2, TILE, 2, "#000000", 0.3);
  p.outline(OUT, "#2a2230");
  return p;
}

function doorNew() {
  const W = TILE, H = HH, p = Canvas(W, H), rng = mul(42);
  const TOPH = 7 * S, JAMB = 3 * S, headH = 4 * S, sillH = 4 * S;
  const IR = ["#14161c", "#222732", "#303744", "#454f60", "#5d6a7e", "#8694a8"];
  const ox = JAMB, ow = W - 2 * JAMB, oy = TOPH + headH, oBot = H - sillH, oh = oBot - oy;
  // FOLHA: pranchas verticais com luz envolvente + bevel por prancha + grão + topo/base
  const nPl = 5, plW = ow / nPl;
  for (let x = ox; x < ox + ow; x++) {
    const u = (x - ox) / ow;
    let base = 1.6 + (1 - Math.abs(u - 0.34) * 1.9) * 3.0;       // cilindro suave da folha
    const inPl = ((x - ox) % plW) / plW;
    if (inPl < 0.1) base += 0.8; else if (inPl > 0.9) base -= 1.4; // sulco/bevel da prancha
    for (let y = oy; y < oBot; y++) {
      let idx = base + (Math.sin(x * 1.3 + y * 0.12) > 0.8 ? -0.5 : 0); // grão vertical sutil
      if (y === oy) idx += 1.2; else if (y === oBot - 1) idx -= 1.6;
      p.px(x, y, wramp[Math.min(6, Math.max(0, Math.round(idx)))]);
    }
  }
  // MOLDURA por cima (encaixa a folha) — bevel limpo
  beam(p, 0, 0, W, TOPH); beam(p, JAMB, TOPH, W - 2 * JAMB, headH);
  beam(p, 0, 0, JAMB, H); beam(p, W - JAMB, 0, JAMB, H);
  p.recta(ox, oy, ow, S, "#000000", 0.32); p.recta(ox, oy, S, oh, "#000000", 0.28); // AO no rebaixo
  // 2 CINTAS de ferro arredondadas + rebites + specular + ferrugem
  for (const by of [oy + 6 * S, oBot - 9 * S]) {
    for (let y = by; y < by + 3 * S; y++) { const ty = (y - by) / (3 * S - 1); for (let x = ox; x < ox + ow; x++) { let idx = 2; if (y === by) idx = 0.4; else if (ty < 0.4) idx = 3.6; else if (y === by + 3 * S - 1) idx = 0.2; let col = IR[Math.round(Math.min(5, Math.max(0, idx)))]; if (ty > 0.3 && rng() < 0.10) col = "#5a3a22"; p.px(x, y, col); } }
    for (let k = 3 * S; k < ow - 2; k += 5 * S) { p.px(ox + k, by + S, IR[5]); p.px(ox + k, by + 2 * S, IR[0]); } // rebites
  }
  // DOBRADIÇAS forjadas: strap reta com ponta afunilada + 2 parafusos
  for (const hy of [oy + 4 * S, oBot - 8 * S]) {
    const len = 12 * S, ht = 3 * S;
    for (let i = 0; i < len; i++) {
      let h2 = ht; if (i > len - 3 * S) h2 = Math.max(1, ht - (i - (len - 3 * S))); // ponta
      const y0 = hy + Math.floor((ht - h2) / 2);
      for (let j = 0; j < h2; j++) { const idx = j === 0 ? 4 : j === h2 - 1 ? 1 : 2; p.px(ox + i, y0 + j, IR[idx]); }
    }
    for (const bx of [ox + 2 * S, ox + 7 * S]) { p.px(bx, hy + S, IR[5]); p.px(bx, hy + S + 1, IR[0]); } // parafusos
  }
  // ARGOLA forjada + chapa de batente na direita
  const rx = ox + ow - 6 * S, ry = oy + oh * 0.46;
  p.recta(rx - 2, ry - 4 * S, 6 * S, 8 * S, "#000000", 0.28);          // chapa (sombra)
  p.rect(rx, ry - 3 * S, 4 * S, 6 * S, IR[2]); p.rect(rx, ry - 3 * S, 4 * S, S, IR[4]); p.rect(rx, ry + 2 * S, 4 * S, S, IR[0]); // chapa
  for (let a = 0; a < 360; a += 6) { const r = a * Math.PI / 180, x = rx + 2 * S + Math.cos(r) * 2.6 * S, y = ry + 5 * S + Math.sin(r) * 2.6 * S; p.px(x, y, Math.sin(r) < -0.2 && Math.cos(r) < 0 ? IR[5] : Math.sin(r) > 0.4 ? IR[1] : IR[3]); } // argola
  // nicks/desgaste na folha
  for (let i = 0; i < 4; i++) p.px(ox + S + rng() * (ow - 2 * S), oBot - 2 * S - rng() * 8 * S, rng() < 0.5 ? wramp[5] : wramp[0]);
  // limiar + contato
  beam(p, 0, H - sillH, W, sillH); p.recta(0, H - 2 * S, W, 2 * S, "#000000", 0.32);
  p.outline(OUT, "#2a2230");
  return p;
}

// ---------- fonte 5×7 ----------
const FONT = { A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"], T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"], U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"], L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"], B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"], O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"], M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"], P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"], R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"], E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"], D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"], J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"], N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"], " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"] };
function text(dst, str, x, y, sc, c) { let cx = x; for (const ch of str) { const g = FONT[ch] || FONT[" "]; for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) if (g[r][col] === "1") dst.rect(cx + col * sc, y + r * sc, sc, sc, c); cx += 6 * sc; } }
function paste(dst, src, ox, oy, z) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const i = (y * src.w + x) * 4; if (src.d[i + 3] === 0) continue; for (let zy = 0; zy < z; zy++) for (let zx = 0; zx < z; zx++) dst.px(ox + x * z + zx, oy + y * z + zy, [src.d[i], src.d[i + 1], src.d[i + 2]]); } }

function main() {
  const Z = 3, pad = 26, gap = 34, lblH = 26;
  const items = [
    { a: doorOld(), b: doorNew(), name: "PORTA" },
    { a: wallOld(null), b: wallNew(null), name: "PAREDE" },
    { a: wallOld("window"), b: wallNew("window"), name: "PAREDE JANELA" },
  ];
  const cW = TILE * Z, cH = HH * Z;
  const sheet = Canvas(pad * 2 + cW * 2 + gap, pad + items.length * (cH + lblH + gap));
  sheet.rect(0, 0, sheet.w, sheet.h, "#15171d");
  items.forEach((it, row) => {
    const y = pad + row * (cH + lblH + gap);
    paste(sheet, it.a, pad, y, Z); paste(sheet, it.b, pad + cW + gap, y, Z);
    text(sheet, it.name + " ATUAL", pad + 4, y + cH + 5, 2, "#9aa0ac");
    text(sheet, it.name + " BOM", pad + cW + gap + 4, y + cH + 5, 2, "#e8c87a");
  });
  writeFileSync("design/pixellab-candidatos/_prop-parede-porta.png", encodePng(sheet.w, sheet.h, sheet.d));
  console.log(`[ok] _prop-parede-porta.png — PORTA + PAREDE, ATUAL vs BOM, zoom ${Z}x`);
}

function encodePng(w, h, d) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = d[y * w * 4 + x]; }
  const idat = deflateSync(raw), ct = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; ct[n] = c >>> 0; }
  const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = ct[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (t, dt) => { const len = Buffer.alloc(4); len.writeUInt32BE(dt.length); const tt = Buffer.from(t); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dt]))); return Buffer.concat([len, tt, dt, cc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}
main();
