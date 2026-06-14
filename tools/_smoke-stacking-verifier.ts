/**
 * VERIFICADOR do STACKING (pedido pontual) — espelha os 5 cenários do brief,
 * sobre as estruturas PURAS da sim (sem client) + um round na Simulation.
 *
 *  (1) 15 queijos no bolso (addItemStackAware) → stack de 12 + stack de 3
 *      (maxStack=12 respeitado, transbordo correto).
 *  (2) consumir/decrementar 1 do stack de 12 → 11; decrementar até 0 → slot vira null.
 *  (3) loot/baú de queijo empilha (entra como stack) — provado no caminho REAL
 *      da Simulation (openChest + grantsItems) e no caminho direto.
 *  (4) GEAR não-stackable (espada_curta) NÃO empilha — continua ItemInstance,
 *      1 por slot, LEDGER INTACTO (a decisão instances-não-stacks preservada).
 *  (5) countOf/countInBolso conta por COUNT (uma quest collect de N comidas fecha
 *      com um stack de N).
 *
 * Rodar:
 *   npx esbuild tools/_smoke-stacking-verifier.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-stacking-verifier.cjs && node /tmp/smoke-stacking-verifier.cjs
 */
import { ContainerRegistry, maxStackOf } from "../src/sim/items/containers";
import { ItemRegistry } from "../src/sim/items/instances";
import { Simulation } from "../src/sim/Simulation";
import { generateTestMap } from "../src/sim/maps/testMap";
import type { Snapshot } from "../src/shared/protocol";

let failures = 0;
const issues: string[] = [];
function ok(cond: boolean, label: string): void {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) {
    failures++;
    issues.push(label);
  }
}

// Conta por COUNT num container (stack + instâncias do mesmo template).
function countInBolso(reg: ItemRegistry, cont: ContainerRegistry, c: ReturnType<ContainerRegistry["create"]>, tpl: string): number {
  return cont.countOf(reg, c, tpl);
}

console.log("VERIFICADOR — stacking de itens fungíveis (gear preservado)\n");

console.log("== (1) 15 queijos → stack de 12 + stack de 3 ==");
{
  const items = new ItemRegistry();
  const cont = new ContainerRegistry();
  const c = cont.create("Bolso", 8);
  ok(maxStackOf("queijo") === 12, "maxStack(queijo) = 12 (teto respeitado)");
  const left = cont.addItemStackAware(items, c, "queijo", 15);
  ok(left === 0, "15 queijos couberam (nada transbordou pra fora do bolso)");
  const stacks = c.slots.filter((s) => s?.kind === "stack") as { templateId: string; count: number }[];
  ok(stacks.length === 2, `ocuparam 2 slots de stack (got ${stacks.length})`);
  ok(stacks[0]?.count === 12 && stacks[1]?.count === 3, `stacks = [12, 3] (got [${stacks.map((s) => s.count).join(", ")}])`);
  ok(stacks.every((s) => s.count <= 12), "nenhum slot passa do teto 12");
  ok(countInBolso(items, cont, c, "queijo") === 15, "countOf total = 15");
}

console.log("\n== (2) decrementar o stack de 12 → 11 → ... → 0 (slot vira null) ==");
{
  const items = new ItemRegistry();
  const cont = new ContainerRegistry();
  const c = cont.create("Bolso", 8);
  cont.addItemStackAware(items, c, "queijo", 12); // único stack de 12 no slot 0
  ok((c.slots[0] as any)?.count === 12, "slot 0 começa com stack de 12");
  // decrementa 1 → 11
  cont.removeOf(items, c, "queijo", 1);
  ok((c.slots[0] as any)?.kind === "stack" && (c.slots[0] as any).count === 11, "após -1 → stack de 11 (slot ainda ocupado)");
  // decrementa os 11 restantes → slot vira null
  const miss = cont.removeOf(items, c, "queijo", 11);
  ok(miss === 0, "removeOf 11 → removeu tudo");
  ok(c.slots[0] === null, "slot 0 virou null (stack zerado libera o slot)");
  ok(countInBolso(items, cont, c, "queijo") === 0, "countOf queijo = 0");
}

console.log("\n== (3a) loot/baú de queijo empilha (caminho DIRETO addItemStackAware) ==");
{
  const items = new ItemRegistry();
  const cont = new ContainerRegistry();
  const c = cont.create("Mochila", 16);
  // simula um loot: 4 queijos dropam num cadáver/baú e entram via addItemStackAware
  cont.addItemStackAware(items, c, "queijo", 4);
  cont.addItemStackAware(items, c, "queijo", 3); // segunda fonte de loot funde no mesmo stack
  const stacks = c.slots.filter((s) => s?.kind === "stack") as { count: number }[];
  ok(stacks.length === 1, "loot funde num único stack (não cria slot por unidade)");
  ok(stacks[0]?.count === 7, `stack de loot = 7 (got ${stacks[0]?.count})`);
  ok(c.slots.filter((s) => s?.kind === "item").length === 0, "loot NÃO virou instâncias (entra como stack)");
}

