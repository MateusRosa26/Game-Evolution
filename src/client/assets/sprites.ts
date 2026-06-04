import { Texture } from "pixi.js";
import { mulberry32, type Rng } from "../../sim/rng";
import type { Facing } from "../../shared/types";
import { PAL } from "./palette";

/**
 * Toda a pixel art do jogo é gerada proceduralmente aqui, em canvases
 * offscreen → texturas Pixi. Trocar por assets desenhados no futuro é
 * só trocar a origem das texturas — o resto do jogo não sabe a diferença.
 */

// ──────────────────────────────────────────────────────────────────────
// Helper de desenho pixel a pixel
// ──────────────────────────────────────────────────────────────────────

class Px {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly w: number;
  readonly h: number;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.canvas = document.createElement("canvas");
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext("2d")!;
  }

  px(x: number, y: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }

  rect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  fill(color: string): void {
    this.rect(0, 0, this.w, this.h, color);
  }

  /** Disco com borda irregular (blobs orgânicos para copas, rochas...). */
  blob(cx: number, cy: number, r: number, color: string, rng: Rng, rough = 1.2): void {
    for (let y = Math.floor(cy - r - 2); y <= cy + r + 2; y++) {
      for (let x = Math.floor(cx - r - 2); x <= cx + r + 2; x++) {
        const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (d <= r + (rng() - 0.5) * rough) this.px(x, y, color);
      }
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: string): void {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.px(x, y, color);
      }
    }
  }

  /** Contorno externo automático: pixel vazio vizinho de pixel opaco. */
  outline(color: string): void {
    const img = this.ctx.getImageData(0, 0, this.w, this.h);
    const a = (x: number, y: number) =>
      x >= 0 && y >= 0 && x < this.w && y < this.h ? img.data[(y * this.w + x) * 4 + 3] : 0;
    const toPaint: [number, number][] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (a(x, y) > 0) continue;
        if (a(x - 1, y) > 60 || a(x + 1, y) > 60 || a(x, y - 1) > 60 || a(x, y + 1) > 60) {
          toPaint.push([x, y]);
        }
      }
    }
    for (const [x, y] of toPaint) this.px(x, y, color);
  }

  texture(): Texture {
    return Texture.from(this.canvas);
  }
}

// ──────────────────────────────────────────────────────────────────────
// Terreno
// ──────────────────────────────────────────────────────────────────────

function makeGrass(seed: number, flowers: boolean): Texture {
  const rng = mulberry32(seed);
  const p = new Px(32, 32);
  p.fill(PAL.grassBase);
  // manchas orgânicas suaves (2x2 / 3x2) em tons próximos — textura sem "chuvisco"
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(rng() * 31);
    const y = Math.floor(rng() * 31);
    const c = rng() < 0.55 ? PAL.grassDark : PAL.grassMid;
    p.rect(x, y, rng() < 0.5 ? 2 : 3, rng() < 0.6 ? 2 : 1, c);
  }
  // pontos de respiro (poucos)
  for (let i = 0; i < 14; i++) {
    p.px(Math.floor(rng() * 32), Math.floor(rng() * 32), rng() < 0.7 ? PAL.grassMid : PAL.grassDark);
  }
  // tufos de capim discretos
  for (let i = 0; i < 5; i++) {
    const x = 2 + Math.floor(rng() * 28);
    const y = 2 + Math.floor(rng() * 28);
    p.px(x, y, PAL.grassLight);
    p.px(x, y + 1, PAL.grassMid);
    if (rng() < 0.4) p.px(x + 1, y, PAL.grassLight);
  }
  if (flowers) {
    for (let i = 0; i < 3; i++) {
      const x = 3 + Math.floor(rng() * 26);
      const y = 3 + Math.floor(rng() * 26);
      p.px(x, y, rng() < 0.5 ? PAL.flowerGold : PAL.flowerWhite);
      p.px(x, y + 1, PAL.grassDark);
    }
  }
  return p.texture();
}

function makeDirt(seed: number): Texture {
  const rng = mulberry32(seed);
  const p = new Px(32, 32);
  p.fill(PAL.dirtBase);
  for (let i = 0; i < 110; i++) {
    const x = Math.floor(rng() * 32);
    const y = Math.floor(rng() * 32);
    const r = rng();
    p.px(x, y, r < 0.4 ? PAL.dirtDark : r < 0.8 ? PAL.dirtMid : PAL.dirtLight);
  }
  // pedrinhas
  for (let i = 0; i < 6; i++) {
    const x = 2 + Math.floor(rng() * 27);
    const y = 2 + Math.floor(rng() * 27);
    p.rect(x, y, 2, 1, PAL.dirtStone);
    p.px(x, y + 1, PAL.dirtDark);
  }
  return p.texture();
}

