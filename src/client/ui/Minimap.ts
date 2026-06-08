import { Container, Graphics, Text } from "pixi.js";
import { TileId, type MapData } from "../../shared/types";
import { makeDraggable } from "./draggable";
import { panelFrame, titleText, UI } from "./theme";

/**
 * Minimapa com NÉVOA DE EXPLORAÇÃO (decidido jun/2026): começa todo preto e
 * revela tiles num raio ao redor do jogador conforme ele anda; o que já foi
 * visto fica permanentemente revelado (não-explorado segue preto). Janela
 * centrada no jogador (scrolla com ele).
 *
 * Apresentação pura: lê o `MapData` (tiles) do client + a posição do jogador.
 * O conjunto de explorados vive no client por ora — quando entrar save/online,
 * vira progresso de exploração persistido (estado do jogador).
 */
const SIZE = 156; // lado da área do mapa (px)
const PX = 3; // px por tile
const HALF = Math.floor(SIZE / PX / 2); // tiles visíveis de cada lado do jogador
const REVEAL = 7; // raio (em tiles) revelado ao redor do jogador
const PAD = 6;

/** Cor de cada tile no minimapa (dessaturado; parede escura, chão claro). */
const TILE_COLOR: Record<number, number> = {
  [TileId.Grass]: 0x334a37,
  [TileId.Dirt]: 0x5a4632,
  [TileId.StoneFloor]: 0x4c535f,
  [TileId.Water]: 0x1d4260,
  [TileId.Tree]: 0x223420,
  [TileId.Rock]: 0x363d49,
  [TileId.Wall]: 0x1c2028,
  [TileId.Bridge]: 0x6e5638,
  [TileId.Swamp]: 0x37432a,
};

export class Minimap {
  readonly container = new Container();
  private bg = new Graphics();
  private map = new Graphics();
  private blip = new Graphics();
  private maskG = new Graphics();
  private title: Text;
  private mapData: MapData | null = null;
  private explored = new Set<number>();
  private last = { x: -9999, y: -9999 };
  private userPos: { x: number; y: number } | null = null;
  private screenW = 0;

  constructor() {
    this.title = titleText("Mapa");
    this.container.addChild(this.bg, this.map, this.blip, this.maskG, this.title);
    this.map.mask = this.maskG;
    makeDraggable(this.container, UI.headerH, (x, y) => {
      this.userPos = { x, y };
      this.layout();
    });
  }

  /** Largura/altura totais do painel (o dock de equip se ancora abaixo disto). */
  get height(): number {
    return UI.headerH + PAD + SIZE + PAD;
  }
  get width(): number {
    return SIZE + PAD * 2;
  }

  setMap(m: MapData): void {
    this.mapData = m;
    this.explored.clear();
    this.last = { x: -9999, y: -9999 };
  }

  /** Revela ao redor do jogador e redesenha quando ele troca de tile. */
  update(px: number, py: number): void {
    if (!this.mapData) return;
    if (px === this.last.x && py === this.last.y) return;
    this.last = { x: px, y: py };
    const m = this.mapData;
    for (let dy = -REVEAL; dy <= REVEAL; dy++) {
      for (let dx = -REVEAL; dx <= REVEAL; dx++) {
        if (dx * dx + dy * dy > REVEAL * REVEAL) continue;
        const x = px + dx;
        const y = py + dy;
        if (x < 0 || y < 0 || x >= m.width || y >= m.height) continue;
        this.explored.add(y * m.width + x);
      }
    }
    this.redrawMap(px, py);
  }

  resize(screenW: number, _screenH: number): void {
    this.screenW = screenW;
    this.layout();
  }

  private layout(): void {
    const w = this.width;
    const pos = this.userPos ?? { x: this.screenW - w - 12, y: 12 };
    this.container.position.set(pos.x, pos.y);
    panelFrame(this.bg, w, this.height);
    this.title.position.set(PAD + 2, UI.headerH / 2);
    // máscara da área de mapa
    this.maskG.clear();
    this.maskG.rect(PAD, UI.headerH + PAD, SIZE, SIZE).fill(0xffffff);
    if (this.last.x > -9999) this.redrawMap(this.last.x, this.last.y);
  }

  private redrawMap(px: number, py: number): void {
    const m = this.mapData;
    if (!m) return;
    const innerX = PAD;
    const innerY = UI.headerH + PAD;
    this.map.clear();
    // fundo preto (névoa) sob tudo
    this.map.rect(innerX, innerY, SIZE, SIZE).fill(0x05070b);
    for (let ty = py - HALF; ty <= py + HALF; ty++) {
      for (let tx = px - HALF; tx <= px + HALF; tx++) {
        if (tx < 0 || ty < 0 || tx >= m.width || ty >= m.height) continue;
        const idx = ty * m.width + tx;
        if (!this.explored.has(idx)) continue; // não-explorado = preto
        const color = TILE_COLOR[m.tiles[idx]] ?? 0x1c2028;
        const sx = innerX + (tx - (px - HALF)) * PX;
        const sy = innerY + (ty - (py - HALF)) * PX;
        this.map.rect(sx, sy, PX, PX).fill(color);
      }
    }
    // blip do jogador no centro
    const cx = innerX + HALF * PX + PX / 2;
    const cy = innerY + HALF * PX + PX / 2;
    this.blip.clear();
    this.blip.circle(cx, cy, 3).fill(0xffe27a);
    this.blip.circle(cx, cy, 3).stroke({ color: UI.textShadow, width: 1 });
  }

  hitTest(sx: number, sy: number): boolean {
    return this.container.getBounds().rectangle.contains(sx, sy);
  }
}
