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
 * frame 0 = parado, frames 1/2 = passos (pernas alternadas, corpo com bob).
 * Desenhado de frente (s), costas (n) e perfil (e); oeste = flip de leste.
 */
function drawKnight(p: Px, facing: Exclude<Facing, "w">, frame: number): void {
  const bob = frame === 0 ? 0 : -1;

  if (facing === "s" || facing === "n") {
    // ── pernas/botas ──
    const leftUp = frame === 1 ? 1 : 0;
    const rightUp = frame === 2 ? 1 : 0;
    // perna esquerda
    p.rect(12, 24 - leftUp, 3, 4, PAL.pants);
    p.rect(12, 27 - leftUp, 3, 2, PAL.boots);
    p.rect(12, 29 - leftUp, 3, 1, PAL.bootsDark);
    // perna direita
    p.rect(17, 24 - rightUp, 3, 4, PAL.pants);
    p.rect(17, 27 - rightUp, 3, 2, PAL.boots);
    p.rect(17, 29 - rightUp, 3, 1, PAL.bootsDark);

    if (facing === "s") {
      // ── capa atrás (bordas visíveis) ──
      p.rect(10, 14 + bob, 1, 9, PAL.capeDark);
      p.rect(21, 14 + bob, 1, 9, PAL.capeDark);
      // ── torso ──
      p.rect(11, 13 + bob, 10, 10, PAL.armorBase);
      p.rect(12, 14 + bob, 5, 5, PAL.armorLight);
      p.rect(11, 13 + bob, 10, 1, PAL.armorEdge);
      // cinto
      p.rect(11, 22 + bob, 10, 1, PAL.belt);
      p.rect(15, 22 + bob, 2, 1, PAL.buckle);
      // ── braços ──
      const armL = frame === 1 ? 1 : frame === 2 ? -1 : 0;
      p.rect(9, 15 + bob + armL, 2, 7, PAL.armorDark);
      p.rect(9, 21 + bob + armL, 2, 2, PAL.skin);
      p.rect(21, 15 + bob - armL, 2, 7, PAL.armorDark);
      p.rect(21, 21 + bob - armL, 2, 2, PAL.skin);
      // pauldrons
      p.rect(9, 13 + bob, 3, 2, PAL.armorLight);
      p.rect(20, 13 + bob, 3, 2, PAL.armorLight);
      // ── cabeça ──
      p.rect(12, 6 + bob, 8, 7, PAL.skin);
      p.rect(12, 11 + bob, 8, 1, PAL.skinShade);
      p.rect(12, 4 + bob, 8, 3, PAL.hair);
      p.px(11, 6 + bob, PAL.hair);
      p.px(20, 6 + bob, PAL.hair);
      p.px(11, 7 + bob, PAL.hair);
      p.px(20, 7 + bob, PAL.hair);
      // olhos
      p.rect(14, 9 + bob, 1, 1, "#20242e");
      p.rect(18, 9 + bob, 1, 1, "#20242e");
    } else {
      // ── NORTH: capa cobre o corpo ──
      p.rect(10, 13 + bob, 12, 11, PAL.capeBase);
      p.rect(10, 13 + bob, 12, 2, PAL.capeLight);
      p.rect(10, 20 + bob, 12, 4, PAL.capeDark);
      p.px(11, 23 + bob, PAL.capeBase);
      p.px(20, 23 + bob, PAL.capeBase);
      // ombros de armadura aparecendo
      p.rect(9, 13 + bob, 3, 2, PAL.armorLight);
      p.rect(20, 13 + bob, 3, 2, PAL.armorLight);
      // cabeça por trás (cabelo)
      p.rect(12, 5 + bob, 8, 8, PAL.hair);
      p.rect(12, 5 + bob, 8, 2, "#403228");
      p.rect(12, 12 + bob, 8, 1, PAL.skinShade);
    }
    return;
  }

  // ── EAST (perfil) ──
  const stride = frame === 1 ? 2 : frame === 2 ? -2 : 0;
  // perna de trás
  p.rect(13 - stride, 24, 3, 4, PAL.pants);
  p.rect(13 - stride, 27, 3, 2, PAL.boots);
  p.rect(13 - stride, 29, 3, 1, PAL.bootsDark);
  // perna da frente
  p.rect(16 + stride, 24, 3, 4, PAL.pants);
  p.rect(16 + stride, 27, 3, 2, PAL.boots);
  p.rect(16 + stride, 29, 3, 1, PAL.bootsDark);
  // capa esvoaçando atrás
  p.rect(10, 13 + bob, 3, 10, PAL.capeBase);
  p.rect(10, 13 + bob, 1, 10, PAL.capeDark);
  p.px(9, 21 + bob, PAL.capeDark);
  // torso
  p.rect(12, 13 + bob, 8, 10, PAL.armorBase);
  p.rect(13, 14 + bob, 4, 5, PAL.armorLight);
  p.rect(12, 13 + bob, 8, 1, PAL.armorEdge);
  p.rect(12, 22 + bob, 8, 1, PAL.belt);
  // braço (balança oposto às pernas)
  const armSwing = frame === 1 ? -1 : frame === 2 ? 1 : 0;
  p.rect(14 + armSwing, 15 + bob, 3, 7, PAL.armorDark);
  p.rect(14 + armSwing, 21 + bob, 3, 2, PAL.skin);
  // pauldron
  p.rect(13, 13 + bob, 4, 2, PAL.armorLight);
  // cabeça perfil
  p.rect(13, 6 + bob, 7, 7, PAL.skin);
  p.rect(13, 4 + bob, 7, 3, PAL.hair);
  p.rect(12, 5 + bob, 2, 6, PAL.hair);
  p.px(20, 8 + bob, PAL.skinShade); // nariz
  p.rect(17, 9 + bob, 1, 1, "#20242e"); // olho
}

function makeKnightTextures(): Record<Facing, Texture[]> {
  const result: Partial<Record<Facing, Texture[]>> = {};
  const eastCanvases: HTMLCanvasElement[] = [];
  for (const facing of ["s", "n", "e"] as const) {
    const frames: Texture[] = [];
    for (let f = 0; f < 3; f++) {
      const p = new Px(32, 32);
      drawKnight(p, facing, f);
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
  knight: Record<Facing, Texture[]>;
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
    knight: makeKnightTextures(),
    rat: makeRatTextures(),
    light: makeLightTexture(),
    tileCursor: makeTileCursor(),
    targetMarker: makeTargetMarker(),
    shadow: makeShadow(),
  };
}
