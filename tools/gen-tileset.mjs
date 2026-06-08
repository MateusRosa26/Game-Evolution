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
  // ── SUBSOLO / ESGOTOS (SISTEMA-ANDARES) — substituem os placeholders procedurais ──
  // Chão de esgoto v4 — ORGÂNICO de verdade (v3 ancorado na muralha ficou tijolo).
  // Terra batida + pedras quebradas espalhadas, SEM grade; ancorado na CAVERNA
  // (orgânica) pra herdar a irregularidade — e barato (âncora).
  "esgoto-chao": {
    lower_description:
      "top-down tile of an old worn dungeon floor seen from directly straight above, packed dark grey dirt and grime with scattered broken irregular grey stones, rubble and pebbles of different sizes pressed unevenly into the ground, cracks and patches of dark moss, chaotic natural worn organic surface, NOT bricks, NOT a grid, NOT flagstones in rows, detailed dithered pixel art, high contrast, dark medieval dungeon, flat top view, no perspective, textured not smooth, no green",
    upper_description:
      "top-down tile of an old worn dungeon floor seen from straight above, packed dark grey dirt with scattered lit broken stones and rubble of varied sizes and dark shadowed gaps, chaotic worn organic surface, NOT bricks, NOT a grid, detailed dithered pixel art, high contrast, dark medieval dungeon, flat top view, no perspective, textured not smooth, no green",
    transition_description: "chaotic organic mix of packed grey dirt, scattered broken stones, rubble and grime",
    transition_size: 0,
    text_guidance_scale: 6,
    tile_strength: 0.5,
    seed: 121,
    lower_reference_image: img("design/pixellab-candidatos/tiles/cave-grey-ref.png"),
    upper_reference_image: img("design/pixellab-candidatos/tiles/cave-grey-ref.png"),
  },
  // Parede de esgoto — MATERIAL de pedra cinza escuro irregular (junta preta,
  // musgo), ancorado na muralha da cidade (coerência + controle de custo).
  "esgoto-parede": {
    lower_description:
      "top-down view of a rough dark grey stone dungeon wall surface seen from directly above, irregular cold grey granite blocks of varied sizes laid as rough heavy masonry with deep black mortar gaps, mossy weathered cracked cut stone, not a neat grid, detailed hand-crafted pixel art with dithering and strong dark shadow in the joints, high contrast, dark medieval dungeon wall, flat top view, no perspective, textured not smooth, no green, no brown",
    upper_description:
      "top-down view of a rough dark grey stone dungeon wall surface seen from above, irregular lit cold grey granite blocks with highlights on the stone and deep black mossy mortar gaps, weathered cracked cut stone, detailed dithered pixel art, high contrast, dark medieval dungeon wall, flat top view, no perspective, textured not smooth, no green",
    transition_description: "rough irregular mix of mossy weathered and bare dark grey wall stones with deep black joints",
    transition_size: 0,
    text_guidance_scale: 8,
    tile_strength: 0.6,
    seed: 105,
    lower_reference_image: img("design/pixellab-candidatos/tiles/muralha-ref.png"),
    upper_reference_image: img("design/pixellab-candidatos/tiles/muralha-ref.png"),
  },
  // Água servida — ESCURA e suja (verde-preto), nunca verde-néon. Animada por código.
  "esgoto-agua": {
    lower_description:
      "top-down tile of dark murky stagnant sewer water seen from directly straight above, deep desaturated greenish-black filthy water with a faint dim oily sheen and bits of floating grime and scum, very dark and dirty, detailed pixel art with subtle dithering, dark medieval dungeon, flat top view, no perspective, no bright colors, no neon, not smooth, dark",
    upper_description:
      "top-down tile of dark murky stagnant sewer water seen from straight above, deep greenish-black filthy water with faint dim reflections and gentle ripples on the dirty surface, very dark, detailed dithered pixel art, dark medieval dungeon, flat top view, no perspective, no bright colors, dark",
    transition_description: "subtle gentle ripples and scum in dark filthy greenish-black water",
    transition_size: 0,
    text_guidance_scale: 7,
    tile_strength: 0.45,
    seed: 94,
    lower_reference_image: img("design/pixellab-candidatos/tiles/muralha-ref.png"),
    upper_reference_image: img("design/pixellab-candidatos/tiles/muralha-ref.png"),
  },
  // Chão de caverna v3: ANCORADO na terra do grass-dirt (marrom coerente, já
  // tileável) + prompt de rocha da v1 (que deu a boa rocha quebrada) +
  // tile_strength 0.6 pra quebrar a repetição do rabisco da v1.
  "caverna-chao": {
    lower_description:
      "top-down floor of a natural underground cavern seen from directly above, rough uneven bare rock and packed earth, cold dark grey-brown stone with cracks scattered loose pebbles and rubble, organic irregular natural surface, seamless, dark medieval fantasy, flat top view, no perspective, no bricks, no tiles, no straight lines, no grid",
    upper_description:
      "top-down floor of a natural underground cavern seen from directly above, rough lit rock and packed earth with subtle highlights on raised stone and dark crevices, scattered rubble and pebbles, organic irregular natural surface, seamless, dark medieval fantasy, flat top view, no perspective, no bricks, no grid, no straight lines",
    transition_description: "natural irregular mix of bare rock and packed dirt with scattered pebbles and rubble",
    transition_size: 0,
    text_guidance_scale: 8,
    tile_strength: 0.6,
    seed: 71,
    lower_reference_image: img("src/client/assets/img/tiles/grass-dirt/wang-1111.png"),
    upper_reference_image: img("src/client/assets/img/tiles/grass-dirt/wang-1111.png"),
  },
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
