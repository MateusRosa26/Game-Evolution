import { Container, FederatedWheelEvent, Graphics, Rectangle, type Renderer, RenderTexture, Sprite, Text } from "pixi.js";
import { TileId, type MapData } from "../../shared/types";
import { makeDraggable } from "./draggable";
import { panelFrame, titleText, UI } from "./theme";

/**
 * Minimapa com NÉVOA DE EXPLORAÇÃO (decidido jun/2026): começa todo preto e
 * revela tiles num raio ao redor do jogador conforme ele anda; o que já foi
 * visto fica permanentemente revelado (não-explorado segue preto). Janela
 * centrada no jogador (scrolla com ele).
 *
 * DESEMPENHO (jun/2026): o mapa do andar inteiro é desenhado UMA vez num
 * RenderTexture (PX por tile) e revelado INCREMENTALMENTE — a cada passo só os
 * tiles novos da borda do disco são pintados no RT (dezenas), e a janela rolante
 * vira só reposicionar um sprite. Antes, `redrawMap` refazia ~2.800 `rect().fill()`
 * por passo (clear + re-tesselagem do Graphics inteiro), o que dava um hitch
 * periódico ao caminhar. Agora o custo por passo é ~zero.
 *
 * Apresentação pura: lê o `MapData` (tiles) do client + a posição do jogador.
 * O conjunto de explorados vive no client por ora — quando entrar save/online,
 * vira progresso de exploração persistido (estado do jogador).
 */
const MIN_SIZE = 156; // lado mínimo (= tamanho atual); a roda do mouse aumenta até MAX_SIZE
const MAX_SIZE = 360;
const SIZE_STEP = 24; // px por tique de roda
const PX = 3; // px por tile
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
  [TileId.HouseWall]: 0x2a2620,
  // subsolo (esgoto/caverna): chão úmido claro, alvenaria/rocha escuras, água suja
  [TileId.SewerFloor]: 0x3a444a,
  [TileId.CaveFloor]: 0x3c362c,
  [TileId.Sewage]: 0x2e3a22,
  [TileId.DeepWater]: 0x14202c,
  [TileId.SewerWall]: 0x1a211f,
  [TileId.OldMasonryWall]: 0x23201a,
  [TileId.CaveWall]: 0x1d1913,
};

export class Minimap {
  readonly container = new Container();
  private bg = new Graphics();
  private fog = new Graphics(); // fundo preto (névoa) sob o mapa, recortado à janela
  private mapSprite = new Sprite(); // janela rolante sobre o RT do andar ativo
  private blip = new Graphics();
  private maskG = new Graphics();
  private title: Text;
  private mapData: MapData | null = null;
  /** Névoa de exploração POR ANDAR (z) — descer/subir não mistura o revelado. */
  private exploredByZ = new Map<number, Set<number>>();
  private explored = new Set<number>();
  /** RenderTexture do mapa INTEIRO por andar (PX por tile), revelado incrementalmente. */
  private rtByZ = new Map<number, RenderTexture>();
  private mapRT: RenderTexture | null = null;
  /** Pincel reusável: pinta os tiles recém-revelados e é renderizado no RT (sem clear). */
  private brush = new Graphics();
  private last = { x: -9999, y: -9999 };
  private userPos: { x: number; y: number } | null = null;
  private screenW = 0;
  /** Lado atual da janela do mapa (px) — a roda do mouse ajusta [MIN_SIZE, MAX_SIZE]. */
  private size = MIN_SIZE;

  constructor(private renderer: Renderer) {
    this.title = titleText("Mapa");
    this.mapSprite.mask = this.maskG;
    this.container.addChild(this.bg, this.fog, this.mapSprite, this.blip, this.maskG, this.title);
    makeDraggable(this.container, UI.headerH, (x, y) => {
      this.userPos = { x, y };
      this.layout();
    });
    // Roda do mouse sobre o minimapa = aumenta/diminui a janela (zoom).
    this.container.on("wheel", (e: FederatedWheelEvent) => {
      e.preventDefault?.();
      const dir = e.deltaY < 0 ? 1 : -1;
      const next = Math.max(MIN_SIZE, Math.min(MAX_SIZE, this.size + dir * SIZE_STEP));
      if (next !== this.size) {
        this.size = next;
        this.layout();
      }
    });
  }

  /** Largura/altura totais do painel (o dock de equip se ancora abaixo disto). */
  get height(): number {
    return UI.headerH + PAD + this.size + PAD;
  }
  get width(): number {
    return this.size + PAD * 2;
  }

