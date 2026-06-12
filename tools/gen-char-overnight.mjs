#!/usr/bin/env node
// RUN NOTURNO — varredura de init_image_strength pro corpo-base do knight (128px).
// Hipótese: o pé cortado é problema de MOLDURA (init enchia o canvas), não de strength;
// e o init_strength real é escala 1–999 (default 300), não 0–100 — a banda 40–58 testada
// até agora é ~5%, território de baixo. Este run fixa a moldura CAL (figura 92px + margem
// de pé) e VARRE o strength no range real pra achar onde a proporção/pé travam SEM o gear
// da placa voltar (a placa tem espada+escudo; em strength alto eles vazam).
//
// pixflux é SÍNCRONO: resposta = { usage:{usd}, image:{base64} }. Sem polling.
//
// Uso:
//   node tools/gen-char-overnight.mjs --init-only   # só monta os inits (GRÁTIS, p/ conferir)
//   node tools/gen-char-overnight.mjs               # roda a varredura inteira (gasta créditos)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { inflateSync, deflateSync } from "node:zlib";

const BASE = "https://api.pixellab.ai/v2";
const KEY = readFileSync(join(homedir(), ".pixellab_key"), "utf8").trim();
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const OUT = "/mnt/c/Users/mateu/OneDrive/Desktop/Rpg/design/pixellab-candidatos/chars/knight-overnight";
const PLACA = "design/pixellab-candidatos/chars/knight-open/_SUA-REFERENCIA-placa-s0.png";
const CANON = "src/client/assets/img/chars/knight/walk/s0.png";

// ---------- matriz do run ----------
const STRENGTHS = [42, 100, 180, 300, 500]; // 42 = baseline provado; resto = range inexplorado
const SEEDS = [5, 33];                       // 2 seeds p/ separar sorte-de-seed do efeito do strength
// + 1 controle: init full-frame (OPEN128 reproduzível) em strength 42, seed 48

const DESC =
  "full body medieval foot-soldier knight, realistic slender human proportions, " +
  "small head about one third of body height, standing idle facing south, " +
  "both armored boots fully visible at the bottom, bearded face visible under an open nasal helmet, " +
  "steel plate armor over chainmail, both arms relaxed down at the sides, empty hands, " +
  "greyscale monochrome iron and steel, clean pixel art, black outline";
const NEG =
  "chibi, big head, large head, super deformed, stubby, cropped, feet cut off, closed helmet, " +
  "full-face helm, visor down, faceplate, sword, weapon, shield, cape, cloak, " +
  "red, brown, gold, color, saturated, photorealistic, smooth gradient, blurry";

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

// ---------- ops de imagem ----------
const px = (img, x, y) => ((y * img.w + x) << 2);
function bbox(img, thr = 20) {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (img.d[px(img, x, y) + 3] > thr) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
function crop(img, b) {
  const out = new Uint8ClampedArray(b.w * b.h * 4);
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    const s = px(img, b.x0 + x, b.y0 + y), di = (y * b.w + x) << 2;
    out[di] = img.d[s]; out[di + 1] = img.d[s + 1]; out[di + 2] = img.d[s + 2]; out[di + 3] = img.d[s + 3];
  }
  return { w: b.w, h: b.h, d: out };
}
function greyscale(img) {
  const out = new Uint8ClampedArray(img.d.length);
  for (let i = 0; i < img.d.length; i += 4) {
    const l = Math.round(0.299 * img.d[i] + 0.587 * img.d[i + 1] + 0.114 * img.d[i + 2]);
    out[i] = out[i + 1] = out[i + 2] = l; out[i + 3] = img.d[i + 3];
  }
  return { w: img.w, h: img.h, d: out };
}
function scaleNearest(img, dw, dh) {
  const out = new Uint8ClampedArray(dw * dh * 4);
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const sx = Math.min(img.w - 1, Math.floor((x * img.w) / dw)), sy = Math.min(img.h - 1, Math.floor((y * img.h) / dh));
    const s = px(img, sx, sy), di = (y * dw + x) << 2;
    out[di] = img.d[s]; out[di + 1] = img.d[s + 1]; out[di + 2] = img.d[s + 2]; out[di + 3] = img.d[s + 3];
  }
  return { w: dw, h: dh, d: out };
}
function blankCanvas(w, h) { return { w, h, d: new Uint8ClampedArray(w * h * 4) }; }
function paste(dst, src, ox, oy) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const dx = ox + x, dy = oy + y;
    if (dx < 0 || dy < 0 || dx >= dst.w || dy >= dst.h) continue;
    const s = px(src, x, y); if (src.d[s + 3] === 0) continue;
    const di = px(dst, dx, dy);
    dst.d[di] = src.d[s]; dst.d[di + 1] = src.d[s + 1]; dst.d[di + 2] = src.d[s + 2]; dst.d[di + 3] = src.d[s + 3];
  }
}
// monta init: figura cropada → greyscale → escala p/ altura figH → cola centrada em 128, topo=topY
function buildInit(srcImg, figH, topY) {
  const b = bbox(srcImg);
  const fig = greyscale(crop(srcImg, b));
  const figW = Math.round((fig.w * figH) / fig.h);
  const scaled = scaleNearest(fig, figW, figH);
  const canvas = blankCanvas(128, 128);
  paste(canvas, scaled, Math.round((128 - figW) / 2), topY);
  return canvas;
}

