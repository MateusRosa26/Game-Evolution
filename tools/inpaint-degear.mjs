#!/usr/bin/env node
// Remove espada+escudo do corpo-base aprovado via /inpaint (custo 0 gerações).
// Monta uma máscara (branco = regenerar) sobre a arma/escudo e pede "mãos vazias".
//
// Uso:
//   node tools/inpaint-degear.mjs            # só PREVIEW da máscara (grátis): _mask-preview@160.png
//   node tools/inpaint-degear.mjs --go       # chama /inpaint (custo 0) → resultado

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { inflateSync, deflateSync } from "node:zlib";

const BASE = "https://api.pixellab.ai/v2";
const KEY = readFileSync(join(homedir(), ".pixellab_key"), "utf8").trim();
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const DIR = "/mnt/c/Users/mateu/OneDrive/Desktop/Rpg/design/pixellab-candidatos/chars/knight-overnight";
const SRC = join(DIR, "cal_s500_seed33.png");

// ---- máscara: formas em coords 128 (ajustar pelo preview) ----
// shield = elipse; sword = banda diagonal (hilt→ponta), largura half-w
const SHAPES = {
  shield: { cx: 87, cy: 81, rx: 24, ry: 28 },
  sword: { x0: 68, y0: 68, x1: 18, y1: 112, hw: 12 },
  hand: { cx: 56, cy: 87, rx: 12, ry: 12 }, // cobre punho+guarda+cotovelo da espada
};

// ---------- codec PNG (de finalize-item.mjs) ----------
function decodePng(buf) {
  let pos = 8, w = 0, h = 0, ct = 6; const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    else if (type === "IDAT") idat.push(data); else if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)), ch = ct === 6 ? 4 : 3, stride = w * ch;
  const out = new Uint8ClampedArray(w * h * 4), cur = new Uint8Array(stride), prev = new Uint8Array(stride);
  let rp = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[rp++];
    for (let x = 0; x < stride; x++) {
      const rb = raw[rp++], a = x >= ch ? cur[x - ch] : 0, b = prev[x], c = x >= ch ? prev[x - ch] : 0;
      let v = rb;
      if (f === 1) v = rb + a; else if (f === 2) v = rb + b; else if (f === 3) v = rb + ((a + b) >> 1);
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = rb + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      cur[x] = v & 255;
    }
    for (let x = 0; x < w; x++) { const si = x * ch, di = (y * w + x) * 4; out[di] = cur[si]; out[di + 1] = cur[si + 1]; out[di + 2] = cur[si + 2]; out[di + 3] = ch === 4 ? cur[si + 3] : 255; }
    prev.set(cur);
  }
  return { w, h, d: out };
}
function png(w, h, d) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = d[y * w * 4 + x]; }
  const idat = deflateSync(raw), ct = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; ct[n] = c >>> 0; }
  const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = ct[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (t, dt) => { const len = Buffer.alloc(4); len.writeUInt32BE(dt.length); const tt = Buffer.from(t); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dt]))); return Buffer.concat([len, tt, dt, cc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}
function scaleNearest(img, dw, dh) {
  const out = new Uint8ClampedArray(dw * dh * 4);
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const sx = Math.min(img.w - 1, Math.floor((x * img.w) / dw)), sy = Math.min(img.h - 1, Math.floor((y * img.h) / dh));
    const s = (sy * img.w + sx) << 2, di = (y * dw + x) << 2;
    out[di] = img.d[s]; out[di + 1] = img.d[s + 1]; out[di + 2] = img.d[s + 2]; out[di + 3] = img.d[s + 3];
  }
  return { w: dw, h: dh, d: out };
}

// ---------- desenho da máscara ----------
function inEllipse(x, y, e) { const dx = (x - e.cx) / e.rx, dy = (y - e.cy) / e.ry; return dx * dx + dy * dy <= 1; }
function distToSeg(x, y, s) {
  const vx = s.x1 - s.x0, vy = s.y1 - s.y0, wx = x - s.x0, wy = y - s.y0;
  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / (vx * vx + vy * vy)));
  const px = s.x0 + t * vx, py = s.y0 + t * vy;
  return Math.hypot(x - px, y - py);
}
function buildMask(w, h) {
  const m = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const hit = inEllipse(x, y, SHAPES.shield) || inEllipse(x, y, SHAPES.hand) || distToSeg(x, y, SHAPES.sword) <= SHAPES.sword.hw;
    const di = (y * w + x) << 2; const v = hit ? 255 : 0;
    m[di] = m[di + 1] = m[di + 2] = v; m[di + 3] = 255;
  }
  return { w, h, d: m };
}

