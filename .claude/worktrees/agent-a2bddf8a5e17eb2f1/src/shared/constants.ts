/** Tamanho do tile em pixels de mundo. */
export const TILE_SIZE = 32;

/** Duração de um tick da simulação (20 ticks/s, estilo servidor de MMO). */
export const TICK_MS = 50;

/**
 * Converte uma duração de DESIGN (ms) para ticks da sim (resolução interna).
 * Todo número de tempo do jogo vive em ms; o tick é só a granularidade com que
 * a sim age. Mudar TICK_MS reescala isto automaticamente, sem tocar no balance.
 * Mínimo 1 tick (duração sub-tick ainda gasta um tick — a sim não age mais fino).
 */
export function msToTicks(ms: number): number {
  return Math.max(1, Math.round(ms / TICK_MS));
}

/**
 * Duração base de um passo ortogonal, em ms. MÚLTIPLO de TICK_MS: a sim só age
 * em fronteiras de tick, então stepMs desalinhado cria um "frame morto" entre o
 * fim do tween no client e o próximo passo na sim (movimento truncado).
 */
export const BASE_WALK_MS = 250;

/**
 * Passos diagonais custam mais (evita diagonal virar speed-hack). O resultado
 * é quantizado à grade de ticks na sim (250 × 1.45 = 362.5 → 350ms = 7 ticks).
 */
export const DIAGONAL_FACTOR = 1.45;

/** Zoom da câmera (pixel art 32px renderizada em 2x). */
export const CAMERA_ZOOM = 2;
