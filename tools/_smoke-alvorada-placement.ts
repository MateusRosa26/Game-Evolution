/**
 * VERIFICADOR Fase 1e — smoke de INTEGRAÇÃO do placement da Alvorada.
 *
 * Importa generateAlvoradaMap() (sim pura) + os registros de quest/NPC/bestiário/
 * itens e cruza, adversarialmente, o conteúdo plantado contra o que as quests
 * pedem. NÃO depende do client.
 *
 * Rodar:
 *   npx esbuild tools/_smoke-alvorada-placement.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-placement.cjs && node /tmp/smoke-placement.cjs
 *
 * Checa:
 *  (A) toda etapa interact/region_enter de toda QuestDef → o id existe em
 *      map.interactables/questRegions (overworld OU FloorLayer). ZERO órfão.
 *  (B) inverso: todo interactable/questRegion plantado é referenciado por
 *      alguma quest (ou anotado como exceção, ex. q11).
 *  (C) ~16 NPCs em npcSpawns, todos com npcId em NPC_CAST (sem bento), em tiles
 *      andáveis.
 *  (D) 8 baús (B1-B8), loot só com templateIds existentes; B5 com levelReq/z.
 *  (E) há 1 presa_torta nos monsters do Matagal.
 */
import { generateAlvoradaMap } from "../src/sim/maps/alvorada";
import { QUESTS } from "../src/sim/quests";
import { NPC_CAST } from "../src/sim/npc/cast";
import { CREATURES } from "../src/sim/bestiary";
import { ITEM_TEMPLATES } from "../src/sim/items/templates";
import { WALKABLE, TileId, type FloorLayer, type MapData } from "../src/shared/types";

const PASS = "✅";
const FAIL = "❌";
let failures = 0;
const issues: string[] = [];
function check(label: string, cond: boolean, detail?: string): void {
  console.log(`  ${cond ? PASS : FAIL} ${label}`);
  if (!cond) {
    failures++;
    issues.push(detail ?? label);
  }
}

const map: MapData = generateAlvoradaMap();
const floors: FloorLayer[] = map.floors ?? [];

// ── Índices de ANCORADOUROS plantados (overworld + cada floor) ────────────────
// id → lista de {z}, pra detectar duplicados e reportar onde foi plantado.
const plantedInteractables = new Map<string, number[]>();
const plantedRegions = new Map<string, number[]>();
const baseZ = map.z ?? 0;

for (const it of map.interactables ?? []) {
  const z = it.z ?? baseZ;
  (plantedInteractables.get(it.id) ?? plantedInteractables.set(it.id, []).get(it.id)!).push(z);
}
for (const r of map.questRegions ?? []) {
  const z = r.z ?? baseZ;
  (plantedRegions.get(r.id) ?? plantedRegions.set(r.id, []).get(r.id)!).push(z);
}
for (const f of floors) {
  for (const it of f.interactables ?? []) {
    const z = it.z ?? f.z;
    (plantedInteractables.get(it.id) ?? plantedInteractables.set(it.id, []).get(it.id)!).push(z);
  }
  for (const r of f.questRegions ?? []) {
    const z = r.z ?? f.z;
    (plantedRegions.get(r.id) ?? plantedRegions.set(r.id, []).get(r.id)!).push(z);
  }
}

// Posição de um ancoradouro/região por id (overworld ou floor), p/ checar tile.
type Anchor = { x: number; y: number; z: number };
function interactablePos(id: string): Anchor | null {
  for (const it of map.interactables ?? []) if (it.id === id) return { x: it.pos.x, y: it.pos.y, z: it.z ?? baseZ };
  for (const f of floors) for (const it of f.interactables ?? []) if (it.id === id) return { x: it.pos.x, y: it.pos.y, z: it.z ?? f.z };
  return null;
}

// Tile lógico num (x,y,z): overworld lê map.tiles; floor lê tiles LOCAIS (esparso).
function tileAt(x: number, y: number, z: number): TileId | null {
  if (z === baseZ) {
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return null;
    return map.tiles[y * map.width + x];
  }
  const f = floors.find((fl) => fl.z === z);
  if (!f) return null;
  const lx = x - f.ox;
  const ly = y - f.oy;
  if (lx < 0 || ly < 0 || lx >= f.width || ly >= f.height) return null;
  return f.tiles[ly * f.width + lx];
}
function isWalkable(x: number, y: number, z: number): boolean {
  const t = tileAt(x, y, z);
  return t != null && WALKABLE[t];
}

