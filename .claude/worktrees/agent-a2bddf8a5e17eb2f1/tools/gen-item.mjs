#!/usr/bin/env node
// Gera candidatos de SPRITE DE ITEM via PixelLab /generate-with-style-v2.
// Modelo Tibia: 1 sprite por item (chão + inventário). Gera a 64px (barato),
// reduz p/ 32px no uso. Sonda /balance antes/depois. 1 chamada = grade de variações.
//
// Uso: node tools/gen-item.mjs <spec>   (rode UM por vez — é a sonda)
//   <spec>: chave em SPECS (ex. "espada-cega")

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { categoryOf } from "./categories.mjs";

const BASE = "https://api.pixellab.ai/v2";
const KEY = readFileSync(join(homedir(), ".pixellab_key"), "utf8").trim();
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

const VOCAB =
  "dark medieval fantasy, black outline, cold desaturated tones, warm light accents, readable silhouette";
// item-specific: objeto único, centrado, fundo transparente, sem personagem/mão/cenário
const ITEM = "single game item sprite, inventory icon, one object centered, slight top-down three-quarter angle, on transparent background, no character, no hands, no background scenery, common worn modest";

// âncora de coerência: knight (metal/couro) + árvore (peso de outline/render)
const STYLE_REFS = [
  "src/client/assets/img/chars/knight/walk/s0.png",
  "src/client/assets/img/scenery/tree2.png",
];

