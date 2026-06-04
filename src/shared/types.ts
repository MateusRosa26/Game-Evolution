export interface Vec2 {
  x: number;
  y: number;
}

/** 8 direções de movimento. */
export type Dir8 = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";

/** 4 direções visuais (sprites). */
export type Facing = "n" | "e" | "s" | "w";

export const DIR_VECTORS: Record<Dir8, Vec2> = {
  n: { x: 0, y: -1 },
  ne: { x: 1, y: -1 },
  e: { x: 1, y: 0 },
  se: { x: 1, y: 1 },
  s: { x: 0, y: 1 },
  sw: { x: -1, y: 1 },
  w: { x: -1, y: 0 },
  nw: { x: -1, y: -1 },
};

export function isDiagonal(dir: Dir8): boolean {
  return dir.length === 2;
}

/** Direção visual a partir da direção de movimento (diagonais mostram o lado horizontal). */
export function facingFromDir(dir: Dir8): Facing {
  switch (dir) {
    case "n":
      return "n";
    case "s":
      return "s";
    case "e":
    case "ne":
    case "se":
      return "e";
    case "w":
    case "nw":
    case "sw":
      return "w";
  }
}

export function dirFromDelta(dx: number, dy: number): Dir8 | null {
  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  for (const [dir, v] of Object.entries(DIR_VECTORS) as [Dir8, Vec2][]) {
    if (v.x === sx && v.y === sy) return dir;
  }
  return null;
}

export type EntityKind = "player" | "monster" | "npc";

/**
 * Classes-base do jogador (DESIGN-EVOLUCAO.md §Classes). Sem subclasses
 * escolhíveis — a especialização emerge via Caminhos/Mutações (wave futura).
 * Identificadores estáveis (chaves de dados/fórmulas).
 */
export type PlayerClass = "knight" | "mage" | "rogue" | "priest";

/**
 * Os 5 atributos da camada sólida (DESIGN-EVOLUCAO.md §Stats). DISTRIBUÍVEIS
 * (pontos no level up); tudo o mais é DERIVADO via `src/sim/formulas.ts`.
 * Nomes em inglês, estáveis (chaves de dados). Chave de atributo isolada em
 * `AttributeKey` para o comando `allocateStatPoint` validar.
 */
export interface Attributes {
  /** Força — dano corpo-a-corpo, capacidade de carga. */
  strength: number;
  /** Destreza — dano de adagas/distância, velocidade de ataque, esquiva. */
  dexterity: number;
  /** Inteligência — dano mágico, mana máxima. */
  intelligence: number;
  /** Vitalidade — HP máximo, regeneração de HP. */
  vitality: number;
  /** Espírito — poder de cura, regen de mana, resistência mágica. */
  spirit: number;
}

export type AttributeKey = keyof Attributes;

/** As 5 chaves de atributo, em ordem estável (para validação/iteração). */
export const ATTRIBUTE_KEYS: AttributeKey[] = [
  "strength",
  "dexterity",
  "intelligence",
  "vitality",
  "spirit",
];

/**
 * As 12 famílias canônicas do bestiário (DESIGN-BESTIARIO.md).
 * Família é a unidade do sistema de Marcas: contadores de kill rastreiam
 * espécie E família. Toda criatura pertence a exatamente uma família.
 * Identificadores em inglês, estáveis (não traduzir — são chaves de dados).
 */
export type CreatureFamily =
  | "bestial" // Bestas — feras naturais
  | "humanoid" // Peles-Verdes, bandidos, cultistas
  | "worm" // Vermes / insetos
  | "plant" // Plantas
  | "aquatic" // Aquáticos
  | "flying" // Voadores
  | "undead" // Mortos-Vivos
  | "draconic" // Dracônicos
  | "giant" // Gigantes
  | "elemental" // Elementais
  | "mythic" // Míticos
  | "demon"; // Demônios

/** Tipos de dano — fundamenta resist/fraqueza por família (DESIGN-BESTIARIO.md). */
export type DamageType =
  | "physical"
  | "fire"
  | "ice"
  | "poison"
  | "bleed"
  | "holy"
  | "arcane";

/** Tiles lógicos do mundo. */
export enum TileId {
  Grass = 0,
  Dirt = 1,
  StoneFloor = 2,
  Water = 3,
  Tree = 4,
  Rock = 5,
  Wall = 6,
}

export const WALKABLE: Record<TileId, boolean> = {
  [TileId.Grass]: true,
  [TileId.Dirt]: true,
  [TileId.StoneFloor]: true,
  [TileId.Water]: false,
  [TileId.Tree]: false,
  [TileId.Rock]: false,
  [TileId.Wall]: false,
};

/** Fonte de luz estática do mapa (posição em tiles). */
export interface MapLight {
  x: number;
  y: number;
  /** Cor em hex 0xRRGGBB. */
  color: number;
  /** Raio em tiles. */
  radius: number;
  /** Intensidade 0..1. */
  intensity: number;
  flicker: boolean;
}

/** Decoração que emite luz / objetos especiais ancorados em tiles. */
export interface MapDecor {
  x: number;
  y: number;
  kind: "torch";
}

/** Ponto de spawn de um monstro no mapa (espécie do bestiário). */
export interface MapMonster {
  x: number;
  y: number;
  /** ID de espécie do bestiário (ex: "rato_lanhoso"). */
  species: string;
}

export interface MapData {
  width: number;
  height: number;
  /** Row-major: tiles[y * width + x]. */
  tiles: TileId[];
  lights: MapLight[];
  decor: MapDecor[];
  /** Pontos de spawn de monstros (vazio = mapa sem mobs). */
  monsters: MapMonster[];
  spawn: Vec2;
}
