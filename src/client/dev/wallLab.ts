/**
 * Wall Lab — crítica de direção de arte das PAREDES DE CASA.
 * Renderiza a PLANTA (footprint) de uma casa — anel de parede — pra avaliar
 * frente (sul, face cheia) × laterais (E/W verticais, vistas em ângulo) × fundo,
 * mais um trecho horizontal por material. Acesso: http://localhost:5173/wall-lab.html
 */
import { Application, Container, Graphics, Sprite, Text, TextureStyle } from "pixi.js";
import { HOUSE_WALL_H, makeHouseWallTile, type WallMaterial } from "../assets/sprites";

TextureStyle.defaultOptions.scaleMode = "nearest";

const TILE = 128;
const SCALE = 0.62;

/** Máscara autotile (N=1,E=2,S=4,W=8) de uma célula dado o conjunto de paredes. */
function maskAt(set: Set<string>, x: number, y: number): number {
  return (set.has(`${x},${y - 1}`) ? 1 : 0) | (set.has(`${x + 1},${y}`) ? 2 : 0) |
    (set.has(`${x},${y + 1}`) ? 4 : 0) | (set.has(`${x - 1},${y}`) ? 8 : 0);
}

/** Desenha o anel de parede de um retângulo w×h no root, ancorado em (ox,oy). */
function footprint(root: Container, ox: number, oy: number, w: number, h: number, mat: WallMaterial, doorAt: [number, number] | null): void {
  const set = new Set<string>();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x === 0 || x === w - 1 || y === 0 || y === h - 1) set.add(`${x},${y}`);
  // CHÃO interno (pra ver a transparência das paredes laterais finas) — cinza pedra
  const floor = new Graphics();
  floor.rect(ox, oy, w * TILE * SCALE, (h * TILE) * SCALE).fill({ color: 0x4a4f57 });
  root.addChild(floor);
  // pinta por linhas de cima→baixo (painter): tile de baixo cobre o de cima (alto > tile)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!set.has(`${x},${y}`)) continue;
      const mask = maskAt(set, x, y);
      // lateral pura (N&S parede, sem E/W) → tira fina; externo = lado sem interior
      const thin = mask === 0b0101 ? (x === 0 ? "w" : "e") : null;
      const feat = doorAt && doorAt[0] === x && doorAt[1] === y ? "door" : null;
      const tex = makeHouseWallTile(mask, 700 + x * 7 + y * 31, feat, mat, thin);
      const spr = new Sprite(tex);
      spr.scale.set(SCALE);
      // base do tile em (y+1)*TILE; sprite é HOUSE_WALL_H alto → top sobe além do tile
      spr.position.set(ox + x * TILE * SCALE, oy + ((y + 1) * TILE - HOUSE_WALL_H) * SCALE);
      root.addChild(spr);
    }
  }
}

async function main() {
  const W = 1100, H = 760;
  const app = new Application();
  await app.init({ width: W, height: H, background: 0x1a2230, antialias: false });
  document.body.appendChild(app.canvas);
  const root = new Container();
  app.stage.addChild(root);
  const cap = (text: string, x: number, y: number, color = 0xe8e4d8, size = 13) => {
    const t = new Text({ text, style: { fontFamily: "monospace", fontSize: size, fill: color } });
    t.position.set(x, y); root.addChild(t);
  };
  cap("WALL LAB — planta de casa (frente sul × laterais E/W verticais × fundo norte)", 16, 12, 0xe8e4d8, 15);
  cap("avaliar: viga de topo repetindo na lateral + espessura frente×lateral (ângulo)", 16, 32, 0x7d8794);

  cap("ENXAIMEL", 40, 70);
  footprint(root, 40, 90, 6, 5, "enxaimel", [3, 4]);

  cap("MEIA-PEDRA", 580, 70);
  footprint(root, 580, 90, 6, 5, "meia_pedra", [3, 4]);

  cap("PEDRA", 40, 440);
  footprint(root, 40, 460, 6, 5, "pedra", null);

  cap("TAIPA POBRE", 580, 440);
  footprint(root, 580, 460, 6, 5, "taipa_pobre", null);
}

main();
