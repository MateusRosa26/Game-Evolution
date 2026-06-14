#!/usr/bin/env node
// Gera SPRITE DE NPC estático (direção SUL) da Alvorada — corpo classless CANONICO como init.
// Receita: init = avatar base aprovado (já 128, enquadrado, COLORIDO = âncora de identidade/paleta)
// → strength médio-alto segura corpo/rosto/proporção/paleta, o prompt reescreve SÓ o figurino+props
// do papel. NPC é estático: 1 sprite sul por NPC (expande direção sob demanda depois).
//
// Uso:
//   node tools/gen-npc.mjs <strength> <seed1,seed2,...> [npcId1,npcId2,...]
//   sonda:  node tools/gen-npc.mjs 140 5 bartolo          (1 NPC × 1 seed = 1 gen)
//   piloto: node tools/gen-npc.mjs 140 5,33 bartolo,leonor,tobias   (3×2 = 6 gens)
//   sheet:  node tools/gen-npc.mjs sheet 5,33 bartolo,leonor,tobias (sem API)

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { inflateSync, deflateSync } from "node:zlib";

const BASE = "https://api.pixellab.ai/v2";
const KEY = readFileSync(join(homedir(), ".pixellab_key"), "utf8").trim();
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const ROOT = "/mnt/c/Users/mateu/OneDrive/Desktop/Rpg/design/pixellab-candidatos/chars";
const OUT = join(ROOT, "npcs");
const BASES = join(ROOT, "base-avatar");

const COMMON =
  "dark medieval fantasy, black outline, cold desaturated muted tones, readable silhouette, low top-down, " +
  "realistic slender human proportions, small head about one third of body height, NOT chibi, NOT super deformed, " +
  "standing idle facing south, full body with both feet fully visible at the bottom, " +
  "plain transparent background, clean pixel art";
const NEG_BASE =
  "chibi, big head, large head, super deformed, stubby, cropped, feet cut off, " +
  "photorealistic, smooth gradient, blurry, oversaturated, neon";

