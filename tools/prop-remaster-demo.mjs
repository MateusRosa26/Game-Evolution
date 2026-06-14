#!/usr/bin/env node
// DEMO comparativo: barril ATUAL (32px-logic ×4, verbatim de sprites.ts) vs
// barril NOVO remasterizado em detalhe nativo 128px. Renderiza standalone (raw
// RGBA + PNG encoder) e compõe lado a lado ampliado. Só pra avaliação visual.
//   node tools/prop-remaster-demo.mjs  ->  design/pixellab-candidatos/_prop-barril.png

import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

// ---------- canvas raw RGBA + primitivas (porte fiel do Px) ----------
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function Canvas(w, h) {
  const d = new Uint8ClampedArray(w * h * 4);
  return {
    w, h, d,
    px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const [r, g, b] = typeof c === "string" ? hex(c) : c; const i = (y * w + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; },
    rect(x, y, ww, hh, c) { x = Math.round(x); y = Math.round(y); ww = Math.round(ww); hh = Math.round(hh); for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) this.px(x + i, y + j, c); },
    ellipse(cx, cy, rx, ry, c) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.px(x, y, c); },
    alphaAt(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? d[(y * w + x) * 4 + 3] : 0; },
    outline(c, sel) { // sel: cor mais clara p/ a borda voltada à luz (top-left)
      const paint = [];
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (this.alphaAt(x, y) > 0) continue;
        if (this.alphaAt(x - 1, y) > 60 || this.alphaAt(x + 1, y) > 60 || this.alphaAt(x, y - 1) > 60 || this.alphaAt(x, y + 1) > 60) {
          const lit = sel && (this.alphaAt(x + 1, y) > 60 || this.alphaAt(x, y + 1) > 60) && !(this.alphaAt(x - 1, y) > 60 && this.alphaAt(x, y - 1) > 60);
          paint.push([x, y, lit ? sel : c]);
        }
      }
      for (const [x, y, col] of paint) this.px(x, y, col);
    },
  };
}
const lerp = (a, b, t) => a + (b - a) * t;
const toRGB = (c) => (typeof c === "string" ? hex(c) : c); // aceita "#rrggbb" OU [r,g,b]
const mix = (c1, c2, t) => { const a = toRGB(c1), b = toRGB(c2); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; };
const mulberry32 = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ---------- PALETA (do projeto) ----------
const WOOD = "#3b2c1f", WOOD_LT = "#4c3a29", WOOD_DK = "#2a2016", WOOD_HI = "#5e4a34";
const IRON = "#20242c", IRON_HI = "#3a4150";
const OUT = "#10141c";

// ======================================================================
// BARRIL ATUAL — porte verbatim de makeBarrel() (S=4 no remaster 128)
// ======================================================================
function barrelOld() {
  const S = 4;
  const p = Canvas(18 * S, 24 * S);
  const cx = 9 * S, top = 5 * S, bot = 21 * S;
  const ramp = [WOOD_DK, WOOD, WOOD_LT, WOOD_HI, WOOD_LT, WOOD, WOOD, WOOD, WOOD, WOOD_DK, WOOD_DK, WOOD_DK];
  for (let i = 0; i < 12; i++) p.rect((3 + i) * S, top, S, bot - top, ramp[i]);
  for (let y = top + 4 * S; y < bot - 4 * S; y++) { p.rect(2 * S, y, S, 1, ramp[0]); p.rect(15 * S, y, S, 1, ramp[11]); }
  for (const sx of [6, 9, 12]) p.rect(sx * S, top + S, S, bot - top - 2 * S, WOOD_DK);
  for (const ay of [8, 16]) { p.rect(2 * S, ay * S, 14 * S, S, IRON_HI); p.rect(2 * S, ay * S + S, 14 * S, 2 * S, IRON); }
  p.ellipse(cx, top, 6 * S, 2.4 * S, WOOD);
  p.ellipse(cx, top, 5 * S, 1.8 * S, WOOD_LT);
  for (let x = cx - 3 * S; x <= cx + S; x++) p.rect(x, top - 2 * S, 1, S, WOOD_HI);
  for (let x = cx - 6 * S; x <= cx + 6 * S; x++) if (((x - cx) / (6 * S)) ** 2 <= 1) p.rect(x, top + 2 * S, 1, S, IRON);
  p.outline(OUT);
  return p;
}

