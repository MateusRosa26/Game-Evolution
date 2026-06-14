/**
 * VERIFICADOR da MOCHILA funcional (sim pura): vestir um item `container` no slot
 * de mochila cresce o bolso (8→16); tirar encolhe pra base (8) e BLOQUEIA enquanto
 * os slots extras estiverem ocupados ("esvazie antes").
 *
 * Rodar:
 *   npx esbuild tools/_smoke-mochila.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-mochila.cjs && node /tmp/smoke-mochila.cjs
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

function me() {
  return last!.entities.find((e) => e.id === pid)!;
}
const bpId = me().backpackContainerId!;
function bolso() {
  return me().containers?.find((c) => c.containerId === bpId);
}

sim.handleCommand(pid, { type: "openContainer", containerId: bpId });
sim.tick();

// Planta uma Mochila no bolso (sem depender da Q2): registries internos.
const reg = (sim as any).items;
const conts = (sim as any).containers;
const bpCont = conts.get(bpId);
conts.addItemStackAware(reg, bpCont, "mochila", 1);
sim.tick();

console.log("== (0) estado inicial: bolso de 8 ==");
ok(bolso()?.capacity === 8, `capacidade inicial 8 (got ${bolso()?.capacity})`);

console.log("== (1) vestir a mochila cresce o bolso (8→16) ==");
{
  const slot = bolso()!.items.find((i) => i.templateId === "mochila")!.slot;
  sim.handleCommand(pid, {
    type: "moveItem",
    from: { kind: "container", containerId: bpId, slot },
    to: { kind: "equip", slot: "backpack" },
  });
  sim.tick();
  ok(me().equipment?.backpack?.templateId === "mochila", "mochila vestida no slot backpack");
  ok(bolso()?.capacity === 16, `bolso cresceu p/ 16 (got ${bolso()?.capacity})`);
}

console.log("== (2) tirar com slot extra OCUPADO é bloqueado ==");
{
  // ocupa o slot 15 (extra, além da base 8) com um queijo plantado.
  conts.addItemStackAware(reg, bpCont, "queijo", 1);
  // garante que o queijo foi pra um slot >=8 movendo-o pra lá, se necessário.
  // (addItemStackAware preenche da esquerda; force um item no slot 15)
  bpCont.slots[15] = { kind: "stack", templateId: "queijo", count: 1 };
  sim.tick();
  sim.handleCommand(pid, {
    type: "moveItem",
    from: { kind: "equip", slot: "backpack" },
    to: { kind: "container", containerId: bpId, slot: 1 }, // slot-base livre
  });
  sim.tick();
  ok(me().equipment?.backpack?.templateId === "mochila", "mochila CONTINUA vestida (tirar bloqueado)");
  ok(bolso()?.capacity === 16, `bolso continua 16 (got ${bolso()?.capacity})`);
}

console.log("== (3) esvaziar o extra e tirar encolhe (16→8) ==");
{
  bpCont.slots[15] = null; // esvazia o slot extra
  sim.tick();
  sim.handleCommand(pid, {
    type: "moveItem",
    from: { kind: "equip", slot: "backpack" },
    to: { kind: "container", containerId: bpId, slot: 1 }, // slot-base livre
  });
  sim.tick();
  ok(me().equipment?.backpack == null, "mochila saiu do slot backpack");
  ok(bolso()?.capacity === 8, `bolso encolheu p/ 8 (got ${bolso()?.capacity})`);
  ok(bolso()!.items.some((i) => i.templateId === "mochila"), "mochila voltou pro bolso");
}

console.log(failures === 0 ? "\nMOCHILA OK." : `\n${failures} FALHA(S).`);
process.exit(failures === 0 ? 0 : 1);
