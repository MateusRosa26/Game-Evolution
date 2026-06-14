/** Tamanho do tile em pixels de mundo. Remaster 128px (jun/2026): era 32→64→128. */
export const TILE_SIZE = 128;

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

/**
 * Modelo de câmera estilo Tibia/Apogea: o que é FIXO é o número de tiles na tela
 * (field of view), não o tamanho do tile em px. A câmera escala o tile pra caber
 * na janela — redimensionou → tiles crescem/encolhem, contagem fica constante.
 *
 * Ancoramos na ALTURA: sempre `VIEW_TILES_H` tiles verticais (clássico Tibia=11).
 * A largura flutua com o aspect ratio (telas largas mostram mais colunas). A arte
 * 128px continua a fonte nativa — só desenha menor, sem perder resolução.
 *
 * Ajustável ao vivo com -/= (ver Game.ts): muda o alvo de tiles verticais.
 */
export let VIEW_TILES_H = 9;

/** Limites do alvo de tiles verticais (tuning ao vivo). */
export const VIEW_TILES_H_MIN = 7;
export const VIEW_TILES_H_MAX = 18;

export function setViewTilesH(n: number): void {
  VIEW_TILES_H = Math.max(VIEW_TILES_H_MIN, Math.min(VIEW_TILES_H_MAX, Math.round(n)));
}

/**
 * Zoom efetivo da câmera, DERIVADO da altura da tela e do alvo de tiles. NÃO é
 * fonte da verdade: é recalculado a cada frame por `recomputeCameraZoom`. Os
 * consumidores (Camera/WorldRenderer/Lighting) leem este `let` via ESM live
 * binding, então enxergam o valor novo sem repasse por parâmetro.
 */
export let CAMERA_ZOOM = 1;

/** Recalcula CAMERA_ZOOM p/ caber VIEW_TILES_H tiles na altura da tela. */
export function recomputeCameraZoom(_screenW: number, screenH: number): void {
  CAMERA_ZOOM = screenH / (VIEW_TILES_H * TILE_SIZE);
}