function makeStoneFloor(seed: number): Texture {
  const rng = mulberry32(seed);
  const p = new Px(32, 32);
  p.fill(PAL.stoneBase);
  // lajotas 16x16 em "running bond"
  for (let row = 0; row < 2; row++) {
    const offset = row % 2 === 0 ? 0 : 8;
    for (let col = -1; col < 3; col++) {
      const x = col * 16 + offset;
      const y = row * 16;
      // variação de tom por lajota (mais contraste entre peças)
      const tone = rng();
      if (tone < 0.3) p.rect(x + 1, y + 1, 15, 15, PAL.stoneMid);
      else if (tone < 0.5) p.rect(x + 1, y + 1, 15, 15, "#3d434e");
      else if (tone > 0.82) p.rect(x + 1, y + 1, 15, 15, "#4c5360");
      // junta + highlight superior
      p.rect(x, y, 16, 1, PAL.stoneDark);
      p.rect(x, y, 1, 16, PAL.stoneDark);
      p.rect(x + 1, y + 1, 14, 1, PAL.stoneLight);
      // canto inferior na sombra (profundidade)
      p.rect(x + 1, y + 15, 15, 1, "#373d47");
    }
  }
  // rachaduras e desgaste
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(rng() * 32);
    const y = Math.floor(rng() * 32);
    p.px(x, y, rng() < 0.5 ? PAL.stoneCrack : PAL.stoneLight);
  }
  return p.texture();
}

function makeWaterFrames(): Texture[] {
  const frames: Texture[] = [];
  for (let f = 0; f < 3; f++) {
    const p = new Px(32, 32);
    p.fill(PAL.waterBase);
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const w1 = Math.sin((x + y * 2.7 + f * 3.4) * 0.55);
        const w2 = Math.sin((x * 0.8 - y * 1.3 - f * 2.6) * 0.4);
        if (w1 > 0.82) p.px(x, y, PAL.waterMid);
        if (w1 > 0.96) p.px(x, y, PAL.waterLight);
        if (w2 > 0.93 && w1 > 0.4) p.px(x, y, PAL.waterDark);
      }
    }
    // brilhos pontuais
    const rng = mulberry32(900 + f);
    for (let i = 0; i < 4; i++) {
      const x = 2 + Math.floor(rng() * 27);
      const y = 2 + Math.floor(rng() * 27);
      p.rect(x, y, 2, 1, PAL.waterFoam);
    }
    frames.push(p.texture());
  }
  return frames;
}

// ──────────────────────────────────────────────────────────────────────
// Objetos do mundo
// ──────────────────────────────────────────────────────────────────────

function makeTree(seed: number): Texture {
  const rng = mulberry32(seed);
  const p = new Px(32, 64);
  // sombra no chão
  p.ellipse(16, 57, 11, 4, "rgba(0,0,0,0.30)");
  // tronco
  p.rect(13, 38, 6, 18, PAL.trunkBase);
  p.rect(13, 38, 2, 18, PAL.trunkLight);
  p.rect(12, 52, 8, 4, PAL.trunkBase);
  p.px(11, 55, PAL.trunkDark);
  p.px(20, 55, PAL.trunkDark);
  for (let i = 0; i < 6; i++) {
    p.px(14 + Math.floor(rng() * 4), 40 + Math.floor(rng() * 14), PAL.trunkDark);
  }
  // copa — camadas de blobs (escuro → claro, luz vindo de cima/esquerda)
  p.blob(16, 30, 9, PAL.canopyDark, rng);
  p.blob(9, 25, 7, PAL.canopyDark, rng);
  p.blob(23, 25, 7, PAL.canopyDark, rng);
  p.blob(16, 18, 9, PAL.canopyDark, rng);
  p.blob(15, 17, 8, PAL.canopyBase, rng);
  p.blob(10, 24, 5, PAL.canopyBase, rng);
  p.blob(22, 23, 5, PAL.canopyBase, rng);
  p.blob(13, 15, 6, PAL.canopyMid, rng);
  p.blob(11, 21, 3, PAL.canopyMid, rng);
  p.blob(12, 13, 4, PAL.canopyLight, rng);
  for (let i = 0; i < 10; i++) {
    const x = 6 + Math.floor(rng() * 16);
    const y = 9 + Math.floor(rng() * 14);
    p.px(x, y, PAL.canopyGlint);
  }
  p.outline(PAL.outline);
  return p.texture();
}

