#!/usr/bin/env node
// DEMO baú: ATUAL (porte verbatim de makeChest(false), S=4) vs NOVO (remaster
// detalhe nativo 128px). Standalone. -> design/pixellab-candidatos/_prop-bau.png
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
    pxa(x, y, c, a) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= w || y >= h) return; const [r, g, b] = toRGB(c); const i = (y * w + x) * 4; if (d[i + 3] === 0) { d[i] = r; d[i + 1] = g; d[i + 2] = b; } else { d[i] = lerp(d[i], r, a); d[i + 1] = lerp(d[i + 1], g, a); d[i + 2] = lerp(d[i + 2], b, a); } d[i + 3] = 255; },
    rect(x, y, ww, hh, c) { for (let j = 0; j < Math.round(hh); j++) for (let i = 0; i < Math.round(ww); i++) this.px(Math.round(x) + i, Math.round(y) + j, c); },
    recta(x, y, ww, hh, c, a) { for (let j = 0; j < Math.round(hh); j++) for (let i = 0; i < Math.round(ww); i++) this.pxa(Math.round(x) + i, Math.round(y) + j, c, a); },
    alphaAt(x, y) { return x >= 0 && y >= 0 && x < w && y < h ? d[(y * w + x) * 4 + 3] : 0; },
    outline(c, sel) { const paint = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (this.alphaAt(x, y) > 0) continue; if (this.alphaAt(x - 1, y) > 60 || this.alphaAt(x + 1, y) > 60 || this.alphaAt(x, y - 1) > 60 || this.alphaAt(x, y + 1) > 60) { const lit = sel && (this.alphaAt(x + 1, y) > 60 || this.alphaAt(x, y + 1) > 60); paint.push([x, y, lit ? sel : c]); } } for (const [x, y, col] of paint) this.px(x, y, col); },
  };
}
// paleta projeto
const WOOD = "#3b2c1f", WOOD_LT = "#4c3a29", WOOD_DK = "#2a2016", WOOD_HI = "#5e4a34";
const FIT = "#6b5a3a", FIT_HI = "#8a7448", FIT_DK = "#3e3322", PIT = "#0a0d12", OUT = "#10141c";
const S = 4;
// rampas BOM
const wr = ["#211910", "#2e2417", "#3b2c1f", "#48382a", "#564231", "#655240", "#776449"]; // 7
const IR = ["#14161c", "#222732", "#303744", "#454f60", "#5d6a7e", "#8694a8"]; // 6 (aço)
const BR = ["#33291a", "#5a4a2c", "#7e6838", "#a08750", "#c2a868"]; // 5 (latão, acento da fechadura)

// ======================================================================
// ATUAL — porte verbatim de makeChest(false)
// ======================================================================
function chestOld() {
  const p = Canvas(30 * S, 26 * S);
  const x0 = 3 * S, w = 24 * S, bodyTop = 12 * S, bodyBot = 24 * S;
  for (let x = x0; x < x0 + w; x++) { const t = (x - x0) / w; const c = t < 0.12 ? WOOD_DK : t < 0.28 ? WOOD : t < 0.5 ? WOOD_LT : t < 0.8 ? WOOD : WOOD_DK; p.rect(x, bodyTop, S, bodyBot - bodyTop, c); }
  for (const jx of [9, 15, 21]) p.rect(jx * S, bodyTop + S, S, bodyBot - bodyTop - 2 * S, WOOD_DK);
  p.rect(x0, bodyTop, w, S, WOOD_HI); p.rect(x0, bodyBot - S, w, S, WOOD_DK);
  p.rect(x0, bodyTop, 2 * S, bodyBot - bodyTop, FIT); p.rect(x0, bodyTop, S, bodyBot - bodyTop, FIT_HI); p.rect(x0 + w - 2 * S, bodyTop, 2 * S, bodyBot - bodyTop, FIT_DK);
  const lidTop = 4 * S, lidBot = 13 * S;
  for (let y = lidTop; y < lidBot; y++) { const k = (y - lidTop) / (lidBot - lidTop); const inset = Math.round((1 - Math.sin(k * Math.PI * 0.5)) * 2 * S); for (let x = x0 + inset; x < x0 + w - inset; x++) { const t = (x - x0) / w; const lit = k < 0.18 || t < 0.2; const c = lit ? WOOD_HI : t < 0.5 ? WOOD_LT : t < 0.8 ? WOOD : WOOD_DK; p.px(x, y, c); } }
  p.rect(x0 + 2 * S, lidTop + S, S, lidBot - lidTop - S, FIT_DK); p.rect(x0 + w - 3 * S, lidTop + S, S, lidBot - lidTop - S, FIT_DK); p.rect(13 * S, lidTop, 4 * S, S, FIT_HI);
  p.rect(13 * S, 10 * S, 4 * S, 5 * S, FIT); p.rect(13 * S, 10 * S, 4 * S, S, FIT_HI); p.rect(14 * S, 12 * S, 2 * S, 2 * S, PIT); p.px(15 * S, 13 * S, FIT_DK);
  p.outline(OUT);
  return p;
}

