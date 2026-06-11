import type { DamageType, Vec2 } from "../shared/types";
import type { SnapshotEvent } from "../shared/protocol";
import type { CombatActorRef, EventBus } from "./events";
import type { SimEntity } from "./entity";
import { armorMitigation } from "./formulas";

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
  /**
   * Chamado quando `target` SOFRE dano (após aplicado, > 0). A Simulation usa
   * para cancelar a conjuração em andamento do alvo (cast-time cancela ao tomar
   * dano). Opcional — DoT/dano ambiental sem este sink simplesmente não cancela.
   */
  onDamaged?: (target: SimEntity, amount: number) => void;
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
 * emite `kill` e marca `target.dead`. Retorna o DANO EFETIVAMENTE APLICADO
 * (pós-mitigação, >= 0) — o chamador deriva "foi fatal?" de `target.dead`.
 * (Lifedrain — DESIGN: morte=dreno vital — usa este retorno p/ curar o caster.)
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
): number {
  if (target.dead) return 0;

  // ── Mitigação do ALVO (ordem decidida: bloqueio% → Def SORTEADA (0..Def) → piso
  // 1). Só o player carrega armadura/escudo (mob: armorDef 0, block null), então o
  // golpe DO player no mob não muda — só o golpe NO player é reduzido. ──
  if (target.block && ctx.rng() < target.block.chance) {
    const blocked = Math.round(amount * target.block.chunkPct);
    amount -= blocked;
    ctx.bus.emit("block", {
      blocker: actorRef(target),
      attacker: actorRef(source),
      blocked,
      damageType,
      context: { tick: ctx.tick, night: ctx.night },
    });
  }
  if (damageType === "physical" && target.armorDef > 0) {
    amount -= armorMitigation(target.armorDef, ctx.rng()); // sorteio 0..Def (Tibia-puro)
  }
  amount = Math.max(1, Math.round(amount));

  target.hp = Math.max(0, target.hp - amount);

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
    context: { tick: ctx.tick, night: ctx.night },
  });
  ctx.pending.push({
    kind: "damage",
    targetId: target.id,
    attackerId: source.id,
    amount,
    pos: { x: target.pos.x, y: target.pos.y },
  });
  // Tomar dano CANCELA a conjuração do alvo (decisão do task: move OU dano).
  if (amount > 0) ctx.onDamaged?.(target, amount);

  if (target.hp > 0) return amount;

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
  return amount;
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
