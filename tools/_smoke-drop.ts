/**
 * VERIFICADOR do DROP NO CHÃO (sim pura): largar mira um TILE (parede/visão/alcance
 * validados); pegar funde no bolso; largar/pegar gear; fora de alcance bloqueado;
 * chão→chão realoca a pilha.
 *
 * Rodar:
 *   npx esbuild tools/_smoke-drop.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-drop.cjs && node /tmp/smoke-drop.cjs
 */
import { Simulation } from "../src/sim/Simulation";
import { generateTestMap } from "../src/sim/maps/testMap";
import type { Snapshot } from "../src/shared/protocol";

let failures = 0;
function ok(cond: boolean, label: string): void {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
}

const sim = new Simulation(generateTestMap());
let last: Snapshot | null = null;
sim.onSnapshot((s) => { last = s; });

const pid = sim.addPlayer("Carregador");
sim.tick();

function me() { return last!.entities.find((e) => e.id === pid)!; }
const bpId = me().backpackContainerId!;
function bolso() { return me().containers?.find((c) => c.containerId === bpId); }
function ground() { return last!.groundItems; }
const P = me().pos; // tile do jogador (28,26-ish); arredores = grama andável

sim.handleCommand(pid, { type: "openContainer", containerId: bpId });
sim.tick();

console.log("== (1) largar a pilha de queijo num TILE vizinho mirado ==");
{
  const slot = bolso()!.stacks.find((s) => s.templateId === "queijo")!.slot;
  const target = { x: P.x + 1, y: P.y };
  sim.handleCommand(pid, {
    type: "moveItem",
    from: { kind: "container", containerId: bpId, slot },
    to: { kind: "ground", pos: target },
  });
  sim.tick();
  ok(ground().length === 1, `1 pilha no chão (got ${ground().length})`);
  ok(ground()[0]?.pos.x === target.x && ground()[0]?.pos.y === target.y, "caiu no tile mirado (não nos pés)");
  ok(ground()[0]?.count === 5, "queijo x5 no chão");
}

console.log("== (2) pegar de volta funde no bolso ==");
{
  const gid = ground()[0].id;
  sim.handleCommand(pid, {
    type: "moveItem",
    from: { kind: "ground", groundItemId: gid },
    to: { kind: "container", containerId: bpId, slot: 0 },
  });
  sim.tick();
  ok(ground().length === 0, "chão vazio");
  ok(bolso()!.stacks.find((s) => s.templateId === "queijo")?.count === 5, "queijo x5 de volta no bolso");
}

console.log("== (3) largar/re-vestir a ARMA via chão ==");
{
  sim.handleCommand(pid, { type: "moveItem", from: { kind: "equip", slot: "hand1" }, to: { kind: "ground", pos: { x: P.x, y: P.y + 1 } } });
  sim.tick();
  ok(me().equipment?.hand1 == null, "hand1 vazia após largar");
  ok(ground().length === 1 && ground()[0].kind === "item", "arma (instância) no chão");
  const gid = ground()[0].id;
  sim.handleCommand(pid, { type: "moveItem", from: { kind: "ground", groundItemId: gid }, to: { kind: "equip", slot: "hand1" } });
  sim.tick();
  ok(me().equipment?.hand1 != null, "arma de volta em hand1");
  ok(ground().length === 0, "chão vazio de novo");
}

console.log("== (4) largar FORA de alcance é bloqueado (nada se move) ==");
{
  const slot = bolso()!.stacks.find((s) => s.templateId === "queijo")!.slot;
  sim.handleCommand(pid, {
    type: "moveItem",
    from: { kind: "container", containerId: bpId, slot },
    to: { kind: "ground", pos: { x: P.x + 13, y: P.y } }, // > dropRange (12)
  });
  sim.tick();
  ok(ground().length === 0, "nada no chão (alvo longe demais)");
  ok(!!bolso()!.stacks.find((s) => s.templateId === "queijo"), "queijo continua no bolso");
}

console.log("== (5) chão → chão realoca a pilha ==");
{
  // larga perto, depois realoca pra outro tile vizinho.
  const slot = bolso()!.stacks.find((s) => s.templateId === "queijo")!.slot;
  sim.handleCommand(pid, { type: "moveItem", from: { kind: "container", containerId: bpId, slot }, to: { kind: "ground", pos: { x: P.x + 1, y: P.y } } });
  sim.tick();
  const gid = ground()[0].id;
  const dest = { x: P.x, y: P.y + 1 };
  sim.handleCommand(pid, { type: "moveItem", from: { kind: "ground", groundItemId: gid }, to: { kind: "ground", pos: dest } });
  sim.tick();
  ok(ground().length === 1 && ground()[0].id === gid, "mesma pilha (id preservado)");
  ok(ground()[0].pos.x === dest.x && ground()[0].pos.y === dest.y, "pilha mudou de tile");
}

console.log(failures === 0 ? "\nDROP OK." : `\n${failures} FALHA(S).`);
process.exit(failures === 0 ? 0 : 1);
