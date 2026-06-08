#!/usr/bin/env node
// Gera candidatos de SPRITE DE ITEM via PixelLab /generate-with-style-v2.
// Modelo Tibia: 1 sprite por item (chão + inventário). Gera a 64px (barato),
// reduz p/ 32px no uso. Sonda /balance antes/depois. 1 chamada = grade de variações.
//
// Uso: node tools/gen-item.mjs <spec>   (rode UM por vez — é a sonda)
//   <spec>: chave em SPECS (ex. "espada-cega")

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BASE = "https://api.pixellab.ai/v2";
const KEY = readFileSync(join(homedir(), ".pixellab_key"), "utf8").trim();
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const VOCAB =
  "dark medieval fantasy, black outline, cold desaturated tones, warm light accents, readable silhouette";
// item-specific: objeto único, centrado, fundo transparente, sem personagem/mão/cenário
const ITEM = "single game item sprite, inventory icon, one object centered, slight top-down three-quarter angle, on transparent background, no character, no hands, no background scenery, common worn modest";

// âncora de coerência: knight (metal/couro) + árvore (peso de outline/render)
const STYLE_REFS = [
  "src/client/assets/img/chars/knight/walk/s0.png",
  "src/client/assets/img/scenery/tree2.png",
];

const SPECS = {
  "espada-cega": {
    description: `a worn old short sword, dull notched steel blade, plain leather-wrapped grip, simple iron crossguard, modest beginner weapon, ${ITEM}, ${VOCAB}`,
    seed: 11,
  },
  "gibao-roto": {
    description: `a tattered cloth-and-leather gambeson jerkin chest armor, frayed edges, patched, faded brown and grey, humble peasant armor, ${ITEM}, ${VOCAB}`,
    seed: 12,
  },
  "botas-surradas": {
    description: `a pair of worn leather boots, scuffed cracked brown leather, simple laces, old and modest, ${ITEM}, ${VOCAB}`,
    seed: 13,
  },
  "sacola-pano": {
    description: `a small simple cloth drawstring bag pouch, coarse beige fabric, tied with a cord, humble container, ${ITEM}, ${VOCAB}`,
    seed: 14,
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function balance() { const r = await fetch(`${BASE}/balance`, { headers: H }); return (await r.json())?.subscription?.generations ?? "?"; }
function styleImg(path) {
  const b = readFileSync(path);
  return { image: { type: "base64", base64: b.toString("base64"), format: "png" }, width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

async function main() {
  const name = process.argv[2] || "espada-cega";
  const spec = SPECS[name];
  if (!spec) throw new Error(`sem spec "${name}" — opções: ${Object.keys(SPECS).join(", ")}`);

  const before = await balance();
  console.log(`[balance] antes: ${before}`);

  const body = {
    style_images: STYLE_REFS.map(styleImg),
    description: spec.description,
    image_size: { width: spec.size ?? 96, height: spec.size ?? 96 }, // 96px ≈ ~10 gens (custo ∝ 1/tamanho²); 32px final via downscale
    seed: spec.seed,
    no_background: true,
  };
  console.log(`[gen] POST /generate-with-style-v2 "${name}" (${body.image_size.width}x${body.image_size.height})…`);
  const r = await fetch(`${BASE}/generate-with-style-v2`, { method: "POST", headers: H, body: JSON.stringify(body) });
  const txt = await r.text();
  if (r.status !== 202 && !r.ok) { console.error(`[erro] HTTP ${r.status}: ${txt.slice(0, 600)}`); process.exit(1); }

  let j = JSON.parse(txt);
  const jobId = j.background_job_id || j.id || j.generation_id;
  const dir = join("design", "pixellab-candidatos", "items", name);
  mkdirSync(dir, { recursive: true });

  let images = collectImages(j);
  if (!images.length && jobId) {
    console.log(`[job] ${jobId} — poll…`);
    for (let i = 1; i <= 50; i++) {
      await sleep(6000);
      const g = await fetch(`${BASE}/background-jobs/${jobId}`, { headers: H });
      j = await g.json();
      images = collectImages(j.last_response ?? j);
      process.stdout.write(`\r[poll ${i}] imgs=${images.length} status=${j.status || "?"}   `);
      if (images.length) break;
      if (j.status === "failed") { console.error("\nFALHOU:", JSON.stringify(j).slice(0, 300)); break; }
    }
    console.log();
  }

  if (!images.length) {
    writeFileSync(join(dir, "_raw.json"), JSON.stringify(j, null, 1));
    console.log(`[?] sem imagens reconhecidas — dump em ${dir}/_raw.json (keys: ${Object.keys(j)})`);
  } else {
    images.forEach((b64, i) => writeFileSync(join(dir, `cand-${String(i).padStart(2, "0")}.png`), Buffer.from(b64, "base64")));
    console.log(`[salvo] ${images.length} candidatos → ${dir}/`);
  }
  const after = await balance();
  console.log(`[balance] depois: ${after} · [CUSTO] ${before - after} gerações`);
}

function collectImages(j) {
  const out = [];
  const visit = (v) => {
    if (!v) return;
    if (typeof v === "string" && v.length > 200 && /^[A-Za-z0-9+/=]+$/.test(v.slice(0, 50))) { out.push(v); return; }
    if (Array.isArray(v)) { v.forEach(visit); return; }
    if (typeof v === "object") {
      if (v.base64) { out.push(v.base64); return; }
      for (const k of Object.keys(v)) visit(v[k]);
    }
  };
  visit(j.images || j.image || j.results || j.output || j);
  return [...new Set(out)];
}

main().catch((e) => { console.error(e); process.exit(1); });
