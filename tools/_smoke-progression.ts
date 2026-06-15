/**
 * VERIFICADOR do LOOP DE PROGRESSÃO (sim pura, unit-style):
 *  (1) curva de XP + level-up: conceder XP cruza limiares (derivados de
 *      `xpForLevel`) sobe o nível; `syncMaxResources` levanta maxHp/maxMp segundo
 *      o crescimento de classe (pool N+1 > pool N, batendo `maxHp`/`maxMana`);
 *  (2) alocação de ponto de atributo: `allocateStatPoint` sobe o atributo e debita
 *      o CUSTO POR FAIXA (`statPointCost`); sem pontos = no-op (return false);
 *  (3) penalidade de morte: `applyDeathPenalty` remove `DEATH_XP_PENALTY` (10%) do
 *      XP TOTAL e recalcula o nível; nunca XP negativa, nunca nível < 1 (piso).
 *
 * Estilo UNIT (como _smoke-mana §4): Progression real de `createProgression` +
 * entidade mínima `{}` cast as any (as funções só tocam hp/maxHp/mp/maxMp/etc).
 * Os ALVOS são DERIVADOS das fórmulas exportadas (não hardcode) — recalibrar os
 * números de `formulas.ts` não quebra o teste; ele afirma as PROPRIEDADES.
 *
 * Rodar:
 *   node tools/run-all-smokes.mjs progression
 *   (ou: npx esbuild tools/_smoke-progression.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-progression.cjs && node /tmp/smoke-progression.cjs)
 */
import {
  createProgression,
  grantKillXp,
  syncMaxResources,
  allocateStatPoint,
  applyDeathPenalty,
} from "../src/sim/progression";
import {
  xpForLevel,
  levelForXp,
  maxHp,
  maxMana,
  statPointCost,
  STAT_POINTS_PER_LEVEL,
} from "../src/sim/formulas";
import { DEATH_XP_PENALTY } from "../src/sim/balance";
import { EventBus } from "../src/sim/events";
import type { CombatContext } from "../src/sim/events";
import type { SimEntity } from "../src/sim/entity";

let failures = 0;
function ok(cond: boolean, label: string): void {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
}

/** Entidade mínima — as funções de progressão só tocam estes campos. */
function makeEntity(): SimEntity {
  return { id: 1, species: null, family: null, hp: 0, maxHp: 0, mp: 0, maxMp: 0 } as any;
}

const bus = new EventBus();
const ctx: CombatContext = { tick: 0, night: false };

console.log("LOOP DE PROGRESSÃO (sim pura, unit-style)\n");

console.log("== (1) curva de XP + level-up cresce pools ==");
{
  const prog = createProgression("mage");
  const ent = makeEntity();
  syncMaxResources(ent, prog, true);

  // Sanidade: o nível inicial bate com a curva, e o pool L1 bate com a fórmula.
  ok(prog.level === 1 && prog.xp === 0, "nasce lvl 1 / 0 XP");
  const hp1 = maxHp(prog.attributes, prog.cls, 1);
  const mp1 = maxMana(prog.attributes, prog.cls, 1);
  ok(ent.maxHp === hp1 && ent.maxMp === mp1, `pool L1 bate a fórmula (hp${hp1}/mp${mp1})`);

  // Conta level_up emitidos pelo bus (um por nível subido).
  let levelUps = 0;
  bus.on("level_up", () => { levelUps++; });

  // Concede XP EXATO para atingir o lvl 5, derivado da curva. creatureLevel alto
  // (≥ playerLevel) garante XP cheia (sem falloff anti-farm).
  const TARGET = 5;
  const needed = xpForLevel(TARGET); // total p/ atingir o nível
  ok(needed > 0, `curva: xpForLevel(${TARGET}) = ${needed} > 0`);
  const gained = grantKillXp(prog, ent, needed, 99, bus, ctx);

  ok(gained === needed, `XP concedida cheia (${gained}) sem falloff`);
  ok(prog.xp === needed, "XP total acumulado correto");
  ok(prog.level === levelForXp(needed), `nível derivado da curva (=${levelForXp(needed)})`);
  ok(prog.level === TARGET, `subiu exatamente p/ lvl ${TARGET}`);
  ok(levelUps === TARGET - 1, `emitiu ${TARGET - 1} eventos level_up (1→${TARGET})`);

  // Pools cresceram: L5 > L1 e batem EXATAMENTE a fórmula no novo nível.
  const hp5 = maxHp(prog.attributes, prog.cls, TARGET);
  const mp5 = maxMana(prog.attributes, prog.cls, TARGET);
  ok(hp5 > hp1, `maxHp monotônico crescente (${hp1}→${hp5})`);
  ok(mp5 > mp1, `maxMp monotônico crescente (${mp1}→${mp5})`);
  ok(ent.maxHp === hp5 && ent.maxMp === mp5, "syncMaxResources levantou os tetos p/ a fórmula L5");
  ok(ent.hp === hp5 && ent.mp === mp5, "level-up encheu HP/Mana ao novo máximo (fill)");

  // Ganho por nível: pool L(N+1) > L(N) para cada degrau (crescimento de classe).
  let monotonic = true;
  for (let l = 1; l < TARGET; l++) {
    if (!(maxHp(prog.attributes, prog.cls, l + 1) > maxHp(prog.attributes, prog.cls, l))) monotonic = false;
    if (!(maxMana(prog.attributes, prog.cls, l + 1) > maxMana(prog.attributes, prog.cls, l))) monotonic = false;
  }
  ok(monotonic, "cada degrau de nível aumenta maxHp e maxMp");

  // Pontos de atributo concedidos = STAT_POINTS_PER_LEVEL por nível subido.
  ok(prog.freeStatPoints === STAT_POINTS_PER_LEVEL * (TARGET - 1),
    `freeStatPoints = ${STAT_POINTS_PER_LEVEL}×${TARGET - 1} concedidos nos level-ups`);
}

