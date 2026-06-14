/* ASCII da CIDADE de Alvorada (debug de layout — world-designer).
 * npx esbuild tools/_ascii-cidade.ts --bundle --platform=node --outfile=/tmp/ac.cjs && node /tmp/ac.cjs
 */
import { generateAlvoradaMap } from "../src/sim/maps/alvorada";
import { TileId } from "../src/shared/types";

const m: any = generateAlvoradaMap();
const W = m.width as number;
const t = m.tiles as number[];
const at = (x: number, y: number) => t[y * W + x];

// janela da cidade (muralha 102..158 × 82..138) com 1 de folga
const X0 = 100, X1 = 159, Y0 = 81, Y1 = 139;

const TC: Record<number, string> = {
  [TileId.Grass]: " ", [TileId.Dirt]: ".", [TileId.StoneFloor]: ",",
  [TileId.Water]: "~", [TileId.Tree]: "T", [TileId.Rock]: "o",
  [TileId.Wall]: "#", [TileId.Bridge]: "=", [TileId.Swamp]: "s",
  [TileId.HouseWall]: "%",
};

// overlays
const ov = new Map<string, string>();
const put = (x: number, y: number, c: string) => ov.set(`${x},${y}`, c);
for (const d of m.doors ?? []) put(d.pos.x, d.pos.y, "D");
for (const n of m.npcSpawns ?? []) put(n.x, n.y, (n.npcId?.[0] ?? "?").toUpperCase());
for (const dec of m.decor ?? []) {
  if (dec.blocks && !ov.has(`${dec.x},${dec.y}`)) put(dec.x, dec.y, "▒");
}

let header = "      ";
for (let x = X0; x <= X1; x++) header += x % 10 === 0 ? "|" : x % 5 === 0 ? ":" : " ";
console.log(header);
for (let y = Y0; y <= Y1; y++) {
  let row = String(y).padStart(4) + "  ";
  for (let x = X0; x <= X1; x++) {
    row += ov.get(`${x},${y}`) ?? TC[at(x, y)] ?? "?";
  }
  console.log(row);
}
console.log("\nLEGENDA: #=muralha %=parede-casa D=porta ,=pedra .=rua ~=água ▒=prop-bloqueia  letra=NPC(inicial)");
console.log("NPCs:", (m.npcSpawns ?? []).map((n: any) => `${n.npcId[0].toUpperCase()}=${n.name}(${n.x},${n.y})`).join("  "));
