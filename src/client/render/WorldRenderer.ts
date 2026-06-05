import { Container, RenderTexture, Sprite, type Renderer } from "pixi.js";
import { hash2D } from "../../sim/rng";
import { TILE_SIZE } from "../../shared/constants";
import { TileId, type MapData } from "../../shared/types";
import type { SpriteLibrary } from "../assets/sprites";

const WATER_FRAME_MS = 380;
const TORCH_FRAME_MS = 140;
/** Chunks de chão pré-renderizados (16×16 tiles → 1 sprite). */
const CHUNK_TILES = 16;

/**
 * Renderiza o mapa estático: chão pré-renderizado em chunks (barato em
 * qualquer GPU) + camada de objetos (árvores, rochas, muros, tochas)
 * ordenada por Y junto das entidades.
 */
export class WorldRenderer {
  readonly ground = new Container();
  /** Compartilhada com as entidades — tudo aqui é y-sorted. */
  readonly objects = new Container();

  private waterSprites: Sprite[] = [];
  private torchSprites: Sprite[] = [];
  private waterClock = 0;
  private torchClock = 0;
  private waterFrame = 0;
  private torchFrame = 0;

  constructor(
    private sprites: SpriteLibrary,
    map: MapData,
    renderer: Renderer,
  ) {
    this.objects.sortableChildren = true;
    this.buildGround(map, renderer);
    this.buildObjects(map);
  }

  private groundTexture(map: MapData, x: number, y: number) {
    const s = this.sprites;
    const tile = map.tiles[y * map.width + x];
    const h = hash2D(x, y);
    switch (tile) {
      case TileId.Dirt:
        return s.dirt[Math.floor(h * s.dirt.length)];
      case TileId.StoneFloor:
      case TileId.Wall:
        return s.stoneFloor[Math.floor(h * s.stoneFloor.length)];
      case TileId.Water:
        return s.waterFrames[0];
      case TileId.Bridge:
        return s.bridge[Math.floor(h * s.bridge.length)];
      case TileId.Swamp:
        return s.swamp[Math.floor(h * s.swamp.length)];
      default: {
        const flower = hash2D(x, y, 99) < 0.06;
        return flower
          ? s.grassFlowers[Math.floor(h * s.grassFlowers.length)]
          : s.grass[Math.floor(h * s.grass.length)];
      }
    }
  }

  private buildGround(map: MapData, renderer: Renderer): void {
    const chunksX = Math.ceil(map.width / CHUNK_TILES);
    const chunksY = Math.ceil(map.height / CHUNK_TILES);

    for (let cy = 0; cy < chunksY; cy++) {
      for (let cx = 0; cx < chunksX; cx++) {
        const tilesW = Math.min(CHUNK_TILES, map.width - cx * CHUNK_TILES);
        const tilesH = Math.min(CHUNK_TILES, map.height - cy * CHUNK_TILES);
        const scratch = new Container();
        for (let ty = 0; ty < tilesH; ty++) {
          for (let tx = 0; tx < tilesW; tx++) {
            const x = cx * CHUNK_TILES + tx;
            const y = cy * CHUNK_TILES + ty;
            const sp = new Sprite(this.groundTexture(map, x, y));
            sp.position.set(tx * TILE_SIZE, ty * TILE_SIZE);
            scratch.addChild(sp);
          }
        }
        const rt = RenderTexture.create({ width: tilesW * TILE_SIZE, height: tilesH * TILE_SIZE });
        renderer.render({ container: scratch, target: rt, clear: true });
        scratch.destroy({ children: true });

        const chunk = new Sprite(rt);
        chunk.position.set(cx * CHUNK_TILES * TILE_SIZE, cy * CHUNK_TILES * TILE_SIZE);
        this.ground.addChild(chunk);
      }
    }

    // água animada: sprites individuais por cima do chão estático
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.tiles[y * map.width + x] !== TileId.Water) continue;
        const w = new Sprite(this.sprites.waterFrames[0]);
        w.position.set(x * TILE_SIZE, y * TILE_SIZE);
        this.ground.addChild(w);
        this.waterSprites.push(w);
      }
    }
  }

  private buildObjects(map: MapData): void {
    const s = this.sprites;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y * map.width + x];
        const h = hash2D(x, y);
        let tex = null;
        if (tile === TileId.Tree) tex = s.trees[Math.floor(h * s.trees.length)];
        else if (tile === TileId.Rock) tex = s.rocks[Math.floor(h * s.rocks.length)];
        else if (tile === TileId.Wall) tex = s.wall;
        if (!tex) continue;
        const obj = new Sprite(tex);
        obj.anchor.set(0.5, 1);
        obj.position.set((x + 0.5) * TILE_SIZE, (y + 1) * TILE_SIZE);
        obj.zIndex = obj.position.y;
        this.objects.addChild(obj);
      }
    }

    for (const d of map.decor) {
      if (d.kind === "torch") {
        const torch = new Sprite(s.torchFrames[0]);
        torch.anchor.set(0.5, 1);
        torch.position.set((d.x + 0.5) * TILE_SIZE, (d.y + 1) * TILE_SIZE);
        torch.zIndex = torch.position.y;
        this.objects.addChild(torch);
        this.torchSprites.push(torch);
      }
    }
  }

  /** Animações de água e tochas. */
  tick(deltaMS: number): void {
    this.waterClock += deltaMS;
    if (this.waterClock >= WATER_FRAME_MS) {
      this.waterClock -= WATER_FRAME_MS;
      this.waterFrame = (this.waterFrame + 1) % this.sprites.waterFrames.length;
      const tex = this.sprites.waterFrames[this.waterFrame];
      for (const w of this.waterSprites) w.texture = tex;
    }
    this.torchClock += deltaMS;
    if (this.torchClock >= TORCH_FRAME_MS) {
      this.torchClock -= TORCH_FRAME_MS;
      this.torchFrame = (this.torchFrame + 1) % this.sprites.torchFrames.length;
      const tex = this.sprites.torchFrames[this.torchFrame];
      for (const t of this.torchSprites) t.texture = tex;
    }
  }
}