function makeRock(seed: number): Texture {
  const rng = mulberry32(seed);
  const p = new Px(32, 32);
  p.ellipse(16, 27, 9, 3, "rgba(0,0,0,0.30)");
  p.blob(16, 20, 8, PAL.rockBase, rng);
  p.blob(15, 18, 7, PAL.rockMid, rng);
  p.blob(13, 15, 4, PAL.rockTop, rng);
  // rachaduras
  for (let i = 0; i < 5; i++) {
    p.px(10 + Math.floor(rng() * 12), 14 + Math.floor(rng() * 10), PAL.stoneCrack);
  }
  p.outline(PAL.outline);
  return p.texture();
}

function makeWall(seed: number): Texture {
  const rng = mulberry32(seed);
  const p = new Px(32, 44);
  // topo (superfície vista de cima) — claro, pega "luz"
  p.rect(0, 0, 32, 12, PAL.wallTop);
  p.rect(0, 0, 32, 2, PAL.wallTopLight);
  for (let i = 0; i < 16; i++) {
    p.px(Math.floor(rng() * 32), 2 + Math.floor(rng() * 9), rng() < 0.5 ? PAL.wallTopLight : "#49525f");
  }
  // beirada do topo marcada (separa topo da face)
  p.rect(0, 10, 32, 1, "#1a1e26");
  p.rect(0, 11, 32, 1, "#0e1117");
  // face frontal: fileiras de blocos, BEM mais escura que o topo
  for (let row = 0; row < 4; row++) {
    const y = 12 + row * 8;
    const offset = row % 2 === 0 ? 0 : 8;
    for (let col = -1; col < 3; col++) {
      const x = col * 16 + offset;
      const shade = 1 - row * 0.18;
      const base = Math.floor(44 * shade);
      p.rect(x + 1, y + 1, 15, 7, `rgb(${base},${base + 6},${base + 15})`);
      // brilho só no topo de cada bloco, sutil
      p.rect(x + 1, y + 1, 15, 1, `rgb(${base + 10},${base + 16},${base + 26})`);
      p.rect(x, y, 16, 1, "#0c0f15");
      p.rect(x, y, 1, 8, "#0c0f15");
      // lascas/desgaste por bloco
      if (rng() < 0.5) p.px(x + 2 + Math.floor(rng() * 12), y + 2 + Math.floor(rng() * 5), "#0c0f15");
    }
  }
  // base na sombra
  p.rect(0, 40, 32, 4, "rgba(0,0,0,0.35)");
  return p.texture();
}

function makeTorchFrames(): Texture[] {
  const frames: Texture[] = [];
  for (let f = 0; f < 3; f++) {
    const rng = mulberry32(500 + f * 7);
    const p = new Px(32, 40);
    // base de pedra
    p.rect(13, 35, 7, 3, PAL.stoneMid);
    p.rect(13, 35, 7, 1, PAL.stoneLight);
    // poste
    p.rect(15, 14, 3, 22, PAL.woodPost);
    p.rect(15, 14, 1, 22, PAL.woodPostLight);
    // braçadeira
    p.rect(14, 14, 5, 2, PAL.metal);
    // chama (oscila por frame)
    const fx = 16 + (f === 1 ? -1 : f === 2 ? 1 : 0);
    const h = f === 1 ? 9 : 8;
    p.ellipse(fx, 9, 3, Math.floor(h / 2) + 1, PAL.flameEdge);
    p.ellipse(fx, 10, 2, 3, PAL.flameBody);
    p.rect(fx - 1, 9, 2, 3, PAL.flameCore);
    // faíscas
    for (let i = 0; i < 2; i++) {
      p.px(fx - 3 + Math.floor(rng() * 6), 3 + Math.floor(rng() * 4), PAL.flameBody);
    }
    p.outline(PAL.outline);
    frames.push(p.texture());
  }
  return frames;
}

// ──────────────────────────────────────────────────────────────────────
// Personagem — cavaleiro com capa, 4 direções × 3 frames
// ──────────────────────────────────────────────────────────────────────

/**
 * Cores de uma skin do cavaleiro: ramp da armadura + capa + visor.
 * Espada e escudo NÃO mudam com a skin — são os ITENS equipados (skin de
 * item, se existir um dia, é outro sistema). Catálogo de ids em shared/skins.ts.
 */
