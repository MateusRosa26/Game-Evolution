/**
 * VERIFICADOR de STATUS EFFECTS (sim pura, estilo-unidade):
 *  (1) DoT (burn): aplica dano PERIÓDICO (a cada intervalo, não todo tick), o
 *      total = damagePerTick × nº de intervalos da duração, e EXPIRA (sem dano
 *      depois do fim);
 *  (2) stacking/refresh: reaplicar o mesmo DoT NÃO empilha — refresca a duração e
 *      fica com o MAIOR damagePerTick (status.ts:106-114);
 *  (3) controle (slow): seta o stepMs efetivo (naturalStepMs × multiplicador via
 *      recomputeStepMs) e LIMPA na expiração (stepMs volta ao natural);
 *      + root: seta a flag isRooted e limpa após a duração.
 *
 * Testa o MÓDULO status.ts direto (applyDot/applySlow/applyRoot/tickStatus são
 * puros e determinísticos) com entidade montada à mão e um CombatCtx mínimo.
 * Expectativas DERIVADAS dos campos do efeito (damagePerTick/intervalMs/durationMs)
 * — sem números mágicos.
 *
 * Rodar:
 *   node tools/run-all-smokes.mjs status
 */
import { TICK_MS, msToTicks } from "../src/shared/constants";
import {
  applyDot,
  applySlow,
  applyRoot,
  tickStatus,
  recomputeStepMs,
  isRooted,
  hasStatus,
  type DotParams,
} from "../src/sim/skills/status";
import type { CombatCtx } from "../src/sim/combat";

