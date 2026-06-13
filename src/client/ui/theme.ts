/**
 * Tema central da UI (jun/2026) — tokens + blocos reutilizáveis.
 *
 * Direção: dark medieval "clean" inspirado em **Apogea** (painéis de carvão
 * translúcido, bordas finas, acento dourado nos títulos, tipografia legível),
 * com leitura de barras de **Tibia/RO/MU** (barra com brilho no topo). As cores
 * de mundo seguem em `palette.ts`; aqui mora SÓ a linguagem visual da interface.
 *
 * Tudo é apresentação: helpers desenham em `Graphics`/`Text` e nada mais.
 */
import { Graphics, Sprite, Text, type TextStyleFontWeight, type TextStyleOptions } from "pixi.js";

/** Tokens de cor/medida da UI (0xRRGGBB). */
export const UI = {
  // Painéis / janelas
  panelBg: 0x141821,
  panelBgAlpha: 0.93,
  panelHeaderBg: 0x1d2330,
  panelBorder: 0x3a4150,
  /** Acento dourado: títulos, sublinhado do header, slot ativo. */
  gold: 0xc8a14a,
  goldBright: 0xe6c061,
  radius: 6,
  headerH: 24,

  // Slots (equip / container / hotbar)
  slotBg: 0x0e121b,
  slotBgItem: 0x161b27, // slot com conteúdo (levemente acima do vazio)
  slotBorder: 0x2c3545,
  slotBorderItem: 0x55617a,

  // Texto
  text: 0xe8e2d4, // off-white quente
  textDim: 0x9aa3b6, // rótulos/secundário
  textShadow: 0x0b0e14, // contorno/stroke

  // Barras (fundo escuro · preenchimento · brilho superior)
  // HP é VERDE cheio (estilo Apogea) e migra p/ âmbar → vermelho ao cair (ver hpColor).
  hpBack: 0x10231a,
  hpFill: 0x49a23f,
  hpTop: 0x73c95e,
  mpBack: 0x101a2e,
  mpFill: 0x33609f,
  mpTop: 0x5a86d4,
  xpBack: 0x1a160d,
  xpFill: 0xc9a83b,
  xpTop: 0xe8cf6a,
} as const;

/** Cor do HP por fração (Apogea): verde cheio → âmbar → vermelho em perigo. */
export function hpColor(ratio: number): { fill: number; top: number } {
  if (ratio > 0.5) return { fill: 0x49a23f, top: 0x73c95e }; // verde
  if (ratio > 0.25) return { fill: 0xc89a32, top: 0xe6c258 }; // âmbar
  return { fill: 0xb23a44, top: 0xd85c63 }; // vermelho
}

/**
 * Moldura de painel/janela: fundo translúcido + borda fina + faixa de título
 * com um fio dourado embaixo (a assinatura Apogea). Limpa o Graphics antes.
 */
export function panelFrame(
  g: Graphics,
  w: number,
  h: number,
  opts: { header?: boolean; alpha?: number } = {},
): void {
  const { header = true, alpha = UI.panelBgAlpha } = opts;
  g.clear();
  g.roundRect(0, 0, w, h, UI.radius).fill({ color: UI.panelBg, alpha });
  if (header) {
    // faixa de título um tom acima, recortada nos cantos de cima
    g.roundRect(0, 0, w, UI.headerH + UI.radius, UI.radius).fill({ color: UI.panelHeaderBg, alpha });
    g.rect(0, UI.headerH - UI.radius, w, UI.radius).fill({ color: UI.panelHeaderBg, alpha });
    // fio dourado sob o header
    g.rect(0, UI.headerH, w, 1).fill({ color: UI.gold, alpha: 0.55 });
  }
  g.roundRect(0, 0, w, h, UI.radius).stroke({ color: UI.panelBorder, width: 1 });
}

/**
 * Barra com brilho (HP/MP/XP). Desenha trilho + preenchimento + faixa de luz
 * no topo + contorno. Não limpa o Graphics (várias barras no mesmo `g`).
 */
export function bar(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  fill: number,
  top: number,
  back: number,
): void {
  const r = Math.min(h / 2, 4);
  const clamped = Math.max(0, Math.min(1, ratio));
  g.roundRect(x, y, w, h, r).fill(back);
  if (clamped > 0) {
    const fw = Math.max(h, w * clamped); // largura mínima = não some num filete
    g.roundRect(x, y, fw, h, r).fill(fill);
    g.roundRect(x, y, fw, Math.max(2, h * 0.4), r).fill({ color: top, alpha: 0.85 });
  }
  g.roundRect(x, y, w, h, r).stroke({ color: UI.textShadow, width: 1 });
}

/** Slot quadrado (equip/container/hotbar). `filled` = tem item (borda mais clara). */
export function slot(g: Graphics, x: number, y: number, size: number, filled = false): void {
  g.roundRect(x, y, size, size, 4).fill(filled ? UI.slotBgItem : UI.slotBg);
  g.roundRect(x, y, size, size, 4).stroke({ color: filled ? UI.slotBorderItem : UI.slotBorder, width: 1 });
}

/**
 * Escala um sprite de item (master 96px, fonte única — vale tanto p/ slot de UI
 * quanto p/ render no chão) para caber num slot quadrado de `size`, com margem.
 * A UI não segue a régua de 1:1 do mundo (todos os itens escalam pelo mesmo
 * fator no painel → sem mixel interno); downscale lê limpo.
 */
export function fitSpriteToSlot(spr: Sprite, size: number, margin = 10): void {
  const nat = Math.max(spr.width, spr.height) || 1; // antes de escalar = tamanho da textura
  spr.scale.set((size - margin) / nat);
}

/** Estilo de texto padrão da UI (com contorno para legibilidade sobre o mundo). */
export function uiText(
  size: number,
  color: number = UI.text,
  weight: TextStyleFontWeight = "normal",
): TextStyleOptions {
  return {
    fontFamily: "monospace",
    fontSize: size,
    fontWeight: weight,
    fill: color,
    stroke: { color: UI.textShadow, width: 2 },
  };
}

/** Título de janela (dourado, negrito) — fábrica de Text pronta. */
export function titleText(text: string): Text {
  const t = new Text({ text, style: uiText(11, UI.goldBright, "bold") });
  t.resolution = 3;
  t.anchor.set(0, 0.5);
  return t;
}
