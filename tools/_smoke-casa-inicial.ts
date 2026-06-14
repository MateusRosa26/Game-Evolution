/**
 * VERIFICADOR do fix da CASA INICIAL (nascimento/tutorial da Alvorada).
 *
 * Prova, sobre a sim pura (sem client), o loop-assinatura do tutorial:
 *   nascer preso → abrir baú → ganhar a chave → abrir a porta → sair pra Praça.
 * E que NINGUÉM fica preso de forma insolúvel (baú+chave alcançáveis, baú sem
 * keyReq). Mais: classless → corpo "homem" (mapeamento + PNGs).
 *
 * Rodar:
 *   npx esbuild tools/_smoke-casa-inicial.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-casa.cjs && node /tmp/smoke-casa.cjs
 *
 * Checa (espelha os 5 critérios do pedido):
 *  (1) Rosa NÃO em (128,126); está em tile ANDÁVEL da safeZone interior da casa.
 *  (2) PORTA (128,126) começa FECHADA → bloqueia um personagem fresco. (nuance:
 *      o tile-base é StoneFloor andável; o bloqueio vive em isDoorTile+openedDoors,
 *      NÃO em World.isWalkable — reportamos os dois.)
 *  (3) Tutorial ponta-a-ponta: player abre casa_inicial_bau → recebe
 *      "chave_casa_inicial" → interage/abre a porta → agora passa → findPath
 *      (spawn → Praça do Poço) cruza a porta. SEM a chave a porta NÃO abre.
 *  (4) Não-preso: baú+chave alcançáveis dentro (findPath spawn→baú), baú sem keyReq.
 *  (5) classless → corpo "homem": o set do torso do outfit classless resolve em
 *      "homem" (NÃO knight) via o alias, e os PNGs walk/ existem.
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Simulation } from "../src/sim/Simulation";
import { findPath } from "../src/sim/pathfinding";
import { World } from "../src/sim/World";
import { generateAlvoradaMap } from "../src/sim/maps/alvorada";
import { WALKABLE, type ChestDef, type DoorDef, type MapData, type Vec2 } from "../src/shared/types";
import { DEFAULT_OUTFIT_BY_CLASS, OUTFIT_PART_BY_ID } from "../src/shared/outfits";
import { DEFAULT_PLAYER_CLASS } from "../src/sim/balance";
import type { Snapshot } from "../src/shared/protocol";

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

const DOOR_TILE: Vec2 = { x: 128, y: 126 };
const map: MapData = generateAlvoradaMap();
const world = new World(map);

console.log("VERIFICADOR — casa inicial (fix do nascimento/tutorial)\n");
console.log(`Mapa ${map.width}×${map.height} | spawn=(${map.spawn.x},${map.spawn.y}) | porta-alvo=(${DOOR_TILE.x},${DOOR_TILE.y})\n`);

// ── Espelha o cálculo da safeZone interior da casa inicial (alvorada.ts §9):
//    rect-city [25,41]→[31,46] + offset (100,80) = world [125,121]→[131,126];
//    interior = rect+1..rect-1 = [126,122]→[130,125]. ─────────────────────────
const CITY = { x: 100, y: 80 };
const CASA_RECT_CITY = { x0: 25, y0: 41, x1: 31, y1: 46 };
const casaInteriorWorld = {
  x: CASA_RECT_CITY.x0 + CITY.x + 1,
  y: CASA_RECT_CITY.y0 + CITY.y + 1,
  x2: CASA_RECT_CITY.x1 + CITY.x - 1,
  y2: CASA_RECT_CITY.y1 + CITY.y - 1,
};
function inCasaInterior(p: Vec2): boolean {
  return p.x >= casaInteriorWorld.x && p.x <= casaInteriorWorld.x2 && p.y >= casaInteriorWorld.y && p.y <= casaInteriorWorld.y2;
}

// ════ (1) Rosa: fora da porta, dentro do interior, em tile andável ════════════
console.log("(1) Rosa (NPC do tutorial):");
const rosa = (map.npcSpawns ?? []).find((s) => s.npcId === "rosa");
check("Rosa existe em npcSpawns", !!rosa, "npc rosa não encontrado em npcSpawns");
if (rosa) {
  const onDoor = rosa.x === DOOR_TILE.x && rosa.y === DOOR_TILE.y;
  check(`Rosa NÃO está na porta (128,126) — está em (${rosa.x},${rosa.y})`, !onDoor,
    `Rosa CAIU na porta (128,126) — bloquearia o vão de saída e prenderia o player`);
  check(`Rosa em tile ANDÁVEL (${rosa.x},${rosa.y})`, world.isWalkable(rosa.x, rosa.y, 0),
    `Rosa em tile NÃO-andável (${rosa.x},${rosa.y}) tile=${world.tileAt(rosa.x, rosa.y, 0)}`);
  check(`Rosa dentro da safeZone interior da casa [${casaInteriorWorld.x},${casaInteriorWorld.y}]→[${casaInteriorWorld.x2},${casaInteriorWorld.y2}]`,
    inCasaInterior(rosa) && world.isSafeZone(rosa.x, rosa.y, 0),
    `Rosa (${rosa.x},${rosa.y}) fora do interior/safeZone da casa`);
  // não pode sentar em cima de spawn/baús (prenderia/sobreporia)
  const collides = [map.spawn, { x: 127, y: 123 }, { x: 129, y: 123 }, DOOR_TILE].some((t) => t.x === rosa.x && t.y === rosa.y);
  check(`Rosa não colide com spawn/baús/porta`, !collides, `Rosa (${rosa.x},${rosa.y}) em cima de spawn/baú/porta`);
}

// ════ (2) Porta começa FECHADA → bloqueia personagem fresco ═══════════════════
console.log("\n(2) Porta de saída começa FECHADA:");
const doorDef: DoorDef | null = world.doorById("porta_casa_inicial");
check("porta_casa_inicial existe como DoorDef", !!doorDef, "DoorDef porta_casa_inicial não encontrada");
if (doorDef) {
  check(`porta em (${DOOR_TILE.x},${DOOR_TILE.y})`, doorDef.pos.x === DOOR_TILE.x && doorDef.pos.y === DOOR_TILE.y,
    `porta em (${doorDef.pos.x},${doorDef.pos.y}) — esperado (128,126)`);
  check(`porta z===0`, doorDef.z === 0, `porta z=${doorDef.z}`);
  check(`porta exige chave "chave_casa_inicial"`, doorDef.keyReq === "chave_casa_inicial",
    `porta keyReq=${doorDef.keyReq} (esperado chave_casa_inicial)`);
}
check(`isDoorTile(128,126)===true (a sim sabe que há porta ali)`, world.isDoorTile(DOOR_TILE.x, DOOR_TILE.y, 0),
  `isDoorTile(128,126) deveria ser true`);
// NUANCE documentada: o tile-base É StoneFloor andável; o bloqueio é no canEnter
// (isDoorTile + openedDoors), não em isWalkable. Reporta o valor literal sem falhar
// o run por causa dele (o que IMPORTA — bloqueio efetivo — é provado no fluxo (3)).
const rawWalkable = world.isWalkable(DOOR_TILE.x, DOOR_TILE.y, 0);
console.log(`    ⓘ World.isWalkable(128,126,0) = ${rawWalkable} (tile-base StoneFloor; o bloqueio da porta vive em canEnter/isDoorTile, não aqui)`);

// ── Bloqueio EFETIVO: um player fresco (sem chave) NÃO atravessa a porta. ──────
// Driva pela sim: anda em direção à praça (sul) e confirma que NÃO cruza y=126.
let snap: Snapshot | null = null;
function makeSim(): Simulation {
  const s = new Simulation(generateAlvoradaMap());
  s.onSnapshot((sn) => { snap = sn; });
  return s;
}
function posOf(s: Simulation, pid: number): Vec2 {
  void s;
  const me = snap?.entities.find((e) => e.id === pid);
  return me ? me.pos : { x: -1, y: -1 };
}
// caminha rumo a (x,y) por um orçamento de ticks; para se chegar perto.
// Registra cada tile pisado em `visited` (p/ provar a travessia da porta).
function walkToward(s: Simulation, pid: number, x: number, y: number, budget = 200, visited?: Set<string>): void {
  s.handleCommand(pid, { type: "walkTo", x, y });
  for (let i = 0; i < budget; i++) {
    s.tick();
    const p = posOf(s, pid);
    if (visited) visited.add(`${p.x},${p.y}`);
    if (p.x === x && p.y === y) return;
  }
}

const PRACA: Vec2 = { x: 137, y: 118 }; // Praça do Poço (tile de pedra ao N do poço (137,119))

// Player TRANCADO (sem abrir o baú) — não deve sair da casa.
const simLocked = makeSim();
const pLocked = simLocked.addPlayer("Trancado");
simLocked.tick(); // emite 1º snapshot
check("Praça do Poço é tile andável (alvo do teste)", world.isWalkable(PRACA.x, PRACA.y, 0),
  `Praça (${PRACA.x},${PRACA.y}) não-andável tile=${world.tileAt(PRACA.x, PRACA.y, 0)}`);
walkToward(simLocked, pLocked, PRACA.x, PRACA.y, 200);
const lockedPos = posOf(simLocked, pLocked);
check(`SEM chave: player preso DENTRO da casa (parou em (${lockedPos.x},${lockedPos.y}), y≤125)`,
  lockedPos.y <= 125 && inCasaInterior(lockedPos),
  `player sem chave atravessou a porta — chegou a (${lockedPos.x},${lockedPos.y})`);

// ════ (3) Tutorial ponta-a-ponta: baú → chave → porta → sair ══════════════════
console.log("\n(3) Loop do tutorial (baú → chave → porta → Praça):");
const sim = makeSim();
const pid = sim.addPlayer("Tutorial"); // classless por default
sim.tick();
const startPos = posOf(sim, pid);
check(`player nasce no spawn (${map.spawn.x},${map.spawn.y})`, startPos.x === map.spawn.x && startPos.y === map.spawn.y,
  `player nasceu em (${startPos.x},${startPos.y}) — esperado (${map.spawn.x},${map.spawn.y})`);

// abre o baú da casa (≤2 tiles do spawn) e DEVE ganhar a chave.
sim.handleCommand(pid, { type: "openChest", chestId: "casa_inicial_bau" });
sim.tick();
const ent = sim.world; void ent; // (world já validado)
// a chave é flag no personagem; expomos via o snapshot? não — checamos efeito:
// interagir na porta agora deve ABRIR (com chave), e o player passa.
// 1º: porta AINDA fechada antes de interagir.
walkToward(sim, pid, DOOR_TILE.x, DOOR_TILE.y - 1, 80); // encosta no tile ao N da porta
const beforeInteract = posOf(sim, pid);
check(`player alcança o tile em frente à porta (${beforeInteract.x},${beforeInteract.y})`,
  beforeInteract.y <= 125, `player não chegou à frente da porta — (${beforeInteract.x},${beforeInteract.y})`);

sim.handleCommand(pid, { type: "interact", interactableId: "porta_casa_inicial" });
sim.tick();
// agora caminha pra Praça (ao N, mas a ÚNICA saída é a porta ao S (128,126): o
// player desce pela porta e contorna a casa). Registra os tiles pisados pra
// PROVAR a travessia da porta — a Praça em si é a prova de que escapou (o player
// trancado, acima, NÃO chega lá).
const trail = new Set<string>();
walkToward(sim, pid, PRACA.x, PRACA.y, 600, trail);
const afterPos = posOf(sim, pid);
check(`COM chave + porta aberta: player SAIU e chegou à Praça (${afterPos.x},${afterPos.y})`,
  afterPos.x === PRACA.x && afterPos.y === PRACA.y,
  `player não chegou à Praça — parou em (${afterPos.x},${afterPos.y})`);
check(`player PISOU na porta (128,126) ao sair (única saída da casa)`, trail.has(`${DOOR_TILE.x},${DOOR_TILE.y}`),
  `player chegou à Praça sem pisar na porta — havia outra saída? (rota deveria cruzar (128,126))`);

// findPath (estático) spawn → Praça existe (o tile-base da porta é andável, então
// a rota geométrica passa por (128,126)). Sanidade de que há rota pela porta.
const pathOut = findPath(world, map.spawn, PRACA, { z: 0 });
check(`findPath(spawn → Praça) existe`, pathOut != null, `findPath(spawn→Praça) retornou null`);
if (pathOut) {
  const crossesDoor = pathOut.some((p) => p.x === DOOR_TILE.x && p.y === DOOR_TILE.y);
  check(`a rota spawn→Praça CRUZA a porta (128,126)`, crossesDoor,
    `rota não passa pela porta — a casa teria outra saída? passos=${pathOut.length}`);
}

// SEM a chave a porta NÃO abre: novo player, interage SEM abrir o baú.
const simNoKey = makeSim();
const pNoKey = simNoKey.addPlayer("SemChave");
simNoKey.tick();
walkToward(simNoKey, pNoKey, DOOR_TILE.x, DOOR_TILE.y - 1, 80);
simNoKey.handleCommand(pNoKey, { type: "interact", interactableId: "porta_casa_inicial" });
simNoKey.tick();
walkToward(simNoKey, pNoKey, PRACA.x, PRACA.y, 200);
const noKeyPos = posOf(simNoKey, pNoKey);
check(`interagir na porta SEM chave NÃO abre (player continua preso, (${noKeyPos.x},${noKeyPos.y}))`,
  noKeyPos.y <= 125, `player sem chave abriu a porta indevidamente — (${noKeyPos.x},${noKeyPos.y})`);

// ════ (4) Não-preso: baú+chave alcançáveis, baú sem keyReq ════════════════════
console.log("\n(4) Insolubilidade descartada (baú+chave alcançáveis, baú sem trava):");
const chests: ChestDef[] = map.chests ?? [];
const bau = chests.find((c) => c.id === "casa_inicial_bau");
check("casa_inicial_bau existe", !!bau, "baú casa_inicial_bau não encontrado");
if (bau) {
  check(`baú concede grantsKey "chave_casa_inicial"`, bau.loot.grantsKey === "chave_casa_inicial",
    `baú grantsKey=${bau.loot.grantsKey} (esperado chave_casa_inicial)`);
  check(`baú casa_inicial_bau SEM keyReq (chave nunca trancada atrás de si mesma)`, bau.keyReq == null,
    `baú casa_inicial_bau tem keyReq=${bau.keyReq} — tornaria o tutorial insolúvel`);
  check(`baú casa_inicial_bau em tile andável (${bau.pos.x},${bau.pos.y})`, world.isWalkable(bau.pos.x, bau.pos.y, 0),
    `baú em tile não-andável (${bau.pos.x},${bau.pos.y})`);
  // alcançável a partir do spawn (mesmo andar, dentro da casa fechada)
  const reach = chebyshevReach(map.spawn, bau.pos);
  check(`baú a ≤2 tiles do spawn (alcance do openChest) — cheby=${reach}`, reach <= 2,
    `baú a ${reach} tiles do spawn (>2) — fora do alcance reach-based do openChest`);
}
function chebyshevReach(a: Vec2, b: Vec2): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

// ════ (5) classless → corpo "homem" (mapeamento + PNGs) ══════════════════════
console.log("\n(5) classless → corpo 'homem':");
check(`DEFAULT_PLAYER_CLASS === "classless"`, DEFAULT_PLAYER_CLASS === "classless",
  `DEFAULT_PLAYER_CLASS = ${DEFAULT_PLAYER_CLASS}`);
const classlessOutfit = DEFAULT_OUTFIT_BY_CLASS["classless"];
check(`existe DEFAULT_OUTFIT_BY_CLASS["classless"]`, !!classlessOutfit, `outfit classless ausente`);
// O EntityRenderer escolhe o corpo pelo SET do torso, com alias citizen→homem.
// Reproduzimos a MESMA resolução aqui (sem importar o client, que puxa pixi).
const BODY_SET_ALIAS: Record<string, string> = { citizen: "homem" };
function bodySetOf(torsoSet: string | undefined): string | undefined {
  if (!torsoSet) return undefined;
  return BODY_SET_ALIAS[torsoSet] ?? torsoSet;
}
if (classlessOutfit) {
  const torsoPart = classlessOutfit.torso.part;
  const torsoSet = OUTFIT_PART_BY_ID[torsoPart]?.set;
  const resolvedBody = bodySetOf(torsoSet);
  console.log(`    ⓘ classless torso="${torsoPart}" → set="${torsoSet}" → corpo="${resolvedBody}"`);
  check(`torso do classless tem set "citizen"`, torsoSet === "citizen",
    `torso classless set=${torsoSet} (esperado citizen)`);
  check(`classless mapeia pro corpo "homem" (NÃO knight)`, resolvedBody === "homem",
    `classless resolveu corpo "${resolvedBody}" (esperado homem)`);
  check(`o alias NÃO aponta pra knight`, resolvedBody !== "knight",
    `classless cairia no corpo knight — errado`);
}
// PNGs do corpo homem (walk). W é gerado por flip de E → só s/e/n precisam existir.
// O bundle roda de /tmp, então __dirname/import.meta.url apontam pro OUTPUT, não
// pra fonte. Ancora na raiz do projeto: env PROJECT_ROOT, senão deriva do cwd
// (rodar a partir da raiz), com fallback no caminho conhecido desta worktree.
const PROJECT_ROOT =
  process.env.PROJECT_ROOT ??
  (existsSync(resolve(process.cwd(), "src/client/assets/img/chars"))
    ? process.cwd()
    : "/mnt/c/Users/mateu/OneDrive/Desktop/Rpg");
void fileURLToPath; // (mantido p/ futuro; raiz vem do cwd/env)
const HOMEM_WALK = resolve(PROJECT_ROOT, "src/client/assets/img/chars/homem/walk");
const needFrames = ["s0", "s1", "s2", "s3", "e0", "e1", "e2", "e3", "n0", "n1", "n2", "n3"];
let missing = 0;
const missingNames: string[] = [];
for (const f of needFrames) {
  const p = resolve(HOMEM_WALK, `${f}.png`);
  if (!existsSync(p)) { missing++; missingNames.push(`${f}.png`); }
}
check(`PNGs de walk do homem existem (s/e/n × 4 frames) em ${HOMEM_WALK}`, missing === 0,
  `faltam ${missing} PNG(s) do homem/walk: ${missingNames.join(", ")}`);
// reforço: o pixellab.ts só registra um corpo se tiver s+e+n (≥1 cada) — temos os 3.
check(`homem tem s+e+n (gate do pixellab.ts pra registrar charBodies)`,
  ["s0", "e0", "n0"].every((f) => existsSync(resolve(HOMEM_WALK, `${f}.png`))),
  `homem não tem o trio s0/e0/n0 — pixellab.ts não registraria o corpo`);

// ── Resumo ────────────────────────────────────────────────────────────────────
console.log(`\n${failures === 0 ? PASS + " TODOS OS CHECKS PASSARAM" : FAIL + ` ${failures} CHECK(S) FALHARAM`}`);
if (issues.length) {
  console.log("\nISSUES:");
  for (const i of issues) console.log(`  - ${i}`);
}
process.exit(failures === 0 ? 0 : 1);
