/**
 * VFX procedural de skill — uma ANIMAÇÃO TAILORED por magia (NÃO uma textura
 * recolorida pra tudo). Decisão de arte (jun/2026): noise aditivo é a técnica-BASE
 * (fogo), mas cada elemento tem PEGADA própria e a sua própria técnica:
 *
 *   fogo      → chama turbulenta (noise aditivo)        · impacto explosivo
 *   gelo      → cristal SÓLIDO (facetas duras)           · estilhaça em cacos
 *   raio      → ARCO elétrico (zigue-zague ramificado)   · descarga bifurcada
 *   terra     → PEDRAS chunky (sólidas, opacas)          · erupção + poeira
 *   sagrado   → orbe RADIANTE + cintilância (lúdico)     · florada de luz
 *   veneno    → FUMAÇA/gás (difuso, blend normal)        · nuvem que demora
 *   morte     → wisp roxo (almas subindo)                · sopro fúnebre
 *   arcano    → orbe + RUNA giratória                    · círculo mágico
 *
 * Cada técnica declara o seu próprio `additive` (fumaça/terra = blend normal;
 * fogo/raio/sagrado = aditivo). APRESENTAÇÃO pura — o `EntityRenderer` consome.
 */
import { Texture } from "pixi.js";
import type { DamageType } from "../../shared/types";

export type VfxElement = "fire" | "ice" | "holy" | "lightning" | "earth" | "death" | "poison" | "arcane";

export function vfxElementOf(damageType?: DamageType): VfxElement | null {
  switch (damageType) {
    case "fire": case "ice": case "holy": case "lightning":
    case "earth": case "death": case "poison": case "arcane":
      return damageType;
    default:
      return null; // physical / bleed / cura → mantêm a apresentação atual
  }
}

// ── Utilidades ────────────────────────────────────────────────────────────────
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296);
}

function makeFbm(seed: number): (x: number, y: number) => number {
  const G = 64;
  const grid = new Float32Array(G * G);
  const r = rng(seed);
  for (let i = 0; i < G * G; i++) grid[i] = r();
  const at = (xi: number, yi: number) => grid[((yi % G) + G) % G * G + (((xi % G) + G) % G)];
  const sm = (t: number) => t * t * (3 - 2 * t);
  const noise = (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = sm(xf), v = sm(yf);
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

type DrawFn = (ctx: CanvasRenderingContext2D, size: number, t: number, frame: number) => void;
function bake(n: number, size: number, draw: DrawFn): Texture[] {
  const out: Texture[] = [];
  for (let f = 0; f < n; f++) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d")!;
    draw(ctx, size, f / n, f);
    const tex = Texture.from(c);
    tex.source.scaleMode = "linear"; // VFX = glow/forma macia, não pixel art
    out.push(tex);
  }
  return out;
}

// ── Técnica A: campo de NOISE (chama/fumaça/wisp) — rampa + forma parametrizadas ──
type Stop = [number, number, number, number, number];
function rampAt(stops: Stop[], t: number): [number, number, number, number] {
  if (t <= stops[0][0]) return [0, 0, 0, 0];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const a = stops[i - 1], b = stops[i], k = (t - a[0]) / (b[0] - a[0]);
      return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k, a[4] + (b[4] - a[4]) * k];
    }
  }
  const e = stops[stops.length - 1];
  return [e[1], e[2], e[3], e[4]];
}
interface NoiseOpt { cyf: number; rxf: number; ryf: number; topTaper: number; scroll: number; contrast: number; }
function noiseBlob(ctx: CanvasRenderingContext2D, size: number, t: number, stops: Stop[], o: NoiseOpt): void {
  const img = ctx.createImageData(size, size);
  const data = img.data;
  const cx = size / 2, cy = size * o.cyf, rx = size * o.rxf, ry = size * o.ryf;
  const sc = t * size * o.scroll;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      const taper = dy < 0 ? o.topTaper : 1.05;
      const shape = 1 - (dx * dx + (dy * taper) * (dy * taper));
      const n = FBM(x * 0.10, y * 0.10 - sc * 0.10);
      const inten = Math.max(0, Math.min(1, shape * o.contrast + (n - 0.5) * 1.5));
      const [r, g, b, a] = rampAt(stops, inten);
      const i = (y * size + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
}
/** Explosão por noise (fogo/veneno/morte): cresce, sobe e dissipa. `punch` acelera. */
function noiseBlast(ctx: CanvasRenderingContext2D, size: number, t: number, stops: Stop[], punch: number, rise: number): void {
  const img = ctx.createImageData(size, size);
  const data = img.data;
  const easeOut = 1 - (1 - t) * (1 - t);
  const R = size * 0.46 * (0.3 + easeOut * (0.7 * punch));
  const cx = size / 2, cy = size * 0.66 - t * size * rise;
  const fade = t < 0.10 ? t / 0.10 : 1 - (t - 0.10) / 0.90;
  const flash = Math.max(0, 1 - t / (0.16 / punch));
  const sc = t * size * 1.2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / R, dy = (y - cy) / R;
      const d = Math.sqrt(dx * dx + dy * dy * 0.9);
      const n = FBM(x * 0.09, y * 0.09 - sc * 0.10);
      const inten = Math.max(0, Math.min(1, (1 - d) * 1.3 + (n - 0.5) * 1.7 + flash * 0.6)) * (0.4 + fade * 0.6);
      const [r, g, b, a] = rampAt(stops, inten);
      const i = (y * size + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = Math.round(a * fade);
    }
  }
  ctx.putImageData(img, 0, 0);
}

