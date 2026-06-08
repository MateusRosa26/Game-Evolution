#!/usr/bin/env node
// Gera candidatos de objeto/estrutura via PixelLab /generate-with-style-v2.
// Sonda /balance antes/depois. Salva a grade de variações em candidatos.
//
// Uso: node tools/gen-object.mjs <spec>
//   <spec>: chave em SPECS (ex. "muralha")

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BASE = "https://api.pixellab.ai/v2";
const KEY = readFileSync(join(homedir(), ".pixellab_key"), "utf8").trim();
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const VOCAB = "dark medieval fantasy, black outline, cold desaturated tones, warm light accents, readable silhouette, low top-down";

// refs de estilo (assets aprovados) — âncora de coerência
const STYLE_REFS = ["src/client/assets/img/scenery/tree1.png", "src/client/assets/img/scenery/tree2.png"];

const SPECS = {
  muralha: {
    description: `top-down stone city rampart wall section seen from a low top-down angle, weathered grey granite blocks with visible top surface and a darker south-facing front face, irregular hand-laid stones with cracks and patches of green moss, a lit wooden wall torch in an iron sconce, a few strands of ivy creeping up, ${VOCAB}`,
    image_size: { width: 96, height: 96 },
    seed: 7,
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function balance() { const r = await fetch(`${BASE}/balance`, { headers: H }); return (await r.json())?.subscription?.generations ?? "?"; }
function styleImg(path) {
  const b = readFileSync(path);
  return { image: { type: "base64", base64: b.toString("base64"), format: "png" }, width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

async function main() {
  const name = process.argv[2] || "muralha";
  const spec = SPECS[name];
  if (!spec) throw new Error(`sem spec "${name}"`);

  const before = await balance();
  console.log(`[balance] antes: ${before}`);

  const body = {
    style_images: STYLE_REFS.map(styleImg),
    description: spec.description,
    image_size: spec.image_size,
    seed: spec.seed,
    no_background: true,
  };
  console.log(`[gen] POST /generate-with-style-v2 "${name}" (${body.image_size.width}x${body.image_size.height})…`);
  const r = await fetch(`${BASE}/generate-with-style-v2`, { method: "POST", headers: H, body: JSON.stringify(body) });
  const txt = await r.text();
  if (r.status !== 202 && !r.ok) { console.error(`[erro] HTTP ${r.status}: ${txt.slice(0, 600)}`); process.exit(1); }

  let j = JSON.parse(txt);
  // async? então tem id pra poll
  const jobId = j.background_job_id || j.id || j.generation_id;
  const dir = join("design", "pixellab-candidatos", "structures", name);
  mkdirSync(dir, { recursive: true });

  // tenta extrair imagens da resposta direta; se async, poll
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

// procura base64 de imagem em formatos variados de resposta
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
