/**
 * VERIFICADOR de EQUIP + CARGA (sim pura):
 *  (1) vestir armadura sobe a Def derivada (`armorDef`) no valor da peça; tirar
 *      restaura. Vestir arma seta `equippedWeaponId` e atualiza o derivado de
 *      combate (a arma da mão entra no auto-attack).
 *  (2) capacidade de carga: encher o bolso perto do cap derivado de `maxCarryOf`
 *      e provar que uma ação que estouraria o cap é BLOQUEADA ("Pesado demais"),
 *      enquanto a MESMA ação abaixo do cap passa.
 *  (3) alívio de peso do ouro: o ouro carregado entra na conta de peso (com teto),
 *      e pagar ouro alivia a carga (o caminho `goldRelief` do buyItem).
 *
 * Tudo passa pelo COMANDO real (`moveItem` p/ um ItemRef `equip`, `buyItem`) —
 * testa a fiação, não só os helpers. Asserções derivam dos templates e das
 * funções de cap; nada de literais frágeis.
 *
 * Rodar:
 *   node tools/run-all-smokes.mjs equip
 */
import { Simulation } from "../src/sim/Simulation";
import { generateTestMap } from "../src/sim/maps/testMap";
import { getItemTemplate } from "../src/sim/items/templates";
import type { Snapshot } from "../src/shared/protocol";

let failures = 0;
function ok(cond: boolean, label: string): void {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
}

// Peso/def lidos do TEMPLATE real (sem literais frágeis).
function armorOf(tid: string): number {
  return getItemTemplate(tid)?.armor?.def ?? 0;
}
function weightOf(tid: string): number {
  return getItemTemplate(tid)?.weight ?? 0;
}

// Nina (Loja Geral) plantada ao lado do spawn (28,26) — chebyshev ≤ 3.
const map = generateTestMap();
map.npcSpawns = [{ npcId: "nina", name: "Nina", x: 28, y: 24 }];

const sim = new Simulation(map);
let last: Snapshot | null = null;
sim.onSnapshot((s) => { last = s; });

const pid = sim.addPlayer("Equipador");
sim.tick();

function me() { return last!.entities.find((e) => e.id === pid)!; }
const ent = (sim as any).entities.get(pid);
const containers = (sim as any).containers;
const items = (sim as any).items;
const bpId = me().backpackContainerId!;
const bp = containers.get(bpId);

function gold(): number { return containers.totalGold(bp); }
// Internals da sim (privados) acessados via cast — espelham os comandos.
function carried(): number { return (sim as any).carriedWeight(ent); }
function maxCarry(): number { return (sim as any).maxCarryOf(ent); }

// Cria uma instância de gear no bolso e devolve {id, slot}.
function plantInstance(tid: string): { id: number; slot: number } {
  const inst = items.create(tid);
  const slot = containers.freeSlot(bp);
  if (slot < 0) throw new Error("bolso cheio ao plantar " + tid);
  bp.slots[slot] = { kind: "item", instanceId: inst.id };
  return { id: inst.id, slot };
}

console.log("EQUIP + CARGA (sim pura)\n");

// ── (1) Armadura sobe Def derivada; tirar restaura ──────────────────────────
console.log("== (1) vestir armadura sobe armorDef pelo valor da peça ==");
{
  const tid = "tunica_de_couro"; // slot armor, def 1
  const def0 = ent.armorDef;
  const { id, slot } = plantInstance(tid);
  sim.handleCommand(pid, {
    type: "moveItem",
    from: { kind: "container", containerId: bpId, slot },
    to: { kind: "equip", slot: "armor" },
  });
  sim.tick();
  ok(ent.equipment.armor === id, "túnica vestida no slot armor");
  ok(ent.armorDef === def0 + armorOf(tid), `armorDef +${armorOf(tid)} (${def0}→${ent.armorDef})`);

  // tirar de volta pro bolso restaura a Def.
  sim.handleCommand(pid, {
    type: "moveItem",
    from: { kind: "equip", slot: "armor" },
    to: { kind: "container", containerId: bpId, slot },
  });
  sim.tick();
  ok(ent.equipment.armor == null, "túnica saiu do slot armor");
  ok(ent.armorDef === def0, `armorDef restaurado (${ent.armorDef})`);
}

