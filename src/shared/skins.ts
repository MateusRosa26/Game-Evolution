/**
 * Catálogo de skins do personagem — DADOS compartilhados sim ⇄ client.
 *
 * A skin é ESTADO do jogador (vive na sim, viaja no snapshot): no online,
 * os outros jogadores veem a sua skin. O client apenas desenha.
 *
 * Hoje todas são livres (ciclo via hotkey 0 — DEV). ✏️ Futuro: desbloqueio
 * por quest e/ou conteúdo pago — a VALIDAÇÃO de posse acontece na sim
 * (handleCommand), nunca no client.
 */
export const KNIGHT_SKINS = ["padrao", "dourado", "sombrio"] as const;

export type KnightSkinId = (typeof KNIGHT_SKINS)[number];

export const DEFAULT_SKIN: KnightSkinId = "padrao";

/** Nome exibível de cada skin (pt-BR). */
export const SKIN_NAMES: Record<KnightSkinId, string> = {
  padrao: "Aço de Alvorada",
  dourado: "Ouro Cerimonial",
  sombrio: "Vigília Negra",
};
