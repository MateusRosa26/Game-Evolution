import { Container, RenderTexture, Sprite, type Renderer, type Texture } from "pixi.js";
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
 * Nível de terreno por tile (dual-grid Wang). Maior = "mais por cima" (vaza no
 * mais baixo): grama < terra < pedra. Água/bridge/swamp/wall seguem o caminho de
 * tile único (terreno -1) e contam como grama (nível baixo) para os cantos.
 */
function terrainLevel(tile: TileId): number {
  if (tile === TileId.StoneFloor) return 2;
  if (tile === TileId.Dirt) return 1;
  if (tile === TileId.Grass) return 0;
  return -1; // água/bridge/swamp/wall → tile único (conta como baixo p/ canto)
}

/**
 * Renderiza o mapa estático: chão pré-renderizado em chunks (barato em
 * qualquer GPU) + camada de objetos (árvores, rochas, muros, tochas)
 * ordenada por Y junto das entidades.
 */
export class WorldRenderer {
  readonly ground = new Container();
  /**
   * Sombras de contato dos objetos estáticos. Camada PLANA entre o chão e os
   * objetos: toda sombra pinga no chão (e vaza pros tiles vizinhos) por baixo de
   * tudo. É a alavanca #1 de profundidade — objeto sem sombra "flutua".
   */
  readonly shadows = new Container();
  /** Compartilhada com as entidades — tudo aqui é y-sorted. */
  readonly objects = new Container();

  private waterSprites: { sp: Sprite; frames: Texture[] }[] = [];
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
      case TileId.SewerFloor:
      // paredes de alvenaria assentam sobre chão de esgoto (base do chunk)
      case TileId.SewerWall:
      case TileId.OldMasonryWall:
        return s.sewerFloor[Math.floor(h * s.sewerFloor.length)];
      case TileId.CaveFloor:
      case TileId.CaveWall:
        return s.caveFloor[Math.floor(h * s.caveFloor.length)];
      case TileId.Sewage:
        return s.sewageFrames[0];
      case TileId.DeepWater:
        return s.deepWaterFrames[0];
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
              // === 1 (terra exata): pedra (nível 2) NÃO conta como terra aqui,
              // senão a terra apareceria em volta da pedra. A pedra entra no
              // passo próprio abaixo.
              const nw = this.terrainAt(map, x - 1, y - 1) === 1 ? 1 : 0;
              const ne = this.terrainAt(map, x, y - 1) === 1 ? 1 : 0;
              const sw = this.terrainAt(map, x - 1, y) === 1 ? 1 : 0;
              const se = this.terrainAt(map, x, y) === 1 ? 1 : 0;
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

        // 2b. CAMADA PEDRA (dual-grid procedural): StoneFloor (nível 2) transborda
        // sobre grama/terra. Mesmo offset meio-tile; código de cantos numérico.
        const stoneWang = this.sprites.stoneTransition;
        for (let ty = 0; ty <= tilesH; ty++) {
          for (let tx = 0; tx <= tilesW; tx++) {
            const x = cx * CHUNK_TILES + tx;
            const y = cy * CHUNK_TILES + ty;
            const nw = this.terrainAt(map, x - 1, y - 1) >= 2 ? 1 : 0;
            const ne = this.terrainAt(map, x, y - 1) >= 2 ? 2 : 0;
            const sw = this.terrainAt(map, x - 1, y) >= 2 ? 4 : 0;
            const se = this.terrainAt(map, x, y) >= 2 ? 8 : 0;
            const code = nw | ne | sw | se;
            if (code === 0 || code === 15) continue; // sem borda (puro grama/terra ou pura pedra)
            const sp = new Sprite(stoneWang[code]);
            sp.position.set(tx * TILE_SIZE - TILE_SIZE / 2, ty * TILE_SIZE - TILE_SIZE / 2);
            scratch.addChild(sp);
          }
        }