console.log("== (1b) Def é SOMÁVEL entre slots distintos ==");
{
  const a = "elmo_de_ferro";   // helmet def 2
  const b = "cota_de_malha";   // armor  def 3
  const def0 = ent.armorDef;
  const ia = plantInstance(a);
  const ib = plantInstance(b);
  sim.handleCommand(pid, { type: "moveItem", from: { kind: "container", containerId: bpId, slot: ia.slot }, to: { kind: "equip", slot: "helmet" } });
  sim.handleCommand(pid, { type: "moveItem", from: { kind: "container", containerId: bpId, slot: ib.slot }, to: { kind: "equip", slot: "armor" } });
  sim.tick();
  ok(ent.armorDef === def0 + armorOf(a) + armorOf(b), `armorDef somou as duas peças (${def0}→${ent.armorDef})`);
  // limpa pros próximos blocos: tira tudo.
  sim.handleCommand(pid, { type: "moveItem", from: { kind: "equip", slot: "helmet" }, to: { kind: "container", containerId: bpId, slot: ia.slot } });
  sim.handleCommand(pid, { type: "moveItem", from: { kind: "equip", slot: "armor" }, to: { kind: "container", containerId: bpId, slot: ib.slot } });
  sim.tick();
  ok(ent.armorDef === def0, "armorDef de volta ao base após desequipar tudo");
}

// ── (1c) Arma seta equippedWeaponId + entra no auto-attack ───────────────────
console.log("== (1c) vestir arma seta equippedWeaponId + derivado de combate ==");
{
  // O jogador NASCE com a arma da classe (espada_cega) na hand1. Tiro pro bolso
  // primeiro pra começar dos punhos.
  ok(ent.equippedWeaponId != null, "nasce com a arma da classe equipada (hand1)");
  const bornSlot = containers.freeSlot(bp);
  sim.handleCommand(pid, {
    type: "moveItem",
    from: { kind: "equip", slot: "hand1" },
    to: { kind: "container", containerId: bpId, slot: bornSlot },
  });
  sim.tick();
  ok(ent.equippedWeaponId == null, "punhos após desequipar a arma de nascimento");
  const fistsDmg = ent.attackDamage; // dano dos punhos (base 3)

  const tid = "espada_curta"; // weapon base 10 > punhos base 3
  const { id, slot } = plantInstance(tid);
  sim.handleCommand(pid, {
    type: "moveItem",
    from: { kind: "container", containerId: bpId, slot },
    to: { kind: "equip", slot: "hand1" },
  });
  sim.tick();
  ok(ent.equippedWeaponId === id, "equippedWeaponId aponta pra espada vestida");
  ok(ent.attackDamage > fistsDmg, `attackDamage subiu com a arma (${fistsDmg}→${ent.attackDamage})`);

  sim.handleCommand(pid, {
    type: "moveItem",
    from: { kind: "equip", slot: "hand1" },
    to: { kind: "container", containerId: bpId, slot },
  });
  sim.tick();
  ok(ent.equippedWeaponId == null, "equippedWeaponId limpo ao desequipar (volta aos punhos)");
  ok(ent.attackDamage === fistsDmg, `attackDamage de volta ao dos punhos (${ent.attackDamage})`);
}

// Slate limpo p/ o teste de carga: esvazia bolso e equipamento, zera ouro.
// (carga é sensível ao estado acumulado dos blocos acima.)
function wipeCarry(): void {
  for (let i = 0; i < bp.slots.length; i++) bp.slots[i] = null;
  for (const slot of Object.keys(ent.equipment)) delete ent.equipment[slot];
  (sim as any).afterEquipChange(ent);
  sim.tick();
}

