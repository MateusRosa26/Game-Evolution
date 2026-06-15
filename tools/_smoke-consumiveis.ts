/**
 * VERIFICADOR de CONSUMÍVEIS (sim pura):
 *  (1) poção de cura: clampa no maxHp, consome 1, arma o EXAUSTO;
 *  (2) usar de novo no exausto é bloqueado; passa o exausto → volta a curar;
 *  (3) curar com vida cheia é no-op (não desperdiça o clique);
 *  (4) comida: aplica "Bem Alimentado" e consome 1 do stack;
 *  (5) saciedade tem TETO (não dá pra empanturrar além de FOOD_SATIETY_CAP_MS).
 *
 * Rodar:
 *   npx esbuild tools/_smoke-consumiveis.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-consumiveis.cjs && node /tmp/smoke-consumiveis.cjs
 */
import { Simulation } from "../src/sim/Simulation";
import { generateTestMap } from "../src/sim/maps/testMap";
import { applyFood, wellFedRegenMult, FOOD_SATIETY_CAP_MS } from "../src/sim/skills/status";
import { msToTicks } from "../src/shared/constants";
import type { Snapshot } from "../src/shared/protocol";

let failures = 0;
function ok(cond: boolean, label: string): void {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
}

const sim = new Simulation(generateTestMap());
let last: Snapshot | null = null;
sim.onSnapshot((s) => { last = s; });

const pid = sim.addPlayer("Faminto");
sim.tick();

const ent = (sim as any).entities.get(pid);
const containers = (sim as any).containers;
const items = (sim as any).items;
const bpId = ent.backpackContainerId;
const bp = containers.get(bpId);
function countOf(tid: string): number { return containers.countOf(items, bp, tid); }
function slotOfInstance(instId: number): number {
  return bp.slots.findIndex((s: any) => s?.kind === "item" && s.instanceId === instId);
}
function giveInstance(tid: string): number {
  const inst = items.create(tid);
  containers.add(bp, { kind: "item", instanceId: inst.id });
  return inst.id;
}

console.log("CONSUMÍVEIS (sim pura)\n");

console.log("== (1) poção cura, clampa e arma exausto ==");
{
  ent.maxHp = 100; ent.hp = 80; ent.nextItemUseAt = 0;
  const id = giveInstance("pocao_vida_pequena"); // heal 30, exhaust 1000ms
  const slot = slotOfInstance(id);
  sim.handleCommand(pid, { type: "useItem", ref: { kind: "container", containerId: bpId, slot } });
  ok(ent.hp === 100, `curou e clampou no max (80→${ent.hp}, +30 limitado)`);
  ok(countOf("pocao_vida_pequena") === 0, "poção consumida (1 unidade)");
  ok(ent.nextItemUseAt > (sim as any).now(), "exausto armado");
}

console.log("== (2) exausto bloqueia; após passar, cura de novo ==");
{
  ent.hp = 70;
  const id = giveInstance("pocao_vida_pequena");
  const slot = slotOfInstance(id);
  // Ainda exausto (mesmo tick): bloqueado.
  sim.handleCommand(pid, { type: "useItem", ref: { kind: "container", containerId: bpId, slot } });
  ok(ent.hp === 70 && countOf("pocao_vida_pequena") === 1, "exausto: cura bloqueada, poção intacta");
  // Passa o exausto (1000ms = 20 ticks) e tenta de novo.
  for (let i = 0; i < 25; i++) sim.tick();
  const slot2 = slotOfInstance(id);
  sim.handleCommand(pid, { type: "useItem", ref: { kind: "container", containerId: bpId, slot: slot2 } });
  ok(ent.hp === 100, `fora do exausto: curou (70→${ent.hp})`);
  ok(countOf("pocao_vida_pequena") === 0, "poção consumida após exausto");
}

console.log("== (3) curar com vida cheia é no-op ==");
{
  ent.hp = ent.maxHp; ent.nextItemUseAt = 0;
  const id = giveInstance("pocao_vida_pequena");
  const slot = slotOfInstance(id);
  sim.handleCommand(pid, { type: "useItem", ref: { kind: "container", containerId: bpId, slot } });
  ok(countOf("pocao_vida_pequena") === 1, "vida cheia: poção NÃO consumida");
}

console.log("== (4) comida aplica 'Bem Alimentado' e consome 1 do stack ==");
{
  ent.status = [];
  containers.addItemStackAware(items, bp, "queijo", 3); // garante um stack fungível
  const before = countOf("queijo");
  const slot = bp.slots.findIndex((s: any) => s?.kind === "stack" && s.templateId === "queijo");
  sim.handleCommand(pid, { type: "useItem", ref: { kind: "container", containerId: bpId, slot } });
  ok(wellFedRegenMult(ent) > 0, "status 'Bem Alimentado' ativo após comer");
  ok(countOf("queijo") === before - 1, `consumiu 1 queijo (${before}→${countOf("queijo")})`);
}

console.log("== (5) saciedade tem teto (anti-empanturramento) ==");
{
  const e: any = { status: [] };
  const capTicks = msToTicks(FOOD_SATIETY_CAP_MS);
  // Empanturra: várias comidas longas seguidas no mesmo instante.
  for (let i = 0; i < 10; i++) applyFood(e, 0, { regenMult: 1.0, durationMs: 200_000 });
  const fed = e.status.find((s: any) => s.kind === "wellFed");
  ok(!!fed, "tem 'Bem Alimentado'");
  ok(fed.expiresAtTick - 0 <= capTicks, `saciedade clampada no teto (${fed.expiresAtTick} ≤ ${capTicks})`);
}

console.log(failures === 0 ? "\nCONSUMÍVEIS OK." : `\n${failures} FALHA(S).`);
process.exit(failures === 0 ? 0 : 1);
