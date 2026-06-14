/**
 * VFX procedural de skill — bola de fogo, explosão e congêneres por ELEMENTO.
 * Decisão de arte (jun/2026): efeitos de magia = NOISE ADITIVO procedural (NÃO
 * PixelLab, NÃO spritesheet) — validado lado-a-lado no `vfx-lab.html`.
 *
 * Motor: um campo de VALUE-NOISE (fbm) mapeado numa RAMPA POR ELEMENTO
 * (transparente → tom escuro do elemento → médio → claro → núcleo quente),
 * rolando pra cima (a chama/sopro sobe). Recolor por elemento = trocar a rampa.
 * Tudo é desenhado em canvas 2D, virado Texture e exibido com blendMode "add".
 *
 * APRESENTAÇÃO pura — nenhuma regra de jogo. O `EntityRenderer` é o consumidor.
 */
import { Texture } from "pixi.js";
import type { DamageType } from "../../shared/types";

/** Elementos que ganham VFX de glow aditivo (físico/sangue ficam no caminho antigo). */
export type VfxElement = "fire" | "ice" | "holy" | "lightning" | "earth" | "death" | "poison" | "arcane";

/** Mapeia o tipo de dano da skill no elemento de VFX (ou null = sem glow procedural). */
export function vfxElementOf(damageType?: DamageType): VfxElement | null {
  switch (damageType) {
    case "fire": case "ice": case "holy": case "lightning":
    case "earth": case "death": case "poison": case "arcane":
      return damageType;
    default:
      return null; // physical / bleed / cura → mantêm a apresentação atual
  }
}

// ── Rampas por elemento (t, r, g, b, a) — luz quente/saturada no topo, escuro
//    dessaturado embaixo; piso transparente em t≤~0.18 (regra de ofício da cadeira). ──
type Stop = [number, number, number, number, number];
const RAMPS: Record<VfxElement, Stop[]> = {
  fire: [[0.18, 60, 10, 6, 90], [0.34, 150, 28, 12, 205], [0.50, 224, 66, 30, 255], [0.66, 255, 120, 40, 255], [0.80, 255, 171, 74, 255], [0.90, 255, 231, 154, 255], [1, 255, 253, 240, 255]],
  ice: [[0.18, 18, 40, 86, 90], [0.36, 32, 90, 170, 200], [0.55, 70, 170, 224, 255], [0.74, 150, 224, 245, 255], [0.90, 210, 245, 255, 255], [1, 245, 253, 255, 255]],
  holy: [[0.18, 90, 60, 16, 90], [0.36, 180, 130, 40, 205], [0.55, 240, 200, 80, 255], [0.74, 255, 224, 130, 255], [0.90, 255, 240, 190, 255], [1, 255, 253, 235, 255]],
  lightning: [[0.18, 70, 66, 20, 90], [0.36, 150, 140, 44, 200], [0.55, 210, 200, 70, 255], [0.74, 234, 226, 120, 255], [0.88, 245, 242, 180, 255], [1, 255, 255, 235, 255]],
  earth: [[0.20, 40, 28, 14, 90], [0.40, 90, 64, 32, 200], [0.58, 150, 110, 60, 245], [0.76, 190, 150, 90, 255], [0.92, 214, 182, 120, 255], [1, 232, 206, 150, 255]],
  death: [[0.18, 30, 16, 40, 100], [0.36, 70, 38, 96, 205], [0.55, 120, 70, 170, 255], [0.74, 160, 110, 210, 255], [0.90, 200, 160, 235, 255], [1, 228, 205, 245, 255]],
  poison: [[0.18, 18, 40, 14, 100], [0.38, 40, 96, 30, 205], [0.56, 90, 170, 60, 255], [0.74, 140, 210, 90, 255], [0.90, 200, 240, 150, 255], [1, 228, 250, 200, 255]],
  arcane: [[0.18, 40, 16, 64, 100], [0.36, 96, 40, 160, 210], [0.55, 150, 80, 210, 255], [0.74, 184, 120, 232, 255], [0.90, 222, 180, 245, 255], [1, 244, 224, 255, 255]],
};

type RGBA = [number, number, number, number];
function rampAt(stops: Stop[], t: number): RGBA {
  if (t <= stops[0][0]) return [0, 0, 0, 0];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const a = stops[i - 1], b = stops[i];
      const k = (t - a[0]) / (b[0] - a[0]);
      return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k, a[4] + (b[4] - a[4]) * k];
    }
  }
  const e = stops[stops.length - 1];
  return [e[1], e[2], e[3], e[4]];
}

