/**
 * VFX Lab — teste de DIREÇÃO DE ARTE para efeitos de fogo (bola de fogo +
 * explosão saindo do chão). Compara DUAS linguagens, lado a lado, ambas
 * geradas 100% por código (zero PixelLab):
 *
 *   ESQUERDA  — noise aditivo em tempo-real (suave, "mágico", glow somado à luz)
 *   DIREITA   — frames pixelados opacos (estilo spritesheet Tibia/CrossCode)
 *
 * Os frames de fogo nascem de um campo de VALUE-NOISE (fbm) mapeado por uma
 * RAMPA DE FOGO (transparente → brasa → laranja → amarelo → branco-quente),
 * rolando pra cima (a chama sobe). É o mesmo motor que viraria um spritesheet
 * recolorível por elemento. Acesso: http://localhost:5173/vfx-lab.html
 */
import { Application, Container, Graphics, Sprite, Text, Texture, TextureStyle } from "pixi.js";

TextureStyle.defaultOptions.scaleMode = "nearest";

const TILE = 128; // escala do remaster: o fogo precisa ler contra 1 tile

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

// ── Rampa de fogo (paleta do jogo: flameEdge/Body/Core) ───────────────────────
type RGBA = [number, number, number, number];
const STOPS: [number, number, number, number, number][] = [
  // t,   r,   g,   b,   a
  [0.18, 60, 10, 6, 90],
  [0.34, 150, 28, 12, 205],
  [0.50, 224, 66, 30, 255], // ~flameEdge #e06228
  [0.66, 255, 120, 40, 255],
  [0.80, 255, 171, 74, 255], // flameBody #ffab4a
  [0.90, 255, 231, 154, 255], // flameCore #ffe79a
  [1.0, 255, 253, 240, 255],
];
function rampSmooth(t: number): RGBA {
  if (t <= STOPS[0][0]) return [0, 0, 0, 0];
  for (let i = 1; i < STOPS.length; i++) {
    if (t <= STOPS[i][0]) {
      const a = STOPS[i - 1], b = STOPS[i];
      const k = (t - a[0]) / (b[0] - a[0]);
      return [
        a[1] + (b[1] - a[1]) * k,
        a[2] + (b[2] - a[2]) * k,
        a[3] + (b[3] - a[3]) * k,
        a[4] + (b[4] - a[4]) * k,
      ];
    }
  }
  const e = STOPS[STOPS.length - 1];
  return [e[1], e[2], e[3], e[4]];
}
/** Pixel: snap pra banda mais próxima + alpha duro (sem gradiente) — look chunky. */
function rampPixel(t: number): RGBA {
  if (t <= 0.2) return [0, 0, 0, 0];
  let best = STOPS[1];
  for (const st of STOPS) if (Math.abs(st[0] - t) < Math.abs(best[0] - t)) best = st;
  return [best[1], best[2], best[3], 255];
}

// ── Geração de frames ─────────────────────────────────────────────────────────
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
    out.push(Texture.from(c));
  }
  return out;
}

/** Bola de fogo: blob elíptico com cauda afilada pra cima, noise subindo. */
function fireballDraw(fbm: (x: number, y: number) => number, ramp: (t: number) => RGBA, res: number): DrawFn {
  return (data, size, t) => {
    const cx = size / 2, cy = size * 0.52, R = size * 0.42;
    const scroll = t * res * 0.9; // a chama sobe ao longo do loop
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - cx) / R;
        const dy = (y - cy) / R;
        // gota: mais estreita e afilada no topo (dy<0)
        const taper = dy < 0 ? 1.5 : 1.05;
        const shape = 1 - (dx * dx + (dy * taper) * (dy * taper));
        const n = fbm(x * 0.10, y * 0.10 - scroll * 0.10);
        let inten = shape * 1.25 + (n - 0.5) * 1.5;
        inten = Math.max(0, Math.min(1, inten));
        const [r, g, b, a] = ramp(inten);
        const i = (y * size + x) * 4;
        data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
      }
    }
  };
}

