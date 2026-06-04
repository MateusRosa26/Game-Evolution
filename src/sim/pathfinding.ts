import type { Vec2 } from "../shared/types";
import type { World } from "./World";

/**
 * A* em grid, 8 direções, custo diagonal 1.41.
 * Diagonal proibida quando "cortaria" uma quina (os dois ortogonais
 * adjacentes precisam estar livres).
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

/** Retorna o caminho (sem incluir a origem) ou null se inalcançável. */
export function findPath(world: World, from: Vec2, to: Vec2): Vec2[] | null {
  if (!world.isWalkable(to.x, to.y)) return null;
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
        if (!world.isWalkable(nx, ny)) continue;
        const diagonal = dx !== 0 && dy !== 0;
        if (diagonal && (!world.isWalkable(current.x + dx, current.y) || !world.isWalkable(current.x, current.y + dy))) {
          continue; // não cortar quinas
        }
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
export function nearestWalkable(world: World, target: Vec2, maxRing = 3): Vec2 | null {
  if (world.isWalkable(target.x, target.y)) return target;
  for (let r = 1; r <= maxRing; r++) {
    let best: Vec2 | null = null;
    let bestDist = Infinity;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = target.x + dx;
        const y = target.y + dy;
        if (!world.isWalkable(x, y)) continue;
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
