#!/usr/bin/env node
// Passo 2 da receita de criatura: 8 ROTAÇÕES via /create-character-v3, usando o
// estático canônico aprovado como reference_image (sul). 1 chamada = 8 direções.
// Async → poll /background-jobs/{id}. Salva os frames crus em rot-XX.png + dump
// da resposta (_v3raw.json) p/ inspeção; guarda character_id (zip export é grátis).
// Sonda /balance antes/depois.
//
// Uso: node tools/gen-mob-rotations.mjs <species>   (ex: esqueleto)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BASE = "https://api.pixellab.ai/v2";
const KEY = readFileSync(join(homedir(), ".pixellab_key"), "utf8").trim();
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const VOCAB = "dark medieval fantasy, black outline, cold desaturated tones, warm light accents, readable silhouette, low top-down";

// descrição por espécie (prompt + display name do v3)
const DESC = {
  esqueleto: `a humble undead skeleton monster, bare bipedal humanoid skeleton, gaunt pale weathered bone, readable skull and ribcage, hollow eye sockets, stocky chibi humanoid proportions, entry-level undead, no armor no weapon, ${VOCAB}`,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function balance() { const r = await fetch(`${BASE}/balance`, { headers: H }); return (await r.json())?.subscription?.generations ?? "?"; }

function collectImages(j) {
  const out = [];
  const visit = (v) => {
    if (!v) return;
    if (typeof v === "string" && v.length > 200 && /^[A-Za-z0-9+/=]+$/.test(v.slice(0, 50))) { out.push(v); return; }
    if (Array.isArray(v)) { v.forEach(visit); return; }
    if (typeof v === "object") { if (v.base64) { out.push(v.base64); return; } for (const k of Object.keys(v)) visit(v[k]); }
  };
  visit(j);
  return [...new Set(out)];
}

async function main() {
  const sp = process.argv[2] || "esqueleto";
  const dir = join("design", "pixellab-candidatos", "mobs", sp);
  const refPath = join(dir, `aprovado-${sp}.png`);
  const ref = readFileSync(refPath); // canônico recém-escrito (legível)
  const desc = DESC[sp];
  if (!desc) throw new Error(`sem descrição p/ "${sp}"`);

  const before = await balance();
  console.log(`[balance] antes: ${before}`);

  const body = {
    description: desc,
    reference_image: { type: "base64", base64: ref.toString("base64"), format: "png" },
    image_size: { width: 64, height: 64 }, // advisory em modo referência
    view: "low top-down",
    template_id: "mannequin", // humanoide
    seed: 71,
    no_background: true,
  };
  console.log(`[gen] POST /create-character-v3 "${sp}"…`);
  const r = await fetch(`${BASE}/create-character-v3`, { method: "POST", headers: H, body: JSON.stringify(body) });
  const txt = await r.text();
  if (!r.ok && r.status !== 202) { console.error(`[erro] HTTP ${r.status}: ${txt.slice(0, 800)}`); process.exit(1); }
  const j0 = JSON.parse(txt);
  const jobId = j0.background_job_id, charId = j0.character_id;
  console.log(`[ok] job=${jobId} character=${charId} status=${j0.status}`);
  writeFileSync(join(dir, "_v3_meta.json"), JSON.stringify({ jobId, charId, created: j0 }, null, 1));

  let j, images = [];
  for (let i = 1; i <= 90; i++) {
    await sleep(6000);
    const g = await fetch(`${BASE}/background-jobs/${jobId}`, { headers: H });
    j = await g.json();
    images = collectImages(j.last_response ?? j);
    process.stdout.write(`\r[poll ${i}] imgs=${images.length} status=${j.status || "?"}   `);
    if (j.status === "completed" || j.status === "success" || images.length >= 8) break;
    if (j.status === "failed") { console.error("\nFALHOU:", JSON.stringify(j).slice(0, 400)); break; }
  }
  console.log();

  writeFileSync(join(dir, "_v3raw.json"), JSON.stringify(j, null, 1).slice(0, 200000));
  if (images.length) {
    mkdirSync(dir, { recursive: true });
    images.forEach((b64, i) => writeFileSync(join(dir, `rot-${String(i).padStart(2, "0")}.png`), Buffer.from(b64, "base64")));
    console.log(`[salvo] ${images.length} frames → ${dir}/rot-XX.png`);
  } else {
    console.log(`[i] sem imagens inline na resposta — usar zip export: GET /characters/${charId}/zip (grátis). Dump em _v3raw.json (keys: ${Object.keys(j || {})})`);
  }
  const after = await balance();
  console.log(`[balance] depois: ${after} · [CUSTO] ${before - after} gerações`);
}

main().catch((e) => { console.error(e); process.exit(1); });
