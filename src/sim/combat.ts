import type { DamageType, Vec2 } from "../shared/types";
import type { SnapshotEvent } from "../shared/protocol";
import type { CombatActorRef, EventBus } from "./events";
import type { SimEntity } from "./entity";
import { armorMitigation } from "./formulas";
import type { EffectSpec } from "./tracking/types";
import type { Facts } from "./tracking/filters";
import { evalOutgoing, evalIncoming, rollFullBlock, collectOnKill, collectOnKillMana, matchStatusCombos, areaShapeTiles } from "./tracking/effects";

/**
 * Lógica de combate da sim: aplicação de dano, morte e emissão dos eventos
 * `damage`/`kill` no barramento. Determinística — sem RNG aqui (M1 não tem
 * crit/variação; quando tiver, virá do RNG seedado da Simulation).
 *
 * Os payloads de evento são montados com tudo que o sistema de Marcas precisa
 * (DESIGN-EVOLUCAO.md) — consumidores futuros filtram declarativamente.
 */

/** Contexto que a Simulation fornece ao combate. */
export interface CombatCtx {
  bus: EventBus;
  tick: number;
  /** Eventos one-shot a encaminhar ao client neste tick. */
  pending: SnapshotEvent[];
  /** É noite no mundo? (placeholder M1: sempre false). */
  night: boolean;
  /** Lookup de entidade por ID (DoT precisa achar a fonte que aplicou o status). */
  lookup: (id: number) => SimEntity | undefined;
  /** RNG seedado (combatRng da Simulation) — rola o bloqueio de escudo. */
  rng: () => number;
  /** Efeitos MECÂNICOS ativos de uma entidade (motor de Marcas/Caminhos). */
  effectsOf?: (entityId: number) => EffectSpec[];
  /** Fatos extras de sessão p/ as condições de efeito (firstHitOfCombat/inCombat). */
  sessionFacts?: (entityId: number) => Facts;
  /** Dano nos TILES dados SEM re-disparar efeitos (P2 onKill) — Simulation fornece. */
  areaDamage?: (tiles: Vec2[], sourceId: number, amount: number, damageType: DamageType) => void;
}

/** Identidade de combate de uma entidade (para os payloads de evento). */
export function actorRef(e: SimEntity): CombatActorRef {
  return { id: e.id, species: e.species, family: e.family };
}

/** Distância Chebyshev em tiles (adjacente incl. diagonal = 1). */
export function chebyshev(a: Vec2, b: Vec2): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/**
 * Identifica a ARMA-INSTÂNCIA por trás de um golpe (null = não foi a arma:
 * magia/DoT/ambiental). É a chave que o ledger usa para atribuir dano/kill à
 * arma equipada (DESIGN-EVOLUCAO.md §"Itens são instâncias").
 */
export interface WeaponSource {
  /** ID da instância de arma equipada. */
  instanceId: number;
  /** Template da instância (conveniência p/ os payloads). */
  templateId: string;
  /** Label legado para o floating text/`weaponId` (ex: "weapon"/templateId). */
  label: string;
}

/**
 * Aplica dano de `source` em `target`. Emite `damage` sempre; se matar,
 * emite `kill` e marca `target.dead`. Retorna true se o golpe foi fatal.
 *
 * `weapon` (null = não-arma) propaga a instância equipada aos payloads `damage`/
 * `kill` para o ledger (auto-attack e skills físicas de arma a passam; projéteis/
 * cura passam null). `skillId` identifica a skill, se veio de uma.
 */
