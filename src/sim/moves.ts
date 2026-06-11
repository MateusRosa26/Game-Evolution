// Sistema de MOVES de monstro — mecânicas telegrafadas e desviáveis.
// Spec: `design/bestiario/MECANICAS-DE-MOB.md`. Um move = AVISO (windup) + EFEITO
// ao resolver. Determinístico (sim autoritativa; zero RNG). O mob fica TRAVADO
// durante o windup (não anda/ataca) — é o telegraph + a janela de punição.
//
// Esta é a 1ª fatia do sistema: o modelo + o efeito "leap" (gap-closer do goblin
// base). Os efeitos de DANO em tiles marcados (Slam/Linha/etc — o núcleo de
// desvio das variantes/T2) entram na próxima fatia (✏️ `MoveKind` cresce; a
// resolução em `Simulation.resolveMove` ganha os ramos).
import { chebyshev } from "./combat";
import type { SimEntity } from "./entity";

/** Tipo de efeito do move ao resolver. ✏️ + "slam" | "beam" | "leap_slam"… */
export type MoveKind = "leap";

export interface MoveDef {
  id: string;
  kind: MoveKind;
  /** Aviso em ms — a janela de leitura/desvio. Régua de justiça
   *  (MECANICAS §1): ≥ reação(~250ms) + 1 passo + buffer. Elites cortam o
   *  buffer, NUNCA a reação. O mob não age durante o windup. */
  windupMs: number;
  /** Cooldown em ms entre usos (conta a partir do início do windup). */
  cooldownMs: number;
  /** Faixa de gatilho (Chebyshev): o move só dispara com o alvo entre min e max
   *  tiles. (leap: min 2 = não salta colado; max 4 = gap-closer de média dist.) */
  rangeMin: number;
  rangeMax: number;
}

/**
 * Salto do Goblin (base) — gap-closer ANTI-KITE: o goblin se prepara (windup) e
 * pula para junto do alvo. **Pura movimentação**, sem dano no pouso (o dano é o
 * melee normal depois). Decisão do criador (MECANICAS §5): o salto fica no BASE.
 * As variantes (goblin + descritor) empilham o AOE-de-aterrissagem desviável.
 * Windup 700ms = telegrafado e justo (passo ~250ms + reação 250ms + buffer).
 */
export const GOBLIN_LEAP: MoveDef = {
  id: "leap",
  kind: "leap",
  windupMs: 700,
  cooldownMs: 5000,
  rangeMin: 2,
  rangeMax: 4,
};

/**
 * Tenta iniciar um move do monstro neste tick. Se algum está fora de cooldown E
 * o alvo está na faixa, seta `activeMove` (entra em windup) + arma o cooldown e
 * retorna true. Determinístico: o primeiro move elegível na ordem declarada.
 * `now` = tempo lógico da sim em ms.
 */
export function tryStartMove(monster: SimEntity, target: SimEntity, now: number): boolean {
  if (!monster.moves || monster.moves.length === 0) return false;
  if (monster.activeMove) return false; // já em windup
  const dist = chebyshev(monster.pos, target.pos);
  for (const def of monster.moves) {
    const ready = (monster.moveCooldowns?.[def.id] ?? 0) <= now;
    if (ready && dist >= def.rangeMin && dist <= def.rangeMax) {
      monster.activeMove = { def, targetId: target.id, resolveAt: now + def.windupMs };
      monster.moveCooldowns = { ...(monster.moveCooldowns ?? {}), [def.id]: now + def.cooldownMs };
      return true;
    }
  }
  return false;
}
