/**
 * VERIFICADOR Fase 2 (mobília) — COLISÃO + TRAVESSIA (smoke headless).
 *
 * Monta o World de generateAlvoradaMap() (sim pura, sem client) e checa:
 *  (a) um tile com decor blocks:true → isWalkable=false (e um decor puro NÃO bloqueia);
 *  (b) o tile de spawn é andável;
 *  (c) os npcSpawns estão em tiles andáveis (mobília não soterrou NPC);
 *  (d) findPath(spawn → Praça do Poço) existe (mobília NÃO vedou a cidade).
 *
 * Rodar:
 *   npx esbuild tools/_smoke-mobilia-collision.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-mobilia.cjs && node /tmp/smoke-mobilia.cjs
 */
import { generateAlvoradaMap } from "../src/sim/maps/alvorada";
import { World } from "../src/sim/World";
import { findPath } from "../src/sim/pathfinding";
import { WALKABLE, type MapData, type TileId } from "../src/shared/types";

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
const world = new World(map);
const baseZ = map.z ?? 0;

console.log("VERIFICADOR Fase 2 — mobília: COLISÃO + TRAVESSIA\n");
console.log(
  `Mapa: ${map.width}×${map.height} | decor=${map.decor.length} | ` +
    `npcSpawns=${(map.npcSpawns ?? []).length} | spawn=(${map.spawn.x},${map.spawn.y})\n`,
);

// ════ (a) decor blocks:true → tile NÃO-andável; decor puro NÃO bloqueia ════════
console.log("(a) colisão de mobília (blocks → impassável):");
const blocking = map.decor.filter((d) => d.blocks);
const nonBlocking = map.decor.filter((d) => !d.blocks);
check(`há decor bloqueante no mapa (got ${blocking.length})`, blocking.length > 0,
  `nenhum decor com blocks:true — colisão não testável`);

// TODO tile com blocks:true precisa ser NÃO-andável (a sim consumiu o blocks).
// Importante: a guarda do gerador só PLANTA blocks em tile que já era andável,
// então o tile vira impassável EXCLUSIVAMENTE por causa do decor. Verifica ambos:
// (i) isWalkable=false agora; (ii) o tile-base por baixo ERA andável (WALKABLE[tile]).
let blockFail = 0;
let baseTileNotWalkable = 0;
for (const d of blocking) {
  if (world.isWalkable(d.x, d.y, baseZ)) {
    blockFail++;
    check(`decor "${d.kind}" em (${d.x},${d.y}) bloqueia (isWalkable=false)`, false,
      `decor "${d.kind}" blocks:true em (${d.x},${d.y}) mas isWalkable=true (sim NÃO consumiu blocks)`);
  }
  const baseTile = world.tileAt(d.x, d.y, baseZ);
  if (!WALKABLE[baseTile as TileId]) baseTileNotWalkable++;
}
check(`TODO decor blocks:true → isWalkable=false (${blocking.length} peças)`, blockFail === 0,
  `${blockFail} decor bloqueante(s) ainda andável(eis)`);
check(`base de todo decor bloqueante era andável (guarda do gerador honrada)`, baseTileNotWalkable === 0,
  `${baseTileNotWalkable} decor bloqueante(s) sobre tile já sólido (selou muro/porta?)`);

// Amostra explícita: o POÇO city(37,39)=world(137,119) bloqueia.
const wellW = world.isWalkable(137, 119, baseZ);
check(`poço (Praça do Poço, 137,119) bloqueia o tile`, !wellW,
  `poço em (137,119) deveria bloquear, isWalkable=${wellW}`);

// Decor PURO (saco/placa/torch) NÃO deve, POR SI SÓ, tornar o tile impassável
// (controle: só `blocks` vira impassável). Exceção legítima: um decor puro pode
// COMPARTILHAR tile com um bloqueante (ex.: torch + caixa) — aí o tile bloqueia
// por causa do OUTRO. Só conta como erro se NENHUM co-ocupante for bloqueante.
const blockerAt = new Set(blocking.map((d) => `${d.x},${d.y}`));
let pureBlocked = 0;
for (const d of nonBlocking) {
  const baseTile = world.tileAt(d.x, d.y, baseZ); // placa pendura em parede; ignora não-andáveis
  if (!WALKABLE[baseTile as TileId]) continue;
  if (!world.isWalkable(d.x, d.y, baseZ) && !blockerAt.has(`${d.x},${d.y}`)) pureBlocked++;
}
check(`decor puro (saco/placa) sobre chão NÃO bloqueia por si só`, pureBlocked === 0,
  `${pureBlocked} decor puro(s) bloquearam indevidamente`);