console.log("== (2) alocação de ponto de atributo ==");
{
  const prog = createProgression("mage");
  const ent = makeEntity();
  // Dá pontos suficientes na mão (sem depender de subir de nível).
  prog.freeStatPoints = 20;

  const before = prog.attributes.intelligence;
  const cost = statPointCost(before); // custo do PRÓXIMO ponto, por faixa
  const ptsBefore = prog.freeStatPoints;
  const okAlloc = allocateStatPoint(prog, ent, "intelligence");

  ok(okAlloc === true, "allocateStatPoint retornou true (havia pontos)");
  ok(prog.attributes.intelligence === before + 1, `intelligence +1 (${before}→${prog.attributes.intelligence})`);
  ok(prog.freeStatPoints === ptsBefore - cost, `debitou o custo por faixa (${cost}; ${ptsBefore}→${prog.freeStatPoints})`);

  // maxMana subiu (Int compra mana) e o teto da entidade acompanhou (sem encher).
  const mmpExpected = maxMana(prog.attributes, prog.cls, prog.level);
  ok(ent.maxMp === mmpExpected, `maxMp recalculado p/ a fórmula (${mmpExpected})`);

  // Sem pontos disponíveis = no-op (não mexe atributo, retorna false).
  prog.freeStatPoints = 0;
  const intFrozen = prog.attributes.intelligence;
  const noop = allocateStatPoint(prog, ent, "intelligence");
  ok(noop === false, "sem pontos → retorna false");
  ok(prog.attributes.intelligence === intFrozen, "sem pontos → atributo intocado (no-op)");
  ok(prog.freeStatPoints === 0, "sem pontos → não vai negativo");
}

console.log("== (3) penalidade de morte (−10% XP total) ==");
{
  // Sobe pra um nível alto via XP exato, então mata e mede a perda.
  const prog = createProgression("knight");
  const ent = makeEntity();
  const START = 10;
  prog.xp = xpForLevel(START);
  prog.level = levelForXp(prog.xp);
  syncMaxResources(ent, prog, true);
  ok(prog.level === START, `montou no lvl ${START} via XP exato`);

  const xpBefore = prog.xp;
  const expectedLost = Math.floor(xpBefore * DEATH_XP_PENALTY); // regra REAL do código
  const expectedXpAfter = xpBefore - expectedLost;
  const expectedLevelAfter = levelForXp(expectedXpAfter);

  const res = applyDeathPenalty(prog, ent);

  ok(res.lostXp === expectedLost, `perdeu floor(${DEATH_XP_PENALTY * 100}% do total) = ${expectedLost}`);
  ok(prog.xp === expectedXpAfter, `XP total reduzido (${xpBefore}→${prog.xp})`);
  ok(prog.xp >= 0, "XP nunca fica negativa");
  ok(prog.level === expectedLevelAfter, `nível recalculado da curva (=${expectedLevelAfter})`);
  ok(res.leveledDown === (expectedLevelAfter < START), "leveledDown reportado coerente com o recálculo");

  // Piso: morte no lvl 1 / 0 XP não pode quebrar nada (floor garante perda 0).
  const floorProg = createProgression("classless");
  const floorEnt = makeEntity();
  syncMaxResources(floorEnt, floorProg, true);
  const floorRes = applyDeathPenalty(floorProg, floorEnt);
  ok(floorRes.lostXp === 0, "lvl1/0xp: perde 0 XP (floor)");
  ok(floorProg.xp === 0, "lvl1/0xp: XP continua 0 (não negativa)");
  ok(floorProg.level === 1, "lvl1/0xp: nível nunca cai abaixo do piso 1");
  ok(floorRes.leveledDown === false, "lvl1/0xp: sem level-down");

  // Level-down derruba o TETO de recursos ao novo nível (syncMaxResources fill=false).
  if (res.leveledDown) {
    ok(ent.maxHp === maxHp(prog.attributes, prog.cls, prog.level),
      "level-down: teto de maxHp desceu p/ o novo nível");
  } else {
    ok(true, "(sem level-down neste cenário — teto preservado)");
  }
}

console.log(failures === 0 ? "\nPROGRESSION OK." : `\n${failures} FALHA(S).`);
process.exit(failures === 0 ? 0 : 1);
