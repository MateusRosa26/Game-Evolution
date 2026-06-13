/**
 * VERIFICADOR — Portas v2 (feel Tibia/Apogea): porta em toda casa, anda-pra-abrir,
 * auto-fecha, NPCs fora do vão. Sim pura (sem client).
 *
 * Rodar:
 *   npx esbuild tools/_smoke-portas-tibia.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-portas.cjs && node /tmp/smoke-portas.cjs
 */
import { Simulation } from "../src/sim/Simulation";
import { World } from "../src/sim/World";
import { generateAlvoradaMap } from "../src/sim/maps/alvorada";
import type { Snapshot } from "../src/shared/protocol";
import type { MapData, Vec2 } from "../src/shared/types";

const PASS = "✅", FAIL = "❌";
let failures = 0;
const issues: string[] = [];
function check(label: string, cond: boolean, detail?: string): void {
  console.log(`  ${cond ? PASS : FAIL} ${label}`);
  if (!cond) { failures++; issues.push(detail ?? label); }
}

const map: MapData = generateAlvoradaMap();
const world = new World(map);
const doors = map.doors ?? [];

console.log("VERIFICADOR — portas v2 (Tibia/Apogea)\n");

// ════ (1) PORTA EM TODA CASA ════
console.log("(1) Porta em toda casa entrável:");
const expectIds = [
  "porta_estalagem", "porta_loja", "porta_boticario", "porta_ferreiro", "porta_depot",
  "porta_camara", "porta_quartel", "porta_capela", "porta_templo", "porta_torre",
  "porta_guilda", "porta_taverna", "porta_armazens", "porta_casa_inicial",
];
check(`14 portas geradas (got ${doors.length})`, doors.length === 14, `esperado 14, got ${doors.length}`);
for (const id of expectIds) {
  check(`porta "${id}" existe`, doors.some((d) => d.id === id), `faltou ${id}`);
}
// toda porta num tile que é vão (StoneFloor andável) e marcada como door-tile
for (const d of doors) {
  check(`"${d.id}" em tile andável (${d.pos.x},${d.pos.y}) + isDoorTile`,
    world.isWalkable(d.pos.x, d.pos.y, d.z) && world.isDoorTile(d.pos.x, d.pos.y, d.z),
    `"${d.id}" em (${d.pos.x},${d.pos.y}) tile=${world.tileAt(d.pos.x, d.pos.y, d.z)}`);
}
// só a casa inicial trancada
const locked = doors.filter((d) => d.keyReq != null);
check(`só 1 porta trancada (casa inicial)`, locked.length === 1 && locked[0].id === "porta_casa_inicial",
  `trancadas: ${locked.map((d) => d.id).join(",")}`);
check(`porta_casa_inicial exige chave_casa_inicial`,
  locked[0]?.keyReq === "chave_casa_inicial", `keyReq=${locked[0]?.keyReq}`);

// ════ (2) NPCs FORA DA PORTA ════
console.log("\n(2) Nenhum NPC em cima de tile-porta:");
const doorTiles = new Set(doors.map((d) => `${d.pos.x},${d.pos.y},${d.z}`));
let onDoor = 0;
for (const n of map.npcSpawns ?? []) {
  if (doorTiles.has(`${n.x},${n.y},0`)) { onDoor++; issues.push(`${n.npcId} em (${n.x},${n.y}) = porta`); }
}
check(`ZERO NPC sobre tile-porta`, onDoor === 0, `${onDoor} NPC(s) em cima de porta`);

// ════ harness de sim ════
let snap: Snapshot | null = null;
function makeSim(): Simulation {
  const s = new Simulation(generateAlvoradaMap());
  s.onSnapshot((sn) => { snap = sn; });
  return s;
}
function posOf(pid: number): Vec2 {
  const me = snap?.entities.find((e) => e.id === pid);
  return me ? me.pos : { x: -1, y: -1 };
}
function doorOpen(id: string): boolean {
  return snap?.doors.find((d) => d.id === id)?.open ?? false;
}
function walkToward(s: Simulation, pid: number, x: number, y: number, budget: number): void {
  s.handleCommand(pid, { type: "walkTo", x, y });
  for (let i = 0; i < budget; i++) {
    s.tick();
    const p = posOf(pid);
    if (p.x === x && p.y === y) return;
  }
}
/** Liberta o player do tutorial: abre o baú (ganha a chave) e sai da casa inicial. */
function freeFromHouse(s: Simulation, pid: number): void {
  s.handleCommand(pid, { type: "openChest", chestId: "casa_inicial_bau" });
  s.tick();
  // sai pela porta (128,126) rumo à Praça — anda-pra-abrir cruza com a chave.
  walkToward(s, pid, 137, 118, 600);
}

