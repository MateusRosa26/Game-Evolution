import type { CreatureFamily, Facing, Vec2 } from "../../shared/types";
import type { SimEntity } from "../entity";
import { actorRef, applyDamage, applyHeal, chebyshev, type CombatCtx } from "../combat";
import { magicDamage, physicalDamage, healPower } from "../formulas";
import type { Progression } from "../progression";
import type { SkillDef } from "./types";
import { SKILLS } from "./definitions";
import {
  APUNHALAR,
  BOLA_DE_FOGO,
  GOLPE_FORTE,
  LANCA_DE_GELO,
  LUZ_SAGRADA,
} from "./numbers";
import { applyDot, applySlow, hasStatus } from "./status";

/**
 * Executores GENÉRICOS por tipo de targeting (DESIGN-EVOLUCAO.md §"Magias e
 * Skills"). RESOLUÇÃO INSTANTÂNEA na sim (estilo runas de Tibia): o dano/cura
 * acontece já no tick do cast; a animação de projétil é responsabilidade FUTURA
 * do client — por isso emitimos snapshot-events de cast (origem/destino/linha/
 * skillId) com dados suficientes p/ o client animar depois.
 *
 * Dano flui SEMPRE por `applyDamage` (combat.ts) → events `damage`/`kill` saem
 * com `skillId` correto. Cura por `applyHeal`. Determinístico (sem RNG).
 */

/** Contexto que a Simulation passa ao módulo de skills. */
export interface SkillCastCtx extends CombatCtx {
  /** Progressão do caster (atributos p/ as fórmulas de dano/cura). */
  prog: Progression;
  /** Dano-base da arma equipada do caster (para skills físicas que escalam arma). */
  weaponBase: number;
  /** Famílias dadas como alvos válidos de um line/projétil (entidades vivas). */
  enemiesInWorld: SimEntity[];
}

/** Resultado de um cast: alvos atingidos + perfil capturado ANTES de aplicar status. */
export interface CastResult {
  validHit: boolean;
  targets: SimEntity[];
  /** Para o perfil de skill_use: ângulo (só Apunhalar). */
  hitFromBehind: boolean;
  /** Estado do alvo primário ANTES do cast (perfis das fichas). */
  targetWasBurning: boolean;
  targetWasSlowed: boolean;
  targetWasPoisoned: boolean;
  /** HP% do alvo primário ANTES do cast (ficha Apunhalar: abertura/alvo cheio). */
  targetHpPctBefore: number | null;
}

const UNHOLY_FAMILIES: CreatureFamily[] = ["undead", "demon"];

/** Vetor unitário do facing (para checar costas no Apunhalar). */
function facingVec(f: Facing): Vec2 {
  switch (f) {
    case "n": return { x: 0, y: -1 };
    case "s": return { x: 0, y: 1 };
    case "e": return { x: 1, y: 0 };
    case "w": return { x: -1, y: 0 };
  }
}

/**
 * Caster está ATRÁS do alvo? Compara o vetor (alvo→caster) com o facing do alvo:
 * se aponta no sentido OPOSTO ao facing, o golpe vem pelas costas. (Usa a
 * direção/facing do alvo, conforme a ficha do Apunhalar.)
 */
function isBehind(caster: SimEntity, target: SimEntity): boolean {
  const fv = facingVec(target.facing);
  const dx = Math.sign(caster.pos.x - target.pos.x);
  const dy = Math.sign(caster.pos.y - target.pos.y);
  // Produto escalar < 0 → caster do lado oposto ao que o alvo encara.
  return fv.x * dx + fv.y * dy < 0;
}

/** Famílias profanas (undead/demon) — bônus da Luz Sagrada. */
function isUnholy(e: SimEntity): boolean {
  return e.family != null && UNHOLY_FAMILIES.includes(e.family);
}

/** Tiles na linha do caster até `range`, na direção (assinada) de `dir`. */
function lineTiles(origin: Vec2, dir: Vec2, range: number): Vec2[] {
  const tiles: Vec2[] = [];
  for (let i = 1; i <= range; i++) {
    tiles.push({ x: origin.x + dir.x * i, y: origin.y + dir.y * i });
  }
  return tiles;
}

/** Aplica o status declarado da skill em um alvo atingido. */
function applySkillStatus(ctx: SkillCastCtx, def: SkillDef, caster: SimEntity, target: SimEntity): void {
  if (!def.applyStatus || target.dead) return;
  if (def.applyStatus.kind === "burn") {
    applyDot(target, ctx.tick, caster, def.id, {
      kind: "burn",
      damagePerTick: BOLA_DE_FOGO.burn.damagePerTick,
      durationTicks: BOLA_DE_FOGO.burn.durationTicks,
      tickEveryTicks: BOLA_DE_FOGO.burn.tickEveryTicks,
      damageType: "fire",
    });
  } else if (def.applyStatus.kind === "slow") {
    applySlow(target, ctx.tick, {
      durationTicks: LANCA_DE_GELO.slow.durationTicks,
      stepMsMultiplier: LANCA_DE_GELO.slow.stepMsMultiplier,
    });
  }
  // "poison" tipado p/ Rogue T2 — nenhuma skill M1 o aplica ainda.
}

