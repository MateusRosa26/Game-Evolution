// Preview descartável do chão procedural de subsolo (rocha-base + scatter de limo/
// poças, igual ao WorldRenderer). Acesse /sewer-preview.html com o dev server.
import type { Texture } from "pixi.js";
import { buildRockField, SEWER_ROCK, CAVE_ROCK, makeScatterDecals, makeMurkyWaterFrames, makeDungeonWallTile, SEWER_WALL_PAL, OLD_MASONRY_PAL, SEWAGE_PAL, DEEPWATER_PAL, type RockOpts } from "./src/client/assets/sprites";
import { hash2D } from "./src/sim/rng";

const root = document.getElementById("root")!;
const scatter = makeScatterDecals();
const canvasOf = (t: Texture) => (t.source as unknown as { resource: HTMLCanvasElement }).resource;
const T = 32;

// Composto fiel ao WorldRenderer: tila a fatia do campo + espalha decais por tile.
function composite(title: string, o: RockOpts, seed: number, decals: Texture[], density: number, tilesW: number, tilesH: number, scale: number) {
  const wrap = document.createElement("div");
  const h = document.createElement("h2");
  h.textContent = title;
  wrap.appendChild(h);

  const field = buildRockField(seed, o).canvas; // 128×128 (4×4 tiles), seamless
  const sets = decals.map(canvasOf);

  const c = document.createElement("canvas");
  c.width = tilesW * T * scale;
  c.height = tilesH * T * scale;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.scale(scale, scale);

  // 1. chão-base (fatia 32 do campo pela posição de mundo)
  for (let ty = 0; ty < tilesH; ty++)
    for (let tx = 0; tx < tilesW; tx++)
      ctx.drawImage(field, (tx % 4) * T, (ty % 4) * T, T, T, tx * T, ty * T, T, T);

  // 2. scatter — MESMA lógica/hashes do WorldRenderer.buildGround
  for (let y = 0; y < tilesH; y++) {
    for (let x = 0; x < tilesW; x++) {
      if (hash2D(x, y, 31) >= density) continue;
      const count = hash2D(x, y, 32) < 0.22 ? 2 : 1;
      for (let k = 0; k < count; k++) {
        const dec = sets[Math.floor(hash2D(x, y, 40 + k) * sets.length)];
        const ox = Math.floor(hash2D(x, y, 50 + k) * Math.max(1, T - dec.width));
        const oy = Math.floor(hash2D(x, y, 60 + k) * Math.max(1, T - dec.height));
        ctx.drawImage(dec, x * T + ox, y * T + oy);
      }
    }
  }
  wrap.appendChild(c);
  root.appendChild(wrap);
}

composite("ESGOTO — composto final (rocha + limo/poças por scatter) @3×", SEWER_ROCK, 801, scatter.sewer, 0.34, 14, 11, 3);
composite("CAVERNA — composto final @3×", CAVE_ROCK, 811, scatter.cave, 0.28, 14, 11, 3);

// ÁGUA: 3 frames de animação lado a lado, tilados 6×3, pra ver fluxo + seamless
function water(title: string, frames: Texture[], scale: number, tilesW: number, tilesH: number) {
  const wrap = document.createElement("div");
  const h = document.createElement("h2");
  h.textContent = title;
  wrap.appendChild(h);
  for (const fr of frames) {
    const cnv = canvasOf(fr);
    const c = document.createElement("canvas");
    c.width = tilesW * T * scale;
    c.height = tilesH * T * scale;
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    for (let ty = 0; ty < tilesH; ty++)
      for (let tx = 0; tx < tilesW; tx++)
        ctx.drawImage(cnv, 0, 0, T, T, tx * T * scale, ty * T * scale, T * scale, T * scale);
    c.style.marginRight = "8px";
    c.style.display = "inline-block";
    wrap.appendChild(c);
  }
  root.appendChild(wrap);
}

