// Dump ASCII descartável dos andares de esgoto — valida layout/portais/mobs sem
// precisar navegar no jogo. Rodar: esbuild bundle → node (ver comando no chat).
import { generateAlvoradaMap } from "../src/sim/maps/alvorada";
import { TileId, WALKABLE } from "../src/shared/types";

const GLYPH: Record<number, string> = {
  [TileId.SewerFloor]: "·",
  [TileId.SewerWall]: "#",
  [TileId.Sewage]: "~",
  [TileId.DeepWater]: "≈",
  [TileId.OldMasonryWall]: "M",
  [TileId.CaveFloor]: ".",
  [TileId.CaveWall]: "%",
  [TileId.Void]: " ",
};

const map = generateAlvoradaMap();
console.log(`MAPA ${map.id} ${map.width}x${map.height} — superfície portais (bocas):`);
for (const p of map.portals ?? []) console.log(`  (${p.x},${p.y}) ${p.kind} → z${p.to?.z}`);

for (const f of map.floors ?? []) {
  console.log(`\n=== ANDAR z=${f.z}  origem(${f.ox},${f.oy}) ${f.width}x${f.height} ambient=${f.ambient?.toString(16)} ===`);
  const grid: string[][] = [];
  for (let ly = 0; ly < f.height; ly++) {
    const row: string[] = [];
    for (let lx = 0; lx < f.width; lx++) row.push(GLYPH[f.tiles[ly * f.width + lx]] ?? "?");
    grid.push(row);
  }
  // overlay portais (em coord MUNDO → local)
  for (const p of f.portals) {
    const lx = p.x - f.ox, ly = p.y - f.oy;
    if (ly >= 0 && ly < f.height && lx >= 0 && lx < f.width) {
      grid[ly][lx] = p.kind === "hole" ? "O" : p.kind === "cave" ? "C" : p.to && p.to.z > f.z ? "▲" : "▼";
    }
  }
  // overlay mobs (1ª letra da espécie)
  for (const m of f.monsters ?? []) {
    const lx = m.x - f.ox, ly = m.y - f.oy;
    if (ly >= 0 && ly < f.height && lx >= 0 && lx < f.width) grid[ly][lx] = m.species[0];
  }
  console.log(grid.map((r) => r.join("")).join("\n"));
  console.log(`  portais: ${f.portals.map((p) => `${p.kind}(${p.x},${p.y})→z${p.to?.z}`).join("  ")}`);
  console.log(`  mobs: ${(f.monsters ?? []).map((m) => m.species).join(", ")}`);
}
console.log("\nLegenda: ·=chão #=parede ~=esgoto ≈=fundo M=alvenaria O=boeiro(desce) ▲=escada↑ ▼=escada↓ C=galeria/saída  letra=mob");

// ── CONNECTIVIDADE: flood-fill por andar a partir de cada landing de portal ──
console.log("\n===== CHECAGEM DE CONNECTIVIDADE (flood-fill) =====");
const floorByZ = new Map((map.floors ?? []).map((f) => [f.z, f]));
// landings que CHEGAM em cada z: superfície + portais de outros andares
const landings = new Map<number, { x: number; y: number; from: string }[]>();
const addLanding = (z: number, x: number, y: number, from: string) => {
  if (!landings.has(z)) landings.set(z, []);
  landings.get(z)!.push({ x, y, from });
};
for (const p of map.portals ?? []) if (p.to) addLanding(p.to.z, p.to.x, p.to.y, `superfície(${p.x},${p.y})`);
for (const f of map.floors ?? []) for (const p of f.portals) if (p.to) addLanding(p.to.z, p.to.x, p.to.y, `z${f.z}(${p.x},${p.y})`);

// landings na SUPERFÍCIE (z=0): valida contra os tiles do mapa base
const surfZ = map.z ?? 0;
for (const lnd of landings.get(surfZ) ?? []) {
  const ok = lnd.x >= 0 && lnd.y >= 0 && lnd.x < map.width && lnd.y < map.height && WALKABLE[map.tiles[lnd.y * map.width + lnd.x]];
  console.log(`  superfície landing de ${lnd.from} em (${lnd.x},${lnd.y}): ${ok ? "✅ andável" : "❌ NÃO-andável (" + TileId[map.tiles[lnd.y * map.width + lnd.x]] + ")"}`);
}
// scan da margem leste (pra escolher a saída secreta): y=156..164, x=195..260
console.log("  scan margem leste (·=andável  x=bloqueado), linhas y156/158/160/162:");
for (const sy of [156, 158, 160, 162]) {
  let row = `   y${sy}: `;
  for (let sx = 195; sx <= 260; sx++) row += WALKABLE[map.tiles[sy * map.width + sx]] ? "·" : "x";
  console.log(row + ` (x195..260)`);
}

for (const f of map.floors ?? []) {
  const ins = landings.get(f.z) ?? [];
  const walk = (lx: number, ly: number) =>
    lx >= 0 && ly >= 0 && lx < f.width && ly < f.height && WALKABLE[f.tiles[ly * f.width + lx]];
  const seen = new Uint8Array(f.width * f.height);
  const q: [number, number][] = [];
  for (const lnd of ins) {
    const lx = lnd.x - f.ox, ly = lnd.y - f.oy;
    if (!walk(lx, ly)) console.log(`  ⚠️ z${f.z}: landing de ${lnd.from} cai em tile NÃO-andável (${lnd.x},${lnd.y})`);
    else if (!seen[ly * f.width + lx]) { seen[ly * f.width + lx] = 1; q.push([lx, ly]); }
  }
  while (q.length) {
    const [lx, ly] = q.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = lx + dx, ny = ly + dy;
      if (walk(nx, ny) && !seen[ny * f.width + nx]) { seen[ny * f.width + nx] = 1; q.push([nx, ny]); }
    }
  }
  const reach = (x: number, y: number) => { const lx = x - f.ox, ly = y - f.oy; return walk(lx, ly) && seen[ly * f.width + lx]; };
  const badP = f.portals.filter((p) => !reach(p.x, p.y));
  const badM = (f.monsters ?? []).filter((m) => !reach(m.x, m.y));
  const ok = badP.length === 0 && badM.length === 0;
  console.log(`  z${f.z}: ${ok ? "✅ tudo alcançável" : "❌ INALCANÇÁVEL"} a partir de ${ins.length} landing(s)`);
  for (const p of badP) console.log(`     portal ${p.kind}(${p.x},${p.y}) NÃO alcançável`);
  for (const m of badM) console.log(`     mob ${m.species}(${m.x},${m.y}) NÃO alcançável`);
}