/** Explosão do chão: bola que cresce, sobe (cogumelo) e dissipa; flash inicial. */
function blastDraw(fbm: (x: number, y: number) => number, ramp: (t: number) => RGBA, res: number): DrawFn {
  return (data, size, t) => {
    const easeOut = 1 - (1 - t) * (1 - t);
    const R = size * 0.46 * (0.35 + easeOut * 0.65);
    const cx = size / 2;
    const cy = size * 0.66 - t * size * 0.22; // sobe ao longo do tempo
    const fade = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88; // entra rápido, sai devagar
    const flash = Math.max(0, 1 - t / 0.18); // clarão branco no nascimento
    const scroll = t * res * 1.2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = (x - cx) / R;
        const dy = (y - cy) / R;
        const d = Math.sqrt(dx * dx + dy * dy * 0.9);
        const n = fbm(x * 0.09, y * 0.09 - scroll * 0.10);
        let inten = (1 - d) * 1.3 + (n - 0.5) * 1.7 + flash * 0.5;
        inten = Math.max(0, Math.min(1, inten)) * (0.4 + fade * 0.6);
        const [r, g, b, a] = ramp(inten);
        const i = (y * size + x) * 4;
        data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = Math.round(a * fade);
      }
    }
  };
}

// ── Célula de demo (loop animado) ─────────────────────────────────────────────
interface Demo { update(dt: number): void; }

function floorCell(parent: Container, x: number, y: number, w: number, h: number): void {
  const g = new Graphics();
  g.rect(0, 0, w, h).fill({ color: 0x14181e });
  for (let gx = 0; gx <= w; gx += TILE) g.moveTo(gx, 0).lineTo(gx, h).stroke({ color: 0x222833, width: 1 });
  for (let gy = 0; gy <= h; gy += TILE) g.moveTo(0, gy).lineTo(w, gy).stroke({ color: 0x222833, width: 1 });
  g.position.set(x, y);
  parent.addChild(g);
}

function caption(parent: Container, text: string, x: number, y: number, color = 0xe8e4d8): void {
  const t = new Text({ text, style: { fontFamily: "monospace", fontSize: 14, fill: color } });
  t.position.set(x, y);
  parent.addChild(t);
}

/** Bola de fogo viajando da esquerda pra direita, com cauda (afterimages). */
function travelDemo(frames: Texture[], displaySize: number, additive: boolean, cellX: number, cellY: number, cellW: number, root: Container): Demo {
  const layer = new Container();
  layer.position.set(cellX, cellY);
  root.addChild(layer);
  const TRAIL = 5;
  const sprites: Sprite[] = [];
  for (let i = 0; i < TRAIL; i++) {
    const s = new Sprite(frames[0]);
    s.anchor.set(0.5);
    if (additive) s.blendMode = "add";
    s.width = displaySize * (1 - i * 0.12);
    s.height = displaySize * (1 - i * 0.12);
    s.alpha = additive ? 1 - i * 0.18 : 1 - i * 0.22;
    layer.addChild(s);
    sprites.push(s);
  }
  let clock = 0;
  const cy = TILE * 1.5;
  const FPS = additive ? 30 : 14;
  const LOOP = 1500; // ms pra cruzar
  return {
    update(dt) {
      clock += dt;
      const phase = (clock % LOOP) / LOOP;
      const fi = Math.floor((clock / 1000) * FPS) % frames.length;
      const headX = TILE * 0.6 + phase * (cellW - TILE * 1.2);
      for (let i = 0; i < TRAIL; i++) {
        const back = i * 16;
        sprites[i].texture = frames[(fi - i + frames.length * 4) % frames.length];
        sprites[i].position.set(headX - back, cy);
      }
    },
  };
}