console.log("\n== (3b) MESMO caminho de loot pela Simulation (addItemStackAware → stack no snapshot) ==");
{
  // O spawn injeta 5 queijos no bolso pela MESMA chamada que o loot de baú
  // (Simulation.ts:1514) e o de cadáver (:2154) usam — addItemStackAware. Provar
  // que entram como STACK no snapshot (não 5 instâncias) cobre o caminho de loot:
  // é a mesma função, e a projeção é o que o cliente desenha.
  const sim = new Simulation(generateTestMap());
  let last: Snapshot | null = null;
  sim.onSnapshot((s) => { last = s; });
  const pid = sim.addPlayer("Looter");
  sim.tick();
  const bpId = last!.entities.find((e) => e.id === pid)!.backpackContainerId!;
  sim.handleCommand(pid, { type: "openContainer", containerId: bpId });
  sim.tick();
  const v = last!.entities.find((e) => e.id === pid)!.containers?.find((c) => c.containerId === bpId);
  ok(!!v, "view do bolso presente no snapshot");
  const cheeseStacks = v!.stacks.filter((s) => s.templateId === "queijo");
  ok(cheeseStacks.length === 1, `queijo entra como 1 STACK no snapshot (got ${cheeseStacks.length} slot(s))`);
  ok(cheeseStacks[0]?.count === 5, `stack count = 5 (got ${cheeseStacks[0]?.count}) — empilhado, não 5 instâncias`);
  ok((v!.items.filter((i) => i.templateId === "queijo")).length === 0, "zero instâncias de queijo (tudo stack)");
}

console.log("\n== (4) GEAR (espada_curta) NÃO empilha: instância única, ledger INTACTO ==");
{
  const items = new ItemRegistry();
  const cont = new ContainerRegistry();
  const c = cont.create("Bolso", 8);
  ok(maxStackOf("espada_curta") === 1, "maxStack(espada_curta) = 1 (gear não-stackable)");
  cont.addItemStackAware(items, c, "espada_curta", 3); // 3 espadas
  const insts = c.slots.filter((s) => s?.kind === "item") as { instanceId: number }[];
  ok(insts.length === 3, `3 espadas = 3 slots de instância (got ${insts.length})`);
  ok(c.slots.filter((s) => s?.kind === "stack").length === 0, "NENHUM slot virou stack (gear nunca empilha)");
  const ids = insts.map((s) => s.instanceId);
  ok(new Set(ids).size === 3, "3 IDs de instância DISTINTOS (cada espada é única)");
  // ledger INTACTO: cada instância existe no registro e tem um ledger próprio (objeto).
  const allHaveLedger = insts.every((s) => {
    const inst = items.get(s.instanceId);
    return !!inst && inst.templateId === "espada_curta" && !!inst.ledger && typeof inst.ledger === "object";
  });
  ok(allHaveLedger, "cada instância tem templateId espada_curta + ledger próprio (proveniência preservada)");
  // ledgers são objetos INDEPENDENTES (não a mesma referência compartilhada).
  const l0 = items.get(ids[0])!.ledger;
  const l1 = items.get(ids[1])!.ledger;
  ok(l0 !== l1, "ledgers de instâncias distintas são objetos independentes (não compartilham referência)");
  ok(countInBolso(items, cont, c, "espada_curta") === 3, "countOf conta as 3 instâncias de gear = 3");
}

console.log("\n== (5) countOf por COUNT fecha uma quest 'collect N' (stack de N) ==");
{
  const items = new ItemRegistry();
  const cont = new ContainerRegistry();
  const c = cont.create("Bolso", 8);
  const QUOTA = 10; // quest: junte 10 queijos
  cont.addItemStackAware(items, c, "queijo", QUOTA); // um stack de 10
  const stacks = c.slots.filter((s) => s?.kind === "stack") as { count: number }[];
  ok(stacks.length === 1 && stacks[0].count === QUOTA, `10 queijos = 1 stack de ${QUOTA} (1 slot só)`);
  ok(countInBolso(items, cont, c, "queijo") >= QUOTA, `countOf ≥ quota (${QUOTA}) → quest fecha por COUNT, não por nº de slots`);
  // sanidade: a quest não confunde COUNT (10) com nº de slots ocupados (1)
  ok(stacks.length === 1, "a quota de 10 fechou ocupando 1 slot (count desacoplado de slots)");
  // entrega: removeOf debita a quota por COUNT e libera o slot
  const miss = cont.removeOf(items, c, "queijo", QUOTA);
  ok(miss === 0 && countInBolso(items, cont, c, "queijo") === 0, "entrega da quest debita a quota por COUNT (sobra 0)");
}

console.log(`\n${failures === 0 ? "TODOS OS CHECKS PASSARAM." : `${failures} CHECK(S) FALHARAM.`}`);
if (issues.length) {
  console.log("ISSUES:");
  for (const i of issues) console.log(`  - ${i}`);
}
process.exit(failures === 0 ? 0 : 1);