/** Dano calculado de uma skill ofensiva contra `target` (já com multiplicadores). */
function computeDamage(ctx: SkillCastCtx, def: SkillDef, caster: SimEntity, target: SimEntity): number {
  if (def.effect === "physical") {
    if (def.id === "golpe_forte") {
      // Golpe Forte: ~1.8× o dano da ARMA equipada (ficha).
      const base = physicalDamage(ctx.prog.attributes, ctx.weaponBase);
      return Math.floor(base * GOLPE_FORTE.weaponMultiplier);
    }
    if (def.id === "apunhalar") {
      // Apunhalar: usa a adaga como base (Destreza) + 2× pelas costas (ficha).
      let dmg = physicalDamage(ctx.prog.attributes, ctx.weaponBase + def.power, true);
      if (isBehind(caster, target)) dmg = Math.floor(dmg * APUNHALAR.backstabMultiplier);
      return dmg;
    }
    return physicalDamage(ctx.prog.attributes, ctx.weaponBase + def.power);
  }
  // mágico
  let dmg = magicDamage(ctx.prog.attributes, def.power);
  if (def.id === "luz_sagrada" && isUnholy(target)) {
    dmg = Math.floor(dmg * LUZ_SAGRADA.unholyMultiplier);
  }
  return dmg;
}

// ─────────────────────────────────────────────────────────────────────────
//  Executores por tipo de targeting
// ─────────────────────────────────────────────────────────────────────────

/** Snapshot do perfil do alvo primário ANTES de qualquer aplicação de status. */
function profileBefore(e: SimEntity | null): Pick<CastResult, "targetWasBurning" | "targetWasSlowed" | "targetWasPoisoned" | "targetHpPctBefore"> {
  return {
    targetWasBurning: e ? hasStatus(e, "burn") : false,
    targetWasSlowed: e ? hasStatus(e, "slow") : false,
    targetWasPoisoned: e ? hasStatus(e, "poison") : false,
    targetHpPctBefore: e && e.maxHp > 0 ? e.hp / e.maxHp : null,
  };
}

/** melee no alvo selecionado (Golpe Forte) / posicional (Apunhalar). */
function execMelee(ctx: SkillCastCtx, def: SkillDef, caster: SimEntity, target: SimEntity | null): CastResult {
  if (!target || target.dead || target.kind !== "monster") return miss();
  if (chebyshev(caster.pos, target.pos) > def.range) return miss();
  const pre = profileBefore(target);
  const behind = def.targeting === "meleePositional" && isBehind(caster, target);
  const dmg = computeDamage(ctx, def, caster, target);
  caster.facing = facingTo(caster.pos, target.pos);
  applyDamage(ctx, caster, target, dmg, def.damageType, ctx.weaponBase > 0 ? "weapon" : null, def.id);
  applySkillStatus(ctx, def, caster, target);
  ctx.pending.push({ kind: "cast", skillId: def.id, casterId: caster.id, from: { ...caster.pos }, to: { ...target.pos } });
  return { validHit: true, targets: [target], hitFromBehind: behind, ...pre };
}

/** projétil no alvo (Bola de Fogo, Luz Sagrada). */
function execProjectile(ctx: SkillCastCtx, def: SkillDef, caster: SimEntity, target: SimEntity | null): CastResult {
  if (!target || target.dead || target.kind !== "monster") return miss();
  if (chebyshev(caster.pos, target.pos) > def.range) return miss();
  const pre = profileBefore(target);
  const dmg = computeDamage(ctx, def, caster, target);
  caster.facing = facingTo(caster.pos, target.pos);
  applyDamage(ctx, caster, target, dmg, def.damageType, null, def.id);
  applySkillStatus(ctx, def, caster, target);
  ctx.pending.push({ kind: "cast", skillId: def.id, casterId: caster.id, from: { ...caster.pos }, to: { ...target.pos } });
  return { validHit: true, targets: [target], hitFromBehind: false, ...pre };
}

