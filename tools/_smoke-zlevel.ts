/**
 * VERIFICADOR de FILTRAGEM POR ANDAR (z-level) na sim pura: entidades/objetos em
 * andares diferentes não se enxergam nem se afetam.
 *   (1) loja é z-gated — abre no mesmo andar, NÃO abre num andar diferente mesmo
 *       com x/y em alcance;
 *   (2) item no chão é z-filtrado — largado em z=0 não pode ser pego de z=-1;
 *   (3) alvo de combate é z-gated — monstro em outro andar não vira alvo do player.
 *
 * Setup: planta a Nina (NPC de comércio) ao lado do spawn (28,26) do testMap.
 *
 * Rodar:
 *   node tools/run-all-smokes.mjs zlevel
 *   # ou direto:
 *   npx esbuild tools/_smoke-zlevel.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-zlevel.cjs && node /tmp/smoke-zlevel.cjs
 */
import { Simulation } from "../src/sim/Simulation";
import { generateTestMap } from "../src/sim/maps/testMap";
import { CREATURES } from "../src/sim/bestiary";
import type { Snapshot } from "../src/shared/protocol";

let failures = 0;
function ok(cond: boolean, label: string): void {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
}

// Planta a Nina ao lado do spawn (28,26) — chebyshev ≤ 3, no baseZ do mundo.
const map = generateTestMap();
map.npcSpawns = [{ npcId: "nina", name: "Nina", x: 28, y: 24 }];

const sim = new Simulation(map);
let last: Snapshot | null = null;
sim.onSnapshot((s) => { last = s; });

const pid = sim.addPlayer("Andarilho");
sim.tick();

function me() { return last!.entities.find((e) => e.id === pid)!; }
const ent = (sim as any).entities.get(pid);
const containers = (sim as any).containers;
const bpId = me().backpackContainerId!;
const bp = containers.get(bpId);
function ground() { return last!.groundItems; }
function countOf(tid: string): number { return containers.countOf((sim as any).items, bp, tid); }

// A Nina plantada é a única entidade npc com npcKey "nina".
function ninaId(): number {
  for (const [id, e] of (sim as any).entities as Map<number, any>) {
    if (e.kind === "npc" && e.npcKey === "nina") return id;
  }
  return -1;
}

const baseZ = ent.z;
console.log(`ZLEVEL — filtragem por andar (sim pura). baseZ=${baseZ}\n`);

console.log("== (1) loja é z-gated ==");
{
  const nid = ninaId();
  ok(nid > 0, "Nina plantada no mundo");
  // Mesmo andar: abre.
  sim.handleCommand(pid, { type: "openShop", npcId: nid });
  sim.tick();
  ok(!!ent.activeShop, "mesmo andar: loja abre (NPC ≤ 3 tiles)");

  // Andar diferente: fecha o estado e tenta abrir de novo. x/y intactos, só o z muda.
  ent.activeShop = null;
  const npc = (sim as any).entities.get(nid);
  const cheb = Math.max(Math.abs(ent.pos.x - npc.pos.x), Math.abs(ent.pos.y - npc.pos.y));
  ent.z = -1; // desce o player um andar
  sim.handleCommand(pid, { type: "openShop", npcId: nid });
  sim.tick();
  ok(ent.activeShop == null, `andar diferente: loja NÃO abre (cheb=${cheb} ≤ 3, mas z difere)`);
  ent.z = baseZ; // restaura
}

console.log("== (2) item no chão é z-filtrado ==");
{
  // Garante o player no baseZ e larga uma pilha de queijo num tile vizinho.
  ent.z = baseZ;
  const slot = bp.slots.findIndex((s: any) => s?.kind === "stack" && s.templateId === "queijo");
  ok(slot >= 0, "queijo no bolso antes de largar");
  const target = { x: ent.pos.x + 1, y: ent.pos.y };
  sim.handleCommand(pid, {
    type: "moveItem",
    from: { kind: "container", containerId: bpId, slot },
    to: { kind: "ground", pos: target },
  });
  sim.tick();
  ok(ground().length === 1, `1 pilha no chão (got ${ground().length})`);
  ok(ground()[0]?.z === baseZ, "item caiu no andar do player (z=baseZ)");
  const gid = ground()[0].id;

  // Desce o player um andar e tenta pegar o MESMO item (que ficou em baseZ).
  ent.z = -1;
  sim.handleCommand(pid, {
    type: "moveItem",
    from: { kind: "ground", groundItemId: gid },
    to: { kind: "container", containerId: bpId, slot: 0 },
  });
  sim.tick();
  ok(ground().some((g) => g.id === gid), "pegar de andar diferente FALHA: item segue no chão");
  ok(countOf("queijo") === 0, "queijo NÃO entrou no bolso (player em z diferente)");

  // Controle: de volta ao mesmo andar, pega normalmente.
  ent.z = baseZ;
  sim.handleCommand(pid, {
    type: "moveItem",
    from: { kind: "ground", groundItemId: gid },
    to: { kind: "container", containerId: bpId, slot: 0 },
  });
  sim.tick();
  ok(ground().length === 0, "mesmo andar: pickup funciona (controle)");
  ok(countOf("queijo") === 5, "queijo de volta no bolso");
}

console.log("== (3) alvo de combate é z-gated ==");
{
  // Spawn de um rato adjacente ao player, no mesmo andar.
  ent.z = baseZ;
  const ratoPos = { x: ent.pos.x + 1, y: ent.pos.y };
  const mobId: number = (sim as any).spawnMonster(CREATURES.rato, ratoPos, baseZ);
  const mob = (sim as any).entities.get(mobId);
  ok(mob && mob.kind === "monster", "rato spawnado adjacente (mesmo andar)");

  // Andar diferente: selecionar o mob NÃO o torna alvo.
  mob.z = -1;
  ent.targetId = null;
  sim.handleCommand(pid, { type: "selectTarget", entityId: mobId });
  sim.tick();
  ok(ent.targetId == null, "andar diferente: monstro NÃO vira alvo");

  // Controle: mesmo andar, vira alvo.
  mob.z = baseZ;
  sim.handleCommand(pid, { type: "selectTarget", entityId: mobId });
  sim.tick();
  ok(ent.targetId === mobId, "mesmo andar: monstro vira alvo (controle)");
}

console.log(failures === 0 ? "\nZLEVEL OK." : `\n${failures} FALHA(S).`);
process.exit(failures === 0 ? 0 : 1);