// ── Refs PEDIDAS pelas quests (id → quests que o citam) ───────────────────────
const refInteract = new Map<string, string[]>();
const refRegion = new Map<string, string[]>();
const refSpecies = new Map<string, string[]>();
const refTemplates = new Map<string, string[]>();
const refNpcs = new Map<string, string[]>();
function add(m: Map<string, string[]>, k: string, q: string): void {
  (m.get(k) ?? m.set(k, []).get(k)!).push(q);
}

for (const [qid, def] of Object.entries(QUESTS)) {
  if (def.giverNpcId) add(refNpcs, def.giverNpcId, qid);
  for (const st of def.stages) {
    switch (st.type) {
      case "interact": add(refInteract, st.interactableId, qid); break;
      case "region_enter": add(refRegion, st.regionId, qid); break;
      case "kill": add(refSpecies, st.species, qid); break;
      case "collect":
        add(refTemplates, st.templateId, qid);
        add(refNpcs, st.turnInNpcId, qid);
        break;
      case "talk": add(refNpcs, st.npcId, qid); break;
    }
  }
  for (const it of def.rewards.items ?? []) add(refTemplates, it.templateId, qid);
}

console.log("VERIFICADOR Fase 1e — placement da Alvorada (smoke de integração)\n");
console.log(
  `Mapa: ${map.width}×${map.height}, ${floors.length} andares (z=${floors.map((f) => f.z).join(",")}). ` +
    `Interactables plantados: ${plantedInteractables.size} | Regiões: ${plantedRegions.size} | ` +
    `NPCs: ${(map.npcSpawns ?? []).length} | Baús: ${(map.chests ?? []).length}\n`,
);

// ════ (A) ZERO órfão: toda etapa interact/region aponta id que o mapa planta ══
console.log("(A) quests → ids plantados (zero órfão):");
const EXCEPTION_INTERACT = new Set<string>(["q11_carta_rabiscada"]); // Q11 aberta-por-item (não é ponto de mapa)
let orphanInteract = 0;
for (const [id, quests] of refInteract) {
  const planted = plantedInteractables.has(id);
  const isExc = EXCEPTION_INTERACT.has(id);
  if (planted) continue;
  if (isExc) {
    console.log(`    ${PASS} interact "${id}" NÃO plantado — exceção anotada (${quests.join(",")})`);
    continue;
  }
  orphanInteract++;
  check(`interact "${id}" plantado (pedido por ${quests.join(",")})`, false,
    `ÓRFÃO interact: quest(s) ${quests.join(",")} → "${id}" não existe em interactables`);
}
let orphanRegion = 0;
for (const [id, quests] of refRegion) {
  if (plantedRegions.has(id)) continue;
  orphanRegion++;
  check(`region "${id}" plantada (pedida por ${quests.join(",")})`, false,
    `ÓRFÃO region: quest(s) ${quests.join(",")} → "${id}" não existe em questRegions`);
}
check(`ZERO interact órfão (fora exceções)`, orphanInteract === 0,
  `${orphanInteract} interact órfão(s)`);
check(`ZERO region órfã`, orphanRegion === 0, `${orphanRegion} region órfã(s)`);

// Asserts de ANDAR específico (z certo) p/ os ids do subsolo.
const expectZ: { id: string; z: number; kind: "interact" | "region" }[] = [
  { id: "q10_alvenaria_manchada", z: -2, kind: "interact" },
  { id: "esgoto_a2", z: -2, kind: "region" },
  { id: "porao_afogado_a3", z: -3, kind: "region" },
];
for (const e of expectZ) {
  const zs = (e.kind === "interact" ? plantedInteractables : plantedRegions).get(e.id) ?? [];
  check(`"${e.id}" plantado no z=${e.z} (subsolo)`, zs.includes(e.z),
    `"${e.id}" deveria estar em z=${e.z}, plantado em z=[${zs.join(",")}]`);
}

// Ancoradouros de interact em tile ANDÁVEL (o alcance do `interact` precisa casar).
let nonWalkAnchor = 0;
for (const [id] of plantedInteractables) {
  const a = interactablePos(id);
  if (!a) continue;
  if (!isWalkable(a.x, a.y, a.z)) {
    nonWalkAnchor++;
    check(`interactable "${id}" em tile andável (${a.x},${a.y},z${a.z})`, false,
      `interactable "${id}" em tile NÃO-andável (${a.x},${a.y},z${a.z}) tile=${tileAt(a.x, a.y, a.z)}`);
  }
}
check(`todo interactable plantado em tile andável`, nonWalkAnchor === 0,
  `${nonWalkAnchor} interactable(s) em tile não-andável`);

