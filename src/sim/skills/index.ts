import { msToTicks } from "../../shared/constants";
import type { Vec2 } from "../../shared/types";
import type { SimEntity } from "../entity";
import { executeSkill, emitSkillUse, type SkillCastCtx } from "./executor";
import { SKILLS } from "./definitions";
import type { SkillDef } from "./types";

export * from "./types";
export { SKILLS } from "./definitions";
export { STARTER_KITS, isKnownSkillId } from "./kits";
export {
  tickStatus,
  projectStatus,
  recomputeStepMs,
  hasStatus,
  isRooted,
  applyFood,
  wellFedRegenMult,
  applyMealBuff,
  mealBuffDamage,
  mealBuffAttackSpeedPct,
  FOOD_SATIETY_CAP_MS,
  type StatusKind,
  type StatusEffect,
  type FoodParams,
} from "./status";
export type { SkillCastCtx, CastResult } from "./executor";

/** Por que um cast foi rejeitado (para feedback futuro ao client). */
export type CastReject = "unknown" | "not_known" | "on_cooldown" | "no_mana" | "no_hit";

export type CastOutcome =
  | { ok: true; def: SkillDef; targetsHit: number }
  | { ok: false; reason: CastReject };

/**
 * Orquestra um cast COMPLETO (DESIGN-EVOLUCAO.md §"Magias e Skills"):
 * 1. valida skill conhecida → 2. cooldown (em ticks) → 3. mana →
 * 4. executa pelo targeting → 5. se atingiu alvo válido, gasta mana, arma o
 * cooldown e emite `skill_use` com o perfil completo.
 *
 * REGRA DE CONTAGEM (documentada): spam no ar NÃO gasta mana/cooldown e NÃO
 * emite `skill_use` válido (a sim retorna `no_hit`). Só uso que conectou conta
 * para Mutação — exatamente como a ficha pede. (Decisão: não emitimos evento
 * com `validHit:false`; simplesmente não há custo nem evento — o client recebe
 * o motivo da rejeição p/ feedback, sem poluir o ledger de progressão.)
 */
export function castSkill(
  ctx: SkillCastCtx,
  caster: SimEntity,
  skillId: string,
  target: SimEntity | null,
): CastOutcome {
  const def = SKILLS[skillId];
  if (!def) return { ok: false, reason: "unknown" };
  if (!caster.knownSkills.includes(skillId)) return { ok: false, reason: "not_known" };

  // Cooldown por skill por entidade, em ticks.
  const readyAt = caster.skillCooldowns[skillId] ?? 0;
  if (ctx.tick < readyAt) return { ok: false, reason: "on_cooldown" };

  // Custo de mana validado na sim.
  if (caster.mp < def.manaCost) return { ok: false, reason: "no_mana" };

  const result = executeSkill(ctx, def, caster, target);
  if (!result.validHit) return { ok: false, reason: "no_hit" };

  // Atingiu alvo válido → cobra recursos e registra o uso.
  caster.mp -= def.manaCost;
  caster.skillCooldowns[skillId] = ctx.tick + msToTicks(def.cooldownMs);
  emitSkillUse(ctx, def, caster, target, result);
  return { ok: true, def, targetsHit: result.targets.length };
}

/** Resultado de iniciar um cast (instantâneo OU armado com cast-time). */
export type BeginOutcome =
  | { ok: true; kind: "instant"; def: SkillDef; targetsHit: number }
  | { ok: true; kind: "casting"; def: SkillDef; endTick: number }
  | { ok: false; reason: CastReject };

/**
 * Ponto de entrada do `useSkill`: decide entre RESOLUÇÃO INSTANTÂNEA (estilo runa
 * de Tibia — comportamento M1, sem `castTimeMs`) e CONJURAÇÃO COM CAST-TIME.
 *
 * Sem cast-time → delega ao `castSkill` (valida known/cooldown/mana → executa →
 *   cobra mana/cooldown só se conectou).
 * Com cast-time → valida known/cooldown/mana, COBRA A MANA NO INÍCIO (decisão do
 *   task), arma o cooldown, e ARMA o `casting` (a sim resolve ao chegar no
 *   `endTick` via `resolveCast`). NÃO executa o efeito aqui — sem alvo/hit ainda.
 *   ✏️ POLÍTICA DE REEMBOLSO (cast cancelado): decisão do Balancista. Default
 *      ATUAL = NÃO reembolsa a mana de um cast cancelado por mover/tomar dano.
 */
export function beginOrCastSkill(
  ctx: SkillCastCtx,
  caster: SimEntity,
  skillId: string,
  target: SimEntity | null,
  aim?: Vec2,
): BeginOutcome {
  const def = SKILLS[skillId];
  if (!def) return { ok: false, reason: "unknown" };

  const castTimeMs = def.castTimeMs ?? 0;
  if (castTimeMs <= 0) {
    const out = castSkill(ctx, caster, skillId, target);
    return out.ok
      ? { ok: true, kind: "instant", def: out.def, targetsHit: out.targetsHit }
      : { ok: false, reason: out.reason };
  }

  // ── Cast-time: valida e cobra NO INÍCIO ──
  if (!caster.knownSkills.includes(skillId)) return { ok: false, reason: "not_known" };
  const readyAt = caster.skillCooldowns[skillId] ?? 0;
  if (ctx.tick < readyAt) return { ok: false, reason: "on_cooldown" };
  if (caster.mp < def.manaCost) return { ok: false, reason: "no_mana" };

  caster.mp -= def.manaCost; // mana no INÍCIO do cast (não no fim)
  caster.skillCooldowns[skillId] = ctx.tick + msToTicks(def.cooldownMs);
  const endTick = ctx.tick + msToTicks(castTimeMs);
  caster.casting = { skillId, startTick: ctx.tick, endTick, targetId: target?.id ?? null, aim };
  return { ok: true, kind: "casting", def, endTick };
}

/**
 * Resolve uma conjuração ARMADA cujo `casting.endTick` foi alcançado. Executa o
 * efeito agora (mana/cooldown já cobrados no início) e limpa o `casting`. A sim
 * chama isto por tick para cada caster com `casting && tick >= endTick`. Retorna
 * o `CastResult` (ou null se a skill sumiu/estado inválido).
 */
export function resolveCast(ctx: SkillCastCtx, caster: SimEntity, target: SimEntity | null): void {
  const c = caster.casting;
  caster.casting = null;
  if (!c) return;
  const def = SKILLS[c.skillId];
  if (!def) return;
  const result = executeSkill(ctx, def, caster, target);
  // Conectou ou não, o uso de cast-time já pagou no início; só emite perfil se
  // houve hit válido (mesma regra de contagem do `castSkill` — spam não conta).
  if (result.validHit) emitSkillUse(ctx, def, caster, target, result);
}
