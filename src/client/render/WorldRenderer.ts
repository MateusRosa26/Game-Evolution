import { Container, RenderTexture, Sprite, type Renderer } from "pixi.js";
import { hash2D } from "../../sim/rng";
import { TILE_SIZE } from "../../shared/constants";
import { TileId, type MapData } from "../../shared/types";
import { PIXELLAB } from "../assets/pixellab";
import type { SpriteLibrary } from "../assets/sprites";

const WATER_FRAME_MS = 380;
const TORCH_FRAME_MS = 140;
/** Chunks de chão pré-renderizados (16×16 tiles → 1 sprite). */
const CHUNK_TILES = 16;

/**
 * Nível de terreno por tile (dual-grid Wang). Maior = "mais por cima":
 * grama < terra. Stone/água/bridge/swamp seguem o caminho de tile único
 * (terreno -1) e contam como grama para os cantos da transição.
 * ✏️ terra↔pedra entra quando o tileset de pedra for gerado.
 */
function terrainLevel(tile: TileId): number {
  if (tile === TileId.Dirt) return 1;
  if (tile === TileId.Grass) return 0;
  return -1; // stone/water/bridge/swamp/wall → tile único (conta como grama p/ canto)
}

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

  /** Nível de terreno seguro fora dos limites (clampa nas bordas). */
  private terrainAt(map: MapData, x: number, y: number): number {
    const cx = Math.max(0, Math.min(map.width - 1, x));
    const cy = Math.max(0, Math.min(map.height - 1, y));
    return terrainLevel(map.tiles[cy * map.width + cx]);
  }

  /**
   * DUAL-GRID Wang (jun/2026): o chão base sai por tile único; a TERRA entra
   * como camada deslocada meio-tile — cada display-tile lê os 4 cantos (células
   * lógicas NW/NE/SW/SE) e escolhe a Wang tile cujo código de cantos bate. O
   * full-lower (0000) é pulado (transparente) p/ a grama base aparecer.
   */
  private buildGround(map: MapData, renderer: Renderer): void {
    const chunksX = Math.ceil(map.width / CHUNK_TILES);
    const chunksY = Math.ceil(map.height / CHUNK_TILES);
    const wang = PIXELLAB.wang["grass-dirt"];

    for (let cy = 0; cy < chunksY; cy++) {
      for (let cx = 0; cx < chunksX; cx++) {
        const tilesW = Math.min(CHUNK_TILES, map.width - cx * CHUNK_TILES);
        const tilesH = Math.min(CHUNK_TILES, map.height - cy * CHUNK_TILES);
        const scratch = new Container();

        // 1. BASE: tile único por célula (grama/stone/água/etc.)
        for (let ty = 0; ty < tilesH; ty++) {
          for (let tx = 0; tx < tilesW; tx++) {
            const x = cx * CHUNK_TILES + tx;
            const y = cy * CHUNK_TILES + ty;
            const sp = new Sprite(this.groundTexture(map, x, y));
            sp.position.set(tx * TILE_SIZE, ty * TILE_SIZE);
            scratch.addChild(sp);
          }
        }

        // 2. CAMADA TERRA (dual-grid): display-tile no canto sup-esq de cada
        // célula lê os 4 cantos (cima-esq/cima/esq/aqui). +1 em cada eixo para
        // cobrir a borda direita/baixo do chunk.
        if (wang) {
          for (let ty = 0; ty <= tilesH; ty++) {
            for (let tx = 0; tx <= tilesW; tx++) {
              const x = cx * CHUNK_TILES + tx;
              const y = cy * CHUNK_TILES + ty;
              const nw = this.terrainAt(map, x - 1, y - 1) >= 1 ? 1 : 0;
              const ne = this.terrainAt(map, x, y - 1) >= 1 ? 1 : 0;
              const sw = this.terrainAt(map, x - 1, y) >= 1 ? 1 : 0;
              const se = this.terrainAt(map, x, y) >= 1 ? 1 : 0;
              const codeStr = `${nw}${ne}${sw}${se}`;
              if (codeStr === "0000") continue; // grama pura: base aparece
              const tex = wang[codeStr];
              if (!tex) continue;
              const sp = new Sprite(tex);
              // deslocado meio-tile (o display cobre o cruzamento de 4 células)
              sp.position.set(tx * TILE_SIZE - TILE_SIZE / 2, ty * TILE_SIZE - TILE_SIZE / 2);
              scratch.addChild(sp);
            }
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
    const isWall = (x: number, y: number): boolean =>
      x >= 0 && y >= 0 && x < map.width && y < map.height &&
      map.tiles[y * map.width + x] === TileId.Wall;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y * map.width + x];
        const h = hash2D(x, y);
        let tex = null;
        if (tile === TileId.Tree) tex = s.trees[Math.floor(h * s.trees.length)];
        else if (tile === TileId.Rock) tex = s.rocks[Math.floor(h * s.rocks.length)];
        else if (tile === TileId.Wall) {
          // autotile por vizinhos que também são muro: N=1, E=2, S=4, W=8
          const mask =
            (isWall(x, y - 1) ? 1 : 0) | (isWall(x + 1, y) ? 2 : 0) |
            (isWall(x, y + 1) ? 4 : 0) | (isWall(x - 1, y) ? 8 : 0);
          const variants = s.walls[mask];
          tex = variants[Math.floor(h * variants.length)];
        }
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
