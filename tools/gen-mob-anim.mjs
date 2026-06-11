#!/usr/bin/env node
// Passo 3 da receita: ANIMAÇÃO de mob via /characters/animations (template mode,
// 1 gen/direção). Usa o character_id do char-v3 (em _v3_meta.json). Trava paleta no
// canônico. Salva <anim>-<dir>-<frame>.png + baixa de storage_urls. Sonda /balance.
//
// Uso: node tools/gen-mob-anim.mjs <species> <template_animation_id> <dir1,dir2,...> [anim_name]
//   ex: node tools/gen-mob-anim.mjs esqueleto walk south,north,east walk

import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const BASE = "https://api.pixellab.ai/v2";
const KEY = readFileSync(join(homedir(), ".pixellab_key"), "utf8").trim();
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function balance() { const r = await fetch(`${BASE}/balance`, { headers: H }); return (await r.json())?.subscription?.generations ?? "?"; }
const b64 = (p) => ({ type: "base64", base64: readFileSync(p).toString("base64"), format: "png" });

// encode RGBA → PNG
function pngFromRGBA(w, h, d) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; d.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const idat = deflateSync(raw), ct = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; ct[n] = c >>> 0; }
  const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = ct[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (t, dt) => { const len = Buffer.alloc(4); len.writeUInt32BE(dt.length); const tt = Buffer.from(t); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dt]))); return Buffer.concat([len, tt, dt, cc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}
// converte um image-obj da resposta (rgba_bytes ou png) → buffer PNG
function imgToPng(im) {
  const buf = Buffer.from(im.base64, "base64");
  if (buf.length >= 8 && buf[0] === 137 && buf[1] === 80) return buf; // já é PNG
  if (im.type === "rgba_bytes" && im.width && im.height) return pngFromRGBA(im.width, im.height, buf);
  return null;
}

async function main() {
  const sp = process.argv[2] || "esqueleto";
  const template = process.argv[3] || "walk";
  const dirs = (process.argv[4] || "south,north,east").split(",");
  const animName = process.argv[5] || template;
  const dir = join("design", "pixellab-candidatos", "mobs", sp);
  const meta = JSON.parse(readFileSync(join(dir, "_v3_meta.json"), "utf8"));
  const charId = meta.charId;
  const canon = join(dir, `aprovado-${sp}.png`);

  const before = await balance();
  console.log(`[balance] antes: ${before} · char=${charId} template=${template} dirs=${dirs.join(",")}`);

  const body = {
    character_id: charId,
    template_animation_id: template,
    mode: "template",
    animation_name: animName,
    directions: dirs,
    color_image: b64(canon),
    force_colors: false,
    seed: 71,
  };
  const r = await fetch(`${BASE}/characters/animations`, { method: "POST", headers: H, body: JSON.stringify(body) });
  const txt = await r.text();
  if (!r.ok && r.status !== 202) { console.error(`[erro] HTTP ${r.status}: ${txt.slice(0, 800)}`); process.exit(1); }
  const j0 = JSON.parse(txt);
  const jobs = j0.background_job_ids || [];
  const jdirs = j0.directions || dirs;
  console.log(`[ok] ${jobs.length} jobs · dirs=${jdirs.join(",")} status=${j0.status}`);
  writeFileSync(join(dir, `_${animName}_meta.json`), JSON.stringify(j0, null, 1));

  for (let k = 0; k < jobs.length; k++) {
    const jobId = jobs[k], d = jdirs[k] ?? `j${k}`;
    let j, imgObjs = [];
    for (let i = 1; i <= 80; i++) {
      await sleep(6000);
      const g = await fetch(`${BASE}/background-jobs/${jobId}`, { headers: H });
      j = await g.json();
      const lr = j.last_response ?? {};
      imgObjs = Array.isArray(lr.images) ? lr.images : [];
      process.stdout.write(`\r[${d} poll ${i}] frames=${imgObjs.length} status=${j.status} prog=${(lr.progress ?? 0).toFixed?.(2) ?? "?"}   `);
      if (j.status === "completed" || j.status === "success") break;
      if (j.status === "failed") { console.error(`\n[${d}] FALHOU`, JSON.stringify(j).slice(0, 300)); break; }
    }
    process.stdout.write("\n");
    let n = 0;
    imgObjs.forEach((im, i) => { const png = imgToPng(im); if (png) { writeFileSync(join(dir, `${animName}-${d}-${String(i).padStart(2, "0")}.png`), png); n++; } });
    console.log(`[salvo] ${d}: ${n}/${imgObjs.length} frames (${imgObjs[0]?.width}x${imgObjs[0]?.height} ${imgObjs[0]?.type})`);
  }
  const after = await balance();
  console.log(`[balance] depois: ${after} · [CUSTO] ${before - after}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
