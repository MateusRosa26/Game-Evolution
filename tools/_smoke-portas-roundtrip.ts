/**
 * VERIFICADOR SUPLEMENTAR — Portas v2: fecha os 2 buracos que o
 * `_smoke-portas-tibia.ts` sub-prova:
 *   (A) COBERTURA: varre TODO `buildings` (footprints) e acusa estruturas com
 *       vão-andável na parede mas SEM DoorDef (pega "casa entrável esquecida",
 *       não só os 14 ids hardcoded). Informativo: lista as exceções.
 *   (B) ROUND-TRIP: numa casa destrancada (Loja), o player ENTRA e SAI — prova
 *       que ninguém fica preso (req. 5), atravessando a porta nos dois sentidos.
 *
 * Rodar:
 *   npx esbuild tools/_smoke-portas-roundtrip.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-rt.cjs && node /tmp/smoke-rt.cjs
 */
import { Simulation } from "../src/sim/Simulation";
import { World } from "../src/sim/World";
import { generateAlvoradaMap } from "../src/sim/maps/alvorada";
import type { Snapshot } from "../src/shared/protocol";
import { TileId, type MapData, type Vec2 } from "../src/shared/types";

const PASS = "✅", FAIL = "❌", WARN = "⚠️";
let failures = 0;
const issues: string[] = [];
function check(label: string, cond: boolean, detail?: string): void {
  console.log(`  ${cond ? PASS : FAIL} ${label}`);
  if (!cond) { failures++; issues.push(detail ?? label); }
}

const map: MapData = generateAlvoradaMap();
const world = new World(map);
const doors = map.doors ?? [];
const buildings = map.buildings ?? [];
const doorTileSet = new Set(doors.map((d) => `${d.pos.x},${d.pos.y}`));

console.log("VERIFICADOR SUPLEMENTAR — portas v2 (cobertura + round-trip)\n");

// ════ (A) COBERTURA: footprint com vão-andável na parede deve ter DoorDef ════
console.log("(A) Cobertura (todo footprint com vão tem DoorDef?):");
// Um "vão de porta" = tile ANDÁVEL (StoneFloor) na BORDA do footprint cercado de
// HouseWall (passagem pra dentro). Toda estrutura que tem vão deveria, no feel
// Tibia, ter uma DoorDef nesse tile. Aqui varremos os perímetros e listamos os
// vãos SEM DoorDef — para o revisor decidir se é "casa entrável" ou POI aberto.
// Filtra os FALSOS-POSITIVOS de "perímetro StoneFloor": prédios que se TOCAM
// pintam o chão de um sobre a parede do outro, então a borda fica StoneFloor sem
// ser uma porta. Um VÃO-DE-PORTA verdadeiro = breach na parede que conecta
// INTERIOR (StoneFloor dentro) ↔ EXTERIOR (grama/dirt/rua fora do footprint), com
// HouseWall dos dois lados ao longo da parede. Olhamos a normal da borda.
const isOutdoor = (x: number, y: number): boolean => {
  const t = world.tileAt(x, y, 0);
  return t === TileId.Grass || t === TileId.Dirt; // fora de qualquer footprint
};
const gapsSemPorta: string[] = [];
for (const b of buildings) {
  const x0 = b.x, y0 = b.y, x1 = b.x + b.w - 1, y1 = b.y + b.h - 1;
  // (borda, normal-para-fora dx/dy)
  const edges: { p: Vec2; out: Vec2 }[] = [];
  for (let x = x0; x <= x1; x++) {
    edges.push({ p: { x, y: y0 }, out: { x: 0, y: -1 } }, { p: { x, y: y1 }, out: { x: 0, y: 1 } });
  }
  for (let y = y0 + 1; y < y1; y++) {
    edges.push({ p: { x: x0, y }, out: { x: -1, y: 0 } }, { p: { x: x1, y }, out: { x: 1, y: 0 } });
  }
  for (const { p, out } of edges) {
    if (world.tileAt(p.x, p.y, 0) !== TileId.StoneFloor || !world.isWalkable(p.x, p.y, 0)) continue;
    const outsideOut = isOutdoor(p.x + out.x, p.y + out.y); // fora = grama/dirt
    const insideIn = world.tileAt(p.x - out.x, p.y - out.y, 0) === TileId.StoneFloor; // dentro = chão
    // vão real só se abre pra fora E tem interior atrás (não é parede compartilhada)
    if (outsideOut && insideIn && !doorTileSet.has(`${p.x},${p.y}`)) {
      gapsSemPorta.push(`(${p.x},${p.y}) no footprint (${x0},${y0})-(${x1},${y1})`);
    }
  }
}
// As 14 portas de BUILDINGS já são cobertas (provadas no outro smoke). Aqui o
// objetivo é zero SURPRESA: nenhum vão órfão. Se houver, é review humano (pode
// ser POI aberto de propósito — moinho/celeiros), por isso NÃO derruba o build.
if (gapsSemPorta.length === 0) {
  check(`nenhum vão-andável órfão (toda parede vazada tem DoorDef)`, true);
} else {
  console.log(`  ${WARN} ${gapsSemPorta.length} vão(s) andável(is) SEM DoorDef (review humano — POI aberto?):`);
  for (const g of gapsSemPorta) console.log(`       - ${g}`);
  issues.push(`${gapsSemPorta.length} vão(s) sem DoorDef (review): ${gapsSemPorta.join(" | ")}`);
}
// E o invariante duro: TODA DoorDef cai num tile andável marcado isDoorTile.
let badDoor = 0;
for (const d of doors) {
  if (!(world.isWalkable(d.pos.x, d.pos.y, d.z) && world.isDoorTile(d.pos.x, d.pos.y, d.z))) badDoor++;
}
check(`toda DoorDef em tile andável + isDoorTile`, badDoor === 0, `${badDoor} DoorDef(s) em tile ruim`);

