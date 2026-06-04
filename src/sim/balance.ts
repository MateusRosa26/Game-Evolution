/**
 * Constantes de balance do combate (M1).
 *
 * TODOS os números aqui são PLACEHOLDER — agrupados num único lugar para
 * tunar sem caçar magic numbers pela sim. Princípio de design: mobs são
 * fortes (até T1 pune descuido), então o jogador morre se for descuidado.
 */

/** Player */
export const PLAYER_MAX_HP = 100;
export const PLAYER_MAX_MP = 50;
/** Dano base do ataque desarmado/arma inicial do jogador. */
export const PLAYER_ATTACK_DAMAGE = 14;
/** Cooldown entre auto-attacks do jogador, em ms (estilo Tibia ~2s). */
export const PLAYER_ATTACK_COOLDOWN_MS = 2000;

/** ID placeholder da "arma" com que o jogador ataca no M1 (para o evento kill). */
export const STARTER_WEAPON_ID = "fists";

/** Combate geral */
/** Alcance melee em tiles (Chebyshev: adjacente incl. diagonal = 1). */
export const MELEE_RANGE = 1;
/** Ticks que um corpo (overlay visual) permanece antes de sumir. 0 = sem corpo. */
export const CORPSE_TICKS = 0;