  /** Troca o mapa exibido pelo do ANDAR ativo (chamado ao descer/subir). Mantém a
   *  névoa de cada andar: re-entrar num andar já explorado preserva o revelado (o
   *  RT e o conjunto de explorados são cacheados juntos por z, logo coerentes). */
  setMap(m: MapData): void {
    this.mapData = m;
    const z = m.z ?? 0;
    let set = this.exploredByZ.get(z);
    if (!set) {
      set = new Set<number>();
      this.exploredByZ.set(z, set);
    }
    this.explored = set;
    let rt = this.rtByZ.get(z);
    if (!rt) {
      rt = RenderTexture.create({
        width: Math.max(1, m.width * PX),
        height: Math.max(1, m.height * PX),
      });
      this.rtByZ.set(z, rt);
    }
    this.mapRT = rt;
    this.mapSprite.texture = rt;
    this.last = { x: -9999, y: -9999 };
  }

  /** Revela ao redor do jogador e rola a janela quando ele troca de tile. */
  update(px: number, py: number): void {
    if (!this.mapData || !this.mapRT) return;
    if (px === this.last.x && py === this.last.y) return;
    this.last = { x: px, y: py };
    const m = this.mapData;
    // Pinta SÓ os tiles novos desta passada (a borda do disco) no RT do andar.
    const g = this.brush;
    g.clear();
    let drew = false;
    for (let dy = -REVEAL; dy <= REVEAL; dy++) {
      for (let dx = -REVEAL; dx <= REVEAL; dx++) {
        if (dx * dx + dy * dy > REVEAL * REVEAL) continue;
        const x = px + dx;
        const y = py + dy;
        if (x < 0 || y < 0 || x >= m.width || y >= m.height) continue;
        const idx = y * m.width + x;
        if (this.explored.has(idx)) continue; // já está no RT
        this.explored.add(idx);
        const tile = m.tiles[idx];
        if (tile === TileId.Void) continue; // fora do footprint do andar = breu
        const color = TILE_COLOR[tile] ?? 0x1c2028;
        g.rect(x * PX, y * PX, PX, PX).fill(color);
        drew = true;
      }
    }
    if (drew) this.renderer.render({ container: g, target: this.mapRT, clear: false });
    this.positionWindow(px, py);
  }

  resize(screenW: number, _screenH: number): void {
    this.screenW = screenW;
    this.layout();
  }

  /** Centra a janela (sprite do RT) no tile do jogador. Custo: um `position.set`. */
  private positionWindow(px: number, py: number): void {
    const innerX = PAD;
    const innerY = UI.headerH + PAD;
    // Centro do tile do jogador alinhado ao centro da janela; arredonda p/ pixel
    // inteiro (nearest) e evitar shimmer de subpixel no scroll.
    this.mapSprite.position.set(
      Math.round(innerX + this.size / 2 - (px + 0.5) * PX),
      Math.round(innerY + this.size / 2 - (py + 0.5) * PX),
    );
  }

  private layout(): void {
    const w = this.width;
    const pos = this.userPos ?? { x: this.screenW - w - 12, y: 12 };
    this.container.position.set(pos.x, pos.y);
    this.container.hitArea = new Rectangle(0, 0, w, this.height); // roda pega na área toda
    panelFrame(this.bg, w, this.height);
    this.title.position.set(PAD + 2, UI.headerH / 2);
    const innerX = PAD;
    const innerY = UI.headerH + PAD;
    // máscara + fundo de névoa cobrem exatamente a área de mapa
    this.maskG.clear();
    this.maskG.rect(innerX, innerY, this.size, this.size).fill(0xffffff);
    this.fog.clear();
    this.fog.rect(innerX, innerY, this.size, this.size).fill(0x05070b);
    // blip do jogador: fixo no centro (desenhado uma vez, não por passo)
    const cx = innerX + this.size / 2;
    const cy = innerY + this.size / 2;
    this.blip.clear();
    this.blip.circle(cx, cy, 3).fill(0xffe27a);
    this.blip.circle(cx, cy, 3).stroke({ color: UI.textShadow, width: 1 });
    if (this.last.x > -9999) this.positionWindow(this.last.x, this.last.y);
  }

  hitTest(sx: number, sy: number): boolean {
    return this.container.getBounds().rectangle.contains(sx, sy);
  }
}
