/**
 * VERIFICADOR do STACKING de itens fungíveis (generalização do ouro).
 *
 * Prova, sobre as estruturas puras da sim (sem client), que:
 *  (1) addItemStackAware empilha fungível (queijo, maxStack 12), transborda em
 *      novos slots ≤ teto, e mantém GEAR como instância única (1 por slot).
 *  (2) countOf soma stacks + instâncias; removeOf debita por COUNT (zera slot).
 *  (3) canFit é stack-aware (cabe em pilha parcial sem slot vazio).
 *  (4) lootSlotsNeeded da Simulation reflete a demanda real (via addItemStackAware).
 *  (5) Determinismo: dois runs idênticos → snapshots de slot idênticos.
 *
 * Rodar:
 *   npx esbuild tools/_smoke-stacking.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-stacking.cjs && node /tmp/smoke-stacking.cjs
 */
import { ContainerRegistry, maxStackOf } from "../src/sim/items/containers";
import { ItemRegistry } from "../src/sim/items/instances";

let failures = 0;
function ok(cond: boolean, label: string): void {
  if (cond) {
    console.log(`  PASS  ${label}`);
  } else {
    console.log(`  FAIL  ${label}`);
    failures++;
  }
}

// Snapshot textual dos slots (determinístico) p/ comparar runs.
function snap(reg: ContainerRegistry, items: ItemRegistry, c: ReturnType<ContainerRegistry["create"]>): string {
  return c.slots
    .map((s) => {
      if (!s) return "·";
      if (s.kind === "gold") return `gold:${s.amount}`;
      if (s.kind === "stack") return `${s.templateId}x${s.count}`;
      return `inst#${s.instanceId}:${items.get(s.instanceId)?.templateId}`;
    })
    .join(" | ");
}

console.log("== (0) teto de stack ==");
ok(maxStackOf("queijo") === 12, "queijo maxStack = 12 (criador)");
ok(maxStackOf("espada_curta") === 1, "espada (gear, !stackable) maxStack = 1");
ok(maxStackOf("pote") === 8, "pote maxStack = 8");

console.log("== (1) empilhar + transbordar fungível ==");
{
  const items = new ItemRegistry();
  const cont = new ContainerRegistry();
  const c = cont.create("Bolso", 8);
  // 12 queijos = 1 slot cheio.
  let left = cont.addItemStackAware(items, c, "queijo", 12);
  ok(left === 0, "12 queijos couberam");
  ok(c.slots.filter((s) => s?.kind === "stack").length === 1, "ocuparam 1 slot");
  // +5 → transborda: slot1 fica 12, slot2 vira 5 (preenche existente até teto).
  left = cont.addItemStackAware(items, c, "queijo", 5);
  ok(left === 0, "+5 queijos couberam (transbordo)");
  ok(cont.countOf(items, c, "queijo") === 17, "countOf queijo = 17");
  const stacks = c.slots.filter((s) => s?.kind === "stack") as { count: number }[];
  ok(stacks.length === 2 && stacks[0].count === 12 && stacks[1].count === 5, "stacks = [12, 5]");
}

console.log("== (2) gear NUNCA empilha (instância única) ==");
{
  const items = new ItemRegistry();
  const cont = new ContainerRegistry();
  const c = cont.create("Bolso", 8);
  cont.addItemStackAware(items, c, "espada_curta", 1);
  cont.addItemStackAware(items, c, "espada_curta", 1);
  const insts = c.slots.filter((s) => s?.kind === "item") as { instanceId: number }[];
  ok(insts.length === 2, "2 espadas = 2 slots de instância");
  ok(insts[0].instanceId !== insts[1].instanceId, "instâncias têm IDs distintos (ledger próprio)");
  ok(cont.countOf(items, c, "espada_curta") === 2, "countOf conta instâncias = 2");
}

console.log("== (3) countOf/removeOf misturando stack + instância ==");
{
  const items = new ItemRegistry();
  const cont = new ContainerRegistry();
  const c = cont.create("Bolso", 8);
  // força uma instância de queijo (slot item) + um stack de queijo no mesmo container
  c.slots[0] = { kind: "item", instanceId: items.create("queijo").id };
  cont.addItemStackAware(items, c, "queijo", 4); // vira stack de 4 noutro slot
  ok(cont.countOf(items, c, "queijo") === 5, "countOf = 4 (stack) + 1 (instância) = 5");
  // remove 5 → zera tudo (debita stack primeiro, depois a instância)
  const miss = cont.removeOf(items, c, "queijo", 5);
  ok(miss === 0, "removeOf 5 = removeu tudo");
  ok(cont.countOf(items, c, "queijo") === 0, "sobra 0 queijo");
  ok(c.slots.every((s) => s === null || (s.kind !== "stack" && (s.kind !== "item" || items.get((s as any).instanceId)?.templateId !== "queijo"))), "slots de queijo liberados");
  // remover além do que há = retorna o faltante
  const miss2 = cont.removeOf(items, c, "queijo", 3);
  ok(miss2 === 3, "removeOf 3 sem estoque → faltam 3");
}

console.log("== (4) canFit stack-aware ==");
{
  const items = new ItemRegistry();
  const cont = new ContainerRegistry();
  const c = cont.create("Bolso", 1); // 1 slot só
  cont.addItemStackAware(items, c, "queijo", 5); // pilha parcial de 5, slot único ocupado
  ok(cont.freeSlot(c) < 0, "container sem slot vazio");
  ok(cont.canFit(c, "queijo", 7) === true, "cabe +7 queijos (pilha tem folga até 12)");
  ok(cont.canFit(c, "queijo", 8) === false, "NÃO cabe +8 (passaria do teto sem slot novo)");
  ok(cont.canFit(c, "espada_curta", 1) === false, "gear NÃO cabe (precisa slot vazio)");
}

console.log("== (5) transbordo respeita o teto por slot ==");
{
  const items = new ItemRegistry();
  const cont = new ContainerRegistry();
  const c = cont.create("Bolso", 8);
  const left = cont.addItemStackAware(items, c, "pote", 20); // pote teto 8 → 8+8+4
  ok(left === 0, "20 potes couberam");
  const counts = (c.slots.filter((s) => s?.kind === "stack") as { count: number }[]).map((s) => s.count);
  ok(JSON.stringify(counts) === JSON.stringify([8, 8, 4]), `potes = [8,8,4] (got ${JSON.stringify(counts)})`);
}

console.log("== (6) cheio → retorna leftover (nada se perde silenciosamente) ==");
{
  const items = new ItemRegistry();
  const cont = new ContainerRegistry();
  const c = cont.create("Bolso", 1);
  const left = cont.addItemStackAware(items, c, "queijo", 20); // 1 slot, teto 12 → sobra 8
  ok(left === 8, "12 entram, 8 sobram (container cheio)");
}

console.log("== (7) determinismo: dois runs idênticos ==");
{
  function run(): string {
    const items = new ItemRegistry();
    const cont = new ContainerRegistry();
    const c = cont.create("Bolso", 8);
    cont.addItemStackAware(items, c, "queijo", 7);
    cont.addItemStackAware(items, c, "espada_curta", 1);
    cont.addItemStackAware(items, c, "cauda_de_rato", 15);
    cont.depositGold(c, 42);
    cont.removeOf(items, c, "queijo", 3);
    return snap(cont, items, c);
  }
  const a = run();
  const b = run();
  ok(a === b, `snapshots idênticos (${a})`);
}

console.log(failures === 0 ? "\nTODOS OS CHECKS PASSARAM." : `\n${failures} CHECK(S) FALHARAM.`);
process.exit(failures === 0 ? 0 : 1);
