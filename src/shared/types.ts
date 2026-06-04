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

export interface MapData {
  width: number;
  height: number;
  /** Row-major: tiles[y * width + x]. */
  tiles: TileId[];
  lights: MapLight[];
  decor: MapDecor[];
  spawn: Vec2;
}
