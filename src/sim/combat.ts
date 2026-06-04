import type { DamageType, Vec2 } from "../shared/types";
import type { SnapshotEvent } from "../shared/protocol";
import type { CombatActorRef, EventBus } from "./events";
import type { SimEntity } from "./entity";

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
 * Aplica dano de `source` em `target`. Emite `damage` sempre; se matar,
 * emite `kill` e marca `target.dead`. Retorna true se o golpe foi fatal.
 */
export function applyDamage(
  ctx: CombatCtx,
  source: SimEntity,
  target: SimEntity,
  amount: number,
  damageType: DamageType,
  weaponId: string | null,
  skillId: string | null,
): boolean {
  if (target.dead) return false;

  target.hp = Math.max(0, target.hp - amount);

  ctx.bus.emit("damage", {
    source: actorRef(source),
    target: actorRef(target),
    amount,
    damageType,
    at: { x: target.pos.x, y: target.pos.y },
    weaponId,
    skillId,
    context: { tick: ctx.tick, night: ctx.night },
  });
  ctx.pending.push({
    kind: "damage",
    targetId: target.id,
    amount,
    pos: { x: target.pos.x, y: target.pos.y },
  });

  if (target.hp > 0) return false;

  // ── Golpe fatal: morte + evento kill rico ──
  target.dead = true;
  ctx.bus.emit("kill", {
    attacker: actorRef(source),
    victim: actorRef(target),
    weaponId,
    skillId,
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
  return true;
}
