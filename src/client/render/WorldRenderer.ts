import { Container, Graphics, RenderTexture, Sprite, type Renderer, type Texture } from "pixi.js";
import { hash2D } from "../../sim/rng";
import { TILE_SIZE } from "../../shared/constants";
import { TileId, type MapData, type MapRect } from "../../shared/types";
import { makeRoof, ROOF_OVERHANG, type SpriteLibrary } from "../assets/sprites";

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
  /** Telhados dos edifícios — acima de tudo; somem quando o player entra. */
  readonly roofs = new Container();

  private roofSprites: { sp: Sprite; rect: MapRect }[] = [];
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
    this.buildRoofs(map);
    this.buildPortalMarkers(map);
  }

  /** Marca visualmente as descidas: boeiro/grade nos portais que não são escada. */
  private buildPortalMarkers(map: MapData): void {
    for (const portal of map.portals ?? []) {
      const tex = portal.kind === "stairs" ? this.sprites.stairs : this.sprites.manhole;
      const sp = new Sprite(tex);
      sp.anchor.set(0.5, 0.5);
      sp.position.set((portal.x + 0.5) * TILE_SIZE, (portal.y + 0.5) * TILE_SIZE);
      this.shadows.addChild(sp); // camada flat, abaixo das entidades (anda por cima)
    }
  }

  /** Um telhado por edifício, posicionado sobre o footprint (com overhang norte). */
  private buildRoofs(map: MapData): void {
    for (const b of map.buildings ?? []) {
      // telhado cobre tudo MENOS a fileira da frente (sul) → a porta/entrada fica
      // visível de fora (a porta dos prédios fica na parede sul).
      const sp = new Sprite(makeRoof(b.w, Math.max(1, b.h - 1), (hash2D(b.x, b.y) * 1e6) | 0));
      sp.position.set(b.x * TILE_SIZE, b.y * TILE_SIZE - ROOF_OVERHANG);
      this.roofs.addChild(sp);
      this.roofSprites.push({ sp, rect: b });
    }
  }

  /**
   * Fade do telhado por PROXIMIDADE (estilo Tibia): some quando o player está
   * dentro OU perto do edifício (vê o interior ao se aproximar da porta), volta
   * sólido quando afasta. Distância Chebyshev até o retângulo (0 = dentro).
   */
  updateRoofs(playerTileX: number, playerTileY: number, deltaMS: number): void {
    const step = deltaMS / 140;
    const FADE = 2.2; // tiles de aproximação até sumir
    for (const { sp, rect } of this.roofSprites) {
      const dx = Math.max(rect.x - playerTileX, playerTileX - (rect.x + rect.w - 1), 0);
      const dy = Math.max(rect.y - playerTileY, playerTileY - (rect.y + rect.h - 1), 0);
      const dist = Math.max(dx, dy);
      const target = Math.max(0, Math.min(1, dist / FADE));
      if (sp.alpha < target) sp.alpha = Math.min(target, sp.alpha + step);
      else if (sp.alpha > target) sp.alpha = Math.max(target, sp.alpha - step);
    }
  }

  private groundTexture(map: MapData, x: number, y: number): Texture | null {
    const s = this.sprites;
    const tile = map.tiles[y * map.width + x];
    if (tile === TileId.Void) return null; // fora do footprint do andar = breu
    const h = hash2D(x, y);
    // Campos 128×128: frame escolhido pela posição de MUNDO (4×4) → chão contínuo
    // sem repetição por tile (a grade idêntica de antes era a "pedra horrível").
    const fi = (x & 3) + (y & 3) * 4;
    switch (tile) {
      case TileId.Dirt:
        return s.dirt[fi];
      case TileId.StoneFloor:
      case TileId.Wall:
      case TileId.HouseWall:
        return s.stoneFloor[fi];
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
      default:
        return s.grass[fi]; // flores agora vêm do scatter
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
            const tex = this.groundTexture(map, x, y);
            if (!tex) continue; // Void: não desenha nada (breu do fundo)
            const sp = new Sprite(tex);
            sp.position.set(tx * TILE_SIZE, ty * TILE_SIZE);
            scratch.addChild(sp);
          }
        }

        // 2. CAMADA TERRA (dual-grid procedural): terra (nível 1) transborda na
        // grama. Display-tile no canto sup-esq lê os 4 cantos; código numérico.
        // === 1 (terra exata): pedra (nível 2) NÃO conta aqui (entra no passo 2b).
        const dirtT = this.sprites.dirtTransition;
        for (let ty = 0; ty <= tilesH; ty++) {
          for (let tx = 0; tx <= tilesW; tx++) {
            const x = cx * CHUNK_TILES + tx;
            const y = cy * CHUNK_TILES + ty;
            const nw = this.terrainAt(map, x - 1, y - 1) === 1 ? 1 : 0;
            const ne = this.terrainAt(map, x, y - 1) === 1 ? 2 : 0;
            const sw = this.terrainAt(map, x - 1, y) === 1 ? 4 : 0;
            const se = this.terrainAt(map, x, y) === 1 ? 8 : 0;
            const code = nw | ne | sw | se;
            if (code === 0 || code === 15) continue; // grama pura ou terra pura: base aparece
            const sp = new Sprite(dirtT[code]);
            sp.position.set(tx * TILE_SIZE - TILE_SIZE / 2, ty * TILE_SIZE - TILE_SIZE / 2);
            scratch.addChild(sp);
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
              tile === TileId.StoneFloor ? scatter.stone :
              tile === TileId.SewerFloor ? scatter.sewer :
              tile === TileId.CaveFloor ? scatter.cave : null;
            if (!set) continue;
            const density =
              tile === TileId.Grass ? 0.62 :
              tile === TileId.Dirt ? 0.42 :
              tile === TileId.SewerFloor ? 0.34 :
              tile === TileId.CaveFloor ? 0.28 : 0.3;
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

        // chunk 100% Void (andar subsolo fora do footprint) → não gasta RT
        if (scratch.children.length === 0) { scratch.destroy(); continue; }

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
    const isWater = (tx: number, ty: number): boolean => {
      if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return false;
      const tt = map.tiles[ty * map.width + tx];
      return tt === TileId.Water || tt === TileId.Sewage || tt === TileId.DeepWater;
    };
    const E = TILE_SIZE;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const t = map.tiles[y * map.width + x];
        const frames =
          t === TileId.Water ? this.sprites.waterFrames :
          t === TileId.Sewage ? this.sprites.sewageFrames :
          t === TileId.DeepWater ? this.sprites.deepWaterFrames : null;
        if (!frames) continue;
        const w = new Sprite(frames[0]);
        w.position.set(x * E, y * E);
        this.ground.addChild(w);
        this.waterSprites.push({ sp: w, frames });
        // PROFUNDIDADE: onde a água encosta no chão ela é um REBAIXO — sombra interna
        // nas bordas (o lábio do chão projeta sombra na lâmina), mais forte no topo
        // (luz vem de cima). Faz a água parecer CONTIDA, não solta por cima do tile.
        const top = !isWater(x, y - 1), lf = !isWater(x - 1, y), rt = !isWater(x + 1, y), bt = !isWater(x, y + 1);
        if (top || lf || rt || bt) {
          const g = new Graphics();
          if (top) { g.rect(0, 0, E, 3).fill({ color: 0, alpha: 0.5 }); g.rect(0, 3, E, 3).fill({ color: 0, alpha: 0.22 }); }
          if (lf) { g.rect(0, 0, 3, E).fill({ color: 0, alpha: 0.38 }); g.rect(3, 0, 2, E).fill({ color: 0, alpha: 0.16 }); }
          if (rt) g.rect(E - 3, 0, 3, E).fill({ color: 0, alpha: 0.3 });
          if (bt) g.rect(0, E - 3, E, 3).fill({ color: 0, alpha: 0.3 });
          g.position.set(x * E, y * E);
          this.ground.addChild(g);
        }
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
      [TileId.HouseWall]: s.houseWalls,
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
        // remaster 128: upscale inteiro temporário até regen nativa do PixelLab.
        // Árvore PixelLab é 64px de largura (meio tile); escala inteira (=2) a leva
        // a 128 largura. Os procedurais (makeTree/rocks/muros) já nascem em TILE_SIZE
        // (largura ≥ TILE_SIZE → fator 1, intocados). Ancorada na base (0.5,1).
        if (tile === TileId.Tree) {
          const nw = tex.width || TILE_SIZE;
          const up = Math.max(1, Math.round(TILE_SIZE / nw));
          if (up !== 1) obj.scale.set(up);
        }
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
