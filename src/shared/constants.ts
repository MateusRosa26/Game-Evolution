/** Tamanho do tile em pixels de mundo. */
export const TILE_SIZE = 32;

/** Duração de um tick da simulação (20 ticks/s, estilo servidor de MMO). */
export const TICK_MS = 50;

/** Duração base de um passo ortogonal, em ms. */
export const BASE_WALK_MS = 260;

/** Passos diagonais custam mais (evita diagonal virar speed-hack). */
export const DIAGONAL_FACTOR = 1.45;

/** Zoom da câmera (pixel art 32px renderizada em 2x). */
export const CAMERA_ZOOM = 2;
