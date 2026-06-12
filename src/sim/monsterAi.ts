import { applyDamage, chebyshev, type CombatCtx } from "./combat";
import { isStunned } from "./skills/status";
import type { SimEntity } from "./entity";
import { tryStartMove } from "./moves";
import { findPath } from "./pathfinding";
import type { World } from "./World";

/**
 * IA de monstro — M1 implementa só o comportamento "Perseguidor" (chaser),
 * o do Rato: idle → detecta jogador no raio de aggro → persegue via
 * A* existente → ataca quando adjacente.
 *
 * Roda na sim, é determinística (sem RNG; o alvo é escolhido por proximidade
 * estável). Não move a entidade aqui — só decide intent/ataque; o passo é
 * executado pelo loop de movimento da Simulation com o cooldown da própria
 * entidade.
 */

/**
 * Histerese de perda de alvo, em tiles: o mob ADQUIRE alvo dentro do raio puro
 * (`aggroRadius`, em `nearestPlayerInAggro`), mas só SOLTA o alvo além de
 * `aggroRadius + GRACE`. Sem a folga, um alvo parado exatamente na borda do
 * raio liga/desliga o aggro a cada passo (flicker de intenção). A assimetria
 * entre adquirir e soltar é DELIBERADA — não igualar os dois lados.
 */
const AGGRO_DROP_GRACE_TILES = 1;

/**
 * Escolhe o jogador vivo mais próximo dentro do raio de aggro, ou null.
 * Jogador em ZONA SEGURA é invisível para a IA (depot: mobs não entram nem
 * ficam batendo da borda — a zona é cega para eles).
 */
function nearestPlayerInAggro(world: World, monster: SimEntity, players: SimEntity[]): SimEntity | null {
  let best: SimEntity | null = null;
  let bestDist = Infinity;
  for (const p of players) {
    // Aggro é POR ANDAR (SISTEMA-ANDARES §4): mob só vê quem está no mesmo z.
    if (p.dead || p.z !== monster.z || world.isSafeZone(p.pos.x, p.pos.y, monster.z)) continue;
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
  /** Bloqueio dinâmico de tile (ocupação por entidades — bloqueio de corpo). */
  isBlocked: (x: number, y: number) => boolean,
): void {
  if (monster.dead) return;
  // Atordoado: não persegue NEM ataca (o movimento já é barrado na Simulation;
  // aqui barramos o ataque). Volta a agir quando o stun expira.
  if (isStunned(monster)) { monster.intent = null; return; }

  // ── Aquisição/perda de alvo ──
  let target = monster.targetId != null ? players.find((p) => p.id === monster.targetId) : undefined;
  if (
    !target ||
    target.dead ||
    target.z !== monster.z || // alvo trocou de andar → solta (mob não persegue cross-floor)
    chebyshev(monster.pos, target.pos) > monster.aggroRadius + AGGRO_DROP_GRACE_TILES ||
    world.isSafeZone(target.pos.x, target.pos.y, monster.z) // alvo entrou em zona segura → solta
  ) {
    target = nearestPlayerInAggro(world, monster, players) ?? undefined;
    monster.targetId = target ? target.id : null;
  }

  if (!target) {
    monster.ai = "idle";
    monster.intent = null;
    return;
  }

  monster.ai = "chasing";
  const dist = chebyshev(monster.pos, target.pos);

  // Mecânica telegrafada (MECANICAS-DE-MOB.md): se um move está pronto e o alvo
  // está na faixa, inicia o windup — o mob ENCARA o alvo e TRAVA (não anda nem
  // ataca) até a Simulation resolver. Prioridade sobre perseguir/atacar.
  if (tryStartMove(monster, target, now)) {
    monster.facing = facingToward(monster, target);
    monster.intent = null;
    return;
  }

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
  // Repath só quando o ALVO MUDOU de tile: o `goal` do intent guarda a posição
  // do alvo no momento do cálculo (tryStep cria objetos novos de pos, então o
  // goal é um snapshot). Alvo parado + path em curso = segue o path — evita um
  // A* completo por mob por tick (bomba de CPU nos mapas maiores do M3).
  if (
    monster.intent?.kind === "path" &&
    monster.intent.path.length > 0 &&
    monster.intent.goal.x === target.pos.x &&
    monster.intent.goal.y === target.pos.y
  ) {
    return;
  }
  // O tile do alvo nunca é filtrado pelo isBlocked (regra do findPath) — o
  // path chega até ele e o último passo é descartado: mobs CERCAM o alvo em
  // tiles livres em vez de empilhar atrás do primeiro que chegou.
  const path = findPath(world, monster.pos, target.pos, { isBlocked, z: monster.z });
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