interface KnightSkin {
  shadow: string;
  dark: string;
  base: string;
  light: string;
  edge: string;
  shine: string;
  capeDark: string;
  capeBase: string;
  capeLight: string;
  visor: string;
  /** Brasa dentro da fresta (olhos brilhando — assinatura da Vigília Negra). */
  ember?: string;
}

/** Visual de cada skin do catálogo (`shared/skins.ts`) — skins são DADOS. */
const KNIGHT_SKIN_COLORS: Record<string, KnightSkin> = {
  padrao: {
    shadow: PAL.armorShadow,
    dark: PAL.armorDark,
    base: PAL.armorBase,
    light: PAL.armorLight,
    edge: PAL.armorEdge,
    shine: PAL.armorShine,
    capeDark: PAL.capeDark,
    capeBase: PAL.capeBase,
    capeLight: PAL.capeLight,
    visor: PAL.visorSlit,
  },
  dourado: {
    shadow: PAL.goldShadow,
    dark: PAL.goldDark,
    base: PAL.goldBase,
    light: PAL.goldLight,
    edge: PAL.goldEdge,
    shine: PAL.goldShine,
    capeDark: PAL.capeRoyalDark,
    capeBase: PAL.capeRoyalBase,
    capeLight: PAL.capeRoyalLight,
    visor: PAL.visorSlit,
  },
  sombrio: {
    shadow: PAL.onyxShadow,
    dark: PAL.onyxDark,
    base: PAL.onyxBase,
    light: PAL.onyxLight,
    edge: PAL.onyxEdge,
    shine: PAL.onyxShine,
    capeDark: PAL.capeNightDark,
    capeBase: PAL.capeNightBase,
    capeLight: PAL.capeNightLight,
    visor: PAL.visorSlit,
    ember: PAL.visorEmber,
  },
};

/**
 * frame 0 = parado, frames 1/2 = passos (pernas alternadas, corpo com bob).
 * Desenhado de frente (s), costas (n) e perfil (e); oeste = flip de leste.
 *
 * Direção de arte: elmo fechado com fresta em T (a silhueta É o cavaleiro),
 * escudo de madeira no braço esquerdo + espada no direito (o kit inicial),
 * zero pele exposta. Luz global do topo-esquerda: colunas esquerdas claras,
 * direitas escuras; selout interno (segmentação em sk.shadow, não preto).
 */
