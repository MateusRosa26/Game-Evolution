#!/usr/bin/env node
// Gera o AVATAR BASE (aldeão classless) — corpo-mãe do paperdoll. 2 homens + 2 mulheres.
// Pele/rosto/cabelo em cor real (NUNCA tingido); túnica simples; mãos vazias; sem armadura.
// init = moldura CAL (placa greyscale 92px + margem de pé) → ancora proporção/escala/enquadramento
// IGUAL pra todos (escala consistente p/ o paperdoll); strength médio deixa o prompt reescrever
// o traje p/ aldeão. Aldeão não tem prior de arma → sem a guerra de de-gear.
//
// Uso:
//   node tools/gen-base-avatar.mjs <strength> <seed1,seed2,...>
//   probe:  node tools/gen-base-avatar.mjs 100 5            (4 modelos × 1 seed = 4 gens)
//   full:   node tools/gen-base-avatar.mjs 100 17,33,48,71  (4 × 4 = 16 gens)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { inflateSync, deflateSync } from "node:zlib";

const BASE = "https://api.pixellab.ai/v2";
const KEY = readFileSync(join(homedir(), ".pixellab_key"), "utf8").trim();
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const OUT = "/mnt/c/Users/mateu/OneDrive/Desktop/Rpg/design/pixellab-candidatos/chars/base-avatar";
const PLACA = "design/pixellab-candidatos/chars/_ref-placa-knight-s0.png"; // ref preservada (só usada se strength>0)

const COMMON =
  "dark medieval fantasy, black outline, cold desaturated muted tones, readable silhouette, low top-down, " +
  "realistic slender human proportions, small head about one third of body height, NOT chibi, NOT super deformed, " +
  "standing idle facing south, full body with both feet fully visible at the bottom, " +
  "both hands empty and relaxed down at the sides, plain transparent background, clean pixel art";
const NEG =
  "chibi, big head, large head, super deformed, stubby, cropped, feet cut off, " +
  "armor, plate, chainmail, helmet, weapon, sword, shield, cape, cloak, " +
  "photorealistic, smooth gradient, blurry, oversaturated, neon";

const MODELS = [
  { id: "homem-jovem", desc: "a young peasant villager man, short brown hair, clean shaven youthful face, simple worn linen tunic, cloth trousers, leather boots, humble and modest commoner" },
  { id: "homem-barbudo", desc: "a rugged peasant villager man, short dark hair and a short beard, simple worn wool tunic, cloth trousers, leather boots, humble and modest commoner" },
  { id: "mulher-jovem", desc: "a young peasant villager woman, slender feminine figure, brown hair tied back in a bun, simple worn linen dress, leather shoes, humble and modest commoner" },
  { id: "mulher-adulta", desc: "a peasant villager woman, slender feminine figure, shoulder length dark hair, simple worn wool blouse and long skirt, leather shoes, humble and modest commoner" },
];

