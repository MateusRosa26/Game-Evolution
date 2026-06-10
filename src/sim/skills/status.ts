import { TICK_MS, msToTicks } from "../../shared/constants";
import type { DamageType } from "../../shared/types";
import type { MealBuff } from "../items/templates";
import type { StatusEffectState } from "../../shared/protocol";
import type { SimEntity } from "../entity";
import type { CombatCtx } from "../combat";
import { applyDamage } from "../combat";

/**
 * Sistema de status effects da sim (DESIGN-EVOLUCAO.md §"Magias e Skills"):
 * queimadura (DoT fogo), lentidão (slow), veneno (tipado para o futuro — Rogue
 * T2). Tudo TICK-BASED, com duração, aplicado/expirado na sim e VISÍVEL no
 * snapshot (lista de status por entidade) para o client futuro animar.
 *
 * Determinístico: nada de RNG/timers aqui — só contadores de tick.
 */

/**
 * Categorias de status. `poison` já existe tipado p/ Rogue T2 (Lâmina
 * Envenenada). `wellFed` ("Bem Alimentado") é o buff de saciedade da comida —
 * multiplica o regen de HP/mana enquanto ativo (loop de sustain Tibia).
 */
export type StatusKind = "burn" | "slow" | "poison" | "wellFed" | "meal";

/**
 * Teto de saciedade: comer ACUMULA duração de "Bem Alimentado" só até aqui —
 * acima disso a comida extra é desperdiçada (não dá pra ficar saciado eterno
 * empanturrando; sem treadmill de comer). ✏️ placeholder — calibrar Balancista.
 */
export const FOOD_SATIETY_CAP_MS = 600_000;

/** Instância de um status ativo numa entidade (estado interno da sim). */
export interface StatusEffect {
  kind: StatusKind;
  /** Tick lógico em que o status expira (>= este tick → remove). */
  expiresAtTick: number;
  /** ── DoT (burn/poison) ── */
  /** Dano por tique do DoT. */
  damagePerTick: number;
  /** A cada quantos ticks o DoT aplica dano. */
  tickEveryTicks: number;
  /** Próximo tick em que o DoT causa dano. */
  nextDamageTick: number;
  /** Tipo de dano do DoT (fire/poison/...). */
  damageType: DamageType;
  /** ── slow ── multiplicador aplicado ao stepMs base (>1 = mais lento). */
  stepMsMultiplier: number;
  /** ── wellFed ── multiplicador aplicado ao regen de HP/mana (>1 = mais rápido). */
  regenMultiplier: number;
  /** ── meal ── +N na BASE DE DANO DA ARMA (comida preparada). Como o dano final =
   *  base_da_arma + atributo, é +N flat no golpe. */
  buffDamage: number;
  /** ── meal ── fração de redução do cooldown de ataque (0.1 = 10% mais rápido). */
  buffAttackSpeedPct: number;
  /** ID da entidade que aplicou (atribuição do dano do DoT/kill). */
  sourceId: number;
  /** Skill que originou o status (para o evento kill/damage do DoT). */
  skillId: string | null;
}

/** Parâmetros para aplicar um DoT (burn/poison). Tempos em ms (design). */
export interface DotParams {
  kind: "burn" | "poison";
  damagePerTick: number;
  /** Duração total do DoT, em ms. */
  durationMs: number;
  /** Intervalo entre aplicações de dano, em ms. */
  intervalMs: number;
  damageType: DamageType;
}

/** Parâmetros para aplicar slow. Tempos em ms (design). */
export interface SlowParams {
  /** Duração do slow, em ms. */
  durationMs: number;
  stepMsMultiplier: number;
}

/** True se a entidade está sob um status do tipo dado (perfil de skill_use). */
export function hasStatus(e: SimEntity, kind: StatusKind): boolean {
  return e.status.some((s) => s.kind === kind);
}

/**
 * Aplica/refresca um DoT. Regra de stacking (documentada): não empilha — refaz
 * a duração e fica com o MAIOR dano por tique (reaplicar fogo forte não é
 * punido). Mantém o cadenciamento do tique já em curso.
 */
