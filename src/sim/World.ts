import {
  TileId,
  WALKABLE,
  type InteractableDef,
  type MapData,
  type MapDecor,
  type MapOpening,
  type MapPortal,
  type MapRect,
  type QuestRegionDef,
} from "../shared/types";

/** Uma camada de andar em runtime (localizada: offset + dimensões próprias). */
interface FloorRuntime {
  z: number;
  ox: number;
  oy: number;
  width: number;
  height: number;
  tiles: TileId[];
  /** Máscaras só do andar base (overworld); andares extras = null por ora. */
  safe: Uint8Array | null;
  pass: Uint8Array | null;
  /** Tiles ocupados por mobília que bloqueia (MapDecor.blocks). LOCAL ao rect. */
  blocked: Uint8Array;
  portals: MapPortal[];
  openings: MapOpening[];
  /** Hooks de quest do andar (esparsos; lista pequena → busca linear, como portals). */
  interactables: InteractableDef[];
  questRegions: QuestRegionDef[];
}

/**
 * Mundo em grid MULTI-ANDAR (z-levels — SISTEMA-ANDARES.md). Andares são
 * camadas LOCALIZADAS e esparsas (esgoto = só o rect sob a cidade). Toda
 * consulta aceita `z` opcional, default = andar base (`map.z ?? 0`), então o
 * código single-floor existente continua valendo sem mudar.
 */
export class World {
  readonly map: MapData;
  readonly baseZ: number;
  /** Dimensões do andar base (overworld) — back-compat com chamadas 2D. */
  readonly width: number;
  readonly height: number;
  private readonly floors = new Map<number, FloorRuntime>();

  constructor(map: MapData) {
    this.map = map;
    this.baseZ = map.z ?? 0;
    this.width = map.width;
    this.height = map.height;
    // andar base (overworld), full-size em offset (0,0)
    this.floors.set(this.baseZ, {
      z: this.baseZ,
      ox: 0,
      oy: 0,
      width: map.width,
      height: map.height,
      tiles: map.tiles,
      safe: World.maskFrom(map.width, map.height, 0, 0, map.safeZones),
      pass: World.maskFrom(map.width, map.height, 0, 0, map.passZones),
      blocked: World.blockedMaskFrom(map.width, map.height, 0, 0, map.decor),
      portals: map.portals ?? [],
      openings: map.openings ?? [],
      interactables: map.interactables ?? [],
      questRegions: map.questRegions ?? [],
    });
    // andares adicionais (z ≠ base): esgotos/cavernas/telhados, localizados
    for (const f of map.floors ?? []) {
      this.floors.set(f.z, {
        z: f.z,
        ox: f.ox,
        oy: f.oy,
        width: f.width,
        height: f.height,
        tiles: f.tiles,
        safe: null,
        pass: null,
        blocked: World.blockedMaskFrom(f.width, f.height, f.ox, f.oy, f.decor),
        portals: f.portals,
        openings: f.openings,
        interactables: f.interactables ?? [],
        questRegions: f.questRegions ?? [],
      });
    }
  }

