/**
 * AVALIADORES DE EFEITO — funções PURAS que interpretam os `EffectSpec` ativos
 * de uma entidade nos hooks de combate (catálogo Lote 1 §3.3). Sem estado, sem
 * pixi: recebem os efeitos + os fatos do hook (mesmo `Facts`/`matchesFilter` dos
 * gatilhos) e devolvem o ajuste. A Simulation injeta isto no `CombatCtx`.
 *
 * Implementados aqui: P1 damageMult, P4 crit, P3 blockFull, P2 onKill.
 * (P5 regen, P6 statusCombo, P7 skillSwap, P9 derivedMod entram nos seus hooks
 * próprios — regen/executor/recompute — ver catálogo §3.3.)
 */

import type { EffectSpec } from "./types";
import { matchesFilter, type Facts } from "./filters";

/** P1+P4 — multiplicador de dano de saída acumulado + se algum crit disparou. */
export interface OutgoingMod {
  mult: number;
  crit: boolean;
}

/** P1 (`damageMult`) + P4 (`crit`): multiplicador do dano de saída dado os fatos. */
export function evalOutgoing(effects: EffectSpec[], facts: Facts): OutgoingMod {
  let mult = 1;
  let crit = false;
  for (const e of effects) {
    if (e.kind === "damageMult") {
      if (!e.when || matchesFilter(e.when, facts)) mult *= e.mult;
    } else if (e.kind === "crit") {
      if (!e.when || matchesFilter(e.when, facts)) {
        mult *= e.mult;
        crit = true;
      }
    }
  }
  return { mult, crit };
}

/** P3 (`blockFull`): rola as chances de bloqueio total; true = absorve 100%. */
export function rollFullBlock(effects: EffectSpec[], rng: () => number): boolean {
  for (const e of effects) {
    if (e.kind === "blockFull" && rng() < e.chance) return true;
  }
  return false;
}

/** Uma ação de dano em área a executar no on-kill (P2). */
export interface OnKillAreaAction {
  amount: number;
  radius: number;
  damageType?: string;
}

/** Um combo de status disparado (P6). */
export interface StatusComboHit {
  burst: number;
  consumes: string[];
}

/**
 * P6 (`statusCombo`): casa os efeitos reativos contra o status do alvo + o tipo
 * de dano. Ex: Senhor dos Extremos — fogo em alvo `slow` (gelado) ou gelo em alvo
 * `burn`. Retorna os bursts a aplicar + os status a consumir.
 */
export function matchStatusCombos(effects: EffectSpec[], targetStatusKinds: string[], damageType: string): StatusComboHit[] {
  const out: StatusComboHit[] = [];
  for (const e of effects) {
    if (e.kind !== "statusCombo") continue;
    if (e.onDamageType !== damageType) continue;
    if (!targetStatusKinds.includes(e.ifTargetStatus)) continue;
    out.push({ burst: e.burst, consumes: e.consumes });
  }
  return out;
}

/** P5 (`regen`): multiplicador acumulado de regen de um recurso, condicional. */
export function evalRegenMult(effects: EffectSpec[], resource: "mana" | "hp", facts: Facts): number {
  let mult = 1;
  for (const e of effects) {
    if (e.kind === "regen" && e.resource === resource) {
      if (!e.when || matchesFilter(e.when, facts)) mult *= e.mult;
    }
  }
  return mult;
}

/** P2 (`onKill`): coleta as áreas de dano escaladas por um FATO do kill (ex: overkill). */
export function collectOnKill(effects: EffectSpec[], facts: Facts): OnKillAreaAction[] {
  const out: OnKillAreaAction[] = [];
  for (const e of effects) {
    if (e.kind !== "onKill" || e.action !== "areaDamage") continue;
    if (e.when && !matchesFilter(e.when, facts)) continue;
    const base = facts[e.scaleField];
    const scaled = typeof base === "number" ? base * e.scale : 0;
    if (scaled >= 1) out.push({ amount: Math.round(scaled), radius: e.radius, damageType: e.damageType });
  }
  return out;
}
