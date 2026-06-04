/**
 * Paleta do jogo — dark medieval fantasy.
 * Tons frios e dessaturados no ambiente; luz quente (tochas) como contraste.
 */
export const PAL = {
  // Vegetação
  grassBase: "#2b3f31",
  grassDark: "#243527",
  grassMid: "#31493a",
  grassLight: "#3d5a42",
  grassBlade: "#4a6b4a",
  flowerGold: "#c9b458",
  flowerWhite: "#b8c4cc",

  // Terra
  dirtBase: "#54422f",
  dirtDark: "#433422",
  dirtMid: "#5f4c37",
  dirtLight: "#6b573f",
  dirtStone: "#75614a",

  // Pedra (piso)
  stoneBase: "#454c58",
  stoneDark: "#2e333d",
  stoneMid: "#4f5763",
  stoneLight: "#5a6270",
  stoneCrack: "#262b33",

  // Água
  waterBase: "#13293f",
  waterDark: "#0e2032",
  waterMid: "#1d4260",
  waterLight: "#2a5a80",
  waterFoam: "#3d72a0",

  // Árvore
  trunkBase: "#38291d",
  trunkDark: "#2a1e14",
  trunkLight: "#463525",
  canopyDark: "#1d3022",
  canopyBase: "#28422b",
  canopyMid: "#335234",
  canopyLight: "#41673c",
  canopyGlint: "#52804a",

  // Rocha / muro
  rockTop: "#6a7382",
  rockMid: "#525a68",
  rockBase: "#3b424e",
  wallTop: "#566070",
  wallTopLight: "#677182",
  wallBlock: "#3f4754",
  wallJoint: "#1f242d",

  // Tocha / fogo
  woodPost: "#3b2c1f",
  woodPostLight: "#4c3a29",
  metal: "#5a626e",
  flameCore: "#ffe79a",
  flameBody: "#ffab4a",
  flameEdge: "#e06228",

  // Personagem — ramp de pele completo (luz quente, sombra fria — regra de ofício)
  skinLight: "#ecc398",
  skin: "#d8a87c",
  skinShade: "#b8865e",
  skinDark: "#92664a",
  hair: "#33271f",
  // Ramp de armadura (sombra→brilho): sombra azulada dessaturada → topo
  // levemente quente (hue-shift, ver design/ESTUDO-REFERENCIAS.md §1)
  armorShadow: "#3b4452",
  armorDark: "#4b5566",
  armorBase: "#5d6a7e",
  armorLight: "#7d8a9c",
  armorEdge: "#98a3ae",
  armorShine: "#b2b8ba",
  // Escudo de madeira (kit inicial do Knight)
  shieldWood: "#6e5638",
  shieldWoodDark: "#4a3a26",
  shieldWoodLight: "#83683f",
  shieldRim: "#33383f",
  // Espada
  swordBlade: "#b8c2cc",
  swordDark: "#7e8894",
  // Interior do visor (buraco do elmo — quase-preto justificado)
  visorSlit: "#0c0f14",

  // ── Skin "Ouro Cerimonial" — armadura gilded, capa azul-real ──
  // Ramp de ouro: sombra fria/dessaturada → topo claro (sat pico no meio)
  goldShadow: "#4a3c20",
  goldDark: "#6b5526",
  goldBase: "#8d7330",
  goldLight: "#b3953f",
  goldEdge: "#d4b654",
  goldShine: "#ecd47e",
  capeRoyalDark: "#1f2c4a",
  capeRoyalBase: "#2a3c64",
  capeRoyalLight: "#3a5080",

  // ── Skin "Vigília Negra" — aço enegrecido, visor em brasa ──
  onyxShadow: "#15181e",
  onyxDark: "#1f242c",
  onyxBase: "#2a313b",
  onyxLight: "#3a434f",
  onyxEdge: "#4c5663",
  onyxShine: "#5e6a77",
  capeNightDark: "#2e1118",
  capeNightBase: "#421a23",
  capeNightLight: "#56222d",
  visorEmber: "#c2502e",
  capeBase: "#5c2531",
  capeDark: "#471c26",
  capeLight: "#6d2c3a",
  pants: "#3a3429",
  boots: "#4f3b27",
  bootsDark: "#2e2218",
  belt: "#2a231c",
  buckle: "#c8a84b",

  // Rato Lanhoso (família Bestial, T1) — pelagem suja e fria
  ratBase: "#5a4a3a",
  ratMid: "#6b5947",
  ratLight: "#7d6a54",
  ratBelly: "#83766a",
  ratEar: "#7a5552",
  ratTail: "#9a8472",
  ratEye: "#b83a3a",

  // UI — progressão (XP/level/atributos)
  xpBack: "#1a160d", // trilho da barra de XP
  xpFill: "#c9a83b", // preenchimento dourado
  xpShine: "#e8cf6a", // brilho superior da barra de XP
  levelGold: "#e8cf6a", // texto/level dourado
  badgePulse: "#ffd95a", // badge de pontos livres (pulsa)
  panelBg: "#12151d", // fundo do painel de personagem
  panelBorder: "#3a4254", // borda do painel
  panelHeader: "#1c212c", // faixa de título do painel
  attrLabel: "#cfc8b4", // rótulo de atributo
  attrValue: "#e8e4d8", // valor de atributo
  btnPlus: "#2e5f38", // botão "+" (verde-musgo)
  btnPlusLight: "#3f7d4a", // topo/brilho do botão "+"
  btnPlusHover: "#4a9156", // botão "+" sob o mouse

  // Outline universal da pixel art
  outline: "#10141c",
} as const;

/** Converte cor hex string ("#rrggbb") para número 0xRRGGBB (Pixi Graphics/Text). */
export function hex(color: string): number {
  return parseInt(color.slice(1), 16);
}

/** Cor ambiente da cena (multiplicada sobre o mundo — "entardecer sombrio"). */
export const AMBIENT_COLOR = 0x8088a8;

/** Luz própria do jogador (quente, discreta). */
export const PLAYER_LIGHT = { color: 0xd8aa78, radius: 5, intensity: 0.7 };