const RAMP_FIRE: Stop[] = [[0.18, 60, 10, 6, 90], [0.34, 150, 28, 12, 205], [0.50, 224, 66, 30, 255], [0.66, 255, 120, 40, 255], [0.80, 255, 171, 74, 255], [0.90, 255, 231, 154, 255], [1, 255, 253, 240, 255]];
const RAMP_POISON: Stop[] = [[0.10, 16, 26, 12, 40], [0.30, 30, 52, 24, 120], [0.50, 52, 88, 38, 165], [0.70, 88, 134, 60, 195], [0.88, 130, 174, 92, 205], [1, 168, 200, 128, 210]];
const RAMP_DEATH: Stop[] = [[0.16, 24, 12, 34, 80], [0.34, 60, 32, 86, 190], [0.55, 108, 64, 150, 235], [0.74, 150, 100, 200, 255], [0.90, 196, 158, 232, 255], [1, 224, 200, 244, 255]];
const RAMP_ARCANE: Stop[] = [[0.18, 40, 16, 64, 100], [0.36, 96, 40, 160, 210], [0.55, 150, 80, 210, 255], [0.74, 184, 120, 232, 255], [0.90, 222, 180, 245, 255], [1, 244, 224, 255, 255]];

// ── Técnica B: CRISTAL de gelo (facetas sólidas, bordas duras) ────────────────
function drawShard(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, ang: number, alpha = 1): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(ang);
  ctx.globalAlpha = alpha;
  // corpo do caco (losango alongado)
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.lineTo(w, -h * 0.15);
  ctx.lineTo(0, h);
  ctx.lineTo(-w, -h * 0.15);
  ctx.closePath();
  ctx.fillStyle = "#3f7fb8"; // azul médio (corpo)
  ctx.fill();
  // faceta clara (metade que pega luz)
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.lineTo(w, -h * 0.15);
  ctx.lineTo(0, h * 0.2);
  ctx.closePath();
  ctx.fillStyle = "#a9e2f5";
  ctx.fill();
  // brilho de núcleo
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.lineTo(w * 0.32, -h * 0.3);
  ctx.lineTo(0, h * 0.1);
  ctx.lineTo(-w * 0.18, -h * 0.3);
  ctx.closePath();
  ctx.fillStyle = "#eafaff";
  ctx.fill();
  // contorno escuro
  ctx.beginPath();
  ctx.moveTo(0, -h);
  ctx.lineTo(w, -h * 0.15);
  ctx.lineTo(0, h);
  ctx.lineTo(-w, -h * 0.15);
  ctx.closePath();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "#163a5e";
  ctx.stroke();
  ctx.restore();
}
function iceProjectile(): DrawFn {
  return (ctx, s, t) => {
    const cx = s / 2, cy = s / 2;
    const shimmer = 0.9 + 0.1 * Math.sin(t * Math.PI * 2);
    // halo gélido leve
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.45);
    g.addColorStop(0, "rgba(180,235,255,0.35)");
    g.addColorStop(1, "rgba(180,235,255,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    // caco principal apontando pra frente (direita) + 2 satélites
    drawShard(ctx, cx + s * 0.04, cy, s * 0.16 * shimmer, s * 0.34, Math.PI / 2);
    drawShard(ctx, cx - s * 0.14, cy - s * 0.10, s * 0.09, s * 0.18, Math.PI / 2 + 0.5, 0.9);
    drawShard(ctx, cx - s * 0.12, cy + s * 0.12, s * 0.08, s * 0.16, Math.PI / 2 - 0.6, 0.9);
  };
}
function iceShatter(): DrawFn {
  const r = rng(77);
  const N = 9;
  const dirs = Array.from({ length: N }, () => ({ a: r() * Math.PI * 2, sp: 0.5 + r() * 0.5, sz: 0.6 + r() * 0.6, rot: r() * Math.PI }));
  return (ctx, s, t) => {
    const cx = s / 2, cy = s * 0.58;
    const fade = 1 - t;
    // clarão frio inicial + anel de gelo
    const flash = Math.max(0, 1 - t / 0.25);
    if (flash > 0) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.4);
      g.addColorStop(0, `rgba(220,245,255,${0.7 * flash})`);
      g.addColorStop(1, "rgba(220,245,255,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    }
    const ring = t * s * 0.42;
    ctx.globalAlpha = 0.6 * fade;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#bfeeff";
    ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.08, ring, ring * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    // cacos voando pra fora e caindo
    for (const d of dirs) {
      const dist = t * s * 0.42 * d.sp;
      const x = cx + Math.cos(d.a) * dist;
      const y = cy + Math.sin(d.a) * dist * 0.6 + t * t * s * 0.18; // gravidade
      drawShard(ctx, x, y, s * 0.06 * d.sz, s * 0.13 * d.sz, d.rot + t * 3, fade);
    }
  };
}

