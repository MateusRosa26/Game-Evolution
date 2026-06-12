#!/usr/bin/env node
// 8 ROTAÇÕES de um avatar base via /create-character-v3 (1 gen = 8 direções).
// reference_image = o CANONICO-<id>.png (frontal-sul aprovado). Async → poll.
// Salva os frames em base-avatar/rotations-<id>/rot-<dir>.png + guarda character_id.
//
// Uso: node tools/gen-char-rotations.mjs <id>   (ex: homem-jovem)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BASE = "https://api.pixellab.ai/v2";
const KEY = readFileSync(join(homedir(), ".pixellab_key"), "utf8").trim();
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const ROOT = "/mnt/c/Users/mateu/OneDrive/Desktop/Rpg/design/pixellab-candidatos/chars/base-avatar";

const VOCAB = "slender realistic human proportions, small head, low top-down, dark medieval fantasy, black outline, cold desaturated muted tones";
const DESC = {
  "homem-jovem": `a young peasant villager man, short brown hair, clean shaven youthful face, simple worn linen tunic, cloth trousers, leather boots, empty hands, humble commoner, ${VOCAB}`,
  "homem-barbudo": `a rugged peasant villager man, short dark hair and short beard, simple worn wool tunic with belt, cloth trousers, leather boots, empty hands, humble commoner, ${VOCAB}`,
  "mulher-jovem": `a young peasant villager woman, brown hair tied in a bun, simple worn apron dress over linen sleeves, leather shoes, empty hands, humble commoner, ${VOCAB}`,
  "mulher-adulta": `a peasant villager woman, shoulder length dark hair, simple cream blouse and long brown skirt, leather shoes, empty hands, humble commoner, ${VOCAB}`,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function balance() { const r = await fetch(`${BASE}/balance`, { headers: H }); return (await r.json())?.subscription?.generations ?? "?"; }
function collectImages(j) {
  const out = []; const visit = (v) => {
    if (!v) return;
    if (typeof v === "string" && v.length > 200 && /^[A-Za-z0-9+/=]+$/.test(v.slice(0, 50))) { out.push(v); return; }
    if (Array.isArray(v)) { v.forEach(visit); return; }
    if (typeof v === "object") { if (v.base64) { out.push(v.base64); return; } for (const k of Object.keys(v)) visit(v[k]); }
  }; visit(j); return [...new Set(out)];
}

async function main() {
  const id = process.argv[2] || "homem-jovem";
  const desc = DESC[id]; if (!desc) throw new Error(`sem desc p/ "${id}" (tem: ${Object.keys(DESC).join(", ")})`);
  const dir = join(ROOT, `rotations-${id}`); mkdirSync(dir, { recursive: true });
  const ref = readFileSync(join(ROOT, `CANONICO-${id}.png`));

  const before = await balance(); console.log(`[balance] antes: ${before}`);
  const body = {
    description: desc,
    reference_image: { type: "base64", base64: ref.toString("base64"), format: "png" },
    image_size: { width: 128, height: 128 }, // advisory em modo referência
    view: "low top-down", template_id: "mannequin", seed: 33, no_background: true,
  };
  console.log(`[gen] POST /create-character-v3 "${id}"…`);
  const r = await fetch(`${BASE}/create-character-v3`, { method: "POST", headers: H, body: JSON.stringify(body) });
  const txt = await r.text(); if (!r.ok && r.status !== 202) { console.error(`[erro] HTTP ${r.status}: ${txt.slice(0, 600)}`); process.exit(1); }
  const j0 = JSON.parse(txt); const jobId = j0.background_job_id, charId = j0.character_id;
  console.log(`[ok] job=${jobId} char=${charId}`); writeFileSync(join(dir, "_meta.json"), JSON.stringify({ jobId, charId }, null, 1));

  let j, images = [];
  for (let i = 1; i <= 90; i++) {
    await sleep(6000);
    j = await (await fetch(`${BASE}/background-jobs/${jobId}`, { headers: H })).json();
    images = collectImages(j.last_response ?? j);
    process.stdout.write(`\r[poll ${i}] imgs=${images.length} status=${j.status || "?"}   `);
    if (["completed", "success"].includes(j.status) || images.length >= 8) break;
    if (j.status === "failed") { console.error("\nFALHOU:", JSON.stringify(j).slice(0, 400)); break; }
  }
  console.log();
  const urls = (j.last_response ?? j)?.storage_urls;
  if (images.length) { images.forEach((b64, i) => writeFileSync(join(dir, `rot-${String(i).padStart(2, "0")}.png`), Buffer.from(b64, "base64"))); console.log(`[salvo] ${images.length} frames inline`); }
  else if (urls && typeof urls === "object") { let n = 0; for (const [d, url] of Object.entries(urls)) { writeFileSync(join(dir, `rot-${d}.png`), Buffer.from(await (await fetch(url)).arrayBuffer())); n++; } console.log(`[salvo] ${n} frames via storage_urls (${Object.keys(urls).join(", ")})`); }
  else { console.log(`[i] sem imagens; zip: GET /characters/${charId}/zip · keys: ${Object.keys(j || {})}`); }
  const after = await balance(); console.log(`[balance] depois: ${after} · custo ${before - after} · saída ${dir}`);
}
main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