// ======================================================================
// BARRIL NOVO — detalhe nativo 128px (mesma pegada ~72×96)
//  - silhueta de barrica curva (bojo no meio)
//  - shading de cilindro suave (Lambert, luz top-left) — não 4 faixas chapadas
//  - 7 duelas com costuras 1px + grão de madeira
//  - 3 aros de ferro ARREDONDADOS (highlight no topo + sombra embaixo)
//  - tampa low-top-down com aro, tábuas radiais e luz de borda traseira
// ======================================================================
function barrelNew() {
  const W = 72, H = 100;
  const p = Canvas(W, H);
  const cx = 36, top = 18, bot = 90;
  // ramp 7 níveis com HUE-SHIFT (sombra fria dessaturada → luz quente discreta)
  const wramp = ["#1e1812", "#2c2317", "#3a2c1e", "#473627", "#564231", "#66523c", "#776444"];
  const IR = ["#14161c", "#222732", "#303744", "#454f60", "#5d6a7e"]; // ferro 5 níveis
  const halfW = (y) => { const t = Math.min(1, Math.max(0, (y - top) / (bot - top))); return 22 + Math.sin(Math.PI * t) * 6.5; };
  const aLight = -0.5; // luz vinda de cima-esquerda
  const NST = 9;       // nº de duelas
  // luminância angular do cilindro: rel∈[-1,1] (x normalizado) → banda 0..6
  const shadeIdx = (rel) => { const a = Math.asin(Math.min(1, Math.max(-1, rel))); const b = Math.cos(a - aLight); return (b + 0.48) / 1.48 * 6; };
  const band = (idx, x, y) => { idx = Math.min(6, Math.max(0, idx)); const lo = Math.floor(idx), f = idx - lo; const d = f > 0.34 && f < 0.66 ? (x + y) & 1 : f >= 0.66 ? 1 : 0; return wramp[Math.min(6, lo + d)]; };
  // CORPO — bandas limpas quantizadas (com dither nas transições)
  for (let y = top; y <= bot; y++) {
    const hw = halfW(y);
    for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) {
      const rel = (x - cx) / hw;
      p.px(x, y, band(shadeIdx(rel), x, y));
    }
  }
  // COSTURAS das duelas (ângulos iguais → foreshortening real na borda) + leve luz
  const seamA = []; for (let k = 1; k < NST; k++) seamA.push(-Math.PI / 2 + (k * Math.PI) / NST);
  for (let y = top + 2; y <= bot - 2; y++) {
    const hw = halfW(y);
    for (const a of seamA) {
      const x = Math.round(cx + Math.sin(a) * hw);
      const baseIdx = shadeIdx(Math.sin(a));
      p.px(x, y, wramp[Math.max(0, Math.floor(baseIdx) - 2)]);          // vinco escuro
      if (Math.sin(a) < 0.1) p.px(x + 1, y, band(baseIdx + 0.6, x + 1, y)); // chanfro lit à dir do vinco
    }
  }
  // AROS de ferro com ARESTA crispa (topo escuro + specular + base escura) + REBITES
  const hoop = (yc, hgt) => {
    for (let y = yc; y < yc + hgt; y++) {
      const hw = halfW(y) + 0.5;
      const ty = (y - yc) / (hgt - 1);
      for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) {
        const rel = (x - cx) / hw;
        let idx = (shadeIdx(rel) / 6) * 4; // ferro herda a luz do cilindro (0..4)
        if (y === yc) idx = 0.5;                 // aresta superior escura
        else if (ty < 0.34) idx += 1.6;          // specular no topo
        else if (y === yc + hgt - 1) idx = 0.3;  // aresta inferior escura
        idx = Math.min(4, Math.max(0, idx)); const lo = Math.floor(idx), f = idx - lo;
        const d = f > 0.5 ? 1 : 0;
        p.px(x, y, IR[Math.min(4, lo + d)]);
      }
    }
    // rebites onde o aro cruza cada duela (alto-luz + sombra embaixo)
    const ymid = yc + Math.floor(hgt / 2) - 1;
    for (const a of [...seamA, -Math.PI / 2.6, Math.PI / 2.6]) {
      const hw = halfW(ymid) + 0.5, x = Math.round(cx + Math.sin(a) * hw);
      if (Math.abs(Math.sin(a)) > 0.9) continue;
      p.px(x, ymid, IR[4]); p.px(x, ymid + 1, IR[0]);
    }
  };
  hoop(26, 7); hoop(48, 8); hoop(70, 7);
  // sombra de contato do aro do bojo na madeira (logo abaixo)
  for (let y = 56; y < 58; y++) { const hw = halfW(y); for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) { const rel = (x - cx) / hw; p.px(x, y, wramp[Math.max(0, Math.floor(shadeIdx(rel)) - 1)]); } }
  // TAMPA FECHADA convexa low-top-down: disco de madeira (não vê interior),
  // mais claro atrás (pega o céu/luz) e à esq (top-left), tábuas + aro + crista.
  const lrx = halfW(top), lry = 8;
  for (let y = Math.floor(top - lry); y <= top + lry; y++) for (let x = Math.floor(cx - lrx); x <= cx + lrx; x++) {
    const e = ((x - cx) / lrx) ** 2 + ((y - top) / lry) ** 2;
    if (e > 1) continue;
    const back = (top - y) / lry;        // +1 traseira (cima), -1 frontal (baixo)
    const left = (cx - x) / lrx;         // +1 esquerda (luz)
    const dome = 1 - e;                  // centro abaulado pega + luz
    let idx = 3.2 + back * 1.3 + left * 0.7 + dome * 0.7; // tampa LIT (mais clara que o corpo)
    idx = Math.min(6, Math.max(1, idx));
    p.px(x, y, wramp[Math.round(idx)]); // bandas limpas (sem dither na tampa)
  }
  // 2 tábuas da tampa (linhas escuras suaves, sem abrir o interior)
  for (const dy of [-3, 3]) for (let x = Math.floor(cx - lrx); x <= cx + lrx; x++) { const y = top + dy; if (((x - cx) / lrx) ** 2 + ((y - top) / lry) ** 2 <= 0.85) p.px(x, y, wramp[2]); }
  // aro de ferro da tampa (anel na borda) — traseira clara, frontal escura
  for (let a = 0; a < 360; a += 1.5) { const rad = a * Math.PI / 180; const x = cx + Math.cos(rad) * lrx, y = top + Math.sin(rad) * lry; const back = Math.sin(rad) < 0; p.px(x, y, back ? IR[3] : IR[1]); }
  // crista de luz na borda traseira-esquerda (acima da tampa)
  for (let x = cx - 9; x <= cx + 1; x++) p.px(x, top - lry, wramp[6]);
  // sombra projetada da borda frontal da tampa sobre o corpo (assenta a tampa)
  for (let x = Math.floor(cx - lrx * 0.8); x <= cx + lrx * 0.8; x++) { const rel = (x - cx) / halfW(top + lry); p.px(x, top + lry, wramp[Math.max(0, Math.floor(shadeIdx(rel)) - 2)]); p.px(x, top + lry + 1, wramp[Math.max(0, Math.floor(shadeIdx(rel)) - 1)]); }
  // outline selout (top-left mais claro/quente, resto escuro)
  p.outline(OUT, "#2a2230");
  return p;
}