function drawKnight(p: Px, facing: Exclude<Facing, "w">, frame: number, sk: KnightSkin): void {
  const bob = frame === 0 ? 0 : -1;

  /** Elmo visto de frente/costas (x12–20, y5–12 + bob). */
  const helmFrontBack = (withVisor: boolean): void => {
    p.rect(14, 5 + bob, 5, 1, sk.edge); // topo arredondado (passos 5-7-9)
    p.rect(13, 6 + bob, 7, 1, sk.light);
    p.px(16, 5 + bob, sk.shine); // specular no topo
    for (let y = 7 + bob; y <= 10 + bob; y++) {
      p.rect(12, y, 2, 1, sk.light); // lado esquerdo lit
      p.rect(14, y, 5, 1, sk.base);
      p.rect(19, y, 2, 1, sk.dark); // lado direito sombra
    }
    if (withVisor) {
      // fresta em T: rasgo horizontal + canal vertical (buraco, quase-preto)
      p.rect(13, 8 + bob, 7, 1, sk.visor);
      p.rect(16, 9 + bob, 1, 2, sk.visor);
      if (sk.ember) {
        // olhos em brasa dentro da fresta (assinatura da Vigília Negra)
        p.px(14, 8 + bob, sk.ember);
        p.px(18, 8 + bob, sk.ember);
      }
    } else {
      // costas: crista central pegando luz
      p.rect(16, 6 + bob, 1, 5, sk.edge);
    }
    p.rect(12, 11 + bob, 2, 1, sk.base);
    p.rect(14, 11 + bob, 5, 1, sk.dark); // queixo na sombra
    p.rect(19, 11 + bob, 2, 1, sk.shadow);
    p.rect(13, 12 + bob, 7, 1, sk.shadow); // gola
  };

  /** Pauldrons largos (a base do triângulo). vy = deslocamento vertical. */
  const pauldrons = (): void => {
    p.rect(9, 13 + bob, 3, 1, sk.edge);
    p.rect(9, 14 + bob, 3, 1, sk.light);
    p.rect(9, 15 + bob, 2, 1, sk.base);
    p.rect(20, 13 + bob, 3, 1, sk.light);
    p.rect(20, 14 + bob, 3, 1, sk.base);
    p.rect(21, 15 + bob, 2, 1, sk.dark);
  };

  /** Pernas frente/costas com passo alternado. */
  const legsFrontBack = (): void => {
    const leftUp = frame === 1 ? 1 : 0;
    const rightUp = frame === 2 ? 1 : 0;
    p.rect(12, 23 - leftUp, 3, 4, PAL.pants);
    p.rect(12, 27 - leftUp, 3, 2, PAL.boots);
    p.rect(12, 29 - leftUp, 3, 1, PAL.bootsDark);
    p.rect(17, 23 - rightUp, 3, 4, PAL.pants);
    p.rect(17, 27 - rightUp, 3, 2, PAL.boots);
    p.rect(17, 29 - rightUp, 3, 1, PAL.bootsDark);
  };

  if (facing === "s") {
    legsFrontBack();
    // ── capa: borda direita atrás do braço da espada ──
    p.rect(22, 14 + bob, 1, 8, sk.capeDark);
    // ── torso (x11–21): esquerda lit → direita sombra ──
    p.rect(13, 14 + bob, 6, 1, sk.edge); // peitoral superior
    for (let y = 15 + bob; y <= 20 + bob; y++) {
      p.rect(11, y, 2, 1, sk.light);
      p.rect(13, y, 6, 1, sk.base);
      p.rect(19, y, 3, 1, sk.dark);
    }
    p.rect(13, 15 + bob, 2, 2, sk.light); // volume do peito (conectado ao lado lit)
    p.rect(11, 21 + bob, 11, 1, PAL.belt);
    p.rect(15, 21 + bob, 2, 1, PAL.buckle);
    p.rect(11, 22 + bob, 11, 1, sk.shadow); // tassets
    helmFrontBack(true);
    pauldrons();
    // ── braço direito + espada apontando para baixo ──
    const armSwing = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    p.rect(21, 15 + bob + armSwing, 2, 4, sk.dark);
    p.rect(21, 19 + bob + armSwing, 2, 1, sk.shadow); // manopla
    p.rect(21, 20 + bob + armSwing, 3, 1, PAL.buckle); // guarda
    p.rect(22, 21 + bob + armSwing, 1, 6, PAL.swordBlade);
    p.px(22, 27 + bob + armSwing, PAL.swordDark); // ponta
    // ── escudo de madeira no braço esquerdo (cobre o braço) ──
    p.rect(7, 15 + bob, 3, 1, PAL.shieldWoodLight);
    for (let y = 16 + bob; y <= 19 + bob; y++) {
      p.px(6, y, PAL.shieldWoodLight);
      p.rect(7, y, 3, 1, PAL.shieldWood);
      p.px(10, y, PAL.shieldWoodDark);
    }
    p.rect(7, 20 + bob, 3, 1, PAL.shieldWood);
    p.rect(7, 21 + bob, 3, 1, PAL.shieldWoodDark);
    p.rect(8, 22 + bob, 1, 1, PAL.shieldWoodDark); // ponta do escudo
    p.rect(8, 17 + bob, 1, 1, sk.shine); // umbo de metal
    p.px(8, 18 + bob, sk.dark);
    return;
  }

  if (facing === "n") {
    legsFrontBack();
    // ── capa cobre o corpo (o acento de cor do jogo) ──
    p.rect(10, 13 + bob, 12, 2, sk.capeLight);
    p.rect(10, 15 + bob, 12, 6, sk.capeBase);
    p.rect(10, 21 + bob, 12, 3, sk.capeDark);
    // dobras verticais (clusters intencionais)
    p.rect(13, 15 + bob, 1, 6, sk.capeDark);
    p.rect(18, 15 + bob, 1, 6, sk.capeDark);
    p.px(10, 23 + bob, sk.capeDark);
    p.px(21, 23 + bob, sk.capeDark);
    helmFrontBack(false);
    pauldrons();
    // ── escudo pendurado: borda aparece no lado direito (braço esq. do char) ──
    p.rect(22, 14 + bob, 1, 7, PAL.shieldWood);
    p.px(22, 14 + bob, PAL.shieldWoodLight);
    p.px(22, 20 + bob, PAL.shieldWoodDark);
    // ── punho da espada acima do quadril esquerdo (lado do viewer) ──
    p.px(9, 17 + bob, PAL.buckle); // pomo
    p.rect(9, 18 + bob, 1, 2, PAL.shieldRim); // bainha
    return;
  }

  // ── EAST (perfil, andando para a direita) ──
  const stride = frame === 1 ? 2 : frame === 2 ? -2 : 0;
  // perna de trás / da frente
  p.rect(13 - stride, 23, 3, 4, PAL.pants);
  p.rect(13 - stride, 27, 3, 2, PAL.boots);
  p.rect(13 - stride, 29, 3, 1, PAL.bootsDark);
  p.rect(16 + stride, 23, 3, 4, PAL.pants);
  p.rect(16 + stride, 27, 3, 2, PAL.boots);
  p.rect(16 + stride, 29, 3, 1, PAL.bootsDark);
  // ── capa esvoaçando atrás ──
  p.rect(10, 13 + bob, 2, 2, sk.capeLight);
  p.rect(10, 15 + bob, 2, 6, sk.capeBase);
  p.rect(9, 18 + bob, 1, 4, sk.capeDark);
  p.rect(10, 21 + bob, 2, 2, sk.capeDark);
  // ── torso (x12–19): costas lit (luz vem de trás-esquerda) ──
  p.rect(13, 14 + bob, 5, 1, sk.edge);
  for (let y = 15 + bob; y <= 20 + bob; y++) {
    p.rect(12, y, 2, 1, sk.light);
    p.rect(14, y, 4, 1, sk.base);
    p.rect(18, y, 2, 1, sk.dark);
  }
  p.rect(12, 21 + bob, 8, 1, PAL.belt);
  p.px(15, 21 + bob, PAL.buckle);
  p.rect(12, 22 + bob, 8, 1, sk.shadow);
  // ── elmo perfil (x13–20): fresta na frente ──
  p.rect(15, 5 + bob, 4, 1, sk.edge);
  p.rect(14, 6 + bob, 6, 1, sk.light);
  p.px(16, 5 + bob, sk.shine);
  for (let y = 7 + bob; y <= 10 + bob; y++) {
    p.rect(13, y, 2, 1, sk.light);
    p.rect(15, y, 4, 1, sk.base);
    p.px(19, y, sk.dark);
  }
  p.rect(17, 8 + bob, 3, 1, sk.visor); // rasgo do visor na frente
  p.px(19, 9 + bob, sk.visor);
  if (sk.ember) p.px(18, 8 + bob, sk.ember); // brasa no perfil
  p.rect(14, 11 + bob, 6, 1, sk.dark);
  p.rect(14, 12 + bob, 5, 1, sk.shadow);
  // ── pauldron próximo ──
  p.rect(13, 13 + bob, 5, 1, sk.edge);
  p.rect(13, 14 + bob, 5, 1, sk.light);
  // ── escudo na frente (braço avançado — o knight avança atrás do escudo) ──
  p.rect(19, 14 + bob, 3, 1, PAL.shieldWoodLight);
  for (let y = 15 + bob; y <= 20 + bob; y++) {
    p.px(19, y, PAL.shieldWoodDark);
    p.rect(20, y, 2, 1, PAL.shieldWood);
    p.px(22, y, PAL.shieldWoodDark);
  }
  p.rect(20, 21 + bob, 2, 1, PAL.shieldWoodDark);
  p.px(21, 22 + bob, PAL.shieldWoodDark);
  p.px(20, 17 + bob, sk.shine); // umbo
}