        // 3. SCATTER (alavanca #2): decais espalhados e baked → o chão nunca
        // fica pelado. Determinístico por tile (mesmo seed → mesma cena).
        const scatter = this.sprites.scatter;
        for (let ty = 0; ty < tilesH; ty++) {
          for (let tx = 0; tx < tilesW; tx++) {
            const x = cx * CHUNK_TILES + tx;
            const y = cy * CHUNK_TILES + ty;
            const tile = map.tiles[y * map.width + x];
            const set =
              tile === TileId.Grass ? scatter.grass :
              tile === TileId.Dirt ? scatter.dirt :
              tile === TileId.StoneFloor ? scatter.stone : null;
            if (!set) continue;
            const density = tile === TileId.Grass ? 0.5 : tile === TileId.Dirt ? 0.42 : 0.3;
            if (hash2D(x, y, 31) >= density) continue;
            const count = hash2D(x, y, 32) < 0.22 ? 2 : 1;
            for (let k = 0; k < count; k++) {
              const dec = set[Math.floor(hash2D(x, y, 40 + k) * set.length)];
              const ox = Math.floor(hash2D(x, y, 50 + k) * Math.max(1, TILE_SIZE - dec.width));
              const oy = Math.floor(hash2D(x, y, 60 + k) * Math.max(1, TILE_SIZE - dec.height));
              const sp = new Sprite(dec);
              sp.position.set(tx * TILE_SIZE + ox, ty * TILE_SIZE + oy);
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

    // água animada: sprites individuais por cima do chão estático. Overworld +
    // esgoto raso/fundo — cada tile puxa seu próprio frame-set.
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const t = map.tiles[y * map.width + x];
        const frames =
          t === TileId.Water ? this.sprites.waterFrames :
          t === TileId.Sewage ? this.sprites.sewageFrames :
          t === TileId.DeepWater ? this.sprites.deepWaterFrames : null;
        if (!frames) continue;
        const w = new Sprite(frames[0]);
        w.position.set(x * TILE_SIZE, y * TILE_SIZE);
        this.ground.addChild(w);
        this.waterSprites.push({ sp: w, frames });
      }
    }
  }

  private buildObjects(map: MapData): void {
    const s = this.sprites;
    // Conjuntos de parede autotile (cidade + subsolo). Cada parede conecta só
    // com vizinhos do MESMO tipo (sem costura entre tijolo/rocha/muralha).
    const wallSets: Partial<Record<TileId, Texture[][]>> = {
      [TileId.Wall]: s.walls,
      [TileId.SewerWall]: s.sewerWalls,
      [TileId.OldMasonryWall]: s.oldMasonryWalls,
      [TileId.CaveWall]: s.caveWalls,
    };
    const sameWall = (x: number, y: number, t: TileId): boolean =>
      x >= 0 && y >= 0 && x < map.width && y < map.height &&
      map.tiles[y * map.width + x] === t;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y * map.width + x];
        const h = hash2D(x, y);
        let tex = null;
        const wallSet = wallSets[tile];
        const cx = (x + 0.5) * TILE_SIZE;
        const baseY = (y + 1) * TILE_SIZE;
        if (tile === TileId.Tree) {
          tex = s.trees[Math.floor(h * s.trees.length)];
          this.addShadow(cx + 4, baseY - 2, 54, 22); // copa larga + leve offset (luz NO)
        } else if (tile === TileId.Rock) {
          tex = s.rocks[Math.floor(h * s.rocks.length)];
          this.addShadow(cx + 2, baseY - 3, 26, 11);
        } else if (wallSet) {
          // autotile por vizinhos do mesmo tipo de parede: N=1, E=2, S=4, W=8
          const mask =
            (sameWall(x, y - 1, tile) ? 1 : 0) | (sameWall(x + 1, y, tile) ? 2 : 0) |
            (sameWall(x, y + 1, tile) ? 4 : 0) | (sameWall(x - 1, y, tile) ? 8 : 0);
          const variants = wallSet[mask];
          tex = variants[Math.floor(h * variants.length)];
          // face visível (sem muro ao sul) → pinga sombra/AO no tile de baixo
          if ((mask & 4) === 0) this.addShadow(cx + 4, baseY + 5, 34, 14);
        }
        if (!tex) continue;
        const obj = new Sprite(tex);
        obj.anchor.set(0.5, 1);
        obj.position.set(cx, baseY);
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
        this.addShadow((d.x + 0.5) * TILE_SIZE + 2, (d.y + 1) * TILE_SIZE - 2, 18, 8);
      }
    }
  }

  /** Adiciona uma sombra de contato suave na camada plana, abaixo dos objetos. */
  private addShadow(cx: number, cy: number, w: number, h: number): void {
    const sh = new Sprite(this.sprites.shadow);
    sh.anchor.set(0.5, 0.5);
    sh.width = w;
    sh.height = h;
    sh.position.set(cx, cy);
    this.shadows.addChild(sh);
  }

  /** Animações de água e tochas. */
  tick(deltaMS: number): void {
    this.waterClock += deltaMS;
    if (this.waterClock >= WATER_FRAME_MS) {
      this.waterClock -= WATER_FRAME_MS;
      this.waterFrame = (this.waterFrame + 1) % this.sprites.waterFrames.length;
      for (const w of this.waterSprites) w.sp.texture = w.frames[this.waterFrame % w.frames.length];
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