// ======================================================================
// BARRIL PERFEITO (teto) — barrelNew + camadas de mestre:
//  pátina (base úmida c/ limo, topo desbotado), ferrugem escorrendo dos aros,
//  oclusão de contato, luz de borda fria (bounce), variação de aduela + nó +
//  rachadura, specular no ferro, nicks, selout quente/frio. Tudo procedural.
// ======================================================================
function barrelMaster() {
  const W = 74, H = 104, p = Canvas(W, H);
  const cx = 37, top = 18, bot = 92;
  const rng = mulberry32(11);
  const wr = ["#1a150e", "#241c13", "#312619", "#3e3022", "#4c3a2a", "#5a4734", "#6a553e", "#7b6548"]; // 8 níveis, sombra fria→luz quente
  const IRm = ["#13151b", "#202630", "#2e3543", "#434e5f", "#5c6a7d", "#8694a8"]; // 6 (último = specular frio)
  const rust = ["#3c2618", "#553720", "#6e4527"]; // pátina de ferrugem (quente dessat.)
  const moss = "#41472a", cool = "#2c333d";        // limo úmido / bounce frio
  const halfW = (y) => { const t = Math.min(1, Math.max(0, (y - top) / (bot - top))); return 22 + Math.sin(Math.PI * t) * 7; };
  const aL = -0.5, NST = 9;
  const shade = (rel) => { const a = Math.asin(Math.min(1, Math.max(-1, rel))); return (Math.cos(a - aL) + 0.48) / 1.48 * 7; }; // 0..7
  const staveOf = (rel) => { const a = Math.asin(Math.min(1, Math.max(-1, rel))); return Math.min(NST - 1, Math.max(0, Math.floor((a + Math.PI / 2) / (Math.PI / NST)))); };
  const put = (x, y, idx) => { idx = Math.min(7, Math.max(0, idx)); const lo = Math.floor(idx), f = idx - lo, d = f > 0.4 && f < 0.6 ? (x + y) & 1 : f >= 0.6 ? 1 : 0; p.px(x, y, wr[Math.min(7, lo + d)]); };
  // variação por aduela + nó + rachadura
  const sShift = [], crackStave = 1 + Math.floor(rng() * (NST - 2));
  for (let i = 0; i < NST; i++) sShift.push((rng() - 0.5) * 0.9);
  const knotY = top + 22 + Math.floor(rng() * 22);
  const hoops = [[26, 7], [48, 8], [70, 7]];
  // CORPO
  for (let y = top; y <= bot; y++) {
    const hw = halfW(y), tb = (y - top) / (bot - top);
    for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) {
      const rel = (x - cx) / hw, st = staveOf(rel);
      let idx = shade(rel) + sShift[st];
      if (tb > 0.80) idx -= (tb - 0.80) * 7;     // base úmida escurece
      if (tb < 0.09) idx += 0.9;                  // topo desbotado pelo sol
      if (rel > 0.86) idx -= 0.6;                 // rim core sombra
      // limo na base
      if (tb > 0.88 && rng() < 0.14) { p.px(x, y, mix(moss, wr[1], rng() * 0.4)); continue; }
      // luz de borda fria (bounce do céu) na beira da sombra
      if (rel > 0.92) { p.px(x, y, mix(wr[Math.max(0, Math.round(idx))], cool, 0.35)); continue; }
      put(x, y, idx);
    }
  }
  // NÓ na madeira (oval escuro com anel claro)
  for (let dy = -3; dy <= 3; dy++) for (let dx = -2; dx <= 2; dx++) {
    const e = (dx / 2.2) ** 2 + (dy / 3) ** 2; const x = cx - 8 + dx, y = knotY + dy;
    if (e <= 1) p.px(x, y, e > 0.55 ? wr[5] : wr[1]);
  }
  // COSTURAS + rachadura (foreshortened)
  const seamA = []; for (let k = 1; k < NST; k++) seamA.push(-Math.PI / 2 + (k * Math.PI) / NST);
  for (let y = top + 2; y <= bot - 2; y++) {
    const hw = halfW(y);
    seamA.forEach((a, k) => {
      const x = Math.round(cx + Math.sin(a) * hw), bi = shade(Math.sin(a));
      p.px(x, y, wr[Math.max(0, Math.floor(bi) - 2)]);
      if (Math.sin(a) < 0.1) p.px(x + 1, y, wr[Math.min(7, Math.floor(bi) + 1)]); // chanfro lit
      if (k === crackStave && (y % 2 === 0 || rng() < 0.6)) p.px(x + (rng() < 0.5 ? -1 : 0), y, wr[0]); // rachadura irregular
    });
  }
  // AROS de ferro: aresta crispa + specular + AO + ferrugem escorrendo
  for (const [yc, hg] of hoops) {
    for (let y = yc; y < yc + hg; y++) {
      const hw = halfW(y) + 0.5, ty = (y - yc) / (hg - 1);
      for (let x = Math.ceil(cx - hw); x <= Math.floor(cx + hw); x++) {
        const rel = (x - cx) / hw; let idx = (shade(rel) / 7) * 4;
        if (y === yc) idx = 0.4; else if (ty < 0.3) idx += 1.7; else if (y === yc + hg - 1) idx = 0.2;
        idx = Math.min(5, Math.max(0, idx));
        let col = IRm[Math.round(idx)];
        if (ty > 0.25 && ty < 0.7 && rng() < 0.12) col = rust[1 + Math.floor(rng() * 2)]; // pitting de ferrugem
        p.px(x, y, col);
      }
    }
    // specular 1px na quina lit + rebites
    for (let x = Math.ceil(cx - halfW(yc + 1)); x <= cx; x++) { const rel = (x - cx) / (halfW(yc + 1) + 0.5); if (rel > -0.7 && rel < -0.2) p.px(x, yc + 1, IRm[5]); }
    const ym = yc + Math.floor(hg / 2) - 1;
    for (const a of seamA) { const x = Math.round(cx + Math.sin(a) * (halfW(ym) + 0.5)); if (Math.abs(Math.sin(a)) > 0.9) continue; p.px(x, ym, IRm[5]); p.px(x, ym + 1, IRm[0]); }
    // AO acima e ferrugem escorrendo abaixo do aro
    for (let x = Math.ceil(cx - halfW(yc)); x <= Math.floor(cx + halfW(yc)); x++) { const rel = (x - cx) / halfW(yc); p.px(x, yc - 1, wr[Math.max(0, Math.floor(shade(rel)) - 2)]); }
    for (let s = 0; s < 5; s++) { const a = (rng() - 0.5) * 2.4; const sx = Math.round(cx + Math.sin(a) * halfW(yc + hg)); const len = 2 + Math.floor(rng() * 5); for (let i = 0; i < len; i++) { const y = yc + hg + i; if (y > bot) break; p.px(sx, y, mix(rust[0], wr[Math.floor(shade(Math.sin(a)))], 0.5 + i / len * 0.3)); } }
  }
  // TAMPA convexa: bandas limpas + aro + crista + nó/batoque + AO sob o aro
  const lrx = halfW(top), lry = 8;
  for (let y = Math.floor(top - lry); y <= top + lry; y++) for (let x = Math.floor(cx - lrx); x <= cx + lrx; x++) {
    const e = ((x - cx) / lrx) ** 2 + ((y - top) / lry) ** 2; if (e > 1) continue;
    const back = (top - y) / lry, left = (cx - x) / lrx, dome = 1 - e;
    let idx = 3.4 + back * 1.4 + left * 0.8 + dome * 0.8;
    p.px(x, y, wr[Math.min(7, Math.max(1, Math.round(idx)))]);
  }
  for (const dy of [-3, 2]) for (let x = Math.floor(cx - lrx); x <= cx + lrx; x++) { const y = top + dy; if (((x - cx) / lrx) ** 2 + ((y - top) / lry) ** 2 <= 0.82) p.px(x, y, wr[2]); }
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) p.px(cx + 5 + dx, top + 1 + dy, wr[1]); // batoque
  for (let a = 0; a < 360; a += 1.2) { const r = a * Math.PI / 180, x = cx + Math.cos(r) * lrx, y = top + Math.sin(r) * lry; p.px(x, y, Math.sin(r) < 0 ? IRm[3] : IRm[1]); if (Math.sin(r) < -0.3 && Math.cos(r) < 0) p.px(x, y, IRm[5]); }
  for (let x = cx - 9; x <= cx + 1; x++) p.px(x, top - lry, wr[7]); // crista traseira-esq
  for (let x = Math.floor(cx - lrx * 0.8); x <= cx + lrx * 0.8; x++) { const rel = (x - cx) / halfW(top + lry); p.px(x, top + lry, wr[Math.max(0, Math.floor(shade(rel)) - 2)]); }
  // nicks/lascas na quina das beiras (madeira fresca clara)
  for (let i = 0; i < 6; i++) { const a = (rng() - 0.5) * 2.6, y = top + 6 + Math.floor(rng() * (bot - top - 12)); const hw = halfW(y); const x = Math.round(cx + Math.sin(a) * hw); p.px(x, y, rng() < 0.5 ? wr[6] : wr[1]); }
  p.outline(OUT, "#2c2433");
  return p;
}

