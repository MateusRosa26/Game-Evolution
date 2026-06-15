/**
 * VERIFICADOR de ECONOMIA DE MANA (sim pura):
 *  (1) cast-time cobra a mana NO INÍCIO (independe de alvo);
 *  (2) mana insuficiente bloqueia o cast (sem débito);
 *  (3) cast cancelado por mover NÃO reembolsa (política atual);
 *  (4) regen é GATED por comida: sem "Bem Alimentado" o pulso é vazio (0);
 *      com comida regenera e CLAMPa no máximo (testado como unidade pura).
 *
 * Usa garras_da_terra (groundTarget, cast-time 800ms, custo 18) concedida via
 * debugGrantSkill. NB: o spawn do testMap é ZONA SEGURA (skill ofensiva é
 * bloqueada lá) — o teste move o caster pra fora antes de conjurar.
 *
 * Rodar:
 *   npx esbuild tools/_smoke-mana.ts --bundle --platform=node \
 *     --outfile=/tmp/smoke-mana.cjs && node /tmp/smoke-mana.cjs
 */
import { Simulation } from "../src/sim/Simulation";
import { generateTestMap } from "../src/sim/maps/testMap";
import { createProgression, regenTick } from "../src/sim/progression";
import { applyFood, wellFedRegenMult } from "../src/sim/skills/status";
import type { Snapshot } from "../src/shared/protocol";

let failures = 0;
function ok(cond: boolean, label: string): void {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
}

const sim = new Simulation(generateTestMap());
let last: Snapshot | null = null;
sim.onSnapshot((s) => { last = s; });

const pid = sim.addPlayer("Conjurador", "mage");
sim.tick();

const ent = (sim as any).entities.get(pid);
const SKILL = "earthen_grasp"; // "Garras da Terra" (ids de skill são em inglês)
const COST = 18;
sim.handleCommand(pid, { type: "debugGrantSkill", skillId: SKILL });

// Tira o caster da zona segura do spawn (skill ofensiva não sai de dentro).
ent.pos = { x: 35, y: 26 };

function reset(mp: number): void {
  ent.mp = mp;
  ent.maxMp = Math.max(mp, 100);
  ent.casting = null;
  ent.skillCooldowns = {};
}

console.log("ECONOMIA DE MANA (sim pura)\n");

console.log("== (1) cast-time cobra mana no início ==");
{
  reset(100);
  sim.handleCommand(pid, { type: "useSkill", skillId: SKILL, aim: { x: ent.pos.x + 2, y: ent.pos.y } });
  sim.tick();
  ok(ent.mp === 100 - COST, `mp debitado em ${COST} (100→${ent.mp})`);
}

console.log("== (2) mana insuficiente bloqueia ==");
{
  reset(5); // < custo
  sim.handleCommand(pid, { type: "useSkill", skillId: SKILL, aim: { x: ent.pos.x + 2, y: ent.pos.y } });
  sim.tick();
  ok(ent.mp === 5, "mp intocado (cast negado por mana)");
}

console.log("== (3) cast cancelado por mover NÃO reembolsa ==");
{
  reset(100);
  sim.handleCommand(pid, { type: "useSkill", skillId: SKILL, aim: { x: ent.pos.x + 2, y: ent.pos.y } });
  sim.tick();
  const afterCast = ent.mp;
  ok(afterCast === 82 && !!ent.casting, `cast armado, mp já cobrado (${afterCast})`);
  sim.handleCommand(pid, { type: "walkTo", x: ent.pos.x + 3, y: ent.pos.y });
  sim.tick();
  ok(!ent.casting, "conjuração cancelada ao mover");
  ok(ent.mp === afterCast, "mp NÃO reembolsado (política atual)");
}

console.log("== (4) regen é gated por comida (unidade pura) ==");
{
  // Entidade mínima controlada: regenTick só toca dead/hp/maxHp/mp/maxMp/status.
  const prog = createProgression("mage");
  prog.level = 20; // garante chunk de regen > 0 (em lvl 1 arredondaria a 0)
  const e: any = { dead: false, hp: 50, maxHp: 300, mp: 50, maxMp: 300, status: [] };

  ok(wellFedRegenMult(e) === 0, "sem 'Bem Alimentado' → multiplicador 0");
  // 3 pulsos de regen (REGEN a cada 5s = 100 ticks) sem comida → nada muda.
  for (let i = 0; i < 320; i++) regenTick(prog, e);
  ok(e.mp === 50 && e.hp === 50, "sem comida: regen 0 (HP e mana)");

  // Aplica "Bem Alimentado" e repete → regenera.
  applyFood(e, 0, { regenMult: 1.0, durationMs: 600_000 });
  ok(wellFedRegenMult(e) > 0, "com comida → multiplicador > 0");
  const mp0 = e.mp, hp0 = e.hp;
  for (let i = 0; i < 320; i++) regenTick(prog, e);
  ok(e.mp > mp0, `com comida: mana regenera (${mp0}→${e.mp})`);
  ok(e.hp > hp0, `com comida: HP regenera (${hp0}→${e.hp})`);

  // Clamp: enche e confirma que não passa do máximo.
  e.mp = e.maxMp - 1; e.hp = e.maxHp - 1;
  for (let i = 0; i < 320; i++) regenTick(prog, e);
  ok(e.mp === e.maxMp && e.hp === e.maxHp, "regen clampa no máximo (não estoura)");
}

console.log(failures === 0 ? "\nMANA OK." : `\n${failures} FALHA(S).`);
process.exit(failures === 0 ? 0 : 1);