// ── Value-noise (fbm) seedável ────────────────────────────────────────────────
function makeFbm(seed: number): (x: number, y: number) => number {
  const G = 64;
  const grid = new Float32Array(G * G);
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296);
  for (let i = 0; i < G * G; i++) grid[i] = rnd();
  const at = (xi: number, yi: number) => grid[((yi % G) + G) % G * G + (((xi % G) + G) % G)];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = smooth(xf), v = smooth(yf);
    const a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1);
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  };
  return (x, y) => {
    let f = 0, amp = 0.5, fr = 1;
    for (let o = 0; o < 4; o++) { f += noise(x * fr, y * fr) * amp; amp *= 0.5; fr *= 2; }
    return f;
  };
}
const FBM = makeFbm(1337);

// ── Bake de frames ────────────────────────────────────────────────────────────
type DrawFn = (data: Uint8ClampedArray, size: number, t: number) => void;
function bakeFrames(n: number, size: number, draw: DrawFn): Texture[] {
  const out: Texture[] = [];
  for (let f = 0; f < n; f++) {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;
    const img = ctx.createImageData(size, size);
    draw(img.data, size, f / n);
    ctx.putImageData(img, 0, 0);
    const tex = Texture.from(c);
    tex.source.scaleMode = "linear"; // glow aditivo: suave ao escalar (não é pixel art)
    out.push(tex);
  }
  return out;
}

/** Projétil: blob elíptico com cauda afilada pra cima, noise subindo (loop). */
function projectileDraw(stops: Stop[], res: number): DrawFn {
  return (data, size, t) => {
    const cx = size / 2, cy = size * 0.52, R = size * 0.42;
    const scroll = t * res * 0.9;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - cx) / R, dy = (y - cy) / R;
        const taper = dy < 0 ? 1.5 : 1.05; // afilado no topo
        const shape = 1 - (dx * dx + (dy * taper) * (dy * taper));
        const n = FBM(x * 0.10, y * 0.10 - scroll * 0.10);
        const inten = Math.max(0, Math.min(1, shape * 1.25 + (n - 0.5) * 1.5));
        const [r, g, b, a] = rampAt(stops, inten);
        const i = (y * size + x) * 4;
        data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
      }
    }
  };
}

/** Explosão: bola que cresce, sobe (cogumelo) e dissipa; flash no nascimento. */
function blastDraw(stops: Stop[], res: number): DrawFn {
  return (data, size, t) => {
    const easeOut = 1 - (1 - t) * (1 - t);
    const R = size * 0.46 * (0.35 + easeOut * 0.65);
    const cx = size / 2, cy = size * 0.66 - t * size * 0.22;
    const fade = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88;
    const flash = Math.max(0, 1 - t / 0.18);
    const scroll = t * res * 1.2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - cx) / R, dy = (y - cy) / R;
        const d = Math.sqrt(dx * dx + dy * dy * 0.9);
        const n = FBM(x * 0.09, y * 0.09 - scroll * 0.10);
        const inten = Math.max(0, Math.min(1, (1 - d) * 1.3 + (n - 0.5) * 1.7 + flash * 0.5)) * (0.4 + fade * 0.6);
        const [r, g, b, a] = rampAt(stops, inten);
        const i = (y * size + x) * 4;
        data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = Math.round(a * fade);
      }
    }
  };
}

// ── Cache lazy por elemento (bake na 1ª vez, reusa depois) ────────────────────
const PROJ_FRAMES = 24, PROJ_SIZE = 56;
const BLAST_FRAMES = 20, BLAST_SIZE = 96;
const projCache = new Map<VfxElement, Texture[]>();
const blastCache = new Map<VfxElement, Texture[]>();

/** Frames do projétil (loop de chama viajando) do elemento — cacheado. */
export function projectileFrames(el: VfxElement): Texture[] {
  let f = projCache.get(el);
  if (!f) { f = bakeFrames(PROJ_FRAMES, PROJ_SIZE, projectileDraw(RAMPS[el], PROJ_SIZE)); projCache.set(el, f); }
  return f;
}

/** Frames da explosão (one-shot: cresce, sobe, dissipa) do elemento — cacheado. */
export function blastFrames(el: VfxElement): Texture[] {
  let f = blastCache.get(el);
  if (!f) { f = bakeFrames(BLAST_FRAMES, BLAST_SIZE, blastDraw(RAMPS[el], BLAST_SIZE)); blastCache.set(el, f); }
  return f;
}

/** Todos os elementos com VFX (ordem estável p/ o lab). */
export const VFX_ELEMENTS: VfxElement[] = ["fire", "ice", "holy", "lightning", "earth", "death", "poison", "arcane"];

let _glow: Texture | null = null;
/** Disco de luz macia (clarão aditivo da explosão / núcleo do projétil). */
export function softGlow(): Texture {
  if (_glow) return _glow;
  const s = 64;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(0.5, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  _glow = Texture.from(c);
  _glow.source.scaleMode = "linear";
  return _glow;
}