// ---------- codec PNG ----------
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
const pxi = (img, x, y) => ((y * img.w + x) << 2);
function bbox(img, thr = 20) { let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1; for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.d[pxi(img, x, y) + 3] > thr) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; }
function crop(img, b) { const o = new Uint8ClampedArray(b.w * b.h * 4); for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) { const s = pxi(img, b.x0 + x, b.y0 + y), di = (y * b.w + x) << 2; o[di] = img.d[s]; o[di + 1] = img.d[s + 1]; o[di + 2] = img.d[s + 2]; o[di + 3] = img.d[s + 3]; } return { w: b.w, h: b.h, d: o }; }
function greyscale(img) { const o = new Uint8ClampedArray(img.d.length); for (let i = 0; i < img.d.length; i += 4) { const l = Math.round(0.299 * img.d[i] + 0.587 * img.d[i + 1] + 0.114 * img.d[i + 2]); o[i] = o[i + 1] = o[i + 2] = l; o[i + 3] = img.d[i + 3]; } return { w: img.w, h: img.h, d: o }; }
function scaleNearest(img, dw, dh) { const o = new Uint8ClampedArray(dw * dh * 4); for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) { const sx = Math.min(img.w - 1, Math.floor((x * img.w) / dw)), sy = Math.min(img.h - 1, Math.floor((y * img.h) / dh)); const s = (sy * img.w + sx) << 2, di = (y * dw + x) << 2; o[di] = img.d[s]; o[di + 1] = img.d[s + 1]; o[di + 2] = img.d[s + 2]; o[di + 3] = img.d[s + 3]; } return { w: dw, h: dh, d: o }; }
function blank(w, h) { return { w, h, d: new Uint8ClampedArray(w * h * 4) }; }
function paste(dst, src, ox, oy) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const dx = ox + x, dy = oy + y; if (dx < 0 || dy < 0 || dx >= dst.w || dy >= dst.h) continue; const s = pxi(src, x, y); if (src.d[s + 3] === 0) continue; const di = pxi(dst, dx, dy); dst.d[di] = src.d[s]; dst.d[di + 1] = src.d[s + 1]; dst.d[di + 2] = src.d[s + 2]; dst.d[di + 3] = src.d[s + 3]; } }
function buildInit() { const placa = decodePng(readFileSync(PLACA)); const b = bbox(placa); const fig = greyscale(crop(placa, b)); const figH = 92, figW = Math.round((fig.w * figH) / fig.h); const sc = scaleNearest(fig, figW, figH); const c = blank(128, 128); paste(c, sc, Math.round((128 - figW) / 2), 18); return c; }

