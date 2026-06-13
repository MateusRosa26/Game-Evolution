#!/usr/bin/env node
// Gera candidatos ESTÁTICOS de mob (frame sul/idle) via /create-image-pixflux — UMA imagem
// por chamada (~1 geração). Substitui o gen-mob.mjs (que usava /generate-with-style-v2 = PROIBIDO:
// grid de 16 ≈ 20 gens + char lavado). N candidatos = N chamadas com seeds diferentes.
// Remaster 128px: canvas 128×128 nativo. Sonda /balance antes/depois e reporta o custo real.
//
// Uso: node tools/gen-mob-pixflux.mjs <spec> <n>   (n = quantos candidatos; rode 1 primeiro)

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BASE = "https://api.pixellab.ai/v2";
const KEY = readFileSync(join(homedir(), ".pixellab_key"), "utf8").trim();
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const VOCAB =
  "dark medieval fantasy, black outline, cold desaturated tones, warm light accents, readable silhouette, low top-down";
const MOB =
  "single creature monster sprite, one creature centered, full body, low top-down three-quarter view facing the viewer south, grounded, transparent background, no scenery, no ground, not cute, not cartoonish, not chibi";

const SPECS = {
  aranha: {
    description:
      `a humble cave sewer spider monster, a large bristly arthropod with a bulbous segmented abdomen and eight angular legs splayed low across the ground, dark chitinous carapace, cold desaturated grey-green tones, a small cluster of faint warm amber eyes on the head, wet underground dweller, menacing but small entry-level T2 creature, arthropod on all fours seen from above, ${MOB}, ${VOCAB}`,
    seed: 4021,
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function balance() {
  const r = await fetch(`${BASE}/balance`, { headers: H });
  return (await r.json())?.subscription?.generations ?? "?";
}

async function pixflux(desc, seed) {
  const body = {
    description: desc,
    image_size: { width: 128, height: 128 },
    text_guidance_scale: 9,
    no_background: true,
    seed,
  };
  const r = await fetch(`${BASE}/create-image-pixflux`, { method: "POST", headers: H, body: JSON.stringify(body) });
  const txt = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt.slice(0, 400)}`);
  let j = JSON.parse(txt);
  let b64 = j?.image?.base64;
  // alguns endpoints voltam async
  if (!b64 && j?.background_job_id) {
    for (let i = 0; i < 60; i++) {
      await sleep(5000);
      j = await (await fetch(`${BASE}/background-jobs/${j.background_job_id}`, { headers: H })).json();
      b64 = (j.last_response ?? j)?.image?.base64;
      if (b64 || j.status === "failed") break;
    }
  }
  if (!b64) throw new Error("sem imagem na resposta: " + JSON.stringify(j).slice(0, 300));
  return b64;
}

async function main() {
  const name = process.argv[2] || "aranha";
  const n = parseInt(process.argv[3] || "1", 10);
  const spec = SPECS[name];
  if (!spec) throw new Error(`sem spec "${name}" — opções: ${Object.keys(SPECS).join(", ")}`);

  const dir = join("design", "pixellab-candidatos", "mobs", name, "gen");
  mkdirSync(dir, { recursive: true });

  const before = await balance();
  console.log(`[balance] antes: ${before}`);

  for (let i = 0; i < n; i++) {
    const seed = spec.seed + i * 137;
    process.stdout.write(`[gen ${i + 1}/${n}] pixflux 128x128 seed=${seed}… `);
    const b64 = await pixflux(spec.description, seed);
    const f = join(dir, `cand-${String(i).padStart(2, "0")}.png`);
    writeFileSync(f, Buffer.from(b64, "base64"));
    console.log(`✓ ${f}`);
  }

  const after = await balance();
  console.log(`[balance] depois: ${after} · [CUSTO REAL] ${before - after} gerações p/ ${n} candidato(s)`);
}

main().catch((e) => { console.error("ERRO:", e.message); process.exit(1); });