function makeKnightTextures(sk: KnightSkin): Record<Facing, Texture[]> {
  const result: Partial<Record<Facing, Texture[]>> = {};
  const eastCanvases: HTMLCanvasElement[] = [];
  for (const facing of ["s", "n", "e"] as const) {
    const frames: Texture[] = [];
    for (let f = 0; f < 3; f++) {
      const p = new Px(32, 32);
      drawKnight(p, facing, f, sk);
      p.outline(PAL.outline);
      if (facing === "e") eastCanvases.push(p.canvas);
      frames.push(p.texture());
    }
    result[facing] = frames;
  }
  // west = flip horizontal de east
  result.w = eastCanvases.map((src) => {
    const p = new Px(32, 32);
    p.ctx.translate(32, 0);
    p.ctx.scale(-1, 1);
    p.ctx.drawImage(src, 0, 0);
    return p.texture();
  });
  return result as Record<Facing, Texture[]>;
}

/** Texturas do cavaleiro para TODAS as skins do catálogo (skin → facing → frames). */
function makeKnightSkinTextures(): Record<string, Record<Facing, Texture[]>> {
  const result: Record<string, Record<Facing, Texture[]>> = {};
  for (const [skinId, colors] of Object.entries(KNIGHT_SKIN_COLORS)) {
    result[skinId] = makeKnightTextures(colors);
  }
  return result;
}

