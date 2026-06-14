/**
 * VERIFICADOR — Portas v3 (CLICK-pra-abrir): a porta é PAREDE até o jogador
 * CLICAR nela (interact → openDoor). NÃO existe mais anda-pra-abrir. Auto-fecha
 * mantém. NPCs fora do vão. Sim pura (sem client).
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

console.log("VERIFICADOR — portas v3 (click-pra-abrir)\n");

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
for (const d of doors) {
  check(`"${d.id}" em tile andável (${d.pos.x},${d.pos.y}) + isDoorTile`,
    world.isWalkable(d.pos.x, d.pos.y, d.z) && world.isDoorTile(d.pos.x, d.pos.y, d.z),
    `"${d.id}" em (${d.pos.x},${d.pos.y}) tile=${world.tileAt(d.pos.x, d.pos.y, d.z)}`);
}
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
const cheb = (a: Vec2, b: Vec2) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
/** Anda até ficar ADJACENTE (cheb≤1) do alvo (porta fechada vira nearestFree). */
function approach(s: Simulation, pid: number, x: number, y: number, budget: number): boolean {
  s.handleCommand(pid, { type: "walkTo", x, y });
  for (let i = 0; i < budget; i++) {
    s.tick();
    if (cheb(posOf(pid), { x, y }) <= 1) return true;
  }
  return false;
}
/** Anda até a posição EXATA (x,y). */
function walkExact(s: Simulation, pid: number, x: number, y: number, budget: number): boolean {
  s.handleCommand(pid, { type: "walkTo", x, y });
  for (let i = 0; i < budget; i++) {
    s.tick();
    const p = posOf(pid);
    if (p.x === x && p.y === y) return true;
  }
  return false;
}
function clickDoor(s: Simulation, pid: number, id: string): void {
  s.handleCommand(pid, { type: "interact", interactableId: id });
  s.tick();
}
function clickChest(s: Simulation, pid: number, id: string): void {
  s.handleCommand(pid, { type: "openChest", chestId: id });
  s.tick();
}

// ════ (3) PORTA TRANCADA (casa inicial) — clique exige chave ════
console.log("\n(3) Porta trancada (casa inicial) — clique exige chave:");
const casa = doors.find((d) => d.id === "porta_casa_inicial")!;
const casaOut: Vec2 = { x: casa.pos.x, y: casa.pos.y + 1 }; // 1 fora (sul)
const sim = makeSim();
const pid = sim.addPlayer("Aldeao");
sim.tick();
// player nasce DENTRO; aproxima e CLICA sem chave
approach(sim, pid, casa.pos.x, casa.pos.y, 200);
clickDoor(sim, pid, "porta_casa_inicial");
check(`sem chave: porta NÃO abre ao clicar`, !doorOpen("porta_casa_inicial"), `abriu sem chave`);
walkExact(sim, pid, casaOut.x, casaOut.y, 120); // tenta sair: parede
check(`sem chave: player preso dentro (não cruzou)`, posOf(pid).y <= casa.pos.y - 1,
  `cruzou trancada → (${posOf(pid).x},${posOf(pid).y})`);
// pega a chave (baú) e CLICA → abre
clickChest(sim, pid, "casa_inicial_bau");
approach(sim, pid, casa.pos.x, casa.pos.y, 200);
clickDoor(sim, pid, "porta_casa_inicial");
check(`com chave: clique ABRE a porta`, doorOpen("porta_casa_inicial"), `não abriu com chave`);
walkExact(sim, pid, casaOut.x, casaOut.y, 200);
check(`com chave: player ATRAVESSA pra fora (${posOf(pid).x},${posOf(pid).y})`,
  posOf(pid).y >= casa.pos.y, `não saiu mesmo com a chave`);

// ════ (4) PORTA DESTRANCADA (estalagem) — PAREDE até clicar ════
console.log("\n(4) Porta destrancada (estalagem) — parede → clique → atravessa:");
const est = doors.find((d) => d.id === "porta_estalagem")!;
const estIn: Vec2 = { x: est.pos.x, y: est.pos.y - 1 }; // 1 dentro (norte)
approach(sim, pid, est.pos.x, est.pos.y, 800);
check(`estalagem começa FECHADA`, !doorOpen("porta_estalagem"), `já estava aberta`);
walkExact(sim, pid, estIn.x, estIn.y, 150); // tenta entrar SEM clicar → parede
check(`fechada é PAREDE: não entrou sem clicar (${posOf(pid).x},${posOf(pid).y})`,
  !(posOf(pid).x === estIn.x && posOf(pid).y === estIn.y), `atravessou porta fechada`);
approach(sim, pid, est.pos.x, est.pos.y, 400);
clickDoor(sim, pid, "porta_estalagem");
check(`clique ABRE a estalagem`, doorOpen("porta_estalagem"), `não abriu ao clicar`);
walkExact(sim, pid, estIn.x, estIn.y, 150);
check(`atravessa pra dentro (${posOf(pid).x},${posOf(pid).y})`,
  posOf(pid).x === estIn.x && posOf(pid).y === estIn.y, `não entrou após abrir`);

// ════ (5) AUTO-FECHA (~4s sem ninguém no vão) ════
console.log("\n(5) Auto-fecha (player longe do vão):");
for (let i = 0; i < 120; i++) sim.tick(); // TICK_MS=50 → 4000ms=80 ticks; roda 120
check(`estalagem auto-fechou sozinha`, !doorOpen("porta_estalagem"), `não fechou após ~6s`);

// ════ (6) NÃO FECHA com player EM CIMA do vão ════
console.log("\n(6) Auto-fecha NÃO prende quem está no vão:");
approach(sim, pid, est.pos.x, est.pos.y, 200);
clickDoor(sim, pid, "porta_estalagem");
walkExact(sim, pid, est.pos.x, est.pos.y, 60); // entra no tile da porta (aberta)
const onv = posOf(pid);
check(`player parado no vão (${onv.x},${onv.y})`,
  onv.x === est.pos.x && onv.y === est.pos.y, `não parou no vão`);
for (let i = 0; i < 120; i++) sim.tick();
check(`porta SEGUE aberta com player no vão`, doorOpen("porta_estalagem"), `fechou na cara do player`);
walkExact(sim, pid, estIn.x, estIn.y, 60); // sai do vão
for (let i = 0; i < 120; i++) sim.tick();
check(`após liberar o vão, auto-fecha`, !doorOpen("porta_estalagem"), `não fechou depois de liberar`);

console.log(`\n${failures === 0 ? PASS + " TODOS OS CHECKS PASSARAM" : FAIL + ` ${failures} CHECK(S) FALHARAM`}`);
if (issues.length) { console.log("\nISSUES:"); for (const i of issues) console.log(`  - ${i}`); }
process.exit(failures === 0 ? 0 : 1);