// ════ harness de sim ════
let snap: Snapshot | null = null;
const sim = new Simulation(generateAlvoradaMap());
sim.onSnapshot((sn) => { snap = sn; });
const pid = sim.addPlayer("Visitante");
sim.tick();
function posOf(): Vec2 {
  const me = snap?.entities.find((e) => e.id === pid);
  return me ? me.pos : { x: -1, y: -1 };
}
function doorOpen(id: string): boolean {
  return snap?.doors.find((d) => d.id === id)?.open ?? false;
}
function walkToward(x: number, y: number, budget: number): Vec2 {
  sim.handleCommand(pid, { type: "walkTo", x, y });
  for (let i = 0; i < budget; i++) {
    sim.tick();
    const p = posOf();
    if (p.x === x && p.y === y) break;
  }
  return posOf();
}

// ════ (B) ROUND-TRIP numa casa DESTRANCADA (Loja) ════
console.log("\n(B) Round-trip (entra E sai de uma casa destrancada):");
// 1) libertar o player do tutorial (nasce trancado na casa inicial):
sim.handleCommand(pid, { type: "openChest", chestId: "casa_inicial_bau" }); // ganha a chave
sim.tick();
const lojaDoor = doors.find((d) => d.id === "porta_loja")!;
const casaDoor = doors.find((d) => d.id === "porta_casa_inicial")!;
// sai da casa inicial pelo SUL (porta city(28,46)=world(128,126); interior ao N)
const outside = walkToward(casaDoor.pos.x, casaDoor.pos.y + 2, 400);
check(`saiu da casa inicial (chegou a (${outside.x},${outside.y}), y≥${casaDoor.pos.y})`,
  outside.y >= casaDoor.pos.y, `não saiu da casa inicial — (${outside.x},${outside.y})`);

// 2) ENTRA na Loja: porta world (124,118), interior 1 tile ao N (124,117)
const startPos = posOf();
const lojaInside: Vec2 = { x: lojaDoor.pos.x, y: lojaDoor.pos.y - 1 };
check(`porta_loja começa FECHADA`, !doorOpen("porta_loja"), `já estava aberta`);
const inPos = walkToward(lojaInside.x, lojaInside.y, 500);
check(`ENTROU na Loja (chegou ao interior (${inPos.x},${inPos.y}))`,
  inPos.x === lojaInside.x && inPos.y === lojaInside.y,
  `não entrou na Loja — parou em (${inPos.x},${inPos.y}) (começou em ${startPos.x},${startPos.y})`);
check(`porta_loja abriu ao entrar`, doorOpen("porta_loja"), `porta_loja não abriu no anda-pra-abrir`);

// 3) SAI da Loja: volta pro vão e 2 tiles ao S (de volta à rua). Prova que não prende.
const backPos = walkToward(lojaDoor.pos.x, lojaDoor.pos.y + 2, 500);
check(`SAIU da Loja de volta à rua (chegou a (${backPos.x},${backPos.y}), y>${lojaDoor.pos.y})`,
  backPos.y > lojaDoor.pos.y,
  `ficou preso na Loja — parou em (${backPos.x},${backPos.y})`);
check(`o player de fato se moveu nos dois sentidos (entrou ≠ saiu)`,
  !(inPos.x === backPos.x && inPos.y === backPos.y),
  `posição final == posição interior — não houve saída real`);

console.log(`\n${failures === 0 ? PASS + " TODOS OS CHECKS DUROS PASSARAM" : FAIL + ` ${failures} CHECK(S) FALHARAM`}`);
if (issues.length) { console.log("\nNOTAS/ISSUES:"); for (const i of issues) console.log(`  - ${i}`); }
process.exit(failures === 0 ? 0 : 1);