// ======================================================================
// NOVO — detalhe nativo 128px
// ======================================================================
function chestNew() {
  const W = 120, H = 104, p = Canvas(W, H), rng = mul(7);
  const cx = 60, x0 = 12, w = 96, bodyTop = 46, bodyBot = 98;
  const lidTop = 16, lidBot = 48; // domo RASO
  const halfLid = (y) => { const t = Math.min(1, Math.max(0, (y - lidTop) / (lidBot - lidTop))); return (w / 2) * Math.sqrt(Math.max(0, 2 * t - t * t)); };
  const bands = [16, 60, 104]; // canto-esq, centro, canto-dir — contínuas tampa→corpo
  // 1) CORPO de tábuas (mais claro, não murcho)
  const nPl = 6, plW = w / nPl;
  for (let x = x0; x < x0 + w; x++) {
    const u = (x - x0) / w; let base = 2.2 + (1 - Math.abs(u - 0.34) * 1.7) * 2.6;
    const inPl = ((x - x0) % plW) / plW; if (inPl < 0.1) base += 0.6; else if (inPl > 0.9) base -= 1.2;
    for (let y = bodyTop; y < bodyBot; y++) { let idx = base + (Math.sin(x * 1.3 + y * 0.1) > 0.82 ? -0.5 : 0); if (y === bodyTop) idx += 0.9; else if (y === bodyBot - 1) idx -= 1.6; p.px(x, y, wr[Math.min(6, Math.max(0, Math.round(idx)))]); }
  }
  p.recta(x0, bodyTop, w, 2, "#000000", 0.32);    // AO sob o lábio da tampa
  // 2) TAMPA domo raso
  for (let y = lidTop; y < lidBot; y++) {
    const hl = halfLid(y), t = (y - lidTop) / (lidBot - lidTop);
    if (hl < 1) continue;
    for (let x = Math.ceil(cx - hl); x <= Math.floor(cx + hl); x++) {
      const u = (x - (cx - hl)) / (2 * hl);
      let idx = 2.6 + (1 - t) * 1.7 + (0.52 - Math.abs(u - 0.34)) * 2.2;
      idx += (Math.sin(x * 1.1 + y * 0.7) > 0.85 ? -0.4 : 0);
      if (y === Math.ceil(lidTop + (lidBot - lidTop) * 0.04)) idx += 0.8; // crista do domo
      p.px(x, y, wr[Math.min(6, Math.max(0, Math.round(idx)))]);
    }
  }
  // 3) BANDAS de ferro CONTÍNUAS (tampa+corpo) — bevel esq lit / dir sombra + rebites
  for (const bxC of bands) {
    for (let y = lidTop; y < bodyBot; y++) {
      const onLid = y < lidBot, hl = halfLid(y);
      if (onLid && Math.abs(bxC - cx) > hl - 3) continue;       // recorta no domo
      const t = onLid ? (y - lidTop) / (lidBot - lidTop) : 0;
      for (let dx = -3; dx <= 3; dx++) { const u = (dx + 3) / 6; let idx = u < 0.22 ? 4 : u > 0.8 ? 1 : 2; if (onLid) idx -= t * 0.5; if (y === lidTop && onLid) idx = 0.5; if (y === bodyBot - 1) idx = 0.3; p.px(bxC + dx, y, IR[Math.min(5, Math.max(0, Math.round(idx)))]); }
    }
    for (let y = lidTop + 6; y < bodyBot - 3; y += 13) { const hl = halfLid(y); if (y < lidBot && Math.abs(bxC - cx) > hl - 3) continue; p.px(bxC, y, IR[5]); p.px(bxC, y + 1, IR[0]); } // rebites
  }
  // 4) FECHADURA de latão (acento quente) na junta tampa↔corpo
  const lkx = cx - 9, lky = lidBot - 8, lkw = 18, lkh = 22;
  p.recta(lkx - 1, lky - 1, lkw + 2, lkh + 2, "#000000", 0.3);
  for (let y = lky; y < lky + lkh; y++) for (let x = lkx; x < lkx + lkw; x++) { const u = (x - lkx) / lkw, v = (y - lky) / lkh; let idx = 2 + (0.5 - Math.abs(u - 0.32)) * 2.2 - v * 0.8; if (y === lky || x === lkx) idx += 1.2; if (y === lky + lkh - 1 || x === lkx + lkw - 1) idx -= 1.4; p.px(x, y, BR[Math.min(4, Math.max(0, Math.round(idx)))]); }
  p.rect(cx - 2, lky + 6, 4, 5, PIT); p.rect(cx - 1, lky + 11, 2, 4, PIT); // buraco da fechadura
  p.px(cx - 2, lky + 6, BR[4]); // brilho na borda do buraco
  // 5) desgaste + contato
  for (let i = 0; i < 5; i++) p.px(x0 + 4 + rng() * (w - 8), bodyTop + 4 + rng() * (bodyBot - bodyTop - 8), rng() < 0.5 ? wr[5] : wr[0]);
  p.recta(x0 - 2, bodyBot - 2, w + 4, 2, "#000000", 0.25);
  p.outline(OUT, "#2a2230");
  return p;
}

