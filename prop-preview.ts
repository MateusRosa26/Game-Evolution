// Preview procedural DESCARTÁVEL do kit de mobília urbana (tenda/barril/caixa) —
// valida estilo (silhueta/ramp/luz) ANTES de produzir em sprites.ts. Acesse
// /prop-preview.html com o dev server. NÃO toca na trilha client (sprites.ts).
import { PAL } from "./src/client/assets/palette";

const root = document.getElementById("root")!;

// ── paleta do kit (madeira/ferro/pano) — madeira reusa palette.ts; resto deriva ──
const WOOD_DK = "#2a2016", WOOD = PAL.woodPost, WOOD_LT = PAL.woodPostLight, WOOD_HI = "#5e4a34";
const IRON = "#20242c", IRON_HI = "#3a4150";
const LINEN = "#b8a784", LINEN_SH = "#8f8060", LINEN_HI = "#cdbf9d";
const CLOTH = "#9a4f3c", CLOTH_SH = "#6e3a2c"; // vermelho-poeira dessaturado (acento quente)
const OUT = "#10141c"; // outline canônico

type Ctx = CanvasRenderingContext2D;
function cv(w: number, h: number): { c: HTMLCanvasElement; x: Ctx } {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const x = c.getContext("2d")!;
  x.imageSmoothingEnabled = false;
  return { c, x };
}
const R = (x: Ctx, px: number, py: number, w: number, h: number, col: string) => { x.fillStyle = col; x.fillRect(px, py, w, h); };

// ─────────────────────────────── BARRIL (16×22) ───────────────────────────────
function barrel(): HTMLCanvasElement {
  const { c, x } = cv(16, 22);
  // silhueta com leve barriga: outline
  R(x, 3, 3, 10, 17, OUT);            // corpo (outline)
  R(x, 2, 6, 12, 11, OUT);            // barriga (outline)
  // duelas (tábuas verticais) — luz vem de cima-esquerda → esquerda mais clara
  const staves = [WOOD_LT, WOOD, WOOD, WOOD_DK, WOOD_DK];
  for (let i = 0; i < 5; i++) R(x, 4 + i * 2, 4, 2, 15, staves[i]);
  R(x, 3, 7, 10, 9, "");              // (no-op; barriga já coberta abaixo)
  // barriga: estende as duelas 1px pra fora nos lados no meio
  R(x, 3, 8, 1, 7, WOOD); R(x, 12, 8, 1, 7, WOOD_DK);
  // tampo elíptico (pega luz de cima)
  R(x, 5, 3, 6, 2, WOOD_HI); R(x, 4, 4, 8, 1, WOOD_LT); R(x, 6, 3, 4, 1, LINEN_HI);
  // aros de ferro (2) — topo do aro pega luz
  for (const ay of [7, 15]) { R(x, 3, ay, 10, 2, IRON); R(x, 3, ay, 10, 1, IRON_HI); }
  R(x, 3, 8, 1, 7, IRON); R(x, 12, 8, 1, 7, IRON); // aros acompanham a barriga
  // re-desenha duelas DENTRO dos aros pra não sumir (entre aros)
  for (let i = 0; i < 5; i++) { R(x, 4 + i * 2, 9, 2, 5, staves[i]); }
  // base em sombra
  R(x, 4, 18, 9, 1, WOOD_DK);
  return c;
}

// ──────────────────────────────── CAIXA (18×18) ────────────────────────────────
function crate(): HTMLCanvasElement {
  const { c, x } = cv(18, 18);
  R(x, 2, 3, 14, 14, OUT);            // outline do cubo
  R(x, 3, 4, 12, 12, WOOD);           // face frontal
  // moldura (ripas da borda) mais escura
  R(x, 3, 4, 12, 2, WOOD_LT);         // topo da face (pega luz)
  R(x, 3, 14, 12, 2, WOOD_DK);        // base (sombra)
  R(x, 3, 4, 2, 12, WOOD_LT);         // viga esquerda (luz)
  R(x, 13, 4, 2, 12, WOOD_DK);        // viga direita (sombra)
  // X de reforço (tábuas diagonais)
  for (let i = 0; i < 9; i++) { R(x, 5 + i, 6 + i, 1, 1, WOOD_HI); R(x, 13 - i, 6 + i, 1, 1, WOOD_DK); }
  // pregos nos cantos
  for (const [px, py] of [[4, 5], [13, 5], [4, 14], [13, 14]]) R(x, px, py, 1, 1, IRON_HI);
  return c;
}