// ════ (3) ANDA-PRA-ABRIR uma porta DESTRANCADA (Estalagem, porta (120,122)) ════
console.log("\n(3) Anda-pra-abrir (porta destrancada):");
// Estalagem door city(20,42) = world (120,122). Interior atrás é y≤121.
const estDoor = doors.find((d) => d.id === "porta_estalagem")!;
const sim = makeSim();
const pid = sim.addPlayer("Andarilho");
sim.tick();
freeFromHouse(sim, pid); // sai do tutorial primeiro (player nasce trancado dentro)
const insideEst: Vec2 = { x: estDoor.pos.x, y: estDoor.pos.y - 1 }; // 1 tile dentro
check(`porta_estalagem começa FECHADA`, !doorOpen("porta_estalagem"), `já estava aberta`);
// 1º para EM CIMA do vão (prova: porta abriu) — depois entra 1 tile.
walkToward(sim, pid, estDoor.pos.x, estDoor.pos.y, 400);
check(`a porta ABRIU ao pisar no vão (estado global no snapshot)`, doorOpen("porta_estalagem"),
  `porta_estalagem não consta aberta ao pisar no vão`);
walkToward(sim, pid, insideEst.x, insideEst.y, 50);
const afterEst = posOf(pid);
check(`player ATRAVESSOU pra dentro da estalagem (chegou a (${afterEst.x},${afterEst.y}))`,
  afterEst.x === insideEst.x && afterEst.y === insideEst.y,
  `player não entrou — parou em (${afterEst.x},${afterEst.y})`);

// ════ (4) AUTO-FECHA: porta fecha sozinha ~4s depois (player saiu de cima) ════
console.log("\n(4) Auto-fecha (player longe do vão):");
// player está 1 tile dentro (não em cima da porta). Espera > 4s lógicos.
// TICK_MS=50 → 4000ms = 80 ticks; roda 100 com folga.
for (let i = 0; i < 100; i++) sim.tick();
check(`porta_estalagem FECHOU sozinha (auto-close)`, !doorOpen("porta_estalagem"),
  `porta_estalagem ainda aberta após ~5s sem ninguém no vão`);

// ════ (5) NÃO FECHA com player EM CIMA do vão ════
console.log("\n(5) Auto-fecha NÃO prende quem está no vão:");
const sim2 = makeSim();
const pid2 = sim2.addPlayer("NoVao");
sim2.tick();
freeFromHouse(sim2, pid2); // sai do tutorial primeiro
// anda até PARAR exatamente no tile da porta (não 1 dentro). Para isso, mira
// o próprio tile da porta como destino.
walkToward(sim2, pid2, estDoor.pos.x, estDoor.pos.y, 400);
const onDoorPos = posOf(pid2);
check(`player parado EM CIMA da porta (${onDoorPos.x},${onDoorPos.y})`,
  onDoorPos.x === estDoor.pos.x && onDoorPos.y === estDoor.pos.y,
  `player não parou no vão — (${onDoorPos.x},${onDoorPos.y})`);
check(`porta aberta com player no vão`, doorOpen("porta_estalagem"), `porta não está aberta`);
for (let i = 0; i < 100; i++) sim2.tick(); // > auto-close, mas player segue no vão
check(`porta SEGUE aberta (não fechou na cara do player)`, doorOpen("porta_estalagem"),
  `porta fechou com player em cima — prenderia/glitch`);
// agora ele sai → porta deve fechar
walkToward(sim2, pid2, estDoor.pos.x, estDoor.pos.y - 1, 50);
for (let i = 0; i < 100; i++) sim2.tick();
check(`após sair do vão, porta auto-fecha`, !doorOpen("porta_estalagem"),
  `porta não fechou depois do player liberar o tile`);

// ════ (6) PORTA TRANCADA bloqueia anda-pra-abrir sem chave ════
console.log("\n(6) Porta trancada barra o anda-pra-abrir sem chave:");
const sim3 = makeSim();
const pid3 = sim3.addPlayer("SemChave");
sim3.tick();
// casa inicial: player nasce dentro; tenta sair pela porta (128,126) SEM abrir o baú.
const casaDoor = doors.find((d) => d.id === "porta_casa_inicial")!;
walkToward(sim3, pid3, casaDoor.pos.x, casaDoor.pos.y + 1, 200); // tenta cruzar pra fora (sul)
const stuck = posOf(pid3);
check(`player SEM chave preso (não cruzou a porta trancada) — (${stuck.x},${stuck.y})`,
  stuck.y <= casaDoor.pos.y - 1, `player atravessou porta trancada — (${stuck.x},${stuck.y})`);
check(`porta_casa_inicial continua FECHADA no snapshot`, !doorOpen("porta_casa_inicial"),
  `porta trancada consta aberta sem chave`);

// com a chave (abre o baú) → anda-pra-abrir funciona
sim3.handleCommand(pid3, { type: "openChest", chestId: "casa_inicial_bau" });
sim3.tick();
walkToward(sim3, pid3, casaDoor.pos.x, casaDoor.pos.y + 2, 200); // agora sai pro sul
const freed = posOf(pid3);
check(`COM chave: anda-pra-abrir cruza a porta trancada (${freed.x},${freed.y})`,
  freed.y >= casaDoor.pos.y, `player não saiu mesmo com a chave — (${freed.x},${freed.y})`);
check(`porta_casa_inicial consta ABERTA após cruzar com a chave`, doorOpen("porta_casa_inicial"),
  `porta não abriu via anda-pra-abrir com a chave`);

console.log(`\n${failures === 0 ? PASS + " TODOS OS CHECKS PASSARAM" : FAIL + ` ${failures} CHECK(S) FALHARAM`}`);
if (issues.length) { console.log("\nISSUES:"); for (const i of issues) console.log(`  - ${i}`); }
process.exit(failures === 0 ? 0 : 1);
