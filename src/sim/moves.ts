// Sistema de MOVES de monstro — mecânicas telegrafadas e desviáveis.
// Spec: `design/bestiario/MECANICAS-DE-MOB.md`. Um move = AVISO (windup) + EFEITO
// ao resolver. Determinístico (sim autoritativa; zero RNG). O mob fica TRAVADO
// durante o windup (não anda/ataca) — é o telegraph + a janela de punição.
//
// Efeitos implementados: "leap" (gap-closer do goblin base, pura movimentação) e
// "slam" (dano em ÁREA marcada — o núcleo de DESVIO: os tiles são congelados no
// início do windup, o jogador SAI de cima durante o aviso, e o dano resolve
// lendo quem ocupa os tiles no tick FINAL). ✏️ próximos: "beam"/"cone"/projétil.
import { chebyshev } from "./combat";
import type { SimEntity } from "./entity";
import type { DamageType, Vec2 } from "../shared/types";

/** Tipo de efeito do move ao resolver. */
export type MoveKind = "leap" | "slam";

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
  // ── Moves de dano-em-tiles (slam/beam/…): ──
  /** Raio do AOE em tiles (Chebyshev): a área marcada = (2r+1)² em torno do alvo,
   *  CONGELADA no início do windup. undefined = não é move de área. */
  radius?: number;
  /** Dano ao resolver, a quem ocupar um tile marcado. Amarrado ao move
   *  (MECANICAS §0: errar o desvio dói; HP só dá ritmo). */
  damage?: number;
  /** Tipo de dano (default "physical"). */
  damageType?: DamageType;
}

/**
 * Salto do Goblin (base) — gap-closer ANTI-KITE: o goblin se prepara (windup) e
 * pula para junto do alvo. **Pura movimentação**, sem dano no pouso (o dano é o
 * melee normal depois). Decisão do criador (MECANICAS §5): o salto fica no BASE.
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
 * Investida do Abutre (mergulho) — gap-closer aéreo: o carniceiro recua a leitura
 * e MERGULHA sobre o alvo. Variante de `leap` (pura movimentação; a mordida é o
 * melee normal no pouso), com alcance MAIOR (até 5 tiles — o abutre cobre o céu) e
 * windup um tico mais curto (600ms — ave ágil; ainda ≥ reação 250 + passo + buffer).
 */
export const ABUTRE_INVESTIDA: MoveDef = {
  id: "leap", // mesmo efeito de movimento do leap base (engine não muda)
  kind: "leap",
  windupMs: 600,
  cooldownMs: 5000,
  rangeMin: 2,
  rangeMax: 5,
};

/**
 * Estouro (Slam) — AOE telegrafado: o mob marca a ÁREA onde o alvo ESTÁ (BASE =
 * 1×1, só o tile dele) e bate depois do windup. O jogador desvia SAINDO da área
 * (sair 1 tile antes = imune; resolução lê a ocupação no tick final). É o
 * move-tutorial do desvio das variantes (MECANICAS §3: goblin → goblin+slam).
 * O tamanho do AOE é o `radius` (knob — 1×1 base → 3×3+ nas versões fortes).
 * Windup 800ms. Dano alto de propósito ✏️ Balancista.
 */
export const GOBLIN_SLAM: MoveDef = {
  id: "slam",
  kind: "slam",
  windupMs: 800,
  cooldownMs: 6000,
  rangeMin: 1,
  rangeMax: 2,
  // `radius` é o KNOB de tamanho do AOE (decidido criador): BASE = 0 → **1×1**
  // (só o tile do alvo; desvio = sair pra qualquer adjacente, o desvio mais
  // limpo/tutorial). Variantes/elites SOBEM o raio (1 = 3×3, 2 = 5×5…) pra
  // exigir mais passos de desvio — sem trocar o código, só o número.
  radius: 0,
  damage: 18, // ✏️ Balancista — errar o desvio dói (respeito ao windup)
  damageType: "physical",
};

/** Tiles do AOE: (2r+1)² em torno de um centro (congelados no início do windup). */
function tilesAround(center: Vec2, radius: number): Vec2[] {
  const tiles: Vec2[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) tiles.push({ x: center.x + dx, y: center.y + dy });
  }
  return tiles;
}

/**
 * Tenta iniciar um move do monstro neste tick. Se algum está fora de cooldown E
 * o alvo está na faixa, seta `activeMove` (entra em windup) + arma o cooldown e
 * retorna true. Determinístico: o primeiro move elegível na ordem declarada.
 * Moves de área CONGELAM os tiles-alvo AGORA (em torno da posição atual do alvo).
 * `now` = tempo lógico da sim em ms.
 */
export function tryStartMove(monster: SimEntity, target: SimEntity, now: number): boolean {
  if (!monster.moves || monster.moves.length === 0) return false;
  if (monster.activeMove) return false; // já em windup
  const dist = chebyshev(monster.pos, target.pos);
  for (const def of monster.moves) {
    const ready = (monster.moveCooldowns?.[def.id] ?? 0) <= now;
    if (ready && dist >= def.rangeMin && dist <= def.rangeMax) {
      const targetTiles = def.radius != null ? tilesAround(target.pos, def.radius) : undefined;
      monster.activeMove = { def, targetId: target.id, resolveAt: now + def.windupMs, targetTiles };
      monster.moveCooldowns = { ...(monster.moveCooldowns ?? {}), [def.id]: now + def.cooldownMs };
      return true;
    }
  }
  return false;
}
