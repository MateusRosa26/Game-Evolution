import { msToTicks } from "../../shared/constants";
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