/** Explosão nascendo do chão, com clarão de luz + chamuscado no piso. */
function blastDemo(frames: Texture[], displaySize: number, additive: boolean, cellX: number, cellY: number, cellW: number, root: Container): Demo {
  const layer = new Container();
  layer.position.set(cellX, cellY);
  root.addChild(layer);
  const groundX = cellW / 2;
  const groundY = TILE * 1.7;

  // chamuscado no piso (persiste e desbota a cada loop)
  const scorch = new Graphics();
  scorch.ellipse(0, 0, displaySize * 0.38, displaySize * 0.16).fill({ color: 0x000000, alpha: 0.55 });
  scorch.position.set(groundX, groundY + displaySize * 0.30);
  layer.addChild(scorch);

  // clarão de luz (só na versão aditiva — é o "+1" da composição com a luz do jogo)
  const flash = new Sprite(softGlow());
  flash.anchor.set(0.5);
  flash.blendMode = "add";
  flash.tint = 0xffb25a;
  flash.position.set(groundX, groundY);
  if (additive) layer.addChild(flash);

  const spr = new Sprite(frames[0]);
  spr.anchor.set(0.5, 0.62);
  if (additive) spr.blendMode = "add";
  spr.width = displaySize;
  spr.height = displaySize;
  spr.position.set(groundX, groundY);
  layer.addChild(spr);

  let clock = 0;
  const LOOP = 1400;
  return {
    update(dt) {
      clock += dt;
      const phase = (clock % LOOP) / LOOP;
      const playing = phase < 0.62; // explode, depois pausa antes de repetir
      spr.visible = playing;
      if (playing) {
        const local = phase / 0.62;
        const fi = Math.min(frames.length - 1, Math.floor(local * frames.length));
        spr.texture = frames[fi];
        const grow = 0.7 + local * 0.5;
        spr.width = displaySize * grow;
        spr.height = displaySize * grow;
        flash.alpha = Math.max(0, 1 - local / 0.4);
        flash.width = flash.height = displaySize * (1.2 + local);
      } else {
        flash.alpha = 0;
      }
      scorch.alpha = 0.55 * (1 - phase * 0.5);
    },
  };
}

let _glow: Texture | null = null;
function softGlow(): Texture {
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
  return _glow;
}

async function main() {
  const W = 1280, H = 920;
  const app = new Application();
  await app.init({ width: W, height: H, background: 0x0a0c10, antialias: false });
  document.body.appendChild(app.canvas);

  const root = new Container();
  app.stage.addChild(root);

  const fbm = makeFbm(1337);
  // SMOOTH (aditivo): canvas alto-res, rampa contínua
  const fbBallSmooth = bakeFrames(24, 96, fireballDraw(fbm, rampSmooth, 96));
  const fbBlastSmooth = bakeFrames(20, 160, blastDraw(fbm, rampSmooth, 160));
  // PIXEL (opaco): canvas baixo-res, rampa em bandas → exibido 4x nearest
  const fbBallPixel = bakeFrames(16, 24, fireballDraw(fbm, rampPixel, 24));
  const fbBlastPixel = bakeFrames(14, 40, blastDraw(fbm, rampPixel, 40));

  caption(root, "VFX LAB — bola de fogo & explosão (tudo procedural, 0 PixelLab)", 16, 12);
  caption(root, "ESQUERDA: noise aditivo (suave/mágico)    DIREITA: frames pixel opacos (estilo spritesheet)", 16, 32, 0x7d8794);

  const colW = (W - 48) / 2;
  const leftX = 16, rightX = 32 + colW;
  const rowAY = 64, rowBY = 64 + 300 + 40;
  const cellH = 300;

  caption(root, "▸ noise aditivo", leftX, rowAY - 4, 0xffab4a);
  caption(root, "▸ frames pixel opacos", rightX, rowAY - 4, 0xffab4a);

  // Linha A — BOLA DE FOGO viajando
  caption(root, "BOLA DE FOGO (viajando)", leftX, rowAY + 12, 0xc2cdd8);
  caption(root, "BOLA DE FOGO (viajando)", rightX, rowAY + 12, 0xc2cdd8);
  floorCell(root, leftX, rowAY + 32, colW, cellH);
  floorCell(root, rightX, rowAY + 32, colW, cellH);

  // Linha B — EXPLOSÃO do chão
  caption(root, "EXPLOSÃO (saindo do chão)", leftX, rowBY + 12, 0xc2cdd8);
  caption(root, "EXPLOSÃO (saindo do chão)", rightX, rowBY + 12, 0xc2cdd8);
  floorCell(root, leftX, rowBY + 32, colW, cellH);
  floorCell(root, rightX, rowBY + 32, colW, cellH);

  const demos: Demo[] = [
    travelDemo(fbBallSmooth, 110, true, leftX, rowAY + 32, colW, root),
    travelDemo(fbBallPixel, 110, false, rightX, rowAY + 32, colW, root),
    blastDemo(fbBlastSmooth, 200, true, leftX, rowBY + 32, colW, root),
    blastDemo(fbBlastPixel, 200, false, rightX, rowBY + 32, colW, root),
  ];

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS;
    for (const d of demos) d.update(dt);
  });
}

main();