// ════ (B) inverso: todo id plantado é referenciado (ou exceção) ═══════════════
console.log("\n(B) plantado → referenciado por quest (zero plantado morto):");
let deadInteract = 0;
for (const [id, zs] of plantedInteractables) {
  const ok = refInteract.has(id);
  if (ok) continue;
  deadInteract++;
  check(`interactable "${id}" (z=${zs.join(",")}) referenciado por quest`, false,
    `PLANTADO MORTO: interactable "${id}" (z=${zs.join(",")}) não é pedido por nenhuma quest`);
}
let deadRegion = 0;
for (const [id, zs] of plantedRegions) {
  if (refRegion.has(id)) continue;
  deadRegion++;
  check(`region "${id}" (z=${zs.join(",")}) referenciada por quest`, false,
    `PLANTADO MORTO: region "${id}" (z=${zs.join(",")}) não é pedida por nenhuma quest`);
}
check(`ZERO interactable plantado morto`, deadInteract === 0, `${deadInteract} interactable(s) morto(s)`);
check(`ZERO region plantada morta`, deadRegion === 0, `${deadRegion} region(ões) morta(s)`);
// duplicados (mesmo id plantado 2×) — não é erro fatal, mas reporta
for (const [id, zs] of plantedInteractables) if (zs.length > 1) console.log(`    ⚠ interactable "${id}" plantado ${zs.length}× (z=${zs.join(",")})`);
for (const [id, zs] of plantedRegions) if (zs.length > 1) console.log(`    ⚠ region "${id}" plantada ${zs.length}× (z=${zs.join(",")})`);

// ════ (C) NPCs: ~16, todos no NPC_CAST, sem bento, em tile andável ════════════
console.log("\n(C) NPCs plantados:");
const npcSpawns = map.npcSpawns ?? [];
check(`~16 NPCs em npcSpawns (got ${npcSpawns.length})`, npcSpawns.length >= 15 && npcSpawns.length <= 17,
  `npcSpawns tem ${npcSpawns.length} (esperado ~16, faixa 15–17)`);
let badNpc = 0;
let bentoFound = false;
for (const s of npcSpawns) {
  if (s.npcId === "bento") bentoFound = true;
  if (!(s.npcId in NPC_CAST)) {
    badNpc++;
    check(`npcId "${s.npcId}" existe em NPC_CAST`, false, `NPC "${s.npcId}" (${s.name}) não está em NPC_CAST`);
  }
  // NPCs do mapa são overworld (z=0)
  if (!isWalkable(s.x, s.y, baseZ)) {
    badNpc++;
    check(`NPC "${s.npcId}" em tile andável (${s.x},${s.y})`, false,
      `NPC "${s.npcId}" em tile NÃO-andável (${s.x},${s.y}) tile=${tileAt(s.x, s.y, baseZ)}`);
  }
}
check(`todos npcId ∈ NPC_CAST e em tile andável`, badNpc === 0, `${badNpc} problema(s) de NPC`);
check(`SEM bento em npcSpawns (fundido no Bartolo)`, !bentoFound, `bento NÃO deveria estar em npcSpawns`);

// ════ (D) Baús: 8 (B1-B8) + loot com templateIds válidos; B5 levelReq/z ═══════
console.log("\n(D) Baús:");
const chests = map.chests ?? [];
// "Orçamento" B1-B8 = os com id b1..b8 (a casa inicial NÃO conta — modelada à parte).
const budgetChests = chests.filter((c) => /^b[1-8]_/.test(c.id));
check(`8 baús no orçamento B1-B8 (got ${budgetChests.length})`, budgetChests.length === 8,
  `orçamento de baús = ${budgetChests.length} (esperado 8); ids: ${budgetChests.map((c) => c.id).join(",")}`);
