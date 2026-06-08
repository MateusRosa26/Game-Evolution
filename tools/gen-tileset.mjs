#!/usr/bin/env node
// Gera um tileset Wang top-down via PixelLab /create-tileset (async) e salva os
// 16 tiles no padrão do repo: wang-<NW><NE><SW><SE>.png (lower=0, upper=1).
// Sonda /balance antes/depois (regra dura de orçamento da skill diretor-de-arte).
//
// Uso: node tools/gen-tileset.mjs <spec> [outName]
//   <spec>: chave em SPECS abaixo (ex. "grass-dirt-v3")
//   [outName]: pasta de saída (default = <spec>) em design/pixellab-candidatos/tiles/

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BASE = "https://api.pixellab.ai/v2";
const KEY = readFileSync(join(homedir(), ".pixellab_key"), "utf8").trim();
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const SHARED = {
  tile_size: { width: 32, height: 32 },
  view: "high top-down",
  detail: "highly detailed",
  shading: "detailed shading",
  outline: "selective outline",
};

// refs: caminhos de PNG → convertidos em Base64Image no envio
const img = (path) => ({ __ref: path });

const SPECS = {
  // v2 do topo do muro: blocos GRANDES de cantaria (ashlar), musgo, mais contraste,
  // menos rigidez de grid (tile_strength baixo) — atacar o "grid pequeno uniforme".
  "muro-topo-v2": {
    lower_description:
      "top-down surface of a few LARGE ancient ashlar stone blocks seen from straight above, big weathered grey granite slabs with strong light-to-shadow variation, deep dark joints between large stones, thick patches of dark green moss, crumbling weathered masonry, seamless, dark medieval fantasy, flat top view, no perspective, large blocks not small bricks",
    upper_description:
      "top-down surface of a few LARGE ancient ashlar stone blocks seen from straight above, big lit grey granite slabs with bright tops and deep shadowed joints, moss creeping in the cracks, weathered castle rampart stone, seamless, dark medieval fantasy, flat top view, no perspective, large blocks not small bricks",
    transition_description: "irregular mix of large weathered granite slabs, some mossy some bare",
    transition_size: 0,
    text_guidance_scale: 8,
    tile_strength: 0.65,
    seed: 23,
  },
  // pedra do TOPO do muro: superfície tileável vista de cima (granito cortado).
  // lower/upper = duas variações de pedra → tile seamless com nuance interna.
  "muro-topo": {
    lower_description:
      "top-down surface of dark cold grey granite blocks seen from directly above, weathered cut stone with deep shadowed joints and patches of dark green moss, hand-laid masonry, seamless, dark medieval fantasy, no perspective, flat top view",
    upper_description:
      "top-down surface of lit weathered grey granite blocks seen from directly above, cut stone with subtle highlights on the block tops and mossy cracks in the joints, hand-laid masonry, seamless, dark medieval fantasy, no perspective, flat top view",
    transition_description: "irregular mix of darker and lighter weathered granite blocks",
    transition_size: 0,
    text_guidance_scale: 8,
    seed: 11,
  },
  // v4: trava grama v3 (lower_ref) + ancora terra granular antiga (upper_ref) p/ matar o "tijolo"
  "grass-dirt-v4": {
    lower_description:
      "top-down ground tile of dark woodland grass, cold desaturated deep green, irregular natural clumps and patches of varied green tones from shadow to soft highlight, scattered tiny grey pebbles and a few muted wildflowers, organic random texture, seamless, dark medieval fantasy, no stripes, no straight lines",
    upper_description:
      "top-down ground tile of bare uneven earth, warm desaturated muddy brown, mottled natural soil with scattered loose rocks and random hairline cracks, patchy dark and light dirt, organic random texture, seamless, dark medieval fantasy, no bricks, no cobbles, no planks, no wood, no stripes, no repeating pattern, no grid",
    transition_description:
      "natural irregular border where grass thins into bare earth, scattered grass tufts spilling onto the soil",
    transition_size: 0,
    text_guidance_scale: 8,
    seed: 42,
    lower_reference_image: img("design/pixellab-candidatos/tiles/grass-dirt-v3/wang-0000.png"),
    upper_reference_image: img("src/client/assets/img/tiles/grass-dirt/wang-1111.png"),
  },
  // v3: anti-listra (terra virou tábua na v2) + grama com clusters reais
  "grass-dirt-v3": {
    lower_description:
      "top-down ground tile of dark woodland grass, cold desaturated deep green, irregular natural clumps and patches of varied green tones from shadow to soft highlight, scattered tiny grey pebbles and a few muted wildflowers, organic random texture, seamless, dark medieval fantasy, no stripes, no straight lines",
    upper_description:
      "top-down ground tile of bare trampled earth, warm desaturated muddy brown, irregular granular soil with scattered small rocks and random hairline cracks, patchy darker and lighter dirt, organic random texture, seamless, dark medieval fantasy, no planks, no wood, no stripes, no straight lines, no grid",
    transition_description:
      "natural irregular border where grass thins into bare earth, scattered grass tufts spilling onto the soil",
    transition_size: 0,
    text_guidance_scale: 9,
    seed: 42,
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function balance() {
  const r = await fetch(`${BASE}/balance`, { headers: H });
  const j = await r.json();
  return j?.subscription?.generations ?? "?";
}

async function main() {
  const specName = process.argv[2] || "grass-dirt-v3";
  const outName = process.argv[3] || specName;
  const spec = SPECS[specName];
  if (!spec) throw new Error(`sem spec "${specName}" — adicione em SPECS`);

  const before = await balance();
  console.log(`[balance] antes: ${before}`);

  const body = { ...SHARED, ...spec };
  // converte refs {__ref:path} → Base64Image
  for (const k of ["lower_reference_image", "upper_reference_image", "transition_reference_image", "color_image"]) {
    if (body[k]?.__ref) {
      body[k] = { type: "base64", base64: readFileSync(body[k].__ref).toString("base64"), format: "png" };
      console.log(`[ref] ${k} ← ${spec[k].__ref}`);
    }
  }
  console.log(`[gen] POST /create-tileset "${specName}" (${body.tile_size.width}px, guidance ${body.text_guidance_scale}, seed ${body.seed})…`);
  const r = await fetch(`${BASE}/create-tileset`, { method: "POST", headers: H, body: JSON.stringify(body) });
  if (r.status !== 202 && !r.ok) {
    console.error(`[erro] HTTP ${r.status}: ${(await r.text()).slice(0, 500)}`);
    process.exit(1);
  }
  const { tileset_id } = await r.json();
  console.log(`[job] tileset_id=${tileset_id} — poll…`);

  let ts = null;
  for (let i = 1; i <= 50; i++) {
    await sleep(6000);
    const g = await fetch(`${BASE}/tilesets/${tileset_id}`, { headers: H });
    const j = await g.json();
    const cand = j.tileset || j;
    const n = (cand.tiles || []).length;
    process.stdout.write(`\r[poll ${i}] tiles=${n}   `);
    if (n > 0) { ts = cand; break; }
    if ((j.status || cand.status) === "failed") { console.error("\nFALHOU:", JSON.stringify(j).slice(0, 300)); process.exit(1); }
  }
  console.log();
  if (!ts) throw new Error("timeout no poll");

  const outDir = join("design", "pixellab-candidatos", "tiles", outName);
  mkdirSync(outDir, { recursive: true });
  const bit = (c) => (c === "upper" ? "1" : "0");
  for (const t of ts.tiles) {
    const c = t.corners;
    const code = `${bit(c.NW)}${bit(c.NE)}${bit(c.SW)}${bit(c.SE)}`;
    writeFileSync(join(outDir, `wang-${code}.png`), Buffer.from(t.image.base64 || t.image, "base64"));
  }
  console.log(`[salvo] ${ts.tiles.length} PNGs → ${outDir}/`);

  const after = await balance();
  console.log(`[balance] depois: ${after} · [CUSTO] ${before - after} gerações`);
}

main().catch((e) => { console.error(e); process.exit(1); });