// base = CANONICO-*.png usado como init (identidade corpo/gênero/idade) · str = strength calibrada por papel
// NOWEAP = negativo padrão p/ NPC civil (sem armadura/arma). Os de combate (knight/guarda/rogue) NÃO usam.
const NOWEAP = "armor, plate, chainmail, helmet, weapon, sword, shield";
const NPCS = {
  // ---- piloto aprovado (não regerar) ----
  bartolo: { base: "homem-barbudo", str: 65, neg: `${NOWEAP}, leather blacksmith apron, anvil, thin, slim, gaunt`,
    desc: "a rotund plump middle-aged tavern cook, short dark hair and a thick grumpy bearded face, " +
      "wearing a heavy greasy pale off-white linen cooking apron over a dark wool tunic, sleeves rolled up to the elbows, " +
      "a cloth rag tucked at the belt, holding a big wooden cooking ladle in one hand, hearty heavy-set build, humble innkeeper" },
  leonor: { base: "mulher-adulta", str: 55, neg: `${NOWEAP}, pointed witch hat, staff`,
    desc: "a mature town arcanist woman, shoulder-length dark hair, " +
      "wearing a long deep indigo-blue mage robe with wide sleeves and a simple rope belt, " +
      "holding a thick worn leather spellbook tome against her chest with one arm, thoughtful distracted scholarly expression, slender feminine figure" },
  tobias: { base: "homem-barbudo", str: 80, neg: `${NOWEAP}, young, youthful, clean, tidy`,
    desc: "an old worn-out drunkard man, unkempt greying hair and a messy grey beard, reddish nose, " +
      "wearing ragged tattered patched commoner clothes, tired slouched hunched posture, loosely holding a round clay liquor bottle in one hand, down on his luck" },

  // ---- lote: figurino leve (s ~70-80) ----
  nina: { base: "mulher-adulta", str: 80, neg: `${NOWEAP}`,
    desc: "a cheerful talkative general-store shopkeeper woman, brown hair tied back, " +
      "wearing a simple wool dress with a clean cloth apron over it and a coin pouch at the belt, lively open friendly expression, slender feminine figure" },
  silas: { base: "homem-jovem", str: 55, neg: `${NOWEAP}`,
    desc: "a lean older apothecary man, thin gaunt serious face, short hair, " +
      "wearing a long dark leather apothecary smock coat, a bandolier of small glowing glass potion vials across the chest, " +
      "holding a mortar and pestle in his hands, dry precise reserved demeanor" },
  duarte: { base: "homem-barbudo", str: 80, neg: "helmet, sword, photorealistic",
    desc: "a brawny village blacksmith man, thick dark beard, muscular bare arms, " +
      "wearing a heavy soot-stained leather blacksmith apron over a sleeveless tunic, holding a smith hammer, strong sturdy build" },
  amaro: { base: "homem-jovem", str: 60, neg: "plate armor, chainmail, helmet, sword, shield, photorealistic",
    desc: "a rugged hunter and furrier man, weathered watchful bearded face, " +
      "wearing a thick fur-trimmed hide cloak with shaggy animal pelts draped heavily over both shoulders, a fur hood, " +
      "a hunting bow slung on the back, leather bracers, quiet and tough" },
  abel: { base: "homem-jovem", str: 75, neg: `${NOWEAP}`,
    desc: "a pale gentle gravedigger man, gaunt sad face, " +
      "wearing plain dark muted funeral clothes with a simple hood, holding a long digging spade, somber sorrowful demeanor" },
  hugo: { base: "homem-barbudo", str: 78, neg: `${NOWEAP}, young, youthful`,
    desc: "an old retired miner man, grey hair and grey beard, stone dust on weathered clothes, " +
      "wearing a worn padded miner tunic, holding an old worn pickaxe, stooped tired posture" },
  telmo: { base: "homem-jovem", str: 65, neg: `${NOWEAP}`,
    desc: "a lean tavern keeper barkeep man, short hair, neutral calm face, " +
      "wearing a white shirt with sleeves rolled up and a long dark bartender apron, a towel draped over one shoulder, " +
      "holding a wooden jug of ale, steady reserved demeanor" },
  rosa: { base: "mulher-jovem", str: 80, neg: `${NOWEAP}`,
    desc: "a warm welcoming young guide woman, long brown hair, gentle kind face, " +
      "wearing a simple modest homely linen dress with a wool shawl over the shoulders, reassuring caring expression, slender feminine figure" },

  // ---- lote: figurino forte de combate (s ~55) — armadura/arma SÃO desejadas ----
  marco: { base: "homem-jovem", str: 58, neg: "photorealistic, blurry",
    desc: "a town watchman sentry man, alert stern face, " +
      "wearing a padded gambeson with leather bracers and a guard hooded cloak, an iron kettle helmet, " +
      "holding a tall spear upright, a signal horn at the belt, on duty vigilant" },
  ricardo: { base: "homem-barbudo", str: 55, neg: "photorealistic, blurry",
    desc: "a scarred veteran knight instructor man, grizzled bearded stern face, " +
      "wearing worn steel plate armor over chainmail with a knight tabard, a longsword sheathed at the hip, battle-hardened disciplined" },
  vincente: { base: "homem-jovem", str: 48, neg: "heavy plate armor, photorealistic, blurry, bright colors, peasant tunic",
    desc: "a lean roguish thief man with a sly crooked smirk, face half-shadowed under a dark pointed hood, " +
      "wearing dark fitted studded black leather armor and a tattered short cloak, " +
      "holding a curved dagger in one hand with a second dagger sheathed at the belt, stealthy ready stance" },
  gabriel: { base: "homem-jovem", str: 58, neg: "weapon, sword, armor, photorealistic",
    desc: "a serene young priest man, calm gentle clean-shaven face, " +
      "wearing pale clean flowing priest robes and vestments with a simple holy symbol pendant, hands folded, peaceful pious demeanor" },
  vidal: { base: "homem-barbudo", str: 55, neg: "photorealistic, blurry",
    desc: "a weary veteran guard captain man, tired stern bearded face, " +
      "wearing worn guard plate armor under a faded tabard cloak, a sword sheathed at the hip, exhausted but commanding authority" },
};