// ---------- API ----------
async function balance() { const r = await fetch(`${BASE}/balance`, { headers: H }); const j = await r.json(); return j?.subscription?.generations ?? "?"; }
async function pixflux({ init, strength, seed }) {
  const body = {
    description: DESC,
    negative_description: NEG,
    image_size: { width: 128, height: 128 },
    text_guidance_scale: 11,
    view: "low top-down",
    direction: "south",
    outline: "single color black outline",
    shading: "medium shading",
    detail: "highly detailed",
    no_background: true,
    seed,
    init_image: { type: "base64", base64: Buffer.from(png(init.w, init.h, init.d)).toString("base64"), format: "png" },
    init_image_strength: strength,
  };
  const r = await fetch(`${BASE}/create-image-pixflux`, { method: "POST", headers: H, body: JSON.stringify(body) });
  const txt = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt.slice(0, 300)}`);
  const j = JSON.parse(txt);
  const b64 = j?.image?.base64; if (!b64) throw new Error(`sem image no retorno: ${txt.slice(0, 200)}`);
  return { img: decodePng(Buffer.from(b64, "base64")), usd: j?.usage?.usd ?? null };
}

// ---------- main ----------
async function main() {
  mkdirSync(OUT, { recursive: true });
  const placa = decodePng(readFileSync(PLACA));
  const canon = decodePng(readFileSync(CANON));

  const initCal = buildInit(placa, 92, 18);   // moldura CAL: figura 92px, margem de pé
  const initFull = buildInit(placa, 120, 4);  // controle: quase enche o quadro (OPEN128)
  writeFileSync(join(OUT, "_init-cal.png"), png(initCal.w, initCal.h, initCal.d));
  writeFileSync(join(OUT, "_init-full.png"), png(initFull.w, initFull.h, initFull.d));
  // versões @160 dos inits p/ ver fácil no Explorer
  const c160 = scaleNearest(initCal, 160, 160), f160 = scaleNearest(initFull, 160, 160);
  writeFileSync(join(OUT, "@160__init-cal.png"), png(160, 160, c160.d));
  writeFileSync(join(OUT, "@160__init-full.png"), png(160, 160, f160.d));
  console.log(`[init] montados → ${OUT}/_init-cal.png e _init-full.png (+@160)`);

  if (process.argv.includes("--init-only")) { console.log("[init-only] parando antes da API (custo 0)."); return; }

  const before = await balance();
  console.log(`[balance] antes: ${before}`);

  const jobs = [];
  for (const s of STRENGTHS) for (const seed of SEEDS) jobs.push({ tag: `cal_s${s}_seed${seed}`, init: initCal, strength: s, seed });
  jobs.push({ tag: `ctrl-full_s42_seed48`, init: initFull, strength: 42, seed: 48 }); // controle OPEN128

  const results = [];
  let totUsd = 0;
  for (const job of jobs) {
    try {
      const { img, usd } = await pixflux(job);
      if (usd != null) totUsd += usd;
      writeFileSync(join(OUT, `${job.tag}.png`), png(img.w, img.h, img.d));
      const big = scaleNearest(img, 160, 160);
      writeFileSync(join(OUT, `@160__${job.tag}.png`), png(160, 160, big.d));
      results.push({ ...job, ok: true, big });
      console.log(`[ok] ${job.tag} (${img.w}x${img.h}${usd != null ? `, $${usd}` : ""})`);
    } catch (e) {
      results.push({ ...job, ok: false, err: String(e.message || e) });
      console.error(`[FALHA] ${job.tag}: ${e.message || e}`);
    }
  }

  // sheet: linha por seed; col0 = canônico; depois full-ctrl + strengths
  const canon160 = scaleNearest(canon, 160, 160);
  const cols = ["canon", "ctrl-full_s42_seed48", ...STRENGTHS.map((s) => `cal_s${s}`)];
  const rows = SEEDS;
  const sheetW = cols.length * 160, sheetH = rows.length * 160;
  const sheet = blankCanvas(sheetW, sheetH);
  rows.forEach((seed, ri) => {
    cols.forEach((col, ci) => {
      let tile = null;
      if (col === "canon") tile = canon160;
      else if (col === "ctrl-full_s42_seed48") { const r = results.find((x) => x.tag === "ctrl-full_s42_seed48"); tile = r?.big; }
      else { const r = results.find((x) => x.tag === `${col}_seed${seed}`); tile = r?.big; }
      if (tile) paste(sheet, tile, ci * 160, ri * 160);
    });
  });
  writeFileSync(join(OUT, "_SHEET.png"), png(sheetW, sheetH, sheet.d));

  const after = await balance();
  const cost = (typeof before === "number" && typeof after === "number") ? before - after : "?";
  const okN = results.filter((r) => r.ok).length;

  const md = [
    `# Run noturno knight — varredura de init_image_strength`,
    ``,
    `Gerado pelo \`tools/gen-char-overnight.mjs\`. Hipótese: moldura CAL conserta o pé; strength real é 1–999 (default 300), não 0–100.`,
    ``,
    `- **Custo:** ${cost} gerações · ~$${totUsd.toFixed(3)} · saldo ${before} → ${after}`,
    `- **Sucesso:** ${okN}/${results.length}`,
    ``,
    `## Como ler o _SHEET.png`,
    `- Colunas: \`canônico | ctrl-full(s42) | cal_s42 | cal_s100 | cal_s180 | cal_s300 | cal_s500\``,
    `- Linhas: seed ${SEEDS.join(", ")}`,
    `- Col 0 = knight canônico (referência de PROPORÇÃO — compare cabeça:corpo no olho).`,
    ``,
    `## O que procurar`,
    `1. **Pé no quadro?** A moldura CAL (margem de pé) deveria preservar o pé. Compare com ctrl-full (deve cortar/encostar no fundo).`,
    `2. **Proporção** — strength baixo (42) = prompt domina, pode chibi/driftar; strength alto = init domina, proporção esguia trava.`,
    `3. **Gear voltando** — a placa tem espada+escudo. Em algum strength eles VOLTAM (greyscale). O strength usável é ABAIXO desse limiar.`,
    `4. O sweet spot = maior strength que ainda tem mãos vazias + rosto aberto + pé + proporção esguia.`,
    ``,
    `## Resultados`,
    ...results.map((r) => `- \`${r.tag}\` — ${r.ok ? "ok" : "FALHA: " + r.err}`),
  ].join("\n");
  writeFileSync(join(OUT, "_RESULTADO.md"), md);

  console.log(`\n[fim] ${okN}/${results.length} ok · custo ${cost} gens · ~$${totUsd.toFixed(3)} · saldo ${before}→${after}`);
  console.log(`[saída] ${OUT}  (abra _SHEET.png e _RESULTADO.md)`);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
