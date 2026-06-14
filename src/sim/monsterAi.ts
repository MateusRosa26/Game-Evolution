import { applyDamage, chebyshev, type CombatCtx } from "./combat";
import { isStunned } from "./skills/status";
import type { SimEntity } from "./entity";
import { physicalVariance } from "./formulas";
import { tryStartMove } from "./moves";
import { findPath } from "./pathfinding";
import { dirFromDelta, TileId } from "../shared/types";
import type { World } from "./World";

/**
 * IA de monstro — roteada por `template.behavior` (a Simulation despacha por
 * comportamento). Implementados:
 *   - "chaser" (`updateChaser`): idle → adquire por proximidade → persegue (A*)
 *     → bate em melee. O do Rato/Goblin/Lobo/etc.
 *   - "territorial" (`updateTerritorial`): NEUTRO até apanhar; provocado, vira
 *     chaser. O do Javali (FAMILIAS §1 "neutro até provocado").
 *   - "shooter" (`updateShooter`): mantém distância e ATIRA (com linha de visão,
 *     PODE atirar através de água/gap); se o alvo encosta, KITA 1 tile. O do
 *     Goblin Fundeiro (FAMILIAS §2 "primeiro ranged do jogo").
 *
 * Roda na sim, é determinística (DECISÃO sem RNG — o alvo é escolhido por
 * proximidade estável; só a VARIÂNCIA do dano usa o combatRng seedado da sim,
 * que é reprodutível). Não move a entidade aqui — só decide intent/ataque; o passo é
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
 * Alcance melee padrão (tiles, Chebyshev): adjacente incl. diagonal. Mobs sem
 * `attackRange` (chaser/territorial) batem colados. O shooter sobrescreve.
 */
const MELEE_RANGE = 1;

/**
 * Tiles que BLOQUEIAM linha de visão (sólidos altos). Tudo o mais — incluindo
 * água/água-funda/esgoto e os chãos — é TRANSPARENTE: o shooter PODE atirar
 * através do rio/gap (o Juncal dos Fundeiros é desenhado pra isso). Não há LoS
 * em outras partes da sim ainda (alcance de arma é Chebyshev puro — ver
 * balance.ts); esta checagem vive aqui, restrita ao tiro de mob.
 */
const SIGHT_BLOCKERS: ReadonlySet<TileId> = new Set([
  TileId.Tree,
  TileId.Rock,
  TileId.Wall,
  TileId.SewerWall,
  TileId.OldMasonryWall,
  TileId.CaveWall,
  TileId.HouseWall,
  TileId.Void,
]);

/**
 * Há linha de visão de `a` até `b` no andar `z`? Traça uma reta (supercover de
 * Bresenham) entre os centros e bloqueia se QUALQUER tile intermediário for
 * sólido (SIGHT_BLOCKERS). As pontas (origem/alvo) não contam — só o caminho
 * entre elas. Determinístico, sem RNG.
 */
export function hasLineOfSight(world: World, a: { x: number; y: number }, b: { x: number; y: number }, z: number): boolean {
  let x = a.x;
  let y = a.y;
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  const sx = a.x < b.x ? 1 : -1;
  const sy = a.y < b.y ? 1 : -1;
  let err = dx - dy;
  // anda passo a passo; ao chegar no tile do alvo, há visão (não testa as pontas)
  while (x !== b.x || y !== b.y) {
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
    if (x === b.x && y === b.y) break; // chegou no alvo — não bloqueia na ponta
    if (SIGHT_BLOCKERS.has(world.tileAt(x, y, z))) return false;
  }
  return true;
}

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
 * Alvo atual ainda válido? (existe, vivo, mesmo andar, dentro do raio + folga,
 * fora de zona segura). Resolve o id pro objeto; undefined se inválido. Comum a
 * chaser/shooter — centraliza a regra de perda de alvo (histerese).
 */
function resolveTarget(world: World, monster: SimEntity, players: SimEntity[]): SimEntity | undefined {
  const target = monster.targetId != null ? players.find((p) => p.id === monster.targetId) : undefined;
  if (
    !target ||
    target.dead ||
    target.z !== monster.z ||
    chebyshev(monster.pos, target.pos) > monster.aggroRadius + AGGRO_DROP_GRACE_TILES ||
    world.isSafeZone(target.pos.x, target.pos.y, monster.z)
  ) {
    return undefined;
  }
  return target;
}

/**
 * Atualiza a IA de um monstro Perseguidor neste tick: aquisição de alvo,
 * perseguição via pathfinding e ataque melee. `now` é o tempo lógico da sim em ms.
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
  let target = resolveTarget(world, monster, players);
  if (!target) {
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
      // Físico do mob é VARIÁVEL como o do player (±40%, mean-preserving): bater
      // exato lê robótico. attackDamage já é a MÉDIA → só rola na resolução, sem
      // recalibrar número de mob. attackType vem do template (não mais hardcoded).
      const dmg = physicalVariance(monster.attackDamage, ctx.rng());
      applyDamage(ctx, monster, target, dmg, monster.attackType ?? "physical", null, null);
      monster.nextAttackAt = now + monster.attackCooldownMs;
    }
    return;
  }

  // ── Persegue via A* até um tile adjacente ao alvo ──
  chaseToward(world, monster, target, isBlocked);
}

/**
 * Monstro TERRITORIAL (Javali — FAMILIAS §1 "neutro até provocado"): NÃO
 * adquire alvo por proximidade — pasta parado até RECEBER dano. A provocação é
 * marcada por fora (`monster.provoked`, setada pelo handler de `damage` da
 * Simulation quando um jogador o fere). Provocado, comporta-se EXATAMENTE como
 * um chaser (persegue/ataca, e a partir daí re-adquire por proximidade — não
 * volta a "dormir"). `provoked` é resetado no respawn (spawnMonster).
 */
