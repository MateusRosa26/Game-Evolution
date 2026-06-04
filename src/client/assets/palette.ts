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

  // Personagem
  skin: "#d8a87c",
  skinShade: "#b8865e",
  hair: "#33271f",
  armorBase: "#5d6a7e",
  armorLight: "#79879c",
  armorDark: "#4b5566",
  armorEdge: "#8a98ad",
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

  // Outline universal da pixel art
  outline: "#10141c",
} as const;

/** Cor ambiente da cena (multiplicada sobre o mundo — "entardecer sombrio"). */
export const AMBIENT_COLOR = 0x8088a8;

/** Luz própria do jogador (quente, discreta). */
export const PLAYER_LIGHT = { color: 0xd8aa78, radius: 5, intensity: 0.7 };
