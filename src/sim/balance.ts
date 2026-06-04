import type { PlayerClass } from "../shared/types";

/**
 * Constantes de balance do combate (M1).
 *
 * TODOS os números aqui são PLACEHOLDER — agrupados num único lugar para
 * tunar sem caçar magic numbers pela sim. Princípio de design: mobs são
 * fortes (até T1 pune descuido), então o jogador morre se for descuidado.
 *
 * NOTA (Wave Stats/XP): HP máx, mana e dano/cooldown do jogador NÃO vivem mais
 * aqui — derivam de `formulas.ts` a partir de atributos/classe/nível. Restam
 * aqui só números que ainda não são derivados (base da arma inicial, alcance).
 */

/** Player */
/** Classe padrão de um novo jogador enquanto não há seleção de classe (HUD/UI). */
export const DEFAULT_PLAYER_CLASS: PlayerClass = "knight";
/** Dano-base da arma inicial do jogador (consumido por `physicalDamage`). ✏️ placeholder. */
export const STARTER_WEAPON_DAMAGE = 6; // ✏️ placeholder — calibrar no M2

/** ID placeholder da "arma" com que o jogador ataca no M1 (para o evento kill). */
export const STARTER_WEAPON_ID = "fists";

/** Combate geral */
/** Alcance melee em tiles (Chebyshev: adjacente incl. diagonal = 1). */
export const MELEE_RANGE = 1;
/** Ticks que um corpo (overlay visual) permanece antes de sumir. 0 = sem corpo. */
export const CORPSE_TICKS = 0;