// ---------- codec PNG (idêntico ao gen-base-avatar) ----------
function decodePng(buf) {
  let pos = 8, w = 0, h = 0, ct = 6; const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    else if (type === "IDAT") idat.push(data); else if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)), ch = ct === 6 ? 4 : 3, stride = w * ch;
  const out = new Uint8ClampedArray(w * h * 4), cur = new Uint8Array(stride), prev = new Uint8Array(stride);
  let rp = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[rp++];
    for (let x = 0; x < stride; x++) {
      const rb = raw[rp++], a = x >= ch ? cur[x - ch] : 0, b = prev[x], c = x >= ch ? prev[x - ch] : 0;
      let v = rb;
      if (f === 1) v = rb + a; else if (f === 2) v = rb + b; else if (f === 3) v = rb + ((a + b) >> 1);
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = rb + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      cur[x] = v & 255;
    }
    for (let x = 0; x < w; x++) { const si = x * ch, di = (y * w + x) * 4; out[di] = cur[si]; out[di + 1] = cur[si + 1]; out[di + 2] = cur[si + 2]; out[di + 3] = ch === 4 ? cur[si + 3] : 255; }
    prev.set(cur);
  }
  return { w, h, d: out };
}
function png(w, h, d) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = d[y * w * 4 + x]; }
  const idat = deflateSync(raw), ct = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; ct[n] = c >>> 0; }
  const crc = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = ct[(c ^ x) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (t, dt) => { const len = Buffer.alloc(4); len.writeUInt32BE(dt.length); const tt = Buffer.from(t); const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(Buffer.concat([tt, dt]))); return Buffer.concat([len, tt, dt, cc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}
const pxi = (img, x, y) => ((y * img.w + x) << 2);
function scaleNearest(img, dw, dh) { const o = new Uint8ClampedArray(dw * dh * 4); for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) { const sx = Math.min(img.w - 1, Math.floor((x * img.w) / dw)), sy = Math.min(img.h - 1, Math.floor((y * img.h) / dh)); const s = (sy * img.w + sx) << 2, di = (y * dw + x) << 2; o[di] = img.d[s]; o[di + 1] = img.d[s + 1]; o[di + 2] = img.d[s + 2]; o[di + 3] = img.d[s + 3]; } return { w: dw, h: dh, d: o }; }
function blank(w, h) { return { w, h, d: new Uint8ClampedArray(w * h * 4) }; }
function paste(dst, src, ox, oy) { for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const dx = ox + x, dy = oy + y; if (dx < 0 || dy < 0 || dx >= dst.w || dy >= dst.h) continue; const s = pxi(src, x, y); if (src.d[s + 3] === 0) continue; const di = pxi(dst, dx, dy); dst.d[di] = src.d[s]; dst.d[di + 1] = src.d[s + 1]; dst.d[di + 2] = src.d[s + 2]; dst.d[di + 3] = src.d[s + 3]; } }

const loadBase = (id) => decodePng(readFileSync(join(BASES, `CANONICO-${id}.png`)));