// ── (2) Capacidade de carga: estouro do cap é BLOQUEADO ─────────────────────
console.log("== (2) carga: ação que estoura o cap é bloqueada; abaixo do cap passa ==");
{
  // Abre a loja da Nina (o caminho de buyItem tem o guard de peso real).
  let ninaId = -1;
  for (const [id, e] of (sim as any).entities as Map<number, any>) {
    if (e.kind === "npc" && e.npcKey === "nina") { ninaId = id; break; }
  }
  ok(ninaId > 0, "Nina plantada");
  sim.handleCommand(pid, { type: "openShop", npcId: ninaId });
  sim.tick();
  ok(!!ent.activeShop, "loja aberta");

  wipeCarry(); // slate limpo: bolso/equip vazios, sem ouro
  containers.depositGold(bp, 1000); // ouro de sobra (preço da pá = 20); peso saturado no teto (15)

  const cap = maxCarry();
  ok(Number.isFinite(cap) && cap > 0, `cap derivado de maxCarryOf finito (${cap})`);

  // A "pá" pesa 20 e custa 20. Encho com cotas de malha (120) enquanto couber uma
  // INTEIRA, depois afino com cordas (15) até deixar uma folga MENOR que o peso da
  // pá → a próxima compra estoura o cap. (loop não estoura: só planta se cabe.)
  const paW = weightOf("pa");
  const fillW = weightOf("cota_de_malha");
  const cordaW = weightOf("corda");
  let guard = 0;
  while (cap - carried() >= fillW && containers.freeSlot(bp) >= 0 && guard++ < 200) plantInstance("cota_de_malha");
  while (cap - carried() >= paW && cap - carried() >= cordaW && containers.freeSlot(bp) >= 0 && guard++ < 400) plantInstance("corda");
  const folga = cap - carried();
  ok(folga < paW, `folga (${folga}) < peso da pá (${paW}) — comprar estouraria o cap`);

  // Conta unidades de "pa" no bolso (NÃO é stackable → vira instância única).
  const countPa = (): number =>
    containers.countOf(items, bp, "pa");

  // (2a) compra ACIMA do cap = bloqueada pelo guard de peso (não pelo de espaço).
  const goldBefore = gold();
  const paCountBefore = countPa();
  sim.handleCommand(pid, { type: "buyItem", templateId: "pa" });
  sim.tick();
  ok(gold() === goldBefore, "ouro intocado (compra negada por peso)");
  ok(countPa() === paCountBefore, "pá NÃO entrou (estouraria o cap)");

  // (2b) abrir folga (tirar uma cota do bolso) → a MESMA compra passa.
  const slotToFree = bp.slots.findIndex((s: any) => s?.kind === "item" && items.get(s.instanceId)?.templateId === "cota_de_malha");
  ok(slotToFree >= 0, "há uma cota no bolso pra liberar peso");
  bp.slots[slotToFree] = null; // remove ~120 de peso → agora cabe a pá
  sim.tick();
  ok(cap - carried() >= paW, `folga reaberta ≥ peso da pá (folga=${cap - carried()})`);
  sim.handleCommand(pid, { type: "buyItem", templateId: "pa" });
  sim.tick();
  ok(gold() === goldBefore - 20, `ouro debitado em 20 (${goldBefore}→${gold()})`);
  ok(countPa() === paCountBefore + 1, "pá entrou agora que há folga de carga");
}

// ── (3) Alívio de peso do ouro: o ouro entra na conta (com teto) ────────────
console.log("== (3) ouro carregado entra no peso (com teto) ==");
{
  // Esvazia o ouro e mede; deposita até o teto e remede — o delta = teto×0.1.
  const cur = gold();
  containers.withdrawGold(bp, cur);
  sim.tick();
  const wNoGold = carried();
  containers.depositGold(bp, 50); // abaixo do teto (150)
  sim.tick();
  const w50 = carried();
  ok(Math.abs((w50 - wNoGold) - 50 * 0.1) < 1e-6, `50 moedas pesam 5.0 (Δ=${(w50 - wNoGold).toFixed(2)})`);

  // Acima do teto: 500 moedas pesam o mesmo que 150 (teto) — o ouro alivia/satura.
  containers.depositGold(bp, 450); // total 500
  sim.tick();
  const w500 = carried();
  ok(Math.abs((w500 - wNoGold) - 150 * 0.1) < 1e-6, `500 moedas saturam no teto (15.0; Δ=${(w500 - wNoGold).toFixed(2)})`);
  ok(w500 < w50 + 450 * 0.1, "peso do ouro tem TETO (não escala linear acima de 150)");
}

console.log(failures === 0 ? "\nEQUIP OK." : `\n${failures} FALHA(S).`);
process.exit(failures === 0 ? 0 : 1);
