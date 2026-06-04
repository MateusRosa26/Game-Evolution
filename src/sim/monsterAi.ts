import { applyDamage, chebyshev, type CombatCtx } from "./combat";
import type { SimEntity } from "./entity";
import { findPath } from "./pathfinding";
import type { World } from "./World";

/**
 * IA de monstro — M1 implementa só o comportamento "Perseguidor" (chaser),
 * o do Rato Lanhoso: idle → detecta jogador no raio de aggro → persegue via
 * A* existente → ataca quando adjacente.
 *
 * Roda na sim, é determinística (sem RNG; o alvo é escolhido por proximidade
 * estável). Não move a entidade aqui — só decide intent/ataque; o passo é
 * executado pelo loop de movimento da Simulation com o cooldown da própria
 * entidade.
 */

/** Escolhe o jogador vivo mais próximo dentro do raio de aggro, ou null. */
function nearestPlayerInAggro(monster: SimEntity, players: SimEntity[]): SimEntity | null {
  let best: SimEntity | null = null;
  let bestDist = Infinity;
  for (const p of players) {
    if (p.dead) continue;
    const d = chebyshev(monster.pos, p.pos);
    if (d <= monster.aggroRadius && d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

/**
 * Atualiza a IA de um monstro neste tick: aquisição de alvo, perseguição via
 * pathfinding e ataque melee. `now` é o tempo lógico da sim em ms.
 */
export function updateChaser(
  ctx: CombatCtx,
  world: World,
  monster: SimEntity,
  players: SimEntity[],
  now: number,
): void {
  if (monster.dead) return;

  // ── Aquisição/perda de alvo ──
  let target = monster.targetId != null ? players.find((p) => p.id === monster.targetId) : undefined;
  if (!target || target.dead || chebyshev(monster.pos, target.pos) > monster.aggroRadius + 1) {
    target = nearestPlayerInAggro(monster, players) ?? undefined;
    monster.targetId = target ? target.id : null;
  }

  if (!target) {
    monster.ai = "idle";
    monster.intent = null;
    return;
  }

  monster.ai = "chasing";
  const dist = chebyshev(monster.pos, target.pos);

  if (dist <= 1) {
    // Adjacente (incl. diagonal): para e ataca no cooldown.
    monster.intent = null;
    if (now >= monster.nextAttackAt) {
      monster.facing = facingToward(monster, target);
      applyDamage(ctx, monster, target, monster.attackDamage, "physical", null, null);
      monster.nextAttackAt = now + monster.attackCooldownMs;
    }
    return;
  }

  // ── Persegue via A* até um tile adjacente ao alvo ──
  const path = findPath(world, monster.pos, target.pos);
  if (path && path.length > 0) {
    // Não pisa em cima do alvo: descarta o último passo (o tile do jogador).
    const goal = path[path.length - 1];
    if (goal.x === target.pos.x && goal.y === target.pos.y) path.pop();
    monster.intent = path.length > 0 ? { kind: "path", path, goal: target.pos } : null;
  } else {
    monster.intent = null;
  }
}

/** Direção visual do monstro virado para o alvo. */
function facingToward(monster: SimEntity, target: SimEntity): SimEntity["facing"] {
  const dx = target.pos.x - monster.pos.x;
  const dy = target.pos.y - monster.pos.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "e" : "w";
  return dy >= 0 ? "s" : "n";
}
