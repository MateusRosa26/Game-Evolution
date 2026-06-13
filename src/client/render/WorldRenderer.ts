import { Container, Graphics, RenderTexture, Sprite, type Renderer, type Texture } from "pixi.js";
import { hash2D } from "../../sim/rng";
import { CAMERA_ZOOM, TILE_SIZE } from "../../shared/constants";
import { TileId, type MapData, type MapRect } from "../../shared/types";
import { makeRoof, ROOF_OVERHANG, type SpriteLibrary } from "../assets/sprites";

const WATER_FRAME_MS = 380;
const TORCH_FRAME_MS = 140;
/** Chunks de chão pré-renderizados (16×16 tiles → 1 sprite). */
const CHUNK_TILES = 16;
/**
 * STREAMING (remaster 128px): a 128px/tile cada chunk é uma RenderTexture de
 * 2048² = 16 MiB. Pré-renderizar os 484 chunks da Alvorada = ~7,7 GB de VRAM →
 * thrashing. Construímos só os chunks que a câmera vê + uma margem, reciclando
 * os distantes conforme o player anda. VRAM ~constante (~12 chunks ≈ 190 MiB).
 */
const STREAM_MARGIN = 1; // anéis de chunk pré-carregados além do visível
const STREAM_BUILD_BUDGET = 2; // teto de chunks novos por frame (evita hitch na fronteira)

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
   * Chunks de chão (RenderTexture) — streaming. Sub-camada de `ground`, ABAIXO
   * da água: chunks entram/saem ao longo do tempo, então a água precisa de um
   * container próprio adicionado depois pra render por cima independe da ordem.
   */
  private readonly groundChunks = new Container();
  /** Água animada + sombras de borda — acima dos chunks, dentro de `ground`. */
  private readonly groundWater = new Container();
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
  /** Braseiros (mobília): animam a brasa como a tocha (3 frames, mesmo clock). */
  private brazierSprites: Sprite[] = [];
  private waterClock = 0;
  private torchClock = 0;
  private waterFrame = 0;
  private torchFrame = 0;

  // Streaming de chunks: guardamos mapa/renderer para construir sob demanda.
  private readonly map: MapData;
  private readonly renderer: Renderer;
  private readonly chunksX: number;
  private readonly chunksY: number;
  /** Chunks construídos e vivos, por chave `cy * chunksX + cx`. */
  private readonly liveChunks = new Map<number, { sp: Sprite; rt: RenderTexture }>();

  constructor(
    private sprites: SpriteLibrary,
    map: MapData,
    renderer: Renderer,
  ) {
    this.map = map;
    this.renderer = renderer;
    this.chunksX = Math.ceil(map.width / CHUNK_TILES);
    this.chunksY = Math.ceil(map.height / CHUNK_TILES);
    this.objects.sortableChildren = true;
    // ordem dentro de `ground`: chunks (streamados) embaixo, água por cima.
    this.ground.addChild(this.groundChunks);
    this.ground.addChild(this.groundWater);
    this.buildWater(map); // água é barata (sprites de textura compartilhada) → eager
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
   * Constrói UM chunk de chão e devolve o sprite (RenderTexture) posicionado, ou
   * `null` se o chunk for 100% Void (andar subsolo fora do footprint → sem RT).
   *
   * DUAL-GRID Wang (jun/2026): o chão base sai por tile único; a TERRA entra
   * como camada deslocada meio-tile — cada display-tile lê os 4 cantos (células
   * lógicas NW/NE/SW/SE) e escolhe a Wang tile cujo código de cantos bate. O
   * full-lower (0000) é pulado (transparente) p/ a grama base aparecer.
   */
  private buildChunk(cx: number, cy: number): Sprite | null {
    const map = this.map;
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
    if (scratch.children.length === 0) { scratch.destroy(); return null; }

    const rt = RenderTexture.create({ width: tilesW * TILE_SIZE, height: tilesH * TILE_SIZE });
    this.renderer.render({ container: scratch, target: rt, clear: true });
    scratch.destroy({ children: true });

    const chunk = new Sprite(rt);
    chunk.position.set(cx * CHUNK_TILES * TILE_SIZE, cy * CHUNK_TILES * TILE_SIZE);
    return chunk;
  }

  /**
   * STREAMING: garante que só os chunks dentro do retângulo visível da câmera
   * (+ STREAM_MARGIN) estejam construídos, reciclando (destruindo a RT) os que
   * saíram de vista. `centerX/Y` é o centro da câmera em pixels de mundo.
   * `maxBuilds` limita construções por chamada (Infinity no prime de load/teleporte/
   * troca de andar; STREAM_BUILD_BUDGET no frame normal pra não engasgar na fronteira).
   */
  updateStreaming(centerX: number, centerY: number, screenW: number, screenH: number, maxBuilds = STREAM_BUILD_BUDGET): void {
    const chunkPx = CHUNK_TILES * TILE_SIZE;
    const halfW = screenW / 2 / CAMERA_ZOOM;
    const halfH = screenH / 2 / CAMERA_ZOOM;
    const clamp = (v: number, hi: number) => Math.max(0, Math.min(hi, v));
    const minCX = clamp(Math.floor((centerX - halfW) / chunkPx) - STREAM_MARGIN, this.chunksX - 1);
    const maxCX = clamp(Math.floor((centerX + halfW) / chunkPx) + STREAM_MARGIN, this.chunksX - 1);
    const minCY = clamp(Math.floor((centerY - halfH) / chunkPx) - STREAM_MARGIN, this.chunksY - 1);
    const maxCY = clamp(Math.floor((centerY + halfH) / chunkPx) + STREAM_MARGIN, this.chunksY - 1);

    // 1. descarrega chunks fora da janela (libera a VRAM da RT)
    for (const [key, { sp, rt }] of this.liveChunks) {
      const cx = key % this.chunksX;
      const cy = (key - cx) / this.chunksX;
      if (cx < minCX || cx > maxCX || cy < minCY || cy > maxCY) {
        this.groundChunks.removeChild(sp);
        sp.destroy();
        rt.destroy(true); // libera a textura na GPU
        this.liveChunks.delete(key);
      }
    }

    // 2. constrói os que faltam, priorizando os mais perto do centro (até o teto)
    const ccx = centerX / chunkPx, ccy = centerY / chunkPx;
    const missing: { cx: number; cy: number; d: number }[] = [];
    for (let cy = minCY; cy <= maxCY; cy++) {
      for (let cx = minCX; cx <= maxCX; cx++) {
        if (this.liveChunks.has(cy * this.chunksX + cx)) continue;
        const dx = cx + 0.5 - ccx, dy = cy + 0.5 - ccy;
        missing.push({ cx, cy, d: dx * dx + dy * dy });
      }
    }
    missing.sort((a, b) => a.d - b.d);
    for (let i = 0; i < missing.length && i < maxBuilds; i++) {
      const { cx, cy } = missing[i];
      const key = cy * this.chunksX + cx;
      const sp = this.buildChunk(cx, cy);
      // Mesmo Void (sp === null) marcamos como "vivo" (RT vazia) pra não reavaliar
      // todo frame; usamos um sprite vazio leve como sentinela.
      if (sp) {
        this.groundChunks.addChild(sp);
        this.liveChunks.set(key, { sp, rt: sp.texture as RenderTexture });
      } else {
        const empty = new Sprite();
        this.liveChunks.set(key, { sp: empty, rt: RenderTexture.create({ width: 1, height: 1 }) });
      }
    }
  }

  /**
   * Água animada: sprites individuais por cima do chão estático (não dá pra bakear
   * num chunk porque o frame troca por tick). Overworld + esgoto raso/fundo; barata
   * (textura compartilhada) → construída eager pro mapa todo, fora do streaming.
   */
  private buildWater(map: MapData): void {
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
        this.groundWater.addChild(w);
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
          this.groundWater.addChild(g);
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

    // MOBÍLIA URBANA (MOBILIA-URBANA.md): cada MapDecor.kind → sprite procedural
    // no MESMO container y-sorted dos objetos, ancorado na BASE (0.5,1), zIndex =
    // pixel Y da base (igual a tochas/árvores). A `cerca` é autotile (máscara dos
    // vizinhos `cerca`); o `braseiro` anima como a tocha. Animados/luz são DADOS:
    // a luz do braseiro vem de `map.lights` (placement), não daqui.
    const fenceAt = new Set<number>();
    for (const d of map.decor) if (d.kind === "cerca") fenceAt.add(d.y * map.width + d.x);
    const hasFence = (x: number, y: number): boolean => fenceAt.has(y * map.width + x);

    for (const d of map.decor) {
      const cx = (d.x + 0.5) * TILE_SIZE;
      const baseY = (d.y + 1) * TILE_SIZE;

      // Cerca: autotile 16 máscaras (N=1,E=2,S=4,W=8) — mesmo contrato do muro.
      if (d.kind === "cerca") {
        const mask =
          (hasFence(d.x, d.y - 1) ? 1 : 0) | (hasFence(d.x + 1, d.y) ? 2 : 0) |
          (hasFence(d.x, d.y + 1) ? 4 : 0) | (hasFence(d.x - 1, d.y) ? 8 : 0);
        const sp = new Sprite(s.fence[mask]);
        sp.anchor.set(0.5, 1);
        sp.position.set(cx, baseY);
        sp.zIndex = sp.position.y;
        this.objects.addChild(sp);
        this.addShadow(cx + 2, baseY - 2, 30, 10);
        continue;
      }

      // Demais kinds → uma textura (anchor base). default: pula (nunca quebra/some).
      let tex: Texture | null = null;
      switch (d.kind) {
        case "torch": tex = s.torchFrames[0]; break;
        case "barril": tex = s.barrel; break;
        case "caixa": tex = s.crate; break;
        case "tenda": tex = s.stall; break;
        case "poco": tex = s.well; break;
        case "balcao": tex = s.shopCounter; break;
        case "placa": tex = s.signs.generico; break;
        case "braseiro": tex = s.brazierFrames[0]; break;
        case "boneco_treino": tex = s.trainingDummy; break;
        case "estacas": tex = s.scaffold; break;
        case "saco": tex = s.sack; break;
        case "lenha": tex = s.firewood; break;
        default: tex = null; // kind desconhecido: ignora (silhueta nunca some/quebra)
      }
      if (!tex) continue;

      const sp = new Sprite(tex);
      sp.anchor.set(0.5, 1);
      sp.position.set(cx, baseY);
      sp.zIndex = sp.position.y;
      this.objects.addChild(sp);

      if (d.kind === "torch") {
        this.torchSprites.push(sp);
        this.addShadow(cx + 2, baseY - 2, 18, 8);
      } else if (d.kind === "braseiro") {
        this.brazierSprites.push(sp);
        this.addShadow(cx + 2, baseY - 2, 24, 11);
      } else if (d.kind === "placa") {
        // tabuleta pendurada na parede (alta): sem sombra de contato no chão.
      } else {
        // props de chão: sombra de contato proporcional à largura do sprite.
        const w = (tex.width || TILE_SIZE) * 0.6;
        this.addShadow(cx + 2, baseY - 2, Math.max(14, w), Math.max(8, w * 0.42));
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
      // braseiros compartilham o clock da tocha (brasa pulsa no mesmo ritmo).
      const bf = this.sprites.brazierFrames;
      const btex = bf[this.torchFrame % bf.length];
      for (const b of this.brazierSprites) b.texture = btex;
    }
  }
}