export function applyDot(e: SimEntity, currentTick: number, source: SimEntity, skillId: string | null, p: DotParams): void {
  const durationTicks = msToTicks(p.durationMs);
  const intervalTicks = msToTicks(p.intervalMs);
  const existing = e.status.find((s) => s.kind === p.kind);
  if (existing) {
    existing.expiresAtTick = currentTick + durationTicks;
    existing.damagePerTick = Math.max(existing.damagePerTick, p.damagePerTick);
    existing.tickEveryTicks = intervalTicks;
    existing.damageType = p.damageType;
    existing.sourceId = source.id;
    existing.skillId = skillId;
    return;
  }
  e.status.push({
    kind: p.kind,
    expiresAtTick: currentTick + durationTicks,
    damagePerTick: p.damagePerTick,
    tickEveryTicks: intervalTicks,
    nextDamageTick: currentTick + intervalTicks,
    damageType: p.damageType,
    stepMsMultiplier: 1,
    regenMultiplier: 1,
    buffDamage: 0,
    buffAttackSpeedPct: 0,
    sourceId: source.id,
    skillId,
  });
}

/**
 * Aplica/refresca slow. Documentado: não empilha — refaz duração e fica com o
 * MAIOR multiplicador (slow mais forte vence). Recalcula o stepMs efetivo.
 */
export function applySlow(e: SimEntity, currentTick: number, p: SlowParams): void {
  const durationTicks = msToTicks(p.durationMs);
  const existing = e.status.find((s) => s.kind === "slow");
  if (existing) {
    existing.expiresAtTick = currentTick + durationTicks;
    existing.stepMsMultiplier = Math.max(existing.stepMsMultiplier, p.stepMsMultiplier);
  } else {
    e.status.push({
      kind: "slow",
      expiresAtTick: currentTick + durationTicks,
      damagePerTick: 0,
      tickEveryTicks: 0,
      nextDamageTick: Number.MAX_SAFE_INTEGER,
      damageType: "ice",
      stepMsMultiplier: p.stepMsMultiplier,
      regenMultiplier: 1,
      buffDamage: 0,
      buffAttackSpeedPct: 0,
      sourceId: 0,
      skillId: null,
    });
  }
  recomputeStepMs(e);
}

/** Parâmetros para aplicar/estender "Bem Alimentado" (comida). Tempo em ms. */
export interface FoodParams {
  /** Multiplicador do regen de HP/mana enquanto saciado (>1 = mais rápido). */
  regenMult: number;
  /** Duração que esta porção adiciona à saciedade, em ms. */
  durationMs: number;
}

/**
 * Aplica/estende "Bem Alimentado". Comer ACUMULA a duração restante até o teto
 * `FOOD_SATIETY_CAP_MS` (não dá pra empanturrar e ficar saciado eterno — sem
 * treadmill). Mantém o MAIOR multiplicador ativo (comida melhor não é punida por
 * comer logo após uma pior). Determinístico — só contadores de tick.
 */
export function applyFood(e: SimEntity, currentTick: number, p: FoodParams): void {
  const capTicks = msToTicks(FOOD_SATIETY_CAP_MS);
  const addTicks = msToTicks(p.durationMs);
  const existing = e.status.find((s) => s.kind === "wellFed");
  if (existing) {
    const remaining = Math.max(0, existing.expiresAtTick - currentTick);
    existing.expiresAtTick = currentTick + Math.min(capTicks, remaining + addTicks);
    existing.regenMultiplier = Math.max(existing.regenMultiplier, p.regenMult);
    return;
  }
  e.status.push({
    kind: "wellFed",
    expiresAtTick: currentTick + Math.min(capTicks, addTicks),
    damagePerTick: 0,
    tickEveryTicks: 0,
    nextDamageTick: Number.MAX_SAFE_INTEGER,
    damageType: "physical",
    stepMsMultiplier: 1,
    regenMultiplier: p.regenMult,
    buffDamage: 0,
    buffAttackSpeedPct: 0,
    sourceId: 0,
    skillId: null,
  });
}

/**
 * Multiplicador de regen do status "Bem Alimentado". MODELO DE SUSTAIN (decidido
 * criador, jun/2026, estilo Tibia/Apogea): **comida é pré-condição do regen** —
 * SEM saciedade, regen de HP e mana é ZERO (em qualquer lugar). Saciado, regen =
 * taxa-base (atributo) × este multiplicador (qualidade da comida). Por isso o
 * retorno NÃO-saciado é 0, não 1: não há regen "de graça".
 */