/** linha perfurante na direção do alvo (Lança de Gelo) — atinge todos na linha. */
function execLine(ctx: SkillCastCtx, def: SkillDef, caster: SimEntity, target: SimEntity | null): CastResult {
  if (!target || target.dead) return miss();
  const dx = Math.sign(target.pos.x - caster.pos.x);
  const dy = Math.sign(target.pos.y - caster.pos.y);
  if (dx === 0 && dy === 0) return miss();
  const tiles = lineTiles(caster.pos, { x: dx, y: dy }, def.range);
  const lastTile = tiles[tiles.length - 1] ?? { ...caster.pos };
  caster.facing = facingTo(caster.pos, target.pos);

  const hit: SimEntity[] = [];
  for (const t of tiles) {
    for (const e of ctx.enemiesInWorld) {
      if (e.dead || e.kind !== "monster") continue;
      if (e.pos.x === t.x && e.pos.y === t.y && !hit.includes(e)) hit.push(e);
    }
  }
  const pre = profileBefore(hit[0] ?? null);
  for (const e of hit) {
    const dmg = computeDamage(ctx, def, caster, e);
    applyDamage(ctx, caster, e, dmg, def.damageType, null, def.id);
    applySkillStatus(ctx, def, caster, e);
  }
  ctx.pending.push({ kind: "cast", skillId: def.id, casterId: caster.id, from: { ...caster.pos }, to: lastTile });
  if (hit.length === 0) return miss();
  return { validHit: true, targets: hit, hitFromBehind: false, ...pre };
}

/** cura self/aliado (Curar Ferimentos). */
function execHeal(ctx: SkillCastCtx, def: SkillDef, caster: SimEntity, target: SimEntity | null): CastResult {
  // Sem alvo (ou alvo inválido) → cura a si mesmo (self-cast).
  let tgt = target;
  if (!tgt || tgt.dead || tgt.kind === "monster") tgt = caster;
  if (chebyshev(caster.pos, tgt.pos) > def.range) return miss();
  const pre = profileBefore(tgt);
  const amount = healPower(ctx.prog.attributes, def.power);
  applyHeal(ctx, caster, tgt, amount, def.id); // empurra o snapshot-event "heal"
  return { validHit: true, targets: [tgt], hitFromBehind: false, ...pre };
}

function miss(): CastResult {
  return {
    validHit: false,
    targets: [],
    hitFromBehind: false,
    targetWasBurning: false,
    targetWasSlowed: false,
    targetWasPoisoned: false,
    targetHpPctBefore: null,
  };
}

function facingTo(from: Vec2, to: Vec2): Facing {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "e" : "w";
  return dy >= 0 ? "s" : "n";
}

/**
 * Resolve um cast pelo tipo de targeting da skill. NÃO valida mana/cooldown
 * (isso é da Simulation, antes de chamar). Retorna os alvos atingidos.
 */
export function executeSkill(ctx: SkillCastCtx, def: SkillDef, caster: SimEntity, target: SimEntity | null): CastResult {
  switch (def.targeting) {
    case "meleeTarget":
    case "meleePositional":
      return execMelee(ctx, def, caster, target);
    case "projectileTarget":
      return execProjectile(ctx, def, caster, target);
    case "lineThrough":
      return execLine(ctx, def, caster, target);
    case "healTarget":
      return execHeal(ctx, def, caster, target);
  }
}

/**
 * Monta e emite o evento `skill_use` com o PERFIL DE USO completo (o que cada
 * ficha pede + o que as mutações precisarão). Só emite com `validHit` real.
 * Ver events.ts (`SkillUseEvent`) para a documentação campo a campo.
 */
export function emitSkillUse(
  ctx: SkillCastCtx,
  def: SkillDef,
  caster: SimEntity,
  selectedTarget: SimEntity | null,
  result: CastResult,
): void {
  // Distância do cast: até o alvo selecionado (ou 0 em self-heal).
  const refTarget = selectedTarget ?? result.targets[0] ?? null;
  const distance = refTarget ? chebyshev(caster.pos, refTarget.pos) : 0;
  const primary = result.targets[0] ?? null;

  ctx.bus.emit("skill_use", {
    caster: actorRef(caster),
    skillId: def.id,
    validHit: result.validHit,
    targets: result.targets.map(actorRef),
    targetsHit: result.targets.length,
    castDistance: distance,
    casterHpPct: caster.maxHp > 0 ? caster.hp / caster.maxHp : 0,
    casterInCombat: caster.targetId != null,
    targetSelf: primary != null && primary.id === caster.id,
    // HP% do alvo NO MOMENTO do cast (antes do golpe) — ficha Apunhalar (abertura).
    targetHpPct: result.targetHpPctBefore,
    targetFamily: primary ? primary.family : null,
    targetWasBurning: result.targetWasBurning,
    targetWasSlowed: result.targetWasSlowed,
    targetWasPoisoned: result.targetWasPoisoned,
    hitFromBehind: result.hitFromBehind,
    context: { tick: ctx.tick, night: ctx.night },
  });
}

/** Lookup de skill por ID (re-export conveniente). */
export function getSkill(id: string): SkillDef | undefined {
  return SKILLS[id];
}
