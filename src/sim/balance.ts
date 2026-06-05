import type { PlayerClass } from "../shared/types";

/**
 * Constantes de balance do combate (M1).
 *
 * TODOS os números aqui são PLACEHOLDER — agrupados num único lugar para
 * tunar sem caçar magic numbers pela sim. Princípio de design: mobs são
 * fortes (até T1 pune descuido), então o jogador morre se for descuidado.
 *
 * NOTA (Wave Stats/XP): HP máx, mana e dano/cooldown do jogador NÃO vivem mais
 * aqui — derivam de `formulas.ts` a partir de atributos/classe/nível.
 *
 * NOTA (Wave Itens): o dano-base/cooldown/ID da arma inicial saíram daqui — agora
 * vivem nos TEMPLATES de item (`src/sim/items/templates.ts`). O jogador equipa
 * uma INSTÂNCIA da arma da classe; o auto-attack lê o template dela. Os antigos
 * `STARTER_WEAPON_DAMAGE`/`STARTER_WEAPON_ID` foram removidos (substituídos pelos
 * templates `espada_curta`/`adaga`/… e o template `fists` dos punhos).
 */

/** Player */
/** Classe padrão de um novo jogador enquanto não há seleção de classe (HUD/UI). */
export const DEFAULT_PLAYER_CLASS: PlayerClass = "knight";

/** Morte */
/**
 * Penalidade de XP por morte do jogador: fração do XP TOTAL acumulado perdida ao
 * morrer (macro do MVP — "morte dói", modelo Tibia). Aplicada em `progression.ts`
 * via `applyDeathPenalty`; level-down é permitido (o teto de recursos pode descer).
 * ✏️ calibrar — knob visceral: define o quanto a morte machuca a progressão.
 */
export const DEATH_XP_PENALTY = 0.1;

/** Combate geral */
/** Alcance melee em tiles (Chebyshev: adjacente incl. diagonal = 1). */
export const MELEE_RANGE = 1;
/** Ticks que um corpo (overlay visual) permanece antes de sumir. 0 = sem corpo. */
export const CORPSE_TICKS = 0;