let failures = 0;
function ok(cond: boolean, label: string): void {
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}`);
  if (!cond) failures++;
}

/** Entidade mínima que o status.ts toca (cast `any` — não é a SimEntity completa). */
function makeEntity(): any {
  return {
    id: 1,
    dead: false,
    hp: 1000,
    maxHp: 1000,
    status: [],
    naturalStepMs: 250, // BASE_WALK_MS
    baseStepMs: 250,
    pos: { x: 0, y: 0 },
    species: "test",
    family: "test",
  };
}

/** CombatCtx mínimo: tick mutável + sinks no-op. applyDamage só usa bus/pending/lookup/rng. */
function makeCtx(): { ctx: CombatCtx; setTick: (t: number) => void } {
  const ctx: any = {
    bus: { emit: () => {} },
    tick: 0,
    pending: [],
    night: false,
    lookup: () => undefined, // sem fonte → DoT usa a própria entidade (status.ts:390)
    rng: () => 0.999, // alto: nunca bloqueia (target não tem block de qualquer forma)
  };
  return { ctx, setTick: (t: number) => { ctx.tick = t; } };
}

console.log("STATUS EFFECTS (sim pura, estilo-unidade)\n");

// ── (1) DoT periódico + total + expiração ──────────────────────────────────
console.log("== (1) DoT (burn): dano periódico, total e expiração ==");
{
  const e = makeEntity();
  const { ctx, setTick } = makeCtx();

  const dot: DotParams = {
    kind: "burn",
    damagePerTick: 12,
    durationMs: 2000, // 40 ticks
    intervalMs: 500, // 10 ticks
    damageType: "fire",
  };
  const intervalTicks = msToTicks(dot.intervalMs);
  const durationTicks = msToTicks(dot.durationMs);
  // Aplicado no tick 0; expira em 0+durationTicks. Tiques de dano em 10,20,30 (o
  // de 40 NÃO conta: tickStatus exige tick < expiresAtTick, e 40 = expira).
  const expectedIntervals = Math.floor((durationTicks - 1) / intervalTicks);
  const expectedTotal = dot.damagePerTick * expectedIntervals;

  setTick(0);
  applyDot(e, 0, e, "fireball", dot);
  ok(hasStatus(e, "burn"), "burn aplicado");

  const hp0 = e.hp;
  // Avança um tick além da duração e conta as quedas de HP e em QUAIS ticks caíram.
  const damageTicks: number[] = [];
  let prevHp = e.hp;
  for (let t = 1; t <= durationTicks + 5; t++) {
    setTick(t);
    tickStatus(ctx, e);
    if (e.hp < prevHp) { damageTicks.push(t); prevHp = e.hp; }
  }

  ok(damageTicks.length === expectedIntervals,
    `aplicou em ${expectedIntervals} intervalos (caiu em ticks [${damageTicks.join(",")}])`);
  ok(damageTicks.every((t) => t % intervalTicks === 0),
    "dano só em fronteiras de intervalo (não todo tick)");
  ok(hp0 - e.hp === expectedTotal,
    `total = damagePerTick × intervalos = ${dot.damagePerTick}×${expectedIntervals} = ${expectedTotal} (real ${hp0 - e.hp})`);
  ok(!hasStatus(e, "burn"), "burn REMOVIDO após a duração");

  // Sem dano além da expiração: avança mais e confirma HP estável.
  const hpAfter = e.hp;
  for (let t = durationTicks + 6; t <= durationTicks + 50; t++) {
    setTick(t);
    tickStatus(ctx, e);
  }
  ok(e.hp === hpAfter, "nenhum dano após a expiração");
}

// ── (2) stacking/refresh ────────────────────────────────────────────────────
console.log("== (2) stacking/refresh: refresca duração, fica com maior dano ==");
{
  const e = makeEntity();
  const { ctx, setTick } = makeCtx();

  const weak: DotParams = { kind: "poison", damagePerTick: 5, durationMs: 1000, intervalMs: 500, damageType: "poison" };
  const strong: DotParams = { kind: "poison", damagePerTick: 9, durationMs: 1000, intervalMs: 500, damageType: "poison" };
  const durTicks = msToTicks(weak.durationMs); // 20

  setTick(0);
  applyDot(e, 0, e, null, weak);
  ok(e.status.filter((s: any) => s.kind === "poison").length === 1, "1 instância de poison");

  // Reaplica MAIS FORTE no tick 10 → refresca expira p/ 10+dur, dano = max(5,9)=9.
  setTick(10);
  applyDot(e, 10, e, null, strong);
  const poison = e.status.find((s: any) => s.kind === "poison");
  ok(e.status.filter((s: any) => s.kind === "poison").length === 1,
    "reaplicar NÃO empilha — segue 1 instância (status.ts:106-114)");
  ok(poison.damagePerTick === 9, "fica com o MAIOR damagePerTick (max(5,9)=9)");
  ok(poison.expiresAtTick === 10 + durTicks, `duração refrescada (expira em ${10 + durTicks})`);

  // Reaplica MAIS FRACO depois → mantém o dano forte (não é punido).
  setTick(12);
  applyDot(e, 12, e, null, weak);
  const poison2 = e.status.find((s: any) => s.kind === "poison");
  ok(poison2.damagePerTick === 9, "reaplicar mais fraco mantém o dano forte (max preserva)");
}

// ── (3) controle: slow seta stepMs e limpa; root seta flag e limpa ──────────
console.log("== (3) controle (slow): seta stepMs e limpa na expiração ==");
{
  const e = makeEntity();
  const { ctx, setTick } = makeCtx();

  const slowMult = 2; // dobra o stepMs (metade da velocidade)
  const slowDurMs = 1500;
  const slowDurTicks = msToTicks(slowDurMs);

  setTick(0);
  applySlow(e, 0, { durationMs: slowDurMs, stepMsMultiplier: slowMult });
  ok(hasStatus(e, "slow"), "slow aplicado");
  ok(e.baseStepMs === Math.round(e.naturalStepMs * slowMult),
    `stepMs efetivo = natural × mult = ${e.naturalStepMs}×${slowMult} = ${e.baseStepMs}`);

  // Roda até expirar — tickStatus remove o slow e recomputa o stepMs.
  for (let t = 1; t <= slowDurTicks; t++) {
    setTick(t);
    tickStatus(ctx, e);
  }
  ok(!hasStatus(e, "slow"), "slow REMOVIDO após a duração");
  ok(e.baseStepMs === e.naturalStepMs, "stepMs volta ao natural (slow limpou)");
}

console.log("== (3b) controle (root): seta isRooted e limpa na expiração ==");
{
  const e = makeEntity();
  const { ctx, setTick } = makeCtx();

  const rootDurMs = 1000;
  const rootDurTicks = msToTicks(rootDurMs);

  setTick(0);
  applyRoot(e, 0, { durationMs: rootDurMs });
  ok(isRooted(e), "root aplicado (isRooted=true)");
  // Root NÃO mexe no stepMs (porta no movimento, não slow — status.ts:166-171).
  ok(e.baseStepMs === e.naturalStepMs, "root não altera stepMs");

  for (let t = 1; t <= rootDurTicks; t++) {
    setTick(t);
    tickStatus(ctx, e);
  }
  ok(!isRooted(e), "root LIMPO após a duração (isRooted=false)");
}

console.log(failures === 0 ? "\nSTATUS OK." : `\n${failures} FALHA(S).`);
// silencia lint de imports não usados em alguns caminhos
void TICK_MS; void recomputeStepMs;
process.exit(failures === 0 ? 0 : 1);