// ──────────────────────────────────────────────────────────────────────
// Rato Lanhoso — família Bestial, T1 ("o primeiro sangue do jogador")
// 4 direções × 3 frames, mesmo contrato visual do cavaleiro.
// ──────────────────────────────────────────────────────────────────────

/**
 * Bicho pequeno e baixo no chão. frame 0 = parado; 1/2 = patas alternadas
 * (correria). Desenhado de frente (s), costas (n) e perfil (e); oeste = flip.
 */
function drawRat(p: Px, facing: Exclude<Facing, "w">, frame: number, rng: Rng): void {
  // corre baixinho: leve bob vertical
  const bob = frame === 0 ? 0 : frame === 1 ? -1 : 0;
  const cy = 22 + bob; // centro do corpo, perto do chão

  if (facing === "e") {
    // ── perfil ──
    // cauda fina atrás
    p.rect(7, cy, 4, 1, PAL.ratTail);
    p.px(6, cy - 1, PAL.ratTail);
    p.px(5, cy - 2, PAL.ratTail);
    // corpo (elipse achatada)
    p.ellipse(16, cy, 7, 4, PAL.ratBase);
    p.ellipse(16, cy - 1, 6, 3, PAL.ratMid);
    p.rect(13, cy - 2, 5, 1, PAL.ratLight);
    p.rect(13, cy + 2, 8, 1, PAL.ratBelly);
    // patas (alternadas)
    const f1 = frame === 1 ? 1 : 0;
    const f2 = frame === 2 ? 1 : 0;
    p.rect(12, cy + 3 + f1, 2, 2, PAL.ratBase);
    p.rect(19, cy + 3 + f2, 2, 2, PAL.ratBase);
    // cabeça à frente, focinho
    p.ellipse(23, cy, 4, 3, PAL.ratMid);
    p.px(26, cy, PAL.ratBelly); // focinho
    p.px(27, cy, PAL.outline); // narina
    p.rect(21, cy - 4, 2, 2, PAL.ratEar); // orelha
    p.px(24, cy - 1, PAL.ratEye); // olho
    return;
  }

  if (facing === "s") {
    // ── de frente: cabeça grande, orelhas, corpo atrás ──
    p.ellipse(16, cy + 1, 6, 4, PAL.ratBase);
    p.rect(11, cy + 3, 10, 1, PAL.ratBelly);
    // cabeça
    p.ellipse(16, cy - 3, 5, 4, PAL.ratMid);
    p.ellipse(16, cy - 4, 4, 3, PAL.ratLight);
    // orelhas
    p.rect(11, cy - 7, 3, 3, PAL.ratEar);
    p.rect(18, cy - 7, 3, 3, PAL.ratEar);
    p.px(12, cy - 6, PAL.ratBelly);
    p.px(19, cy - 6, PAL.ratBelly);
    // olhos + focinho
    p.px(14, cy - 3, PAL.ratEye);
    p.px(18, cy - 3, PAL.ratEye);
    p.px(16, cy - 1, PAL.outline);
    // patinhas alternadas
    const f1 = frame === 1 ? 1 : 0;
    const f2 = frame === 2 ? 1 : 0;
    p.rect(12, cy + 4 - f1, 2, 2, PAL.ratBase);
    p.rect(18, cy + 4 - f2, 2, 2, PAL.ratBase);
    return;
  }

  // ── NORTH (costas): corpo + cauda subindo, orelhas por trás ──
  p.ellipse(16, cy, 6, 4, PAL.ratBase);
  p.ellipse(16, cy - 1, 6, 3, PAL.ratMid);
  p.rect(11, cy - 3, 10, 1, PAL.ratLight);
  // orelhas
  p.rect(11, cy - 6, 3, 3, PAL.ratEar);
  p.rect(18, cy - 6, 3, 3, PAL.ratEar);
  // cauda subindo
  p.px(16, cy + 4, PAL.ratTail);
  p.px(17, cy + 5, PAL.ratTail);
  p.px(18, cy + 6, PAL.ratTail);
  const f1 = frame === 1 ? 1 : 0;
  const f2 = frame === 2 ? 1 : 0;
  p.rect(12, cy + 3 - f1, 2, 2, PAL.ratBase);
  p.rect(18, cy + 3 - f2, 2, 2, PAL.ratBase);
  // pelos eriçados ("lanhoso")
  for (let i = 0; i < 4; i++) p.px(12 + Math.floor(rng() * 9), cy - 4 - Math.floor(rng() * 2), PAL.ratLight);
}

