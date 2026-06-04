import { TileId, WALKABLE, type MapData } from "../shared/types";

/** Mundo em grid: tiles + consultas de colisão. */
export class World {
  readonly width: number;
  readonly height: number;
  private readonly tiles: TileId[];
  readonly map: MapData;

  constructor(map: MapData) {
    this.map = map;
    this.width = map.width;
    this.height = map.height;
    this.tiles = map.tiles;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  tileAt(x: number, y: number): TileId {
    if (!this.inBounds(x, y)) return TileId.Water;
    return this.tiles[y * this.width + x];
  }

  isWalkable(x: number, y: number): boolean {
    return this.inBounds(x, y) && WALKABLE[this.tileAt(x, y)];
  }
}
