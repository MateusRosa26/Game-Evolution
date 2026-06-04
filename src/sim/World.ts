import { TileId, WALKABLE, type MapData } from "../shared/types";

/** Mundo em grid: tiles + consultas de colisão. */
export class World {
  readonly width: number;
  readonly height: number;
  private readonly tiles: TileId[];
  /** Máscara de zona segura por tile (precomputada dos retângulos do mapa). */
  private readonly safe: Uint8Array;
  /** Máscara de zona de passagem (chegada de escada/alavanca/portal). */
  private readonly pass: Uint8Array;
  readonly map: MapData;

  constructor(map: MapData) {
    this.map = map;
    this.width = map.width;
    this.height = map.height;
    this.tiles = map.tiles;
    this.safe = World.maskFrom(map, map.safeZones);
    this.pass = World.maskFrom(map, map.passZones);
  }

  private static maskFrom(map: MapData, rects: MapData["safeZones"]): Uint8Array {
    const mask = new Uint8Array(map.width * map.height);
    for (const z of rects) {
      for (let y = z.y; y < z.y + z.h; y++) {
        for (let x = z.x; x < z.x + z.w; x++) {
          if (x >= 0 && y >= 0 && x < map.width && y < map.height) mask[y * map.width + x] = 1;
        }
      }
    }
    return mask;
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

  /** Tile de zona segura? (entidades não bloqueiam; monstros não entram). */
  isSafeZone(x: number, y: number): boolean {
    return this.inBounds(x, y) && this.safe[y * this.width + x] === 1;
  }

  /** Tile de passagem? (chegada de mecanismo: sem bloqueio de corpo, resto normal). */
  isPassZone(x: number, y: number): boolean {
    return this.inBounds(x, y) && this.pass[y * this.width + x] === 1;
  }
}