const SPECS = {
  "espada-cega": {
    description: `a worn old short sword, dull notched steel blade, plain leather-wrapped grip, simple iron crossguard, modest beginner weapon, ${ITEM}, ${VOCAB}`,
    seed: 11,
  },
  "gibao-roto": {
    description: `a tattered cloth-and-leather gambeson jerkin chest armor, frayed edges, patched, faded brown and grey, humble peasant armor, ${ITEM}, ${VOCAB}`,
    seed: 12,
  },
  "botas-surradas": {
    description: `a pair of worn leather boots, scuffed cracked brown leather, simple laces, old and modest, ${ITEM}, ${VOCAB}`,
    seed: 13,
  },
  "sacola-pano": {
    description: `a small simple cloth drawstring bag pouch, coarse beige fabric, tied with a cord, humble container, ${ITEM}, ${VOCAB}`,
    seed: 14,
  },

  // --- Armas T1 (templates já codificados, faltam sprites) ---
  "espada-curta": {
    description: `a simple short sword, straight clean steel blade, leather-wrapped grip, plain iron crossguard, basic reliable beginner weapon, ${ITEM}, ${VOCAB}`,
    seed: 21,
  },
  "machado-de-mao": {
    description: `a one-handed hand axe, single curved iron axe head, short wooden haft, simple woodsman tool-weapon, ${ITEM}, ${VOCAB}`,
    seed: 22,
  },
  "clava": {
    description: `a crude wooden club mace, heavy knotted bludgeon head banded with a few iron rings, plain wooden handle, blunt humble weapon, ${ITEM}, ${VOCAB}`,
    seed: 23,
  },
  "cajado-simples": {
    description: `a simple wooden mage staff, long gnarled wooden quarterstaff, a small rough bound stone at the tip, humble apprentice staff, ${ITEM}, ${VOCAB}`,
    seed: 24,
  },
  "adaga": {
    description: `a small dagger, short narrow steel blade, leather-wrapped handle, simple crossguard, light quick rogue weapon, ${ITEM}, ${VOCAB}`,
    seed: 25,
  },
  "cetro": {
    description: `a very humble plain priest scepter, a short simple rod of tarnished dull worn brass, topped with a tiny small matte pale stone, modest unadorned clerical weapon, no ornaments no jewels no decoration, poor and worn, ${ITEM}, ${VOCAB}`,
    seed: 36,
  },

  // --- Consumíveis T1 ---
  "pao": {
    description: `a small loaf of rustic bread, round crusty golden-brown peasant bread, humble food, ${ITEM}, ${VOCAB}`,
    seed: 27,
  },
  "carne-assada": {
    description: `a stylized chunk of roasted meat, a chunky cooked meat morsel with a small bone nub sticking out, bold rounded chunky shapes, warm golden-brown glazed, iconic cartoon fantasy game food, hearty appetizing, simple readable, painterly stylized not photorealistic, ${ITEM}, ${VOCAB}`,
    seed: 48,
  },
  "carne-crua": {
    description: `a stylized chunk of raw uncooked meat, a chunky raw red meat morsel with a small bone nub sticking out, bold rounded chunky shapes, pink-red raw flesh with pale marbled fat, no cooking no glaze no char no browning, iconic cartoon fantasy game food, simple readable, painterly stylized not photorealistic, ${ITEM}, ${VOCAB}`,
    seed: 49,
  },
  "pocao-vida-pequena": {
    description: `a small slim health potion, a tall narrow slender glass vial with a cork stopper, deep red liquid inside, thin flask bottle, ${ITEM}, ${VOCAB}`,
    seed: 39,
  },

  // --- Ferramentas T1 ---
  "corda": {
    description: `a coiled rope, neat loop of thick brown hemp rope bundled together, simple explorer tool, ${ITEM}, ${VOCAB}`,
    seed: 30,
  },
  "pa": {
    description: `a simple shovel spade, wooden handle with a worn iron digging blade, old digging tool, ${ITEM}, ${VOCAB}`,
    seed: 31,
  },
  "tocha": {
    description: `a lit torch, wooden handle wrapped in oiled cloth at the top with a small warm flame, handheld light source, ${ITEM}, ${VOCAB}`,
    seed: 32,
  },
  "faca-de-esfolar": {
    description: `a skinning knife, short curved steel blade, plain bone handle, simple worn skinning tool, ${ITEM}, ${VOCAB}`,
    seed: 33,
  },

  // --- Material (loot) ---
  "cauda-de-rato": {
    description: `a severed rat tail, thin tapering pinkish-grey rodent tail, small grisly trophy loot, ${ITEM}, ${VOCAB}`,
    seed: 34,
  },

  // --- Vestir T1 vendor (couro genérico, sem bônus) ---
  "coifa-de-couro": {
    description: `a simple leather coif cap, a close-fitting plain brown leather hood helmet, humble head armor, modest and worn but intact, ${ITEM}, ${VOCAB}`,
    seed: 50,
  },
  "tunica-de-couro": {
    description: `a plain leather tunic chest armor, a worn but intact brown leather vest jerkin with simple stitching, humble body armor, NOT tattered NOT ragged, ${ITEM}, ${VOCAB}`,
    seed: 51,
  },
  "calcas-de-couro": {
    description: `a pair of simple leather trousers, plain worn brown leather pants leggings, humble leg armor, ${ITEM}, ${VOCAB}`,
    seed: 52,
  },
  "botas-de-couro": {
    description: `a pair of plain sturdy leather boots, simple intact brown leather boots with laces, modest footwear, NOT scuffed NOT cracked, ${ITEM}, ${VOCAB}`,
    seed: 53,
  },
  "luvas-de-couro": {
    description: `a SINGLE single leather glove, one plain worn brown leather hand glove only, just one glove NOT a pair, humble modest, ${ITEM}, ${VOCAB}`,
    seed: 64,
  },
  "escudo-de-madeira": {
    description: `a round wooden shield, simple planked wood round shield with an iron rim and a central iron boss, worn humble buckler, ${ITEM}, ${VOCAB}`,
    seed: 55,
  },

  // --- Vestir/joias T1 baús (COM bônus — tema na cor) ---
  "capuz-do-cacador": {
    description: `a hunter's hood, a rugged green and brown leather and cloth ranger hood, weathered hunting headgear, modest with a fine touch, ${ITEM}, ${VOCAB}`,
    seed: 56,
  },
  "robe-do-erudito": {
    description: `a scholar's robe, a long flowing dark blue-grey cloth mage robe with simple pale trim, modest scholarly garment, ${ITEM}, ${VOCAB}`,
    seed: 57,
  },
  "peitoral-da-muralha": {
    description: `a bulwark breastplate, a sturdy worn iron steel chest plate cuirass armor, heavy solid defensive plate, ${ITEM}, ${VOCAB}`,
    seed: 58,
  },
  "botas-do-viajante": {
    description: `a PAIR of two traveler's boots side by side, both sturdy brown leather travel boots with buckles and straps, well-traveled and reliable, a matching pair of boots, modest with a fine touch, ${ITEM}, ${VOCAB}`,
    seed: 69,
  },
  "anel-de-regeneracao-menor": {
    description: `a lesser ring of regeneration, a simple worn metal band ring set with a small dull green gem, modest enchanted ring, ${ITEM}, ${VOCAB}`,
    seed: 60,
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function balance() { const r = await fetch(`${BASE}/balance`, { headers: H }); return (await r.json())?.subscription?.generations ?? "?"; }
function styleImg(path) {
  const b = readFileSync(path);
  return { image: { type: "base64", base64: b.toString("base64"), format: "png" }, width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

async function main() {
  const name = process.argv[2] || "espada-cega";
  const spec = SPECS[name];
  if (!spec) throw new Error(`sem spec "${name}" — opções: ${Object.keys(SPECS).join(", ")}`);

  const before = await balance();
  console.log(`[balance] antes: ${before}`);

  const body = {
    style_images: STYLE_REFS.map(styleImg),
    description: spec.description,
    image_size: { width: spec.size ?? 96, height: spec.size ?? 96 }, // 96px ≈ ~10 gens (custo ∝ 1/tamanho²); 32px final via downscale
    seed: spec.seed,
    no_background: true,
  };
  console.log(`[gen] POST /generate-with-style-v2 "${name}" (${body.image_size.width}x${body.image_size.height})…`);
  const r = await fetch(`${BASE}/generate-with-style-v2`, { method: "POST", headers: H, body: JSON.stringify(body) });
  const txt = await r.text();
  if (r.status !== 202 && !r.ok) { console.error(`[erro] HTTP ${r.status}: ${txt.slice(0, 600)}`); process.exit(1); }

  let j = JSON.parse(txt);
  const jobId = j.background_job_id || j.id || j.generation_id;
  const dir = join("design", "pixellab-candidatos", "items", categoryOf(name), name);
  mkdirSync(dir, { recursive: true });

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