water("ÁGUA SERVIDA (sewage) — frames 0·1·2 @4×", makeMurkyWaterFrames(SEWAGE_PAL), 4, 4, 4);
water("POÇA FUNDA (deep water) — frames 0·1·2 @4×", makeMurkyWaterFrames(DEEPWATER_PAL), 4, 4, 4);

// PAREDE: face de cada tile (32×54) sobre chão de esgoto, várias seeds → ver a
// irregularidade/podridão. mask 10 = corredor horizontal (E+W, face cheia).
function walls(title: string, pal: typeof SEWER_WALL_PAL, scale: number, id: string) {
  const wrap = document.createElement("div");
  const h = document.createElement("h2");
  h.textContent = title;
  wrap.appendChild(h);
  const floor = buildRockField(801, SEWER_ROCK).canvas;
  const n = 7;
  const c = document.createElement("canvas");
  c.id = id;
  c.width = n * T * scale;
  c.height = 54 * scale;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.scale(scale, scale);
  // chão atrás (pra ver a sombra de contato assentar)
  for (let i = 0; i < n; i++) for (let yy = 0; yy < 2; yy++) ctx.drawImage(floor, (i % 4) * T, yy * T, T, T, i * T, 54 - T - 22 + yy * T, T, T);
  for (let i = 0; i < n; i++) {
    const tex = makeDungeonWallTile(10, 820 + i * 7, pal);
    ctx.drawImage(canvasOf(tex), i * T, 0);
  }
  wrap.appendChild(c);
  root.appendChild(wrap);
}

walls("PAREDE DE ESGOTO — face podre (7 seeds) @6×", SEWER_WALL_PAL, 6, "wall-sewer");
walls("ALVENARIA ANTIGA — face podre (7 seeds) @6×", OLD_MASONRY_PAL, 6, "wall-masonry");

// CANAL: chão com trincheira de água servida (2 fileiras) + sombra de recesso nas
// bordas — replica a lógica do WorldRenderer pra ver a água CONTIDA (rebaixada).
function channel(scale: number) {
  const wrap = document.createElement("div");
  const h = document.createElement("h2");
  h.textContent = "CANAL — água servida contida no rebaixo (chão + trincheira + sombra de borda) @6×";
  wrap.appendChild(h);
  const floor = buildRockField(801, SEWER_ROCK).canvas;
  const water = canvasOf(makeMurkyWaterFrames(SEWAGE_PAL)[0]);
  const W = 10, H = 5; // trincheira nas fileiras 2-3
  const isW = (ty: number) => ty === 2 || ty === 3;
  const c = document.createElement("canvas");
  c.id = "channel";
  c.width = W * T * scale; c.height = H * T * scale;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false; ctx.scale(scale, scale);
  for (let ty = 0; ty < H; ty++)
    for (let tx = 0; tx < W; tx++) {
      if (isW(ty)) {
        ctx.drawImage(water, 0, 0, T, T, tx * T, ty * T, T, T);
        // sombra de recesso (mesma do WorldRenderer)
        const top = !isW(ty - 1), bt = !isW(ty + 1), lf = tx === 0, rt = tx === W - 1;
        const sh = (x: number, y: number, w: number, hh: number, a: number) => { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(tx * T + x, ty * T + y, w, hh); };
        if (top) { sh(0, 0, T, 3, 0.5); sh(0, 3, T, 3, 0.22); }
        if (bt) sh(0, T - 3, T, 3, 0.3);
        if (lf) { sh(0, 0, 3, T, 0.38); sh(3, 0, 2, T, 0.16); }
        if (rt) sh(T - 3, 0, 3, T, 0.3);
      } else {
        ctx.drawImage(floor, (tx % 4) * T, (ty % 4) * T, T, T, tx * T, ty * T, T, T);
      }
    }
  wrap.appendChild(c);
  root.appendChild(wrap);
}
channel(6);
