import { TileId, type MapData, type MapDecor, type MapLight, type MapMonster } from "../../shared/types";
import { mulberry32 } from "../rng";

/**
 * Mapa de teste 64x64 gerado deterministicamente:
 * clareira com caminho de terra, lago, ruína de pedra com tochas
 * e floresta fechando as bordas.
 */
export function generateTestMap(): MapData {
  const W = 64;
  const H = 64;
  const rng = mulberry32(1337);
  const tiles: TileId[] = new Array(W * H).fill(TileId.Grass);
  const lights: MapLight[] = [];
  const decor: MapDecor[] = [];

  const set = (x: number, y: number, t: TileId) => {
    if (x >= 0 && y >= 0 && x < W && y < H) tiles[y * W + x] = t;
  };
  const get = (x: number, y: number): TileId =>
    x >= 0 && y >= 0 && x < W && y < H ? tiles[y * W + x] : TileId.Water;

  // ── Lago orgânico no canto sudeste ────────────────────────────────
  const lakeCx = 48;
  const lakeCy = 46;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x - lakeCx;
      const dy = y - lakeCy;
      const wobble = Math.sin(x * 0.7) * 1.6 + Math.cos(y * 0.55) * 1.8;
      if (Math.sqrt(dx * dx * 0.8 + dy * dy * 1.3) < 9 + wobble) set(x, y, TileId.Water);
    }
  }

  // ── Caminho de terra: oeste → centro → sul ────────────────────────
  const pathPoints: [number, number][] = [];
  let py = 30;
  for (let x = 0; x <= 36; x++) {
    py += Math.round((rng() - 0.5) * 2 * 0.9);
    py = Math.max(24, Math.min(36, py));
    pathPoints.push([x, py]);
  }
  let px = 36;
  for (let y = pathPoints[pathPoints.length - 1][1]; y < H; y++) {
    px += Math.round((rng() - 0.5) * 2 * 0.9);
    px = Math.max(30, Math.min(40, px));
    pathPoints.push([px, y]);
  }
  for (const [cx, cy] of pathPoints) {
    for (let dy = 0; dy <= 1; dy++) {
      for (let dx = 0; dx <= 1; dx++) {
        if (get(cx + dx, cy + dy) === TileId.Grass) set(cx + dx, cy + dy, TileId.Dirt);
      }
    }
  }

  // ── Ruína de pedra ao norte do caminho ────────────────────────────
  const rx = 22;
  const ry = 10;
  const rw = 13;
  const rh = 9;
  for (let y = ry; y < ry + rh; y++) {
    for (let x = rx; x < rx + rw; x++) {
      set(x, y, TileId.StoneFloor);
    }
  }
  for (let x = rx; x < rx + rw; x++) {
    if (x !== rx + 6 && x !== rx + 7) set(x, ry, TileId.Wall); // porta norte? não: parede com vão
    set(x, ry + rh - 1, x === rx + 6 || x === rx + 7 ? TileId.StoneFloor : TileId.Wall); // entrada sul
  }
  for (let y = ry; y < ry + rh; y++) {
    set(rx, y, TileId.Wall);
    set(rx + rw - 1, y, TileId.Wall);
  }
  // Ruína "quebrada": derruba alguns blocos de parede
  const breaks: [number, number][] = [
    [rx + 3, ry],
    [rx + 9, ry],
    [rx, ry + 4],
    [rx + rw - 1, ry + 6],
  ];
  for (const [bx, by] of breaks) set(bx, by, TileId.StoneFloor);
  // Piso da ruína se estendendo pela entrada (desgaste)
  for (let y = ry + rh; y < ry + rh + 3; y++) {
    for (let x = rx + 5; x < rx + 9; x++) {
      if (get(x, y) === TileId.Grass) set(x, y, TileId.StoneFloor);
    }
  }
  // Tochas da ruína (decor + luz)
  const torchSpots: [number, number][] = [
    [rx + 2, ry + 2],
    [rx + rw - 3, ry + 2],
    [rx + 2, ry + rh - 3],
    [rx + rw - 3, ry + rh - 3],
  ];
  for (const [tx, ty] of torchSpots) {
    decor.push({ x: tx, y: ty, kind: "torch" });
    lights.push({ x: tx, y: ty, color: 0xffa14e, radius: 5.5, intensity: 0.95, flicker: true });
  }

  // ── Postes de tocha ao longo do caminho ───────────────────────────
  const roadTorches: [number, number][] = [
    [12, 28],
    [30, 32],
    [38, 48],
  ];
  for (const [tx, ty] of roadTorches) {
    if (get(tx, ty) === TileId.Grass) {
      decor.push({ x: tx, y: ty, kind: "torch" });
      lights.push({ x: tx, y: ty, color: 0xff9a42, radius: 5, intensity: 0.9, flicker: true });
    }
  }

  // ── Floresta: bordas densas + clusters internos ───────────────────
  const treeAt = (x: number, y: number) => {
    if (get(x, y) !== TileId.Grass) return;
    set(x, y, TileId.Tree);
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
      if (edge < 3 && rng() < (edge === 0 ? 1 : edge === 1 ? 0.75 : 0.4)) treeAt(x, y);
    }
  }
  const clusters: [number, number, number, number][] = [
    // [cx, cy, raio, densidade]
    [10, 12, 5, 0.55],
    [50, 12, 6, 0.5],
    [14, 48, 6, 0.5],
    [44, 26, 4, 0.45],
    [28, 44, 4, 0.4],
    [56, 30, 4, 0.5],
  ];
  for (const [cx, cy, r, d] of clusters) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        if (rng() < d) treeAt(cx + dx, cy + dy);
      }
    }
  }

  // ── Pedras espalhadas ─────────────────────────────────────────────
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(rng() * W);
    const y = Math.floor(rng() * H);
    if (get(x, y) === TileId.Grass) set(x, y, TileId.Rock);
  }

  // ── Spawn: no caminho, ao sul da ruína ────────────────────────────
  const spawn = { x: 28, y: 26 };
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const t = get(spawn.x + dx, spawn.y + dy);
      if (t === TileId.Tree || t === TileId.Rock) set(spawn.x + dx, spawn.y + dy, TileId.Grass);
    }
  }

  // ── Ratos Lanhosos: "o primeiro sangue" — pequenos grupos perto do spawn ─
  const monsters: MapMonster[] = [];
  const ratSpots: [number, number][] = [
    [33, 27],
    [34, 28],
    [32, 29], // matilha a leste do spawn
    [25, 31],
    [26, 30], // dupla a sudoeste
    [30, 22], // batedor solitário ao norte
  ];
  for (const [mx, my] of ratSpots) {
    // garante tile andável (limpa árvore/pedra que tenha caído ali)
    const t = get(mx, my);
    if (t === TileId.Tree || t === TileId.Rock || t === TileId.Wall) set(mx, my, TileId.Grass);
    if (get(mx, my) === TileId.Water) continue;
    monsters.push({ x: mx, y: my, species: "rato_lanhoso" });
  }

  // Zonas seguras (depot) e de passagem (escadas/portais): nenhuma no mapa de
  // teste — os mecanismos são exercitados nas cidades/dungeons do M3.
  return { width: W, height: H, tiles, lights, decor, monsters, safeZones: [], passZones: [], spawn };
}