let badLoot = 0;
for (const c of chests) {
  for (const it of c.loot.items ?? []) {
    if (!(it.templateId in ITEM_TEMPLATES)) {
      badLoot++;
      check(`baú "${c.id}" loot templateId "${it.templateId}" existe`, false,
        `baú "${c.id}" → templateId inexistente "${it.templateId}"`);
    }
  }
}
check(`todo loot de baú usa templateId existente`, badLoot === 0, `${badLoot} templateId(s) de loot inexistente(s)`);
// B5 = baú lacrado nv10, z=-2 (A2)
const b5 = chests.find((c) => /^b5_/.test(c.id));
check(`B5 (lacrado) existe`, !!b5, `B5 (baú lacrado) não encontrado`);
if (b5) {
  check(`B5 levelReq === 10 (got ${b5.levelReq})`, b5.levelReq === 10, `B5 levelReq = ${b5.levelReq} (esperado 10)`);
  check(`B5 z === -2 (A2) (got ${b5.z})`, b5.z === -2, `B5 z = ${b5.z} (esperado -2)`);
}

// ════ (E) presa_torta no Matagal (1×) ════════════════════════════════════════
console.log("\n(E) Presa-Torta (named, Matagal):");
const allMonsters = [...map.monsters, ...floors.flatMap((f) => f.monsters)];
const presa = allMonsters.filter((m) => m.species === "presa_torta");
check(`1 presa_torta nos monsters (got ${presa.length})`, presa.length === 1,
  `presa_torta aparece ${presa.length}× (esperado 1)`);
// reforço: a espécie existe no bestiário (senão o gerador a teria filtrado e o
// placement seria silenciosamente vazio).
check(`espécie "presa_torta" existe no bestiário`, "presa_torta" in CREATURES,
  `"presa_torta" não está em CREATURES — gerador filtraria o spawn`);
// e o ponto cai dentro do retângulo do Matagal S10 [235..275]×[230..270]
if (presa.length === 1) {
  const p = presa[0];
  const inMatagal = p.x >= 235 && p.x <= 275 && p.y >= 230 && p.y <= 270;
  check(`presa_torta dentro do Matagal S10 (${p.x},${p.y})`, inMatagal,
    `presa_torta em (${p.x},${p.y}) fora do Matagal [235..275]×[230..270]`);
}

// ── Reforço extra: TODA espécie/templateId citada por quest existe (kill/collect
// quebrariam silenciosamente sem isso; não está nos critérios A-E mas é barato) ─
console.log("\n(extra) espécies/itens citados por quest existem:");
let missSpecies = 0;
for (const [sp, quests] of refSpecies) {
  if (!(sp in CREATURES)) {
    missSpecies++;
    check(`espécie "${sp}" existe (pedida por ${quests.join(",")})`, false,
      `espécie de quest inexistente "${sp}" (${quests.join(",")})`);
  }
}
let missTpl = 0;
for (const [tpl, quests] of refTemplates) {
  if (!(tpl in ITEM_TEMPLATES)) {
    missTpl++;
    check(`templateId "${tpl}" existe (pedido por ${quests.join(",")})`, false,
      `templateId de quest inexistente "${tpl}" (${quests.join(",")})`);
  }
}
let missNpc = 0;
for (const [nid, quests] of refNpcs) {
  if (nid === "") continue; // sentinela (Q11/Q14/Q15 aberta/segredo — sem giver)
  if (!(nid in NPC_CAST)) {
    missNpc++;
    check(`npcId "${nid}" existe (pedido por ${quests.join(",")})`, false,
      `npcId de quest inexistente "${nid}" (${quests.join(",")})`);
  }
}
check(`toda espécie de quest existe`, missSpecies === 0, `${missSpecies} espécie(s) faltando`);
check(`todo templateId de quest existe`, missTpl === 0, `${missTpl} templateId(s) faltando`);
check(`todo npcId de quest existe`, missNpc === 0, `${missNpc} npcId(s) faltando`);

// ── Resumo ────────────────────────────────────────────────────────────────────
console.log(`\n${failures === 0 ? PASS + " TODOS OS CHECKS PASSARAM" : FAIL + ` ${failures} CHECK(S) FALHARAM`}`);
if (issues.length) {
  console.log("\nISSUES:");
  for (const i of issues) console.log(`  - ${i}`);
}
console.log(`\nCONTAGENS: npcSpawns=${npcSpawns.length} baús=${chests.length} (orçamento B1-B8=${budgetChests.length}) ` +
  `interactables=${plantedInteractables.size} regiões=${plantedRegions.size} ` +
  `quests=${Object.keys(QUESTS).length} presa_torta=${presa.length}`);

process.exit(failures === 0 ? 0 : 1);