// ---------- fonte de pixel 5×7 (só as letras dos rótulos) ----------
const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  N: ["10001", "11001", "10101", "10101", "10011", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};
function text(dst, str, x, y, scale, c) {
  let cx = x;
  for (const ch of str) {
    const g = FONT[ch] || FONT[" "];
    for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) if (g[r][col] === "1") dst.rect(cx + col * scale, y + r * scale, scale, scale, c);
    cx += 6 * scale;
  }
}

// ---------- composição lado a lado (limpa, base alinhada, rótulos) ----------
function paste(dst, src, ox, oy, zoom) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const i = (y * src.w + x) * 4; if (src.d[i + 3] === 0) continue;
    for (let zy = 0; zy < zoom; zy++) for (let zx = 0; zx < zoom; zx++) dst.px(ox + x * zoom + zx, oy + y * zoom + zy, [src.d[i], src.d[i + 1], src.d[i + 2]]);
  }
}
// base (1ª linha de baixo com pixel opaco) — p/ alinhar os dois pelo "chão"
function baseY(src) { for (let y = src.h - 1; y >= 0; y--) for (let x = 0; x < src.w; x++) if (src.d[(y * src.w + x) * 4 + 3] > 0) return y; return src.h - 1; }
function main() {
  const cols = [
    { src: barrelOld(), label: "ATUAL", color: "#9aa0ac" },
    { src: barrelNew(), label: "BOM", color: "#c8c0a0" },
    { src: barrelMaster(), label: "PERFEITO", color: "#e8c87a" },
  ];
  const Z = 5, gap = 28, pad = 28, labelH = 28;
  const cW = Math.max(...cols.map((c) => c.src.w)) * Z;
  const figH = Math.max(...cols.map((c) => c.src.h)) * Z;
  const sheet = Canvas(pad * 2 + cW * cols.length + gap * (cols.length - 1), pad * 2 + figH + labelH);
  sheet.rect(0, 0, sheet.w, sheet.h, "#15171d");
  const groundY = pad + figH;
  cols.forEach((c, i) => {
    const colX = pad + i * (cW + gap);
    const bx = colX + (cW - c.src.w * Z) / 2, by = groundY - (baseY(c.src) + 1) * Z;
    const sw = c.src.w * Z * 0.7, sh = 7 * Z * 0.5, scx = colX + cW / 2, scy = groundY - 2;
    for (let yy = -sh; yy <= sh; yy++) for (let xx = -sw; xx <= sw; xx++) if ((xx / sw) ** 2 + (yy / sh) ** 2 <= 1) sheet.px(scx + xx, scy + yy, "#0d0f14");
    paste(sheet, c.src, bx, by, Z);
    text(sheet, c.label, colX + cW / 2 - c.label.length * 6, groundY + 8, 2, c.color);
  });
  writeFileSync("design/pixellab-candidatos/_prop-barril.png", encodePng(sheet.w, sheet.h, sheet.d));
  console.log(`[ok] _prop-barril.png — ATUAL → BOM → PERFEITO, zoom ${Z}x`);
}

// ---------- PNG encoder ----------
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