// ── Técnica C: ARCO elétrico (zigue-zague ramificado) ─────────────────────────
function boltPath(rand: () => number, x0: number, y0: number, x1: number, y1: number, disp: number, detail: number): number[][] {
  let pts: number[][] = [[x0, y0], [x1, y1]];
  let d = disp;
  for (let it = 0; it < detail; it++) {
    const np: number[][] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      const off = (rand() - 0.5) * d;
      np.push(a, [mx - (dy / len) * off, my + (dx / len) * off]);
    }
    np.push(pts[pts.length - 1]);
    pts = np; d *= 0.5;
  }
  return pts;
}
function strokeBolt(ctx: CanvasRenderingContext2D, pts: number[][], glow: string, core: string, wGlow: number, wCore: number): void {
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = glow; ctx.lineWidth = wGlow; ctx.stroke();
  ctx.strokeStyle = core; ctx.lineWidth = wCore; ctx.stroke();
}
function lightningProjectile(): DrawFn {
  return (ctx, s, _t, f) => {
    const cx = s / 2, cy = s / 2;
    // núcleo crepitante
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.22);
    g.addColorStop(0, "rgba(255,255,235,0.95)");
    g.addColorStop(0.5, "rgba(238,226,120,0.6)");
    g.addColorStop(1, "rgba(238,226,120,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    // 2-3 raios curtos lambendo em volta (re-sorteados por frame = crepitar)
    const r = rng(100 + f * 7);
    const arms = 3;
    for (let i = 0; i < arms; i++) {
      const a = r() * Math.PI * 2;
      const reach = s * (0.22 + r() * 0.18);
      const pts = boltPath(r, cx, cy, cx + Math.cos(a) * reach, cy + Math.sin(a) * reach, s * 0.14, 4);
      strokeBolt(ctx, pts, "rgba(245,242,170,0.5)", "rgba(255,255,240,0.95)", 4, 1.5);
    }
  };
}
function lightningStrike(): DrawFn {
  return (ctx, s, t, f) => {
    const cx = s / 2, baseY = s * 0.66;
    const fade = 1 - t;
    // flash no solo
    const flash = Math.max(0, 1 - t / 0.3);
    if (flash > 0) {
      const g = ctx.createRadialGradient(cx, baseY, 0, cx, baseY, s * 0.42);
      g.addColorStop(0, `rgba(255,255,225,${0.85 * flash})`);
      g.addColorStop(1, "rgba(255,255,225,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    }
    // bolt principal do topo ao solo + bifurcações (pisca nos primeiros frames)
    if (t < 0.5) {
      const r = rng(200 + f * 13);
      const main = boltPath(r, cx + (r() - 0.5) * s * 0.1, s * 0.04, cx, baseY, s * 0.28, 5);
      strokeBolt(ctx, main, "rgba(245,242,170,0.55)", "rgba(255,255,245,1)", 7, 2.4);
      // forks
      for (let i = 0; i < 3; i++) {
        const k = Math.floor((0.3 + r() * 0.5) * main.length);
        const p = main[Math.min(k, main.length - 1)];
        const fk = boltPath(r, p[0], p[1], p[0] + (r() - 0.5) * s * 0.4, p[1] + r() * s * 0.25, s * 0.12, 3);
        strokeBolt(ctx, fk, "rgba(245,242,170,0.4)", "rgba(255,255,240,0.85)", 3.5, 1.3);
      }
    }
    // faíscas residuais subindo do solo
    const r2 = rng(9);
    ctx.globalAlpha = fade;
    for (let i = 0; i < 6; i++) {
      const a = r2();
      const x = cx + (a - 0.5) * s * 0.5;
      const y = baseY - t * s * 0.3 * (0.4 + a);
      ctx.fillStyle = "rgba(255,255,220,0.9)";
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
  };
}

// ── Técnica D: PEDRAS chunky (sólidas, opacas) ────────────────────────────────
function drawRock(ctx: CanvasRenderingContext2D, cx: number, cy: number, rad: number, seed: number, ang: number): void {
  const r = rng(seed);
  const sides = 6;
  const verts: number[][] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 + ang;
    const rr = rad * (0.7 + r() * 0.45);
    verts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  ctx.beginPath();
  ctx.moveTo(verts[0][0], verts[0][1]);
  for (let i = 1; i < sides; i++) ctx.lineTo(verts[i][0], verts[i][1]);
  ctx.closePath();
  ctx.fillStyle = "#5a4026"; ctx.fill(); // rocha base (sombra)
  // faceta de cima-esquerda (luz global)
  ctx.save(); ctx.clip();
  ctx.fillStyle = "#8a6438";
  ctx.fillRect(cx - rad, cy - rad, rad * 1.15, rad * 1.15);
  ctx.fillStyle = "#a87f4c";
  ctx.fillRect(cx - rad, cy - rad, rad * 0.6, rad * 0.6);
  ctx.restore();
  ctx.lineWidth = 1.2; ctx.strokeStyle = "#2e1f12"; ctx.stroke();
}
function earthProjectile(): DrawFn {
  return (ctx, s, t) => {
    const cx = s / 2, cy = s / 2, spin = t * Math.PI * 2;
    // poeira atrás (esquerda)
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#6b4f33";
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + spin;
      ctx.beginPath(); ctx.arc(cx - s * 0.22 + Math.cos(a) * 4, cy + Math.sin(a) * 5, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // cluster de pedras orbitando/tombando
    const orbit = [[0.0, 0.0, 0.18], [0.16, -0.10, 0.11], [0.12, 0.13, 0.10], [-0.12, 0.04, 0.09]];
    orbit.forEach((o, i) => {
      const a = spin + i * 1.6;
      const x = cx + (o[0] + Math.cos(a) * 0.03) * s;
      const y = cy + (o[1] + Math.sin(a) * 0.03) * s;
      drawRock(ctx, x, y, s * o[2], 31 + i * 17, a);
    });
  };
}
function earthBurst(): DrawFn {
  const r = rng(55);
  const N = 7;
  const rocks = Array.from({ length: N }, () => ({ a: -Math.PI / 2 + (r() - 0.5) * 1.6, sp: 0.6 + r() * 0.6, sz: 0.5 + r() * 0.7, seed: (r() * 1e6) | 0, spin: r() * 6 }));
  return (ctx, s, t) => {
    const cx = s / 2, gy = s * 0.66;
    // nuvem de poeira (blend normal, marrom, expande e some)
    const fade = 1 - t;
    const img = ctx.createImageData(s, s);
    const data = img.data;
    const R = s * 0.4 * (0.3 + t * 0.7);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const dx = (x - cx) / R, dy = (y - gy) / (R * 0.7);
      const d = Math.sqrt(dx * dx + dy * dy);
      const n = FBM(x * 0.08, y * 0.08 + t * 2);
      const inten = Math.max(0, Math.min(1, (1 - d) * 1.1 + (n - 0.5) * 1.4));
      const i = (y * s + x) * 4;
      data[i] = 120; data[i + 1] = 92; data[i + 2] = 58;
      data[i + 3] = Math.round(inten * 150 * fade);
    }
    ctx.putImageData(img, 0, 0);
    // pedras erupcionando (sobem e caem com gravidade)
    for (const rk of rocks) {
      const dist = t * s * 0.5 * rk.sp;
      const x = cx + Math.cos(rk.a) * dist;
      const y = gy + Math.sin(rk.a) * dist + t * t * s * 0.4; // gravidade puxa de volta
      drawRock(ctx, x, y, s * 0.07 * rk.sz, rk.seed, rk.spin + t * 8);
    }
  };
}

// ── Técnica E: RADIANTE (orbe + raios + cintilância) — sagrado, lúdico ────────
function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#fff7e0";
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.22, y - r * 0.22); ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.22, y + r * 0.22); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.22, y + r * 0.22);
  ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.22, y - r * 0.22); ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function holyProjectile(): DrawFn {
  return (ctx, s, t, f) => {
    const cx = s / 2, cy = s / 2;
    // orbe radiante
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.34);
    g.addColorStop(0, "rgba(255,253,235,0.95)");
    g.addColorStop(0.4, "rgba(255,224,130,0.7)");
    g.addColorStop(1, "rgba(255,210,90,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    // raios girando suave
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * Math.PI);
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      const len = s * (0.34 + 0.04 * Math.sin(t * 6.28 + i));
      const grd = ctx.createLinearGradient(0, 0, len, 0);
      grd.addColorStop(0, "rgba(255,240,180,0.7)");
      grd.addColorStop(1, "rgba(255,240,180,0)");
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.moveTo(0, -2.2); ctx.lineTo(len, 0); ctx.lineTo(0, 2.2); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // cintilância (estrelinha que pisca)
    const tw = 0.5 + 0.5 * Math.sin(t * Math.PI * 4 + f);
    drawSparkle(ctx, cx + s * 0.1, cy - s * 0.12, s * 0.1 * tw, 0.9 * tw);
    drawSparkle(ctx, cx - s * 0.14, cy + s * 0.08, s * 0.07 * (1 - tw), 0.8 * (1 - tw));
  };
}
function holyBurst(): DrawFn {
  const r = rng(42);
  const stars = Array.from({ length: 7 }, () => ({ a: r() * Math.PI * 2, sp: 0.5 + r() * 0.5, ph: r() }));
  return (ctx, s, t) => {
    const cx = s / 2, cy = s * 0.56, fade = 1 - t;
    // florada de luz
    const bloom = Math.sin(Math.min(1, t * 1.6) * Math.PI);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.46);
    g.addColorStop(0, `rgba(255,253,235,${0.85 * bloom})`);
    g.addColorStop(0.5, `rgba(255,224,130,${0.5 * bloom})`);
    g.addColorStop(1, "rgba(255,210,90,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    // coluna de luz subindo
    ctx.globalAlpha = 0.5 * fade;
    const colg = ctx.createLinearGradient(0, cy + s * 0.15, 0, cy - s * 0.4);
    colg.addColorStop(0, "rgba(255,240,180,0)");
    colg.addColorStop(0.5, "rgba(255,245,200,0.8)");
    colg.addColorStop(1, "rgba(255,245,200,0)");
    ctx.fillStyle = colg;
    ctx.fillRect(cx - s * 0.12, cy - s * 0.4, s * 0.24, s * 0.55);
    ctx.globalAlpha = 1;
    // anel de estrelinhas voando pra fora
    for (const st of stars) {
      const dist = t * s * 0.42 * st.sp;
      const x = cx + Math.cos(st.a) * dist;
      const y = cy + Math.sin(st.a) * dist * 0.7;
      drawSparkle(ctx, x, y, s * 0.06 * fade, fade);
    }
  };
}

