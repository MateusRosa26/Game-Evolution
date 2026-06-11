import type { CreatureFamily, Facing, Vec2 } from "../../shared/types";
import type { SimEntity } from "../entity";
import { actorRef, applyDamage, applyHeal, chebyshev, type CombatCtx, type WeaponSource } from "../combat";
import { magicDamage, physicalDamage, physicalVariance, healPower, holyDamage } from "../formulas";
import type { Progression } from "../progression";
import type { SkillDef } from "./types";
import { SKILLS } from "./definitions";
import {
  APUNHALAR,
  GOLPE_FORTE,
  LUZ_SAGRADA,
} from "./numbers";
import { applyDot, applySlow, applyRoot, hasStatus } from "./status";

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
  /**
   * Arma-instância equipada do caster (p/ atribuir dano/kill de skill FÍSICA de
   * arma ao ledger — DESIGN-EVOLUCAO.md: skills com tag `arma` alimentam Marcas).
   * Magias NÃO usam isto (passamos null no executor) → não tocam o ledger da arma.
   */
  weaponSource: WeaponSource | null;
  /** Famílias dadas como alvos válidos de um line/projétil (entidades vivas). */
  enemiesInWorld: SimEntity[];
  /** RNG seedado [0,1) da sim — variância do dano FÍSICO (AD swingy). Mágico não usa. */
  roll: () => number;
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
/** Sagrado bate REDUZIDO fora de undead/demon (especialista anti-undead). ✏️ Balancista. */
const HOLY_NONUNDEAD_MULT = 0.65;

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

/**
 * Aplica o status declarado da skill em um alvo atingido. GENÉRICO: os
 * parâmetros vêm da PRÓPRIA `applyStatus` (union discriminada — dado, não código
 * hardcoded por skill). Cada `kind` chama o helper de status com seus campos.
 */
function applySkillStatus(ctx: SkillCastCtx, def: SkillDef, caster: SimEntity, target: SimEntity): void {
  const st = def.applyStatus;
  if (!st || target.dead) return;
  switch (st.kind) {
    case "burn":
      applyDot(target, ctx.tick, caster, def.id, {
        kind: "burn",
        damagePerTick: st.damagePerTick,
        durationMs: st.durationMs,
        intervalMs: st.intervalMs,
        damageType: st.damageType,
      });
      break;
    case "bleed":
      applyDot(target, ctx.tick, caster, def.id, {
        kind: "bleed",
        damagePerTick: st.damagePerTick,
        durationMs: st.durationMs,
        intervalMs: st.intervalMs,
        damageType: "physical", // sangramento = DoT físico
      });
      break;
    case "poison":
      applyDot(target, ctx.tick, caster, def.id, {
        kind: "poison",
        damagePerTick: st.damagePerTick,
        durationMs: st.durationMs,
        intervalMs: st.intervalMs,
        damageType: "poison",
      });
      break;
    case "slow":
      applySlow(target, ctx.tick, { durationMs: st.durationMs, stepMsMultiplier: st.stepMsMultiplier });
      break;
    case "root":
      applyRoot(target, ctx.tick, { durationMs: st.durationMs });
      break;
  }
}

/** Dano calculado de uma skill ofensiva contra `target` (já com multiplicadores). */
function computeDamage(ctx: SkillCastCtx, def: SkillDef, caster: SimEntity, target: SimEntity): number {
  if (def.effect === "physical") {
    // Skills FÍSICAS (AD) também rolam variância (swingy); só o mágico é constante.
    if (def.id === "golpe_forte") {
      // Golpe Forte: ~1.8× o dano da ARMA equipada (ficha).
      const base = physicalDamage(ctx.prog.attributes, ctx.weaponBase);
      return physicalVariance(Math.floor(base * GOLPE_FORTE.weaponMultiplier), ctx.roll());
    }
    if (def.id === "apunhalar") {
      // Apunhalar: usa a adaga como base (Destreza) + 2× pelas costas (ficha).
      let dmg = physicalVariance(physicalDamage(ctx.prog.attributes, ctx.weaponBase + def.power, true), ctx.roll());
      if (isBehind(caster, target)) dmg = Math.floor(dmg * APUNHALAR.backstabMultiplier);
      return dmg;
    }
    return physicalVariance(physicalDamage(ctx.prog.attributes, ctx.weaponBase + def.power), ctx.roll());
  }
  // mágico — ofensiva SAGRADA (damageType "holy") escala ESPÍRITO; demais
  // elementos escalam Inteligência. (Decidido 09/jun/2026 — o Priest é o melhor
  // conjurador sagrado porque seu corpo bomba Esp; um Mage Int-pesado faz Luz fraca.)
  let dmg = def.damageType === "holy"
    ? holyDamage(ctx.prog.attributes, def.power)
    : magicDamage(ctx.prog.attributes, def.power);
  // SAGRADO é ESPECIALISTA ANTI-UNDEAD (decidido criador jun/2026): cheio vs profano
  // (undead/demon), REDUZIDO vs o resto. É a fraqueza clara do Priest — dano alto só
  // no nicho; fora dele vira sustain/utilidade (não "forte em tudo"). ✏️ % Balancista.
  if (def.damageType === "holy") {
    if (isUnholy(target)) {
      if (def.id === "luz_sagrada") dmg = Math.floor(dmg * LUZ_SAGRADA.unholyMultiplier);
    } else {
      dmg = Math.floor(dmg * HOLY_NONUNDEAD_MULT);
    }
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
  // Skill FÍSICA de arma (Golpe Forte/Apunhalar, tag `arma`/`posicional`) alimenta
  // o ledger da arma equipada; sem efeito físico, não há arma envolvida.
  const weapon = def.effect === "physical" ? ctx.weaponSource : null;
  applyDamage(ctx, caster, target, dmg, def.damageType, weapon, def.id);
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
    // ── Stubs de targeting (superfície de dados pronta; executores em waves futuras) ──
    case "groundTarget":
      // TODO(T2): área num tile mirado (Storm, Garras da Terra). Usa def.areaRadius
      // e o `aim` do casting (Vec2). Por ora não resolve nada.
      return miss();
    case "selfRadius":
      // TODO(T3): área ao redor do caster (def.areaRadius). Por ora não resolve nada.
      return miss();
    case "chain":
      // TODO(T4): salta entre alvos (def.chainMax/chainRange/chainFalloff). Por ora não resolve nada.
      return miss();
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