// ───────────────────────── TENDA / BANCA DE FEIRA (44×40) ─────────────────────────
function stall(): HTMLCanvasElement {
  const { c, x } = cv(44, 40);
  // POSTES (atrás, VISÍVEIS no vão aberto entre toldo e balcão)
  for (const px of [7, 34]) {
    R(x, px, 15, 3, 21, OUT);
    R(x, px, 15, 2, 21, WOOD);
    R(x, px + 1, 15, 1, 21, WOOD_DK);
    R(x, px, 15, 2, 1, WOOD_LT);
  }
  // TOLDO listrado (linho × vermelho-poeira), overhang x2..41, corpo y3..13
  const bands = 6, bw = 40 / bands;
  for (let b = 0; b < bands; b++) {
    const isLinen = b % 2 === 0;
    const col = isLinen ? LINEN : CLOTH, sh = isLinen ? LINEN_SH : CLOTH_SH, hi = isLinen ? LINEN_HI : CLOTH;
    const x0 = 2 + Math.round(b * bw), x1 = 2 + Math.round((b + 1) * bw);
    for (let cx = x0; cx < x1; cx++) {
      R(x, cx, 3, 1, 11, col);          // corpo do toldo
      R(x, cx, 3, 1, 1, hi);            // crista (pega luz de cima)
      R(x, cx, 13, 1, 1, sh);           // borda frontal em sombra leve
    }
    // FRANJA escalopada (o que grita "toldo de feira"): um pingo triangular por faixa
    const sc = (x0 + x1) >> 1;
    for (let k = 0; k < 4; k++) R(x, sc - (3 - k), 14 + k, (3 - k) * 2 + 1, 1, sh);
  }
  R(x, 1, 2, 42, 1, OUT);               // outline: topo do toldo
  R(x, 1, 3, 1, 11, OUT); R(x, 42, 3, 1, 11, OUT); // laterais do toldo
  // BALCÃO (mesa) — tampo lit + face de tábuas (y26..36)
  R(x, 6, 26, 32, 11, OUT);
  R(x, 7, 27, 30, 3, WOOD_LT); R(x, 7, 27, 30, 1, WOOD_HI); // tampo (luz de cima)
  R(x, 7, 30, 30, 6, WOOD);             // face frontal
  for (let i = 0; i < 6; i++) R(x, 9 + i * 5, 30, 1, 6, WOOD_DK); // juntas das tábuas
  R(x, 7, 35, 30, 1, WOOD_DK);          // base (sombra)
  // MERCADORIA exposta (sacos + caixinha) sobre o tampo, subindo no vão aberto
  for (const sx of [12, 19, 26]) { R(x, sx, 21, 5, 6, OUT); R(x, sx + 1, 22, 3, 4, LINEN); R(x, sx + 1, 22, 3, 1, LINEN_HI); R(x, sx + 1, 25, 3, 1, LINEN_SH); R(x, sx + 2, 21, 1, 1, LINEN); }
  R(x, 30, 22, 5, 5, OUT); R(x, 31, 23, 3, 3, WOOD_LT); R(x, 31, 23, 3, 1, WOOD_HI);
  return c;
}

// ── composição: cada peça sobre GRAMA e PEDRA, em 6× e 10×, + silhueta preta ──
function bgTile(kind: "grass" | "stone"): HTMLCanvasElement {
  const { c, x } = cv(64, 64);
  const base = kind === "grass" ? "#243520" : PAL.stoneBase;
  const v1 = kind === "grass" ? "#1b2a20" : PAL.stoneDark;
  const v2 = kind === "grass" ? "#2f4327" : PAL.stoneMid;
  R(x, 0, 0, 64, 64, base);
  for (let i = 0; i < 380; i++) { const px = (i * 37) % 64, py = (i * 53) % 64; R(x, px, py, 1, 1, (i % 2 ? v1 : v2)); }
  return c;
}
function silhouette(src: HTMLCanvasElement): HTMLCanvasElement {
  const { c, x } = cv(src.width, src.height);
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = "source-in";
  R(x, 0, 0, src.width, src.height, "#000");
  return c;
}
function show(title: string, sprite: HTMLCanvasElement) {
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:inline-block;vertical-align:top;margin:0 18px 18px 0;text-align:center";
  const h = document.createElement("div"); h.textContent = title; h.style.cssText = "color:#cbd3dd;font:12px sans-serif;margin-bottom:6px"; wrap.appendChild(h);
  const sil = silhouette(sprite);
  for (const [label, bg, scale] of [["grama 10×", "grass", 10], ["pedra 10×", "stone", 10], ["grama 6×", "grass", 6], ["silhueta", null, 10]] as const) {
    const W = sprite.width * scale, H = sprite.height * scale;
    const { c, x } = cv(W, H);
    if (bg) { const t = bgTile(bg as "grass" | "stone"); for (let yy = 0; yy < H; yy += 64) for (let xx = 0; xx < W; xx += 64) x.drawImage(t, xx, yy); }
    else { R(x, 0, 0, W, H, "#cbd3dd"); }
    x.imageSmoothingEnabled = false;
    x.drawImage(bg ? sprite : sil, 0, 0, W, H);
    c.style.cssText = "image-rendering:pixelated;margin:0 6px;border:1px solid #333";
    const cap = document.createElement("div"); cap.textContent = label; cap.style.cssText = "color:#7d8794;font:10px sans-serif";
    const col = document.createElement("div"); col.style.cssText = "display:inline-block;vertical-align:top"; col.appendChild(c); col.appendChild(cap);
    wrap.appendChild(col);
  }
  root.appendChild(wrap);
}

show("TENDA DE FEIRA", stall());
show("BARRIL", barrel());
show("CAIXA / ENGRADADO", crate());