// ── Registro por elemento ─────────────────────────────────────────────────────
interface Recipe {
  additive: boolean;
  projSize: number; projFrames: number; proj: (size: number) => DrawFn;
  blastSize: number; blastFrames: number; blast: (size: number) => DrawFn;
}
const RECIPES: Record<VfxElement, Recipe> = {
  fire: {
    additive: true,
    projSize: 56, projFrames: 24, proj: () => (c, s, t) => noiseBlob(c, s, t, RAMP_FIRE, { cyf: 0.52, rxf: 0.42, ryf: 0.42, topTaper: 1.5, scroll: 0.9, contrast: 1.25 }),
    blastSize: 96, blastFrames: 18, blast: () => (c, s, t) => noiseBlast(c, s, t, RAMP_FIRE, 1.35, 0.22),
  },
  poison: {
    additive: false,
    projSize: 56, projFrames: 24, proj: () => (c, s, t) => noiseBlob(c, s, t, RAMP_POISON, { cyf: 0.5, rxf: 0.44, ryf: 0.5, topTaper: 1.15, scroll: 0.5, contrast: 1.05 }),
    blastSize: 96, blastFrames: 22, blast: () => (c, s, t) => noiseBlast(c, s, t, RAMP_POISON, 0.85, 0.10),
  },
  death: {
    additive: true,
    projSize: 56, projFrames: 24, proj: () => (c, s, t) => noiseBlob(c, s, t, RAMP_DEATH, { cyf: 0.55, rxf: 0.38, ryf: 0.52, topTaper: 1.8, scroll: 1.0, contrast: 1.2 }),
    blastSize: 96, blastFrames: 20, blast: () => (c, s, t) => noiseBlast(c, s, t, RAMP_DEATH, 1.0, 0.18),
  },
  arcane: {
    additive: true,
    projSize: 56, projFrames: 24, proj: () => (c, s, t) => noiseBlob(c, s, t, RAMP_ARCANE, { cyf: 0.5, rxf: 0.42, ryf: 0.42, topTaper: 1.2, scroll: 0.8, contrast: 1.25 }),
    blastSize: 96, blastFrames: 20, blast: () => (c, s, t) => noiseBlast(c, s, t, RAMP_ARCANE, 1.1, 0.16),
  },
  ice: {
    additive: false,
    projSize: 56, projFrames: 16, proj: iceProjectile,
    blastSize: 96, blastFrames: 18, blast: iceShatter,
  },
  lightning: {
    additive: true,
    projSize: 56, projFrames: 12, proj: lightningProjectile,
    blastSize: 96, blastFrames: 14, blast: lightningStrike,
  },
  earth: {
    additive: false,
    projSize: 56, projFrames: 18, proj: earthProjectile,
    blastSize: 96, blastFrames: 20, blast: earthBurst,
  },
  holy: {
    additive: true,
    projSize: 56, projFrames: 24, proj: holyProjectile,
    blastSize: 96, blastFrames: 20, blast: holyBurst,
  },
};