export function wellFedRegenMult(e: SimEntity): number {
  const fed = e.status.find((s) => s.kind === "wellFed");
  return fed ? fed.regenMultiplier : 0;
}

/**
 * Aplica o buff de refeição (comida preparada — COZINHA.md). É um status "meal"
 * SEPARADO do `wellFed` (timer próprio): comer pão barato NÃO estende o buff de um
 * prato premium, porque pão não tem `buffs` (não chama isto). UM por vez — eating
 * outro prato SUBSTITUI (remove o anterior). Resolve os MealBuffs em campos.
 */
export function applyMealBuff(e: SimEntity, currentTick: number, p: { buffs: MealBuff[]; durationMs: number }): void {
  e.status = e.status.filter((s) => s.kind !== "meal"); // um buff de refeição por vez
  let buffDamage = 0;
  let buffAttackSpeedPct = 0;
  for (const b of p.buffs) {
    if (b.stat === "damage") buffDamage += b.amount;
    else if (b.stat === "attackSpeed") buffAttackSpeedPct += b.amount;
  }
  e.status.push({
    kind: "meal",
    expiresAtTick: currentTick + msToTicks(p.durationMs),
    damagePerTick: 0,
    tickEveryTicks: 0,
    nextDamageTick: Number.MAX_SAFE_INTEGER,
    damageType: "physical",
    stepMsMultiplier: 1,
    regenMultiplier: 1,
    buffDamage,
    buffAttackSpeedPct,
    sourceId: 0,
    skillId: null,
  });
}

/** Bônus de dano do buff de refeição (+N na base da arma = +N no golpe; 0 se nenhum). */
export function mealBuffDamage(e: SimEntity): number {
  const m = e.status.find((s) => s.kind === "meal");
  return m ? m.buffDamage : 0;
}

/** Fração de redução do cooldown de ataque do buff de refeição (0 se nenhum). */
export function mealBuffAttackSpeedPct(e: SimEntity): number {
  const m = e.status.find((s) => s.kind === "meal");
  return m ? m.buffAttackSpeedPct : 0;
}

/** Recalcula `stepMs` efetivo a partir do baseStepMs e do slow ativo. */
export function recomputeStepMs(e: SimEntity): void {
  const slow = e.status.find((s) => s.kind === "slow");
  const mult = slow ? slow.stepMsMultiplier : 1;
  e.baseStepMs = Math.round(e.naturalStepMs * mult);
}

/**
 * Tick de status de UMA entidade: aplica DoTs vencidos e remove status
 * expirados. Chamado pela Simulation a cada tick, ANTES do movimento (para o
 * stepMs já refletir o slow). DoT flui pelo `applyDamage` normal → events
 * `damage`/`kill` saem corretos com skillId.
 */
export function tickStatus(ctx: CombatCtx, e: SimEntity): void {
  if (e.dead || e.status.length === 0) return;
  const tick = ctx.tick;

  // 1. DoTs que devem aplicar dano neste tick.
  for (const s of e.status) {
    if (s.damagePerTick <= 0) continue;
    while (tick >= s.nextDamageTick && tick < s.expiresAtTick) {
      const source = ctx.lookup(s.sourceId) ?? e;
      const fatal = applyDamage(ctx, source, e, s.damagePerTick, s.damageType, null, s.skillId);
      s.nextDamageTick += s.tickEveryTicks;
      if (fatal) return; // morreu pelo DoT — resolveDeaths cuida do resto
    }
  }

  // 2. Expira status vencidos.
  const before = e.status.length;
  e.status = e.status.filter((s) => tick < s.expiresAtTick);
  if (e.status.length !== before) recomputeStepMs(e);
}

/** Projeção serializável dos status para o snapshot (client futuro). */
export function projectStatus(e: SimEntity, currentTick: number): StatusEffectState[] {
  return e.status.map((s) => ({
    kind: s.kind,
    remainingMs: Math.max(0, (s.expiresAtTick - currentTick) * TICK_MS),
  }));
}
