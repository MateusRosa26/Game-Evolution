#!/usr/bin/env node
// WALK de um avatar base via /characters/animations (template "walking-4-frames",
// mannequin). Usa o charId das rotações (rotations-<id>/_meta.json). Palette lock no
// CANONICO. Frames vêm rgba_bytes cru → encode PNG. W = flip no client (gera S/N/E).
//
// Uso: node tools/gen-char-walk.mjs <id> [template] [dirs]
//   ex: node tools/gen-char-walk.mjs homem-jovem walking-4-frames south,north,east

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const BASE = "https://api.pixellab.ai/v2";
const KEY = readFileSync(join(homedir(), ".pixellab_key"), "utf8").trim();
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const ROOT = "/mnt/c/Users/mateu/OneDrive/Desktop/Rpg/design/pixellab-candidatos/chars/base-avatar";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function balance() { const r = await fetch(`${BASE}/balance`, { headers: H }); return (await r.json())?.subscription?.generations ?? "?"; }
const b64file = (p) => ({ type: "base64", base64: readFileSync(p).toString("base64"), format: "png" });

function pngFromRGBA(w, h, d) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; d.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const idat = deflateSync(raw), ct = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; ct[n] = c >>> 0; }
  const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = ct[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (t, dt) => { const len = Buffer.alloc(4); len.writeUInt32BE(dt.length); const tt = Buffer.from(t); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dt]))); return Buffer.concat([len, tt, dt, cc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}
function imgToPng(im) { const buf = Buffer.from(im.base64, "base64"); if (buf.length >= 8 && buf[0] === 137 && buf[1] === 80) return buf; if (im.type === "rgba_bytes" && im.width && im.height) return pngFromRGBA(im.width, im.height, buf); return null; }

async function main() {
  const id = process.argv[2] || "homem-jovem";
  const template = process.argv[3] || "walking-4-frames";
  const dirs = (process.argv[4] || "south,north,east").split(",");
  const dir = join(ROOT, `rotations-${id}`);
  const charId = JSON.parse(readFileSync(join(dir, "_meta.json"), "utf8")).charId;

  const before = await balance();
  console.log(`[balance] antes: ${before} · char=${charId} template=${template} dirs=${dirs.join(",")}`);
  const body = {
    character_id: charId, template_animation_id: template, mode: "template",
    animation_name: "walk", directions: dirs,
    color_image: b64file(join(ROOT, `CANONICO-${id}.png`)), force_colors: false, seed: 71,
  };
  const r = await fetch(`${BASE}/characters/animations`, { method: "POST", headers: H, body: JSON.stringify(body) });
  const txt = await r.text(); if (!r.ok && r.status !== 202) { console.error(`[erro] HTTP ${r.status}: ${txt.slice(0, 800)}`); process.exit(1); }
  const j0 = JSON.parse(txt);
  const jobs = j0.background_job_ids || []; const jdirs = j0.directions || dirs;
  console.log(`[ok] ${jobs.length} jobs · dirs=${jdirs.join(",")}`);
  writeFileSync(join(dir, "_walk_meta.json"), JSON.stringify(j0, null, 1));

  for (let k = 0; k < jobs.length; k++) {
    const jobId = jobs[k], d = jdirs[k] ?? `j${k}`;
    let j, imgObjs = [];
    for (let i = 1; i <= 80; i++) {
      await sleep(6000);
      j = await (await fetch(`${BASE}/background-jobs/${jobId}`, { headers: H })).json();
      const lr = j.last_response ?? {}; imgObjs = Array.isArray(lr.images) ? lr.images : [];
      process.stdout.write(`\r[${d} poll ${i}] frames=${imgObjs.length} status=${j.status}   `);
      if (["completed", "success"].includes(j.status)) break;
      if (j.status === "failed") { console.error(`\n[${d}] FALHOU`, JSON.stringify(j).slice(0, 300)); break; }
    }
    process.stdout.write("\n");
    let n = 0;
    imgObjs.forEach((im, i) => { const png = imgToPng(im); if (png) { writeFileSync(join(dir, `walk-${d}-${String(i).padStart(2, "0")}.png`), png); n++; } });
    console.log(`[salvo] ${d}: ${n}/${imgObjs.length} frames (${imgObjs[0]?.width}x${imgObjs[0]?.height} ${imgObjs[0]?.type})`);
  }
  const after = await balance();
  console.log(`[balance] depois: ${after} · [CUSTO] ${before - after}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