// Sobreposições de tile (mesma âncora) — não quebram colisão, mas empilham
// sprites e desperdiçam um bloqueante. Reporta (não é fatal).
const tileCount = new Map<string, string[]>();
for (const d of map.decor) {
  const k = `${d.x},${d.y}`;
  (tileCount.get(k) ?? tileCount.set(k, []).get(k)!).push(d.kind + (d.blocks ? "*" : ""));
}
let doubleBlocker = 0;
for (const [k, kinds] of tileCount) {
  if (kinds.length > 1) {
    const blockers = kinds.filter((s) => s.endsWith("*")).length;
    console.log(`    ⚠ overlap em (${k}): ${kinds.join(" + ")}${blockers > 1 ? "  ← 2 bloqueantes empilhados" : ""}`);
    if (blockers > 1) doubleBlocker++;
  }
}
if (doubleBlocker > 0) {
  issues.push(`${doubleBlocker} tile(s) com 2 decor bloqueantes empilhados (1 sprite/bloqueio desperdiçado — visual)`);
}

// ════ (b) spawn andável ════════════════════════════════════════════════════════
console.log("\n(b) spawn:");
const spawnW = world.isWalkable(map.spawn.x, map.spawn.y, baseZ);
check(`spawn (${map.spawn.x},${map.spawn.y}) é andável`, spawnW,
  `spawn em tile NÃO-andável (tile=${world.tileAt(map.spawn.x, map.spawn.y, baseZ)})`);

// ════ (c) NPCs em tiles andáveis (mobília não soterrou ninguém) ═════════════════
console.log("\n(c) NPCs em tiles andáveis (mobília não soterrou):");
const npcSpawns = map.npcSpawns ?? [];
let buriedNpc = 0;
for (const s of npcSpawns) {
  if (!world.isWalkable(s.x, s.y, baseZ)) {
    buriedNpc++;
    check(`NPC "${s.npcId}" (${s.name}) andável (${s.x},${s.y})`, false,
      `NPC "${s.npcId}" em (${s.x},${s.y}) NÃO-andável (tile=${world.tileAt(s.x, s.y, baseZ)}) — mobília soterrou?`);
  }
}
check(`todos os ${npcSpawns.length} NPCs em tile andável`, buriedNpc === 0,
  `${buriedNpc} NPC(s) soterrado(s) por mobília/tile`);

// ════ (d) findPath(spawn → Praça do Poço): cidade NÃO vedada ═══════════════════
console.log("\n(d) travessia: findPath(spawn → Praça do Poço):");
// O tile do poço (137,119) é bloqueante → mira um tile ANDÁVEL da praça ao lado
// (a praça é piso de pedra [33..42]×[34..44]-cidade = world [133..142]×[114..124]).
// Escolho um tile-alvo livre próximo ao poço, confirmando que ele é andável.
const PRACA_ALVO = { x: 138, y: 119 }; // city(38,39) — vizinho L do poço
const alvoW = world.isWalkable(PRACA_ALVO.x, PRACA_ALVO.y, baseZ);
check(`alvo da praça (${PRACA_ALVO.x},${PRACA_ALVO.y}) é andável`, alvoW,
  `alvo da praça em tile não-andável (tile=${world.tileAt(PRACA_ALVO.x, PRACA_ALVO.y, baseZ)})`);

if (spawnW && alvoW) {
  const path = findPath(world, map.spawn, PRACA_ALVO, { z: baseZ });
  const reachable = path !== null && path.length > 0;
  check(`findPath(spawn → praça) existe (mobília não vedou a cidade)`, reachable,
    `findPath retornou ${path === null ? "null (inalcançável)" : "[] (mesmo tile?)"} — mobília pode ter selado a praça`);
  if (reachable) {
    console.log(`    → caminho de ${path!.length} passos; chega em (${path![path!.length - 1].x},${path![path!.length - 1].y})`);
  }
}

// Reforço: dá pra ANDAR pelo anel de tendas? Pega 2 tiles em lados opostos da
// praça e confirma rota entre eles (mobília agrupada não criou bolsão fechado).
const PRACA_NO = { x: 134, y: 115 }; // canto NO da praça
const PRACA_SE = { x: 141, y: 123 }; // canto SE da praça
if (world.isWalkable(PRACA_NO.x, PRACA_NO.y, baseZ) && world.isWalkable(PRACA_SE.x, PRACA_SE.y, baseZ)) {
  const cross = findPath(world, PRACA_NO, PRACA_SE, { z: baseZ });
  check(`travessia NO↔SE da praça (anel de tendas não fecha bolsão)`, cross !== null && cross.length > 0,
    `não há rota NO→SE dentro da praça (mobília agrupada vedou?)`);
}

// ── Resumo ────────────────────────────────────────────────────────────────────
console.log(`\n${failures === 0 ? PASS + " TODOS OS CHECKS PASSARAM" : FAIL + ` ${failures} CHECK(S) FALHARAM`}`);
if (issues.length) {
  console.log("\nISSUES:");
  for (const i of issues) console.log(`  - ${i}`);
}
console.log(`\nCONTAGENS: decor=${map.decor.length} (bloqueante=${blocking.length}, puro=${nonBlocking.length}) ` +
  `npcSpawns=${npcSpawns.length}`);

process.exit(failures === 0 ? 0 : 1);
