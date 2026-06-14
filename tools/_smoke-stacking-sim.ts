/**
 * VERIFICADOR de integração do STACKING na Simulation (sim pura, sem client):
 *  (1) spawn → 5 Queijos entram como UM stack (count 5) no bolso, projetado no
 *      snapshot como ItemStackView (templateId+count).
 *  (2) useItem num slot de stack → decrementa (5 → 4); 0 → some.
 *  (3) backpackContainerId presente; a view do bolso traz `stacks`.
 *
 * Rodar:
 *   npx esbuild tools/_smoke-stacking-sim.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-stacking-sim.cjs && node /tmp/smoke-stacking-sim.cjs
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

const pid = sim.addPlayer("Stacker");
sim.tick();

function me() {
  return last!.entities.find((e) => e.id === pid)!;
}
function bolsoView() {
  const bpId = me().backpackContainerId!;
  return me().containers?.find((c) => c.containerId === bpId);
}

// Abrir o bolso pra ele entrar na projeção de containers.
const bpId = me().backpackContainerId!;
ok(bpId != null, "backpackContainerId presente no snapshot");
sim.handleCommand(pid, { type: "openContainer", containerId: bpId });
sim.tick();

console.log("== (1) 5 Queijos = 1 stack count 5 ==");
{
  const v = bolsoView();
  ok(!!v, "view do bolso presente");
  const cheese = v!.stacks.filter((s) => s.templateId === "queijo");
  ok(cheese.length === 1, `1 slot de stack de queijo (got ${cheese.length})`);
  ok(cheese[0]?.count === 5, `count = 5 (got ${cheese[0]?.count})`);
  ok(cheese[0]?.name === "Queijo", "name projetado = Queijo");
  // não deve haver instâncias de queijo (era 5 instâncias no modelo antigo)
  ok((v!.items.filter((i) => i.templateId === "queijo")).length === 0, "nenhuma instância de queijo (virou stack)");
}

console.log("== (2) useItem decrementa o stack (5 → 4) ==");
{
  const v = bolsoView()!;
  const slot = v.stacks.find((s) => s.templateId === "queijo")!.slot;
  sim.handleCommand(pid, { type: "useItem", ref: { kind: "container", containerId: bpId, slot } });
  sim.tick();
  const after = bolsoView()!.stacks.find((s) => s.templateId === "queijo");
  ok(after?.count === 4, `count após comer 1 = 4 (got ${after?.count})`);
}

console.log("== (3) comer até zerar libera o slot ==");
{
  for (let i = 0; i < 4; i++) {
    const v = bolsoView()!;
    const stack = v.stacks.find((s) => s.templateId === "queijo");
    if (!stack) break;
    sim.handleCommand(pid, { type: "useItem", ref: { kind: "container", containerId: bpId, slot: stack.slot } });
    sim.tick();
  }
  const gone = bolsoView()!.stacks.find((s) => s.templateId === "queijo");
  ok(gone === undefined, "stack de queijo sumiu (count chegou a 0)");
}

console.log(failures === 0 ? "\nINTEGRACAO OK." : `\n${failures} FALHA(S).`);
process.exit(failures === 0 ? 0 : 1);