const projCache = new Map<VfxElement, Texture[]>();
const blastCache = new Map<VfxElement, Texture[]>();

/** Frames do projétil (loop) do elemento — bake lazy cacheado. */
export function projectileFrames(el: VfxElement): Texture[] {
  let f = projCache.get(el);
  if (!f) { const r = RECIPES[el]; f = bake(r.projFrames, r.projSize, r.proj(r.projSize)); projCache.set(el, f); }
  return f;
}
/** Frames da explosão (one-shot) do elemento — bake lazy cacheado. */
export function blastFrames(el: VfxElement): Texture[] {
  let f = blastCache.get(el);
  if (!f) { const r = RECIPES[el]; f = bake(r.blastFrames, r.blastSize, r.blast(r.blastSize)); blastCache.set(el, f); }
  return f;
}
/** Blend do elemento: true = aditivo (glow), false = normal (fumaça/pedra/cristal). */
export function vfxAdditive(el: VfxElement): boolean {
  return RECIPES[el].additive;
}

export const VFX_ELEMENTS: VfxElement[] = ["fire", "ice", "holy", "lightning", "earth", "death", "poison", "arcane"];

let _glow: Texture | null = null;
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
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  _glow = Texture.from(c);
  _glow.source.scaleMode = "linear";
  return _glow;
}
