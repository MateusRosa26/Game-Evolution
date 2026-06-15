/**
 * VERIFICADOR de BAÚ (abertura/saque — sim pura): prova os GATES ortogonais e o
 * saque SINGLE-USE por jogador de `openChest()`.
 *
 *  (1) levelReq: baú cujo nível mínimo > nível do player RECUSA (nenhum loot
 *      concedido); ao atingir o nível, abre e concede o loot fixo.
 *  (2) keyReq: baú que exige uma chave que o player NÃO tem RECUSA; depois de
 *      ganhar a chave (em `ent.keys`), abre.
 *  (3) single-use: abrir um baú lootável concede o loot UMA vez; a 2ª abertura
 *      NÃO concede de novo (rastreado em `ent.lootedChests`) — ouro/itens não dobram.
 *
 * NÃO duplica `_smoke-casa-inicial.ts` (que prova o fluxo baú→chave→porta do
 * tutorial); aqui o foco é só a LÓGICA de gating + single-use, com baús injetados.
 *
 * Setup: injeta ChestDefs no `map.chests` (do mesmo jeito que o commerce injeta
 * `npcSpawns`), posicionados ≤2 tiles do spawn (28,26) — alcance do openChest. O
 * gate de nível lê `progressions.get(pid).level`, então mexemos no nível por ali.
 *
 * Rodar:
 *   node tools/run-all-smokes.mjs chest
 */
import { Simulation } from "../src/sim/Simulation";
import { generateTestMap } from "../src/sim/maps/testMap";
import type { ChestDef } from "../src/shared/types";
import type { Snapshot } from "../src/shared/protocol";

let failures = 0;
function ok(cond: boolean, label: string): void {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
}

// Baús injetados ≤2 tiles do spawn (28,26), z=0 (andar do spawn).
const CHESTS: ChestDef[] = [
  // (1) gate de nível: precisa de nível 5; loot fixo = 50 ouro + 1 pão.
  { id: "bau_nivel", pos: { x: 28, y: 24 }, z: 0, levelReq: 5, name: "Baú Selado",
    loot: { gold: 50, items: [{ templateId: "pao", qty: 1 }] } },
  // (2) gate de chave: exige "chave_teste"; loot fixo = 33 ouro.
  { id: "bau_chave", pos: { x: 26, y: 26 }, z: 0, keyReq: "chave_teste", name: "Baú Trancado",
    loot: { gold: 33 } },
  // (3) single-use: sem gate; loot fixo = 17 ouro + 2 pães (empilhável).
  { id: "bau_simples", pos: { x: 30, y: 26 }, z: 0, name: "Baú",
    loot: { gold: 17, items: [{ templateId: "pao", qty: 2 }] } },
];

const map = generateTestMap();
map.chests = CHESTS;

const sim = new Simulation(map);
let last: Snapshot | null = null;
sim.onSnapshot((s) => { last = s; });

const pid = sim.addPlayer("Saqueador");
sim.tick();

function me() { return last!.entities.find((e) => e.id === pid)!; }
const ent = (sim as any).entities.get(pid);
const containers = (sim as any).containers;
const items = (sim as any).items;
const progressions = (sim as any).progressions as Map<number, { level: number }>;
const bp = containers.get(me().backpackContainerId!);
function gold(): number { return containers.totalGold(bp); }
function countOf(tid: string): number { return containers.countOf(items, bp, tid); }
function setLevel(n: number): void { progressions.get(pid)!.level = n; }

function open(chestId: string): void {
  sim.handleCommand(pid, { type: "openChest", chestId });
  sim.tick();
}

console.log("BAÚ — gates de abertura + saque single-use (sim pura)\n");

// Sanidade: player nasce no spawn, nível 1, bolso vazio de ouro.
ok(ent.pos.x === 28 && ent.pos.y === 26, "player nasce no spawn (28,26)");
ok((progressions.get(pid)?.level ?? 0) === 1, "player começa no nível 1");
ok(gold() === 0, "bolso começa sem ouro");

console.log("\n== (1) levelReq: nível insuficiente RECUSA; suficiente abre ==");
{
  // Nível 1 < levelReq 5 → recusa, nada concedido.
  const g0 = gold(), p0 = countOf("pao");
  open("bau_nivel");
  ok(gold() === g0 && countOf("pao") === p0, "nível < req: NADA concedido (recusado)");
  ok(!ent.lootedChests.has("bau_nivel"), "baú NÃO marcado como saqueado ao recusar");

  // Sobe pro nível 5 e abre — loot fixo entra (50 ouro + 1 pão).
  setLevel(5);
  open("bau_nivel");
  ok(gold() === g0 + 50, `nível ≥ req: +50 ouro (${g0}→${gold()})`);
  ok(countOf("pao") === p0 + 1, "nível ≥ req: +1 pão");
  ok(ent.lootedChests.has("bau_nivel"), "baú marcado como saqueado após abrir");
}

console.log("\n== (2) keyReq: sem chave RECUSA; com chave abre ==");
{
  const g0 = gold();
  ok(!ent.keys.has("chave_teste"), "player NÃO tem a chave ainda");
  open("bau_chave");
  ok(gold() === g0, "sem chave: ouro intocado (recusado)");
  ok(!ent.lootedChests.has("bau_chave"), "baú trancado NÃO marcado como saqueado");

  // Ganha a chave abstrata e reabre.
  ent.keys.add("chave_teste");
  open("bau_chave");
  ok(gold() === g0 + 33, `com chave: +33 ouro (${g0}→${gold()})`);
  ok(ent.lootedChests.has("bau_chave"), "baú trancado saqueado após ter a chave");
}

console.log("\n== (3) single-use: concede 1×; 2ª abertura NÃO dobra ==");
{
  const g0 = gold(), p0 = countOf("pao");
  open("bau_simples");
  ok(gold() === g0 + 17, `1ª abertura: +17 ouro (${g0}→${gold()})`);
  ok(countOf("pao") === p0 + 2, "1ª abertura: +2 pães");
  ok(ent.lootedChests.has("bau_simples"), "baú simples marcado como saqueado");

  // 2ª abertura: NADA muda (loot não dobra).
  const g1 = gold(), p1 = countOf("pao");
  open("bau_simples");
  ok(gold() === g1, `2ª abertura: ouro NÃO dobra (${g1}→${gold()})`);
  ok(countOf("pao") === p1, "2ª abertura: pães NÃO dobram");
}

console.log(failures === 0 ? "\nCHEST OK." : `\n${failures} FALHA(S).`);
process.exit(failures === 0 ? 0 : 1);
