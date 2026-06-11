#!/usr/bin/env node
// Gera candidatos ESTÁTICOS de mob (frame sul/idle) via PixelLab /generate-with-style-v2.
// É o passo 1 da receita de criatura (estático canônico → curadoria → char-v3 → anim).
// Style refs = mobs JÁ APROVADOS (coerência de família). Como o working tree fica em
// OneDrive (PNGs viram placeholder online-only ilegível), os refs são lidos do GIT (HEAD).
// 64px → grade de ~16 candidatos por ~20 gens. Sonda /balance antes/depois.
//
// Uso: node tools/gen-mob.mjs <spec>   (rode UM por vez)

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

const BASE = "https://api.pixellab.ai/v2";
const KEY = readFileSync(join(homedir(), ".pixellab_key"), "utf8").trim();
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const VOCAB =
  "dark medieval fantasy, black outline, cold desaturated tones, warm light accents, readable silhouette, low top-down";
// creature-specific: 1 monstro centrado, corpo inteiro, ¾ low top-down, fundo transparente
const MOB = "single creature monster sprite, one creature centered, full body, low top-down three-quarter view, facing the viewer south, grounded, on transparent background, no scenery, no items on ground";

// refs de coerência (lidos do git HEAD): goblin = âncora humanoide; rato = padrão-ouro de render; lobo = limpo
const STYLE_REFS = [
  "src/client/assets/img/mobs/goblin_batedor/s0.png",
  "src/client/assets/img/mobs/rato_lanhoso/s0.png",
  "src/client/assets/img/mobs/lobo_cinzento/s0.png",
];

const SPECS = {
  esqueleto: {
    description: `a humble undead skeleton monster, a bare bipedal humanoid skeleton standing on two bony legs, gaunt weathered pale bone, ribcage and skull clearly readable, hollow dark eye sockets with a faint warm ember glow, stocky chibi humanoid proportions like a small humanoid creature, entry-level undead, no armor no helmet no weapon, animated by dark magic, ${MOB}, ${VOCAB}`,
    seed: 71,
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function balance() { const r = await fetch(`${BASE}/balance`, { headers: H }); return (await r.json())?.subscription?.generations ?? "?"; }

// lê um PNG do working tree; se falhar (placeholder OneDrive), cai pro git HEAD
function styleImg(path) {
  let b;
  try { b = readFileSync(path); if (!b.length) throw new Error("vazio"); }
  catch { b = execSync(`git show HEAD:${path}`, { maxBuffer: 64 * 1024 * 1024 }); }
  return { image: { type: "base64", base64: b.toString("base64"), format: "png" }, width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

async function main() {
  const name = process.argv[2] || "esqueleto";
  const spec = SPECS[name];
  if (!spec) throw new Error(`sem spec "${name}" — opções: ${Object.keys(SPECS).join(", ")}`);

  const before = await balance();
  console.log(`[balance] antes: ${before}`);

  const body = {
    style_images: STYLE_REFS.map(styleImg),
    description: spec.description,
    image_size: { width: spec.size ?? 64, height: spec.size ?? 64 }, // 64px ≈ ~16 candidatos por ~20 gens
    seed: spec.seed,
    no_background: true,
  };
  console.log(`[gen] POST /generate-with-style-v2 "${name}" (${body.image_size.width}x${body.image_size.height})…`);
  const r = await fetch(`${BASE}/generate-with-style-v2`, { method: "POST", headers: H, body: JSON.stringify(body) });
  const txt = await r.text();
  if (r.status !== 202 && !r.ok) { console.error(`[erro] HTTP ${r.status}: ${txt.slice(0, 600)}`); process.exit(1); }

  let j = JSON.parse(txt);
  const jobId = j.background_job_id || j.id || j.generation_id;
  const dir = join("design", "pixellab-candidatos", "mobs", name);
  mkdirSync(dir, { recursive: true });

  let images = collectImages(j);
  if (!images.length && jobId) {
    console.log(`[job] ${jobId} — poll…`);
    for (let i = 1; i <= 60; i++) {
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
    console.log(`[?] sem imagens — dump em ${dir}/_raw.json (keys: ${Object.keys(j)})`);
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
    if (typeof v === "object") { if (v.base64) { out.push(v.base64); return; } for (const k of Object.keys(v)) visit(v[k]); }
  };
  visit(j.images || j.image || j.results || j.output || j);
  return [...new Set(out)];
}

main().catch((e) => { console.error(e); process.exit(1); });
