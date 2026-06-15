/**
 * VERIFICADOR de CONTAINER ANINHADO (sim pura): item-container (sacola_de_pano)
 * carregado no bolso pode ser ABERTO (openItemContainer) → vira uma view própria;
 * itens entram nele; o conteúdo PERSISTE com a instância ao largar/pegar.
 *
 * Rodar:
 *   npx esbuild tools/_smoke-nested-bag.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-nested.cjs && node /tmp/smoke-nested.cjs
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
const pid = sim.addPlayer("Bagueteiro");
sim.tick();

function me() { return last!.entities.find((e) => e.id === pid)!; }
const bpId = me().backpackContainerId!;
function bolso() { return me().containers?.find((c) => c.containerId === bpId); }
function sacolaView() { return me().containers?.find((c) => c.name === "Sacola de Pano"); }

// planta uma Sacola de Pano no bolso
const reg = (sim as any).items;
const conts = (sim as any).containers;
conts.addItemStackAware(reg, conts.get(bpId), "sacola_de_pano", 1);
sim.handleCommand(pid, { type: "openContainer", containerId: bpId });
sim.tick();

console.log("== (1) a sacola aparece como item-container (isContainer) ==");
const sac = bolso()!.items.find((i) => i.templateId === "sacola_de_pano");
ok(!!sac, "sacola no bolso");
ok(sac?.isContainer === true, "marcada isContainer na view");

console.log("== (2) abrir a sacola cria a view própria (8 slots) ==");
{
  sim.handleCommand(pid, { type: "openItemContainer", instanceId: sac!.instanceId });
  sim.tick();
  ok(!!sacolaView(), "view da Sacola de Pano presente");
  ok(sacolaView()?.capacity === 8, `8 slots (got ${sacolaView()?.capacity})`);
}

console.log("== (3) mover um queijo do bolso pra dentro da sacola ==");
{
  const sCid = sacolaView()!.containerId;
  const qSlot = bolso()!.stacks.find((s) => s.templateId === "queijo")!.slot;
  sim.handleCommand(pid, {
    type: "moveItem",
    from: { kind: "container", containerId: bpId, slot: qSlot },
    to: { kind: "container", containerId: sCid, slot: 0 },
  });
  sim.tick();
  ok(sacolaView()!.stacks.some((s) => s.templateId === "queijo"), "queijo agora dentro da sacola");
}

console.log("== (4) conteúdo PERSISTE: largar a sacola fecha a view; pegar reabre com o queijo ==");
{
  const sacSlot = bolso()!.items.find((i) => i.templateId === "sacola_de_pano")!.slot;
  const P = me().pos;
  sim.handleCommand(pid, {
    type: "moveItem",
    from: { kind: "container", containerId: bpId, slot: sacSlot },
    to: { kind: "ground", pos: { x: P.x + 1, y: P.y } },
  });
  sim.tick();
  ok(!sacolaView(), "view da sacola sumiu (item largado = inacessível)");
  const gid = last!.groundItems[0].id;
  sim.handleCommand(pid, { type: "moveItem", from: { kind: "ground", groundItemId: gid }, to: { kind: "container", containerId: bpId, slot: 0 } });
  sim.tick();
  const sac2 = bolso()!.items.find((i) => i.templateId === "sacola_de_pano")!;
  sim.handleCommand(pid, { type: "openItemContainer", instanceId: sac2.instanceId });
  sim.tick();
  ok(!!sacolaView(), "reabriu a sacola após pegar de volta");
  ok(sacolaView()!.stacks.some((s) => s.templateId === "queijo"), "queijo ainda dentro (conteúdo persistiu)");
}

console.log(failures === 0 ? "\nNESTED OK." : `\n${failures} FALHA(S).`);
process.exit(failures === 0 ? 0 : 1);