async function balance() { const r = await fetch(`${BASE}/balance`, { headers: H }); return (await r.json())?.subscription?.generations ?? "?"; }
async function pixflux({ desc, init, strength, seed }) {
  const body = {
    description: `${desc}, ${COMMON}`, negative_description: NEG,
    image_size: { width: 128, height: 128 }, text_guidance_scale: 10,
    view: "low top-down", direction: "south", outline: "single color black outline",
    shading: "medium shading", detail: "highly detailed", no_background: true, seed,
  };
  if (strength > 0) { // strength 0 = from-scratch (sem init armado)
    body.init_image = { type: "base64", base64: Buffer.from(png(init.w, init.h, init.d)).toString("base64"), format: "png" };
    body.init_image_strength = strength;
  }
  const r = await fetch(`${BASE}/create-image-pixflux`, { method: "POST", headers: H, body: JSON.stringify(body) });
  const txt = await r.text(); if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt.slice(0, 250)}`);
  const j = JSON.parse(txt); const b64 = j?.image?.base64; if (!b64) throw new Error("sem image");
  return decodePng(Buffer.from(b64, "base64"));
}

async function main() {
  // sheet <seeds>: monta grade combinada dos @160 já no disco (sem API). Linha=modelo, col=seed.
  if (process.argv[2] === "sheet") {
    const seeds = (process.argv[3] || "5,17,33,48,71").split(",").map((s) => parseInt(s, 10));
    const sheet = blank(seeds.length * 160, MODELS.length * 160);
    MODELS.forEach((m, ri) => seeds.forEach((seed, ci) => {
      try { const t = decodePng(readFileSync(join(OUT, `@160__${m.id}_s0_seed${seed}.png`))); paste(sheet, t, ci * 160, ri * 160); } catch {}
    }));
    writeFileSync(join(OUT, "_SHEET_TODOS.png"), png(sheet.w, sheet.h, sheet.d));
    console.log(`[sheet] _SHEET_TODOS.png — linhas: ${MODELS.map((m) => m.id).join(", ")} · cols seeds: ${seeds.join(", ")}`);
    return;
  }
  // rotate <basename> <from_dir>: vira um avatar pra frontal-sul via /rotate
  if (process.argv[2] === "rotate") {
    const file = process.argv[3], fromDir = process.argv[4] || "south-east";
    const src = decodePng(readFileSync(join(OUT, `${file}.png`)));
    const before = await balance();
    const b64in = Buffer.from(png(src.w, src.h, src.d)).toString("base64");
    const body = {
      from_image: { type: "base64", base64: b64in, format: "png" },
      image_size: { width: src.w, height: src.h },
      from_direction: fromDir, to_direction: "south",
      from_view: "low top-down", to_view: "low top-down",
      init_image: { type: "base64", base64: b64in, format: "png" }, init_image_strength: 220,
    };
    console.log(`[rotate] ${file} ${fromDir}→south…`);
    const r = await fetch(`${BASE}/rotate`, { method: "POST", headers: H, body: JSON.stringify(body) });
    const txt = await r.text(); if (!r.ok) { console.error(`HTTP ${r.status}: ${txt.slice(0, 300)}`); process.exit(1); }
    let j = JSON.parse(txt), b64 = j?.image?.base64;
    if (!b64 && j?.background_job_id) { for (let i = 0; i < 60; i++) { await new Promise((s) => setTimeout(s, 5000)); const g = await (await fetch(`${BASE}/background-jobs/${j.background_job_id}`, { headers: H })).json(); if (["completed", "success"].includes(g.status)) { j = g.last_response ?? g; break; } if (g.status === "failed") { console.error("FALHOU"); process.exit(1); } } b64 = j?.image?.base64; }
    if (!b64) { console.error("sem image:", JSON.stringify(j).slice(0, 200)); process.exit(1); }
    const out = decodePng(Buffer.from(b64, "base64"));
    writeFileSync(join(OUT, `${file}_FRONT.png`), png(out.w, out.h, out.d));
    writeFileSync(join(OUT, `@160__${file}_FRONT.png`), png(160, 160, scaleNearest(out, 160, 160).d));
    const after = await balance();
    console.log(`[ok] ${file}_FRONT.png · custo ${before === "?" ? "?" : before - after} · saldo ${before}→${after}`);
    return;
  }
  const strength = parseInt(process.argv[2] || "100", 10);
  const seeds = (process.argv[3] || "5").split(",").map((s) => parseInt(s, 10));
  mkdirSync(OUT, { recursive: true });
  const init = strength > 0 ? buildInit() : null; // from-scratch (strength 0) não precisa do init
  if (init) writeFileSync(join(OUT, "_init.png"), png(init.w, init.h, init.d));
  const before = await balance();
  console.log(`[balance] antes: ${before} · strength ${strength} · seeds ${seeds.join(",")} · ${MODELS.length * seeds.length} gens`);

  const tiles = []; // {model, seed, big}
  for (const m of MODELS) for (const seed of seeds) {
    try {
      const img = await pixflux({ desc: m.desc, init, strength, seed });
      const tag = `${m.id}_s${strength}_seed${seed}`;
      writeFileSync(join(OUT, `${tag}.png`), png(img.w, img.h, img.d));
      const big = scaleNearest(img, 160, 160);
      writeFileSync(join(OUT, `@160__${tag}.png`), png(160, 160, big.d));
      tiles.push({ model: m.id, seed, big });
      console.log(`[ok] ${tag}`);
    } catch (e) { console.error(`[FALHA] ${m.id} seed${seed}: ${e.message}`); }
  }

  // sheet: linha por modelo, coluna por seed
  const cols = seeds.length, rows = MODELS.length;
  const sheet = blank(cols * 160, rows * 160);
  MODELS.forEach((m, ri) => seeds.forEach((seed, ci) => { const t = tiles.find((x) => x.model === m.id && x.seed === seed); if (t) paste(sheet, t.big, ci * 160, ri * 160); }));
  writeFileSync(join(OUT, `_SHEET_s${strength}.png`), png(sheet.w, sheet.h, sheet.d));

  const after = await balance();
  console.log(`[fim] ${tiles.length} ok · custo ${before === "?" ? "?" : before - after} gens · saldo ${before}→${after}`);
  console.log(`[saída] ${OUT} (linhas: ${MODELS.map((m) => m.id).join(", ")})`);
}
main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