function makeRatTextures(): Record<Facing, Texture[]> {
  const result: Partial<Record<Facing, Texture[]>> = {};
  const eastCanvases: HTMLCanvasElement[] = [];
  for (const facing of ["s", "n", "e"] as const) {
    const frames: Texture[] = [];
    for (let f = 0; f < 3; f++) {
      const rng = mulberry32(700 + f);
      const p = new Px(32, 32);
      drawRat(p, facing, f, rng);
      p.outline(PAL.outline);
      if (facing === "e") eastCanvases.push(p.canvas);
      frames.push(p.texture());
    }
    result[facing] = frames;
  }
  result.w = eastCanvases.map((src) => {
    const p = new Px(32, 32);
    p.ctx.translate(32, 0);
    p.ctx.scale(-1, 1);
    p.ctx.drawImage(src, 0, 0);
    return p.texture();
  });
  return result as Record<Facing, Texture[]>;
}

// ──────────────────────────────────────────────────────────────────────
// Utilitários visuais
// ──────────────────────────────────────────────────────────────────────

/** Marcador de alvo estilo Tibia: quadrado vermelho de cantos (sobre o mob). */
function makeTargetMarker(): Texture {
  const p = new Px(32, 32);
  const c = "#d83a3a";
  const s = "rgba(0,0,0,0.6)";
  for (const [ox, oy, dx, dy] of [
    [1, 1, 1, 1],
    [30, 1, -1, 1],
    [1, 30, 1, -1],
    [30, 30, -1, -1],
  ] as const) {
    for (let i = 0; i < 8; i++) {
      p.px(ox + dx * i, oy, c);
      p.px(ox, oy + dy * i, c);
      p.px(ox + dx * i, oy + dy, s);
      p.px(ox + dx, oy + dy * i, s);
    }
  }
  return p.texture();
}

/** Gradiente radial para as luzes (branco → transparente, falloff suave). */
function makeLightTexture(): Texture {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(0.7, "rgba(255,255,255,0.18)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(c);
}

/** Cursor de tile (cantos em L). */
function makeTileCursor(): Texture {
  const p = new Px(32, 32);
  const c = "rgba(232,217,168,0.95)";
  const s = "rgba(0,0,0,0.5)";
  for (const [ox, oy, dx, dy] of [
    [0, 0, 1, 1],
    [31, 0, -1, 1],
    [0, 31, 1, -1],
    [31, 31, -1, -1],
  ] as const) {
    for (let i = 0; i < 7; i++) {
      p.px(ox + dx * i, oy, c);
      p.px(ox, oy + dy * i, c);
      p.px(ox + dx * i, oy + dy, s);
      p.px(ox + dx, oy + dy * i, s);
    }
  }
  return p.texture();
}

/** Sombra elíptica para entidades. */
function makeShadow(): Texture {
  const p = new Px(24, 10);
  p.ellipse(12, 5, 10, 4, "rgba(0,0,0,0.35)");
  return p.texture();
}

// ──────────────────────────────────────────────────────────────────────
// Bundle
// ──────────────────────────────────────────────────────────────────────

export interface SpriteLibrary {
  grass: Texture[];
  grassFlowers: Texture[];
  dirt: Texture[];
  stoneFloor: Texture[];
  waterFrames: Texture[];
  trees: Texture[];
  rocks: Texture[];
  wall: Texture;
  torchFrames: Texture[];
  /** Cavaleiro por SKIN (catálogo em shared/skins.ts): skin → facing → frames. */
  knight: Record<string, Record<Facing, Texture[]>>;
  rat: Record<Facing, Texture[]>;
  light: Texture;
  tileCursor: Texture;
  targetMarker: Texture;
  shadow: Texture;
}

export function createSprites(): SpriteLibrary {
  return {
    grass: [makeGrass(11, false), makeGrass(22, false), makeGrass(33, false), makeGrass(44, false)],
    grassFlowers: [makeGrass(55, true), makeGrass(66, true)],
    dirt: [makeDirt(10), makeDirt(20), makeDirt(30)],
    stoneFloor: [makeStoneFloor(7), makeStoneFloor(14), makeStoneFloor(21)],
    waterFrames: makeWaterFrames(),
    trees: [makeTree(101), makeTree(202), makeTree(303)],
    rocks: [makeRock(401), makeRock(402)],
    wall: makeWall(500),
    torchFrames: makeTorchFrames(),
    knight: makeKnightSkinTextures(),
    rat: makeRatTextures(),
    light: makeLightTexture(),
    tileCursor: makeTileCursor(),
    targetMarker: makeTargetMarker(),
    shadow: makeShadow(),
  };
}
