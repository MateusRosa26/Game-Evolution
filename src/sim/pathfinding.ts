import type { Vec2 } from "../shared/types";
import type { World } from "./World";

/**
 * A* em grid, 8 direções, custo diagonal 1.41.
 * Diagonal estilo Tibia (decidido jun/2026): só o tile DESTINO importa —
 * cortar quina é permitido, mesmo entre dois tiles sólidos. (A regra de
 * quina anterior travava caçada perto de árvores/muros — as copas de 64px
 * escondem qual tile é o sólido, e a travada parecia bug de mob.)
 */

const ORTHO_COST = 1;
const DIAG_COST = 1.41;
const MAX_EXPANSIONS = 4000;

interface Node {
  x: number;
  y: number;
  g: number;
  f: number;
  parent: Node | null;
}

function octile(ax: number, ay: number, bx: number, by: number): number {
  const dx = Math.abs(ax - bx);
  const dy = Math.abs(ay - by);
  return ORTHO_COST * Math.max(dx, dy) + (DIAG_COST - ORTHO_COST) * Math.min(dx, dy);
}

/** Opções de pathfinding. */
export interface PathOpts {
  /**
   * Bloqueio DINÂMICO de tile (ex.: ocupado por entidade viva — bloqueio de
   * corpo estilo Tibia). O tile-DESTINO nunca é filtrado: perseguir um alvo
   * significa pathear até o tile dele e parar adjacente.
   */
  isBlocked?: (x: number, y: number) => boolean;
  /** Andar (z-level) em que o caminho é calculado. Default = andar base. */
  z?: number;
}

/** Retorna o caminho (sem incluir a origem) ou null se inalcançável. Opera
 *  dentro de UM andar (`opts.z`) — travessia entre andares é por portal. */
export function findPath(world: World, from: Vec2, to: Vec2, opts?: PathOpts): Vec2[] | null {
  const isBlocked = opts?.isBlocked;
  const z = opts?.z;
  if (!world.isWalkable(to.x, to.y, z)) return null;
  if (from.x === to.x && from.y === to.y) return [];

  const open: Node[] = [{ x: from.x, y: from.y, g: 0, f: octile(from.x, from.y, to.x, to.y), parent: null }];
  const bestG = new Map<number, number>();
  const key = (x: number, y: number) => y * world.width + x;
  bestG.set(key(from.x, from.y), 0);

  let expansions = 0;
  while (open.length > 0 && expansions < MAX_EXPANSIONS) {
    expansions++;
    // Fila de prioridade simples — mapas atuais são pequenos; trocar por heap se crescer.
    let bestIdx = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bestIdx].f) bestIdx = i;
    const current = open.splice(bestIdx, 1)[0];

    if (current.x === to.x && current.y === to.y) {
      const path: Vec2[] = [];
      let n: Node | null = current;
      while (n && n.parent) {
        path.push({ x: n.x, y: n.y });
        n = n.parent;
      }
      return path.reverse();
    }

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = current.x + dx;
        const ny = current.y + dy;
        if (!world.isWalkable(nx, ny, z)) continue;
        // Bloqueio dinâmico (entidades), exceto no tile-destino.
        if (isBlocked && !(nx === to.x && ny === to.y) && isBlocked(nx, ny)) continue;
        const diagonal = dx !== 0 && dy !== 0;
        const g = current.g + (diagonal ? DIAG_COST : ORTHO_COST);
        const k = key(nx, ny);
        const known = bestG.get(k);
        if (known !== undefined && known <= g) continue;
        bestG.set(k, g);
        open.push({ x: nx, y: ny, g, f: g + octile(nx, ny, to.x, to.y), parent: current });
      }
    }
  }
  return null;
}

/**
 * Para cliques em tiles bloqueados: encontra o tile andável mais próximo
 * do alvo (busca em anel limitada), ou null.
 */
export function nearestWalkable(world: World, target: Vec2, maxRing = 3, z?: number): Vec2 | null {
  if (world.isWalkable(target.x, target.y, z)) return target;
  for (let r = 1; r <= maxRing; r++) {
    let best: Vec2 | null = null;
    let bestDist = Infinity;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = target.x + dx;
        const y = target.y + dy;
        if (!world.isWalkable(x, y, z)) continue;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          best = { x, y };
        }
      }
    }
    if (best) return best;
  }
  return null;
}