  /** Máscara em coords de mundo, recortada ao rect do andar (ox,oy,w,h). */
  private static maskFrom(w: number, h: number, ox: number, oy: number, rects: MapRect[]): Uint8Array {
    const mask = new Uint8Array(w * h);
    for (const r of rects) {
      for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) {
          const lx = x - ox, ly = y - oy;
          if (lx >= 0 && ly >= 0 && lx < w && ly < h) mask[ly * w + lx] = 1;
        }
      }
    }
    return mask;
  }

  /**
   * Máscara dos tiles ocupados por mobília que BLOQUEIA (MOBILIA-URBANA §3): só
   * decor com `blocks:true` (barril/caixa/cerca/tenda/poço/balcão/braseiro/boneco/
   * estacas/lenha) marca o tile como impassável; decor puro (saco/cesto/placa) e o
   * `torch` não bloqueiam. Coords de decor são de MUNDO → recortadas ao rect do andar.
   */
  private static blockedMaskFrom(w: number, h: number, ox: number, oy: number, decor: MapDecor[]): Uint8Array {
    const mask = new Uint8Array(w * h);
    for (const d of decor) {
      if (!d.blocks) continue;
      const lx = d.x - ox, ly = d.y - oy;
      if (lx >= 0 && ly >= 0 && lx < w && ly < h) mask[ly * w + lx] = 1;
    }
    return mask;
  }

  /** Existe esse andar carregado? */
  hasFloor(z: number): boolean {
    return this.floors.has(z);
  }

  /** Lista dos z's carregados (overworld + extras). */
  floorZs(): number[] {
    return [...this.floors.keys()];
  }

  inBounds(x: number, y: number, z: number = this.baseZ): boolean {
    const f = this.floors.get(z);
    if (!f) return false;
    const lx = x - f.ox, ly = y - f.oy;
    return lx >= 0 && ly >= 0 && lx < f.width && ly < f.height;
  }

  tileAt(x: number, y: number, z: number = this.baseZ): TileId {
    const f = this.floors.get(z);
    if (!f) return TileId.Water;
    const lx = x - f.ox, ly = y - f.oy;
    if (lx < 0 || ly < 0 || lx >= f.width || ly >= f.height) return TileId.Water;
    return f.tiles[ly * f.width + lx];
  }

  isWalkable(x: number, y: number, z: number = this.baseZ): boolean {
    if (!this.inBounds(x, y, z) || !WALKABLE[this.tileAt(x, y, z)]) return false;
    // mobília bloqueante (barril/cerca/poço…) ocupa o tile: não-andável.
    const f = this.floors.get(z)!;
    return f.blocked[(y - f.oy) * f.width + (x - f.ox)] === 0;
  }

  /** Tile de zona segura? (entidades não bloqueiam; monstros não entram). */
  isSafeZone(x: number, y: number, z: number = this.baseZ): boolean {
    const f = this.floors.get(z);
    if (!f || !f.safe) return false;
    const lx = x - f.ox, ly = y - f.oy;
    return lx >= 0 && ly >= 0 && lx < f.width && ly < f.height && f.safe[ly * f.width + lx] === 1;
  }

  /** Tile de passagem? (chegada de mecanismo: sem bloqueio de corpo, resto normal). */
  isPassZone(x: number, y: number, z: number = this.baseZ): boolean {
    const f = this.floors.get(z);
    if (!f || !f.pass) return false;
    const lx = x - f.ox, ly = y - f.oy;
    return lx >= 0 && ly >= 0 && lx < f.width && ly < f.height && f.pass[ly * f.width + lx] === 1;
  }

  /**
   * Há FONTE DE CALOR (fogão/fogueira) a ≤ `range` tiles de (x,y)? Gate de
   * cozinha (COZINHA.md). Marcadores vivem no overworld (baseZ) por ora.
   */
  nearHeat(x: number, y: number, z: number = this.baseZ, range = 1): boolean {
    if (z !== this.baseZ) return false;
    return (this.map.heatSources ?? []).some((p) => Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) <= range);
  }

  /**
   * Há ÁGUA-DOCE (poço/rio doce) a ≤ `range` tiles de (x,y)? Água do mar (sem
   * marcador) não conta. Gate de cozinha (sopas).
   */
  nearFreshWater(x: number, y: number, z: number = this.baseZ, range = 1): boolean {
    if (z !== this.baseZ) return false;
    return (this.map.freshWater ?? []).some((p) => Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) <= range);
  }

  /** Portal (transição entre andares) neste tile, se houver. */
  portalAt(x: number, y: number, z: number = this.baseZ): MapPortal | null {
    const f = this.floors.get(z);
    if (!f) return null;
    return f.portals.find((p) => p.x === x && p.y === y) ?? null;
  }

  /** Abertura visual (revela andar vizinho) neste tile, se houver. */
  openingAt(x: number, y: number, z: number = this.baseZ): MapOpening | null {
    const f = this.floors.get(z);
    if (!f) return null;
    return f.openings.find((o) => o.x === x && o.y === y) ?? null;
  }

  /** Interagível de quest neste tile (mesmo andar), se houver. */
  interactableAt(x: number, y: number, z: number = this.baseZ): InteractableDef | null {
    const f = this.floors.get(z);
    if (!f) return null;
    return f.interactables.find((i) => i.pos.x === x && i.pos.y === y) ?? null;
  }

  /** Interagível de quest por id (mesmo andar) — a sim valida o alcance. */
  interactableById(id: string, z: number = this.baseZ): InteractableDef | null {
    const f = this.floors.get(z);
    if (!f) return null;
    return f.interactables.find((i) => i.id === id) ?? null;
  }

  /** Regiões de quest cujo retângulo contém (x,y) neste andar (0+; esparsas). */
  questRegionsAt(x: number, y: number, z: number = this.baseZ): QuestRegionDef[] {
    const f = this.floors.get(z);
    if (!f) return [];
    return f.questRegions.filter(
      (r) => x >= r.rect.x && y >= r.rect.y && x < r.rect.x + r.rect.w && y < r.rect.y + r.rect.h,
    );
  }
}