// ---------- API ----------
async function balance() { const r = await fetch(`${BASE}/balance`, { headers: H }); return (await r.json())?.subscription?.generations ?? "?"; }

async function main() {
  // --front: endireita o ¾ → frontal-sul via /rotate (south-east → south)
  if (process.argv.includes("--front")) {
    const src = decodePng(readFileSync(join(DIR, "BASE-clean.png")));
    const before = await balance();
    const body = {
      from_image: { type: "base64", base64: Buffer.from(png(src.w, src.h, src.d)).toString("base64"), format: "png" },
      image_size: { width: src.w, height: src.h },
      from_direction: "south-east",
      to_direction: "south",
      from_view: "low top-down", to_view: "low top-down",
      init_image: { type: "base64", base64: Buffer.from(png(src.w, src.h, src.d)).toString("base64"), format: "png" },
      init_image_strength: 300,
    };
    console.log("[rotate] POST /rotate south-east→south…");
    const r = await fetch(`${BASE}/rotate`, { method: "POST", headers: H, body: JSON.stringify(body) });
    const txt = await r.text();
    if (!r.ok) { console.error(`[erro] HTTP ${r.status}: ${txt.slice(0, 400)}`); process.exit(1); }
    let j = JSON.parse(txt), b64 = j?.image?.base64;
    if (!b64 && j?.background_job_id) {
      for (let i = 0; i < 60; i++) { await new Promise((s) => setTimeout(s, 5000)); const g = await (await fetch(`${BASE}/background-jobs/${j.background_job_id}`, { headers: H })).json(); if (g.status === "completed" || g.status === "success") { j = g.last_response ?? g; break; } if (g.status === "failed") { console.error("FALHOU", JSON.stringify(g).slice(0, 300)); process.exit(1); } }
      b64 = j?.image?.base64 ?? j?.images?.[0]?.base64;
    }
    if (!b64) { console.error("sem image:", JSON.stringify(j).slice(0, 300)); process.exit(1); }
    const out = decodePng(Buffer.from(b64, "base64"));
    writeFileSync(join(DIR, "FRONT.png"), png(out.w, out.h, out.d));
    writeFileSync(join(DIR, "@160__FRONT.png"), png(160, 160, scaleNearest(out, 160, 160).d));
    const after = await balance();
    console.log(`[ok] FRONT.png (${out.w}x${out.h}) · custo ${before === "?" ? "?" : before - after} gens · saldo ${before}→${after}`);
    return;
  }
  // --grid: emite original + BASE-clean em 4x (512) com grade de 8px p/ ler coordenadas
  if (process.argv.includes("--grid")) {
    for (const [name, file] of [["orig", SRC], ["clean", join(DIR, "BASE-clean.png")]]) {
      const img = decodePng(readFileSync(file));
      const S = 4, W = img.w * S;
      const g = scaleNearest(img, W, img.h * S);
      for (let i = 0; i < g.d.length; i += 4) { const x = (i >> 2) % W, y = (i >> 2) / W | 0; if ((x % (8 * S) === 0) || (y % (8 * S) === 0)) { g.d[i] = 255; g.d[i + 1] = 60; g.d[i + 2] = 60; g.d[i + 3] = Math.max(g.d[i + 3], 140); } }
      writeFileSync(join(DIR, `_grid-${name}.png`), png(g.w, g.h, g.d));
    }
    console.log("[grid] _grid-orig.png e _grid-clean.png (grade a cada 8px do nativo)");
    return;
  }
  // --clean: (1) restaura os PÉS do original (eram limpos, sem gear) (2) apaga só a lâmina
  // que flutua bem à esquerda, longe dos pés.
  if (process.argv.includes("--clean")) {
    const img = decodePng(readFileSync(join(DIR, "BASE-degear.png")));
    const orig = decodePng(readFileSync(SRC));
    // (1) restaurar pés: copia janela dos botins do original (x∈[46,90], y∈[104,122]) — sem a lâmina (x<46)
    let restored = 0;
    for (let y = 104; y < 122 && y < img.h; y++) for (let x = 46; x < 90 && x < img.w; x++) {
      const di = (y * img.w + x) << 2; for (let k = 0; k < 4; k++) img.d[di + k] = orig.d[di + k]; restored++;
    }
    // (2) apagar a lâmina: tudo à ESQUERDA do braço (x<47), do cotovelo (y>74) até logo acima
    //     dos botins (y<104, que já foram restaurados do original). Deixa a manopla (x>=47).
    let cleared = 0;
    for (let y = 74; y < 104 && y < img.h; y++) for (let x = 0; x < 47; x++) {
      const di = (y * img.w + x) << 2; if (img.d[di + 3] > 0) { img.d[di + 3] = 0; cleared++; }
    }
    writeFileSync(join(DIR, "BASE-clean.png"), png(img.w, img.h, img.d));
    writeFileSync(join(DIR, "@160__BASE-clean.png"), png(160, 160, scaleNearest(img, 160, 160).d));
    console.log(`[clean] pés restaurados (${restored}px do original) + ${cleared}px de lâmina flutuante apagados`);
    return;
  }

  const src = decodePng(readFileSync(SRC));
  const mask = buildMask(src.w, src.h);

  // PREVIEW: máscara em vermelho semitransparente sobre o char @160
  const ov = { w: src.w, h: src.h, d: new Uint8ClampedArray(src.d) };
  for (let i = 0; i < mask.d.length; i += 4) if (mask.d[i] > 127) { ov.d[i] = 255; ov.d[i + 1] = (ov.d[i + 1] * 0.3) | 0; ov.d[i + 2] = (ov.d[i + 2] * 0.3) | 0; ov.d[i + 3] = 255; }
  writeFileSync(join(DIR, "_mask-preview@160.png"), png(160, 160, scaleNearest(ov, 160, 160).d));
  writeFileSync(join(DIR, "_mask.png"), png(mask.w, mask.h, mask.d));
  console.log(`[preview] ${DIR}/_mask-preview@160.png (vermelho = vai regenerar)`);

  if (!process.argv.includes("--go")) { console.log("[preview-only] sem --go, custo 0. Confira a máscara antes de rodar."); return; }

  const before = await balance();
  const body = {
    description: "greyscale steel plate armor cuirass with fauld tassets over chainmail, a steel plate armored arm hanging straight down at the side ending in an empty gauntlet, armored leg plate and steel boot, nothing held in the hand",
    negative_description: "sword, weapon, blade, dagger, hilt, stick, pole, shield, round shield, buckler, robe, gown, cloak, cloth, fabric, drape, tunic, skirt, dress, bare skin, color, saturated, blurry",
    image_size: { width: src.w, height: src.h },
    text_guidance_scale: 5,
    view: "low top-down",
    direction: "south",
    outline: "single color black outline",
    shading: "medium shading",
    detail: "highly detailed",
    no_background: true,
    inpainting_image: { type: "base64", base64: Buffer.from(png(src.w, src.h, src.d)).toString("base64"), format: "png" },
    mask_image: { type: "base64", base64: Buffer.from(png(mask.w, mask.h, mask.d)).toString("base64"), format: "png" },
  };
  console.log("[inpaint] POST /inpaint…");
  const r = await fetch(`${BASE}/inpaint`, { method: "POST", headers: H, body: JSON.stringify(body) });
  const txt = await r.text();
  if (!r.ok) { console.error(`[erro] HTTP ${r.status}: ${txt.slice(0, 400)}`); process.exit(1); }
  const j = JSON.parse(txt);
  const b64 = j?.image?.base64; if (!b64) { console.error("sem image:", txt.slice(0, 300)); process.exit(1); }
  const out = decodePng(Buffer.from(b64, "base64"));
  writeFileSync(join(DIR, "BASE-degear.png"), png(out.w, out.h, out.d));
  writeFileSync(join(DIR, "@160__BASE-degear.png"), png(160, 160, scaleNearest(out, 160, 160).d));
  const after = await balance();
  console.log(`[ok] BASE-degear.png (${out.w}x${out.h}) · custo ${before === "?" ? "?" : before - after} gens (esperado 0) · usd ${j?.usage?.usd ?? "?"}`);
}
main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
