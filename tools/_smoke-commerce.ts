/**
 * VERIFICADOR de COMÉRCIO (compra/venda — sim pura): abrir loja exige NPC perto;
 * comprar debita ouro e entrega o item (stack-aware); ouro insuficiente bloqueia;
 * vender uma instância funde ouro e remove o item; vender algo que o NPC não
 * compra é bloqueado.
 *
 * Setup: planta a Nina (Loja Geral, npcKey real do COMMERCE) ao lado do spawn do
 * testMap — sem precisar atravessar o mapa.
 *
 * Rodar:
 *   npx esbuild tools/_smoke-commerce.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-commerce.cjs && node /tmp/smoke-commerce.cjs
 */
import { Simulation } from "../src/sim/Simulation";
import { generateTestMap } from "../src/sim/maps/testMap";
import type { Snapshot } from "../src/shared/protocol";

let failures = 0;
function ok(cond: boolean, label: string): void {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
}

// Planta a Nina ao lado do spawn (28,26) do testMap — chebyshev ≤ 3 do player.
const map = generateTestMap();
map.npcSpawns = [{ npcId: "nina", name: "Nina", x: 28, y: 24 }];

const sim = new Simulation(map);
let last: Snapshot | null = null;
sim.onSnapshot((s) => { last = s; });

const pid = sim.addPlayer("Comprador");
sim.tick();

function me() { return last!.entities.find((e) => e.id === pid)!; }
const ent = (sim as any).entities.get(pid);
const containers = (sim as any).containers;
const items = (sim as any).items;
const bpId = me().backpackContainerId!;
const bp = containers.get(bpId);
function gold(): number { return containers.totalGold(bp); }
function countOf(tid: string): number { return containers.countOf(items, bp, tid); }

// O NPC plantado é a única entidade não-player não-mob com npcKey.
function ninaId(): number {
  for (const [id, e] of (sim as any).entities as Map<number, any>) {
    if (e.kind === "npc" && e.npcKey === "nina") return id;
  }
  return -1;
}

console.log("COMÉRCIO — compra/venda (sim pura)\n");

console.log("== (0) loja exige NPC perto ==");
{
  const nid = ninaId();
  ok(nid > 0, "Nina plantada no mundo");
  // Sem abrir loja, comprar não faz nada.
  containers.depositGold(bp, 100);
  sim.handleCommand(pid, { type: "buyItem", templateId: "pao" });
  sim.tick();
  ok(countOf("pao") === 0 && gold() === 100, "comprar sem loja aberta = no-op");
}

console.log("== (1) abrir loja + comprar debita ouro e entrega item ==");
{
  const nid = ninaId();
  sim.handleCommand(pid, { type: "openShop", npcId: nid });
  sim.tick();
  ok(!!ent.activeShop, "loja aberta (NPC ≤ 3 tiles)");
  const before = gold();
  sim.handleCommand(pid, { type: "buyItem", templateId: "pao" }); // pão = 2
  sim.tick();
  ok(gold() === before - 2, `ouro debitado em 2 (${before}→${gold()})`);
  ok(countOf("pao") === 1, "pão entrou no bolso");
}

console.log("== (2) ouro insuficiente bloqueia ==");
{
  // Esvazia o ouro até < 20 (preço da pá) e tenta comprar.
  containers.withdrawGold(bp, gold() - 5); // sobra 5
  const before = gold();
  sim.handleCommand(pid, { type: "buyItem", templateId: "pa" }); // pá = 20
  sim.tick();
  ok(gold() === before, "ouro intocado (compra negada)");
  ok(countOf("pa") === 0, "pá NÃO entrou no bolso");
}

console.log("== (3) vender instância funde ouro e remove o item ==");
{
  // Dá uma cauda_de_rato (a Nina compra por 1) como instância no bolso.
  const inst = items.create("cauda_de_rato");
  containers.add(bp, { kind: "item", instanceId: inst.id });
  const before = gold();
  ok(countOf("cauda_de_rato") >= 1, "cauda no bolso antes da venda");
  sim.handleCommand(pid, { type: "sellItem", instanceId: inst.id });
  sim.tick();
  ok(gold() === before + 1, `ouro creditado em 1 (${before}→${gold()})`);
  ok(countOf("cauda_de_rato") === 0, "cauda saiu do bolso");
}

console.log("== (4) vender algo que o NPC não compra é bloqueado ==");
{
  // A Nina vende pão mas NÃO compra pão. Tenta vender o pão comprado em (1).
  const slot = bp.slots.findIndex((s: any) => s?.kind === "stack" && s.templateId === "pao");
  // pão é fungível (stack) — venda espera instância; mesmo assim o caminho não
  // deve creditar ouro nem sumir item indevidamente. Cria uma instância de tocha
  // (vendida pela Nina, não comprada) p/ provar o "ele não compra isso".
  const inst = items.create("tocha");
  containers.add(bp, { kind: "item", instanceId: inst.id });
  const before = gold();
  sim.handleCommand(pid, { type: "sellItem", instanceId: inst.id });
  sim.tick();
  ok(gold() === before, "ouro intocado (item não comprado)");
  ok(countOf("tocha") === 1, "tocha continua no bolso");
  void slot;
}

console.log(failures === 0 ? "\nCOMMERCE OK." : `\n${failures} FALHA(S).`);
process.exit(failures === 0 ? 0 : 1);