export function applyDamage(
  ctx: CombatCtx,
  source: SimEntity,
  target: SimEntity,
  amount: number,
  damageType: DamageType,
  weapon: WeaponSource | null,
  skillId: string | null,
  suppressEffects = false,
): boolean {
  if (target.dead) return false;

  // ── P1 (damageMult) + P4 (crit): dano de SAÍDA do atacante. `suppressEffects`
  // evita recursão quando o próprio efeito (P2 onKill) causa dano em área. ──
  if (!suppressEffects && ctx.effectsOf) {
    const effects = ctx.effectsOf(source.id);
    if (effects.length > 0) {
      const facts: Facts = {
        "target.family": target.family,
        attackerHpPct: source.maxHp > 0 ? source.hp / source.maxHp : 0,
        damageType,
        ...(ctx.sessionFacts ? ctx.sessionFacts(source.id) : {}),
      };
      const mod = evalOutgoing(effects, facts);
      if (mod.mult !== 1) amount = amount * mod.mult;
    }
  }

  // ── B5 (incomingMult): redução de dano RECEBIDO (efeito do ALVO; ex: Sombra Sem
  // Nome mitiga a abertura). 1º efeito de ENTRADA do motor. ──
  if (!suppressEffects && ctx.effectsOf) {
    const tEffects = ctx.effectsOf(target.id);
    if (tEffects.length > 0) {
      const facts: Facts = {
        "attacker.family": source.family,
        damageType,
        ...(ctx.sessionFacts ? ctx.sessionFacts(target.id) : {}),
      };
      const mult = evalIncoming(tEffects, facts);
      if (mult !== 1) amount = amount * mult;
    }
  }

  // ── Mitigação do ALVO (ordem decidida: bloqueio% → Def SORTEADA (0..Def) → piso
  // 1). Só o player carrega armadura/escudo (mob: armorDef 0, block null), então o
  // golpe DO player no mob não muda — só o golpe NO player é reduzido. ──
  if (target.block) {
    // P3 (blockFull): chance de absorver 100% (Inabalável) — senão, bloqueio normal.
    const tEffects = !suppressEffects && ctx.effectsOf ? ctx.effectsOf(target.id) : [];
    const full = tEffects.length > 0 ? rollFullBlock(tEffects, ctx.rng) : false;
    if (full || ctx.rng() < target.block.chance) {
      const blocked = full ? Math.round(amount) : Math.round(amount * target.block.chunkPct);
      amount -= blocked;
      ctx.bus.emit("block", {
        blocker: actorRef(target),
        attacker: actorRef(source),
        blocked,
        damageType,
        context: { tick: ctx.tick, night: ctx.night },
      });
    }
  }
  if (damageType === "physical" && target.armorDef > 0) {
    amount -= armorMitigation(target.armorDef, ctx.rng()); // sorteio 0..Def (Tibia-puro)
  }
  amount = Math.max(1, Math.round(amount));

  // HP da vítima ANTES do golpe (base de overkill/execução) e fatalidade.
  const hpBefore = target.hp;
  target.hp = Math.max(0, target.hp - amount);
  const fatal = target.hp <= 0;

  ctx.bus.emit("damage", {
    source: actorRef(source),
    target: actorRef(target),
    amount,
    damageType,
    at: { x: target.pos.x, y: target.pos.y },
    weaponId: weapon ? weapon.label : null,
    skillId,
    weaponInstanceId: weapon ? weapon.instanceId : null,
    weaponTemplateId: weapon ? weapon.templateId : null,
    wasFatal: fatal,
    context: { tick: ctx.tick, night: ctx.night },
  });
  ctx.pending.push({
    kind: "damage",
    targetId: target.id,
    attackerId: source.id,
    amount,
    pos: { x: target.pos.x, y: target.pos.y },
  });

  // ── P6 (statusCombo): reage ao status do alvo + tipo de dano (Senhor dos
  // Extremos: fogo em alvo `slow`/gelo em alvo `burn` → choque térmico). Só em
  // alvo VIVO; o burst é `suppressEffects` (não re-dispara combo nem cascata). ──
  if (!suppressEffects && !fatal && ctx.effectsOf) {
    const effects = ctx.effectsOf(source.id);
    if (effects.length > 0) {
      const kinds = target.status.map((s) => s.kind as string);
      const combos = matchStatusCombos(effects, kinds, damageType);
      for (const combo of combos) {
        // Consome os status casados + recomputa o stepMs (slow pode ter saído).
        target.status = target.status.filter((s) => !combo.consumes.includes(s.kind));
        const slow = target.status.find((s) => s.kind === "slow");
        target.baseStepMs = Math.round(target.naturalStepMs * (slow ? slow.stepMsMultiplier : 1));
        applyDamage(ctx, source, target, combo.burst, damageType, null, null, true);
        if (target.dead) break;
      }
    }
  }

  if (!fatal) return false;

  // ── Golpe fatal: morte + evento kill rico ──
  target.dead = true;
  ctx.bus.emit("kill", {
    attacker: actorRef(source),
    victim: actorRef(target),
    weaponId: weapon ? weapon.label : null,
    skillId,
    weaponInstanceId: weapon ? weapon.instanceId : null,
    weaponTemplateId: weapon ? weapon.templateId : null,
    finalBlow: { amount, damageType },
    victimHpBeforeBlow: hpBefore,
    victimMaxHp: target.maxHp,
    overkill: Math.max(0, amount - hpBefore),
    overkillRatio: hpBefore > 0 ? amount / hpBefore : amount,
    victimHpPctBeforeBlow: target.maxHp > 0 ? hpBefore / target.maxHp : 0,
    statusesOnVictim: target.status.length,
    attackerHpPct: source.maxHp > 0 ? source.hp / source.maxHp : 0,
    attackerPos: { x: source.pos.x, y: source.pos.y },
    victimPos: { x: target.pos.x, y: target.pos.y },
    distance: chebyshev(source.pos, target.pos),
    context: { tick: ctx.tick, night: ctx.night },
  });
  ctx.pending.push({
    kind: "death",
    entityId: target.id,
    pos: { x: target.pos.x, y: target.pos.y },
  });

  // ── P2 (onKill): ações ao matar (ex: Exagero respinga o overkill em área).
  // `suppressEffects` no splash evita cascata infinita. ──
  if (!suppressEffects && ctx.effectsOf) {
    const effects = ctx.effectsOf(source.id);
    if (effects.length > 0) {
      const facts: Facts = {
        overkill: Math.max(0, amount - hpBefore),
        overkillRatio: hpBefore > 0 ? amount / hpBefore : amount,
        "victim.family": target.family,
        finalBlowAmount: amount,
        damageType, // B6: filtra kill MÁGICO (Intocado)
      };
      // P2 areaDamage (Transbordo) — precisa do sink de área.
      if (ctx.areaDamage) {
        for (const a of collectOnKill(effects, facts)) {
          const tiles = areaShapeTiles(a.shape, target.pos, source.pos);
          ctx.areaDamage(tiles, source.id, a.amount, (a.damageType as DamageType) ?? damageType);
        }
      }
      // B6 restoreMana (Intocado: golpe final mágico devolve mana à fonte).
      const mana = collectOnKillMana(effects, facts);
      if (mana > 0 && source.maxMp > 0) source.mp = Math.min(source.maxMp, source.mp + mana);
    }
  }
  return true;
}

/**
 * Cura `target` em até `amount` (clampado a maxHp). Emite o snapshot-event
 * `heal` (floating text verde futuro). Não cura entidade morta. Retorna o HP
 * efetivamente restaurado. (Cura não tem evento próprio no bus M1 — o perfil
 * relevante vai no `skill_use`; quando houver Marca de cura, plugamos aqui.)
 */
export function applyHeal(
  ctx: CombatCtx,
  source: SimEntity,
  target: SimEntity,
  amount: number,
  skillId: string | null,
): number {
  if (target.dead) return 0;
  const before = target.hp;
  target.hp = Math.min(target.maxHp, target.hp + amount);
  const healed = target.hp - before;
  ctx.pending.push({
    kind: "heal",
    skillId,
    casterId: source.id,
    targetId: target.id,
    amount: healed,
    pos: { x: target.pos.x, y: target.pos.y },
  });
  return healed;
}