// ======================================================================
// BAÚ MASTER — o melhor que eu consigo, procedural puro
// ======================================================================
function chestMaster() {
  const W = 168, H = 104, p = Canvas(W, H), rng = mul(13);
  const cx = 84, x0 = 16, w = 136, bodyTop = 58, bodyBot = 98; // CAIXA larga e baixa
  const lidBot = bodyTop, lidTopC = 26, archDrop = 17;          // tampa em ARCO RASO
  const topEdge = (x) => Math.round(lidTopC + ((x - cx) / (w / 2)) ** 2 * archDrop);
  const WD = ["#1a140d", "#241c12", "#30261a", "#3c2f20", "#4a3a28", "#594630", "#6a5640", "#7e6a4c"]; // 8
  const ST = ["#12141a", "#1e232d", "#2c3340", "#414c5d", "#5e6b80", "#93a3b8"]; // aço 6 (5=spec)
  const BRz = ["#2f2412", "#523c17", "#785b27", "#9c7c37", "#c2a052", "#ecd488"]; // latão 6 (5=glint)
  const RU = ["#3a2414", "#52331c", "#6e4626"]; const COOL = "#2c3744";
  const cl = (v, m) => Math.min(m, Math.max(0, v));
  const knots = [[x0 + 22, 80, 4], [x0 + w - 30, 88, 3]];
  const woodPx = (x, y, idx) => {
    idx += (Math.sin(x * 1.25 + y * 0.09) > 0.85 ? -0.5 : 0) + (Math.sin(x * 0.4 + 2.1) > 0.92 ? 0.35 : 0);
    for (const [kx, ky, kr] of knots) { const d = Math.hypot(x - kx, y - ky); if (d < kr) idx -= 1.5; else if (d < kr + 1.5) idx -= 0.6; }
    p.px(x, y, WD[Math.round(cl(idx, 7))]);
  };
  // 1) CORPO de tábuas
  const nPl = 7, plW = w / nPl;
  for (let x = x0; x < x0 + w; x++) {
    const u = (x - x0) / w; let base = 2.5 + (1 - Math.abs(u - 0.34) * 1.7) * 2.7;
    const inPl = ((x - x0) % plW) / plW; if (inPl < 0.08) base += 0.7; else if (inPl > 0.92) base -= 1.3;
    for (let y = bodyTop; y < bodyBot; y++) {
      let idx = base;
      if (y === bodyTop) idx += 0.8; else if (y >= bodyBot - 2) idx -= 1.5;
      if (y > bodyBot - 9 && rng() < 0.45) idx -= (y - (bodyBot - 9)) / 9 * 0.7;
      if ((x < x0 + 3 || x > x0 + w - 3) && rng() < 0.4) idx += 0.8; // desgaste claro nas quinas
      if (u > 0.94) idx *= 0.6;
      woodPx(x, y, idx);
    }
  }
  // 2) TAMPA em arco raso (shading: topo encara céu → frente escurece; wrap horizontal; rim frio)
  for (let x = x0; x < x0 + w; x++) {
    const te = topEdge(x), u = (x - x0) / w;
    for (let y = te; y < lidBot; y++) {
      const depth = (y - te) / (lidBot - te);
      let idx = 3.0 + (1 - depth) * 1.5 + (0.5 - Math.abs(u - 0.33)) * 2.1;
      if (y === te) idx += 1.1;                 // crista de céu
      woodPx(x, y, idx);
      if (u > 0.91) p.px(x, y, mix(WD[Math.round(cl(idx, 7))], COOL, 0.4));
    }
  }
  // 3) lábio frontal da tampa (aresta lit) + AO da junta
  for (let x = x0 + 2; x < x0 + w - 2; x++) p.px(x, lidBot - 1, WD[6]);
  p.recta(x0, bodyTop, w, 1, "#000000", 0.5); p.recta(x0, bodyTop + 1, w, 2, "#000000", 0.28);
  // 4) STRAPS verticais contínuas (tampa+corpo) forjadas + rebites em cúpula + ferrugem leve
  const straps = [x0 + 8, cx, x0 + w - 9], BW = 4;
  for (const bxC of straps) {
    for (let y = topEdge(bxC); y < bodyBot; y++) {
      const onLid = y < lidBot, t = onLid ? (y - topEdge(bxC)) / (lidBot - topEdge(bxC)) : 0;
      for (let dx = -BW; dx <= BW; dx++) {
        const u = (dx + BW) / (2 * BW); let idx = u < 0.16 ? 5 : u < 0.34 ? 4 : u > 0.86 ? 1 : 2 + (u < 0.5 ? 0.6 : 0);
        if (onLid) idx -= t * 0.4; if ((onLid && y === topEdge(bxC)) || y === bodyBot - 1) idx = 0.6;
        let col = ST[Math.round(cl(idx, 5))];
        if (rng() < 0.035) col = RU[1 + Math.floor(rng() * 2)];
        if (u > 0.93) col = mix(col, COOL, 0.4);
        p.px(bxC + dx, y, col);
      }
    }
    for (let y = topEdge(bxC) + 6; y < bodyBot - 4; y += 13) { p.px(bxC - 1, y, ST[4]); p.px(bxC, y, ST[5]); p.px(bxC + 1, y, ST[2]); p.px(bxC, y + 1, ST[0]); }
    const sx = bxC + (BW + 1), y0 = lidBot + 3; for (let i = 0; i < 5; i++) p.pxa(sx, y0 + i, RU[0], 0.4 - i * 0.05); // 1 escorrido sutil
  }
  // 5) CANTONEIRAS em L nas quinas superiores (clipadas no corpo)
  for (const side of [0, 1]) { const cxx = side ? x0 + w - 9 : x0; for (let y = bodyTop; y < bodyTop + 13; y++) for (let x = cxx; x < cxx + 9; x++) { const u = (x - cxx) / 9; p.px(x, y, ST[y === bodyTop ? 1 : u < 0.3 ? 4 : u > 0.8 ? 1 : 2]); } const fx0 = side ? x0 + w - 13 : x0; for (let x = fx0; x < fx0 + 13 && x < x0 + w; x++) p.px(x, bodyTop, ST[4]); }
  // 6) PÉS de ferro
  for (const fx of [x0, x0 + w - 8]) for (let y = bodyBot - 1; y < bodyBot + 4; y++) for (let x = fx; x < fx + 8; x++) { const u = (x - fx) / 8; p.px(x, y, ST[y === bodyBot + 3 ? 0 : u < 0.3 ? 4 : u > 0.78 ? 1 : 2]); }
  // 7) FECHADURA de latão (foco): chapa topo-arredondado + buraco c/ bevel + glint
  const lkw = 26, lkh = 34, lkx = cx - lkw / 2, lky = lidBot - 15;
  p.recta(lkx - 2, lky, lkw + 4, lkh + 2, "#000000", 0.35);
  for (let y = lky; y < lky + lkh; y++) for (let x = lkx; x < lkx + lkw; x++) {
    const u = (x - lkx) / lkw, v = (y - lky) / lkh;
    if (v < 0.24) { const dd = Math.abs(u - 0.5) / 0.5; if (dd > Math.sin((v / 0.24) * Math.PI / 2)) continue; } // topo redondo
    let idx = 2.5 + (0.5 - Math.abs(u - 0.30)) * 2.3 - v * 0.9;
    if (y === lky || x === lkx) idx += 1.3; if (y === lky + lkh - 1 || x === lkx + lkw - 1) idx -= 1.4;
    p.px(x, y, BRz[Math.round(cl(idx, 5))]);
  }
  const hx = cx, hy = lky + 17;
  for (let y = -3; y <= 6; y++) for (let x = -3; x <= 3; x++) { if ((y < 1 && x * x + y * y <= 6) || (y >= 1 && Math.abs(x) <= 1)) p.px(hx + x, hy + y, PIT); }
  p.px(hx - 2, hy - 3, BRz[5]); p.px(hx - 1, hy - 3, BRz[4]);            // borda lit do buraco
  p.px(lkx + 4, lky + 4, "#fbe6b0"); p.px(lkx + 3, lky + 4, BRz[5]); p.px(lkx + 5, lky + 4, BRz[5]); p.px(lkx + 4, lky + 3, BRz[5]); p.px(lkx + 4, lky + 5, BRz[4]); // GLINT
  // 8) desgaste + contato + selout
  for (let i = 0; i < 4; i++) p.px(x0 + 5 + rng() * (w - 10), bodyTop + 6 + rng() * (bodyBot - bodyTop - 12), rng() < 0.5 ? WD[6] : WD[0]);
  p.recta(x0 - 4, bodyBot + 3, w + 8, 2, "#000000", 0.28);
  p.outline(OUT, "#2c2433");
  return p;
}