async function balance() { const r = await fetch(`${BASE}/balance`, { headers: H }); return (await r.json())?.subscription?.generations ?? "?"; }
async function pixflux({ desc, neg, init, strength, seed }) {
  const body = {
    description: `${desc}, ${COMMON}`, negative_description: `${neg}, ${NEG_BASE}`,
    image_size: { width: 128, height: 128 }, text_guidance_scale: 10,
    view: "low top-down", direction: "south", outline: "single color black outline",
    shading: "medium shading", detail: "highly detailed", no_background: true, seed,
    init_image: { type: "base64", base64: Buffer.from(png(init.w, init.h, init.d)).toString("base64"), format: "png" },
    init_image_strength: strength,
  };
  const r = await fetch(`${BASE}/create-image-pixflux`, { method: "POST", headers: H, body: JSON.stringify(body) });
  const txt = await r.text(); if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt.slice(0, 250)}`);
  const j = JSON.parse(txt); const b64 = j?.image?.base64; if (!b64) throw new Error("sem image");
  return decodePng(Buffer.from(b64, "base64"));
}

function buildSheet(ids, seeds, strength, fromDisk) {
  const sheet = blank(seeds.length * 160, ids.length * 160);
  ids.forEach((id, ri) => seeds.forEach((seed, ci) => {
    try {
      const t = fromDisk[`${id}_${seed}`] ?? decodePng(readFileSync(join(OUT, `@160__${id}_s${strength}_seed${seed}.png`)));
      paste(sheet, t, ci * 160, ri * 160);
    } catch {}
  }));
  return sheet;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  if (process.argv[2] === "sheet") {
    const seeds = (process.argv[3] || "5").split(",").map((s) => parseInt(s, 10));
    const ids = (process.argv[4] || Object.keys(NPCS).join(",")).split(",");
    const strength = parseInt(process.argv[5] || "140", 10);
    const sheet = buildSheet(ids, seeds, strength, {});
    writeFileSync(join(OUT, "_SHEET_NPCS.png"), png(sheet.w, sheet.h, sheet.d));
    console.log(`[sheet] _SHEET_NPCS.png — linhas: ${ids.join(", ")} · cols seeds: ${seeds.join(", ")}`);
    return;
  }

  const cliStr = process.argv[2] || "auto"; // "auto" = strength por-NPC (npc.str); número = override global p/ sweeps
  const useAuto = cliStr === "auto";
  const strength = useAuto ? null : parseInt(cliStr, 10);
  const seeds = (process.argv[3] || "5").split(",").map((s) => parseInt(s, 10));
  const ids = (process.argv[4] || Object.keys(NPCS).join(",")).split(",");
  const before = await balance();
  console.log(`[balance] antes: ${before} · strength ${useAuto ? "auto(por-NPC)" : strength} · seeds ${seeds.join(",")} · NPCs ${ids.join(",")} · ${ids.length * seeds.length} gens`);

  const fromDisk = {};
  for (const id of ids) {
    const npc = NPCS[id]; if (!npc) { console.error(`[skip] NPC desconhecido: ${id}`); continue; }
    const init = loadBase(npc.base);
    const eff = useAuto ? (npc.str ?? 80) : strength;
    for (const seed of seeds) {
      try {
        const img = await pixflux({ desc: npc.desc, neg: npc.neg, init, strength: eff, seed });
        const tag = `${id}_s${eff}_seed${seed}`;
        writeFileSync(join(OUT, `${tag}.png`), png(img.w, img.h, img.d));
        const big = scaleNearest(img, 160, 160);
        writeFileSync(join(OUT, `@160__${tag}.png`), png(160, 160, big.d));
        fromDisk[`${id}_${seed}`] = big;
        console.log(`[ok] ${tag}`);
      } catch (e) { console.error(`[FALHA] ${id} seed${seed}: ${e.message}`); }
    }
  }

  const sheet = buildSheet(ids, seeds, strength, fromDisk);
  writeFileSync(join(OUT, `_SHEET_s${strength}.png`), png(sheet.w, sheet.h, sheet.d));
  const after = await balance();
  console.log(`[fim] custo ${before === "?" ? "?" : before - after} gens · saldo ${before}→${after}`);
  console.log(`[saída] ${OUT}`);
}
main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