export function updateTerritorial(
  ctx: CombatCtx,
  world: World,
  monster: SimEntity,
  players: SimEntity[],
  now: number,
  isBlocked: (x: number, y: number) => boolean,
): void {
  if (monster.dead) return;
  if (!monster.provoked) {
    // Neutro: sem alvo, sem intenção (fica idle no lugar). Apanhar liga `provoked`.
    monster.ai = "idle";
    monster.targetId = null;
    monster.intent = null;
    return;
  }
  // Provocado → chaser pleno (mesma lógica de aquisição/perseguição/ataque).
  updateChaser(ctx, world, monster, players, now, isBlocked);
}

/**
 * Monstro ATIRADOR (Goblin Fundeiro — FAMILIAS §2 "primeiro ranged do jogo"):
 * adquire por proximidade e MANTÉM distância, atirando a cada cooldown a quem
 * estiver no `attackRange` COM linha de visão (pode atravessar água/gap). Se o
 * alvo encosta (≤ KITE_RANGE), RECUA 1 tile (kite). Se está fora de alcance ou
 * sem visão, APROXIMA via A* até entrar na faixa de tiro. O dano é direto à
 * distância (telegrafia mínima = o próprio evento de dano: o client anima o
 * ataque do atacante + floating text no alvo). ✏️ projétil próprio = wave futura.
 */
export function updateShooter(
  ctx: CombatCtx,
  world: World,
  monster: SimEntity,
  players: SimEntity[],
  now: number,
  isBlocked: (x: number, y: number) => boolean,
): void {
  if (monster.dead) return;
  if (isStunned(monster)) { monster.intent = null; return; }

  // Distância em que o atirador é "encostado" e KITA (recua). 1 = só quando
  // adjacente; o fundeiro quer atirar de longe, então qualquer adjacência o faz recuar.
  const KITE_RANGE = 1;
  const range = monster.attackRange ?? MELEE_RANGE;

  // ── Aquisição/perda de alvo (mesma histerese do chaser) ──
  let target = resolveTarget(world, monster, players);
  if (!target) {
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
  const los = hasLineOfSight(world, monster.pos, target.pos, monster.z);

  // ── Encostado: KITA (recua 1 tile na direção oposta ao alvo) ──
  if (dist <= KITE_RANGE) {
    monster.facing = facingToward(monster, target);
    const stepped = kiteAway(monster, target, isBlocked);
    // Mesmo recuando, dispara se ainda tem visão e cooldown pronto (atira e foge).
    if (los) tryShoot(ctx, monster, target, range, now);
    if (!stepped) monster.intent = null; // sem pra onde recuar: fica e atira
    return;
  }

  // ── Na faixa de tiro COM visão: para e atira no cooldown ──
  if (dist <= range && los) {
    monster.intent = null;
    monster.facing = facingToward(monster, target);
    tryShoot(ctx, monster, target, range, now);
    return;
  }

  // ── Fora de alcance OU sem visão: aproxima via A* até poder atirar ──
  chaseToward(world, monster, target, isBlocked);
}

/**
 * Dispara o ataque à distância se o alvo está no alcance e o cooldown venceu.
 * Dano variável (±40%, igual ao melee de mob) a partir da média do template.
 */
function tryShoot(ctx: CombatCtx, monster: SimEntity, target: SimEntity, range: number, now: number): void {
  if (chebyshev(monster.pos, target.pos) > range) return;
  if (now < monster.nextAttackAt) return;
  const dmg = physicalVariance(monster.attackDamage, ctx.rng());
  applyDamage(ctx, monster, target, dmg, monster.attackType ?? "physical", null, null);
  monster.nextAttackAt = now + monster.attackCooldownMs;
}

/**
 * Recua 1 tile na direção OPOSTA ao alvo (kite do atirador). Tenta o passo reto
 * para longe e, se bloqueado, os dois passos cardeais adjacentes (desliza pela
 * parede). Seta `intent` = dir; o passo é executado pelo loop de movimento.
 * Retorna true se achou pra onde recuar.
 */
function kiteAway(monster: SimEntity, target: SimEntity, isBlocked: (x: number, y: number) => boolean): boolean {
  const dx = Math.sign(monster.pos.x - target.pos.x);
  const dy = Math.sign(monster.pos.y - target.pos.y);
  // candidatos: afastar nos dois eixos, depois só X, depois só Y (desliza)
  const cands: [number, number][] = [
    [dx, dy],
    [dx, 0],
    [0, dy],
  ];
  for (const [vx, vy] of cands) {
    if (vx === 0 && vy === 0) continue;
    const nx = monster.pos.x + vx;
    const ny = monster.pos.y + vy;
    if (isBlocked(nx, ny)) continue;
    const dir = dirFromDelta(vx, vy);
    if (dir) { monster.intent = { kind: "dir", dir }; return true; }
  }
  return false;
}

/**
 * Persegue o alvo via A* até um tile adjacente a ele (lógica comum a chaser e
 * ao shooter quando precisa fechar distância). Repath só quando o alvo MUDA de
 * tile (o `goal` do intent guarda a posição do alvo no cálculo — alvo parado +
 * path em curso = segue o path, evita um A* completo por mob por tick).
 */
function chaseToward(
  world: World,
  monster: SimEntity,
  target: SimEntity,
  isBlocked: (x: number, y: number) => boolean,
): void {
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