// ---------- fonte + composição ----------
const FONT = { A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"], T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"], U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"], L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"], N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"], O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"], V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"], " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"] };
function text(dst, str, x, y, sc, c) { let cx = x; for (const ch of str) { const g = FONT[ch] || FONT[" "]; for (let r = 0; r < 7; r++) for (let col = 0; col < 5; col++) if (g[r][col] === "1") dst.rect(cx + col * sc, y + r * sc, sc, sc, c); cx += 6 * sc; } }
function paste(dst, src, ox, oy, z) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const i = (y * src.w + x) * 4; if (src.d[i + 3] === 0) continue; for (let zy = 0; zy < z; zy++) for (let zx = 0; zx < z; zx++) dst.px(ox + x * z + zx, oy + y * z + zy, [src.d[i], src.d[i + 1], src.d[i + 2]]); } }
function baseY(src) { for (let y = src.h - 1; y >= 0; y--) for (let x = 0; x < src.w; x++) if (src.d[(y * src.w + x) * 4 + 3] > 0) return y; return src.h - 1; }
function main() {
  const m = chestMaster();
  const Z = 6, pad = 36, gap = 50;
  const bigW = m.w * Z, bigH = m.h * Z, oneW = m.w, oneH = m.h;
  const sheet = Canvas(pad * 2 + bigW + gap + oneW, pad * 2 + bigH);
  sheet.rect(0, 0, sheet.w, sheet.h, "#15171d");
  // grande
  const gY = pad + bigH;
  const sw = bigW * 0.6, sh = 7 * Z * 0.5;
  for (let yy = -sh; yy <= sh; yy++) for (let xx = -sw; xx <= sw; xx++) if ((xx / sw) ** 2 + (yy / sh) ** 2 <= 1) sheet.px(pad + bigW / 2 + xx, gY - 8 + yy, "#0d0f14");
  paste(sheet, m, pad, gY - (baseY(m) + 1) * Z, Z);
  // 1:1 (tamanho real no jogo) ao lado
  const ox = pad + bigW + gap, oy = pad + bigH - oneH - 30;
  paste(sheet, m, ox, oy, 1);
  text(sheet, "1:1", ox + oneW / 2 - 9, oy + oneH + 6, 2, "#9aa0ac");
  writeFileSync("design/pixellab-candidatos/_prop-bau.png", encodePng(sheet.w, sheet.h, sheet.d));
  console.log(`[ok] _prop-bau.png — BAÚ MASTER, zoom ${Z}x + 1:1`);
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
