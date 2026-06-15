/**
 * VFX Lab — vitrine dos efeitos de skill por ELEMENTO (motor real `assets/vfx.ts`).
 * Anima, em loop, PROJÉTIL (viajando, com cauda) + EXPLOSÃO (saindo do chão) de
 * cada elemento. Tudo procedural por noise aditivo (decisão de arte jun/2026).
 * Acesso: http://localhost:5173/vfx-lab.html
 */
import { Application, Container, Graphics, Sprite, Text, TextureStyle, type Texture } from "pixi.js";
import { blastFrames, projectileFrames, softGlow, vfxAdditive, VFX_ELEMENTS, type VfxElement } from "../assets/vfx";

TextureStyle.defaultOptions.scaleMode = "nearest";

const TILE = 128;
const LABEL: Record<VfxElement, string> = {
  fire: "FOGO", ice: "GELO", holy: "SAGRADO", lightning: "RAIO",
  earth: "TERRA", death: "MORTE", poison: "VENENO", arcane: "ARCANO",
};

interface Demo { update(dt: number): void; }

function caption(parent: Container, text: string, x: number, y: number, color = 0xe8e4d8, size = 13): void {
  const t = new Text({ text, style: { fontFamily: "monospace", fontSize: size, fill: color } });
  t.position.set(x, y);
  parent.addChild(t);
}

function floorCell(parent: Container, x: number, y: number, w: number, h: number): void {
  const g = new Graphics();
  g.rect(0, 0, w, h).fill({ color: 0x14181e });
  for (let gx = 0; gx <= w; gx += TILE / 2) g.moveTo(gx, 0).lineTo(gx, h).stroke({ color: 0x202632, width: 1 });
  for (let gy = 0; gy <= h; gy += TILE / 2) g.moveTo(0, gy).lineTo(w, gy).stroke({ color: 0x202632, width: 1 });
  g.position.set(x, y);
  parent.addChild(g);
}

/** Projétil viajando da esquerda → direita, com cauda (afterimages). */
function travelDemo(frames: Texture[], additive: boolean, px: number, cellX: number, cellY: number, cellW: number, cellH: number, root: Container): Demo {
  const layer = new Container();
  layer.position.set(cellX, cellY);
  root.addChild(layer);
  const TRAIL = additive ? 5 : 3;
  const sprites: Sprite[] = [];
  for (let i = 0; i < TRAIL; i++) {
    const s = new Sprite(frames[0]);
    s.anchor.set(0.5);
    if (additive) s.blendMode = "add";
    s.width = s.height = px * (1 - i * 0.12);
    s.alpha = 1 - i * 0.18;
    layer.addChild(s);
    sprites.push(s);
  }
  let clock = 0;
  const cy = cellH / 2;
  const LOOP = 1500;
  return {
    update(dt) {
      clock += dt;
      const phase = (clock % LOOP) / LOOP;
      const fi = Math.floor((clock / 1000) * 30) % frames.length;
      const headX = px * 0.6 + phase * (cellW - px * 1.2);
      for (let i = 0; i < TRAIL; i++) {
        sprites[i].texture = frames[(fi - i + frames.length * 4) % frames.length];
        sprites[i].position.set(headX - i * 14, cy);
      }
    },
  };
}

/** Explosão nascendo do chão, com clarão de luz + chamuscado no piso. */
function blastDemo(frames: Texture[], additive: boolean, px: number, cellX: number, cellY: number, cellW: number, cellH: number, root: Container): Demo {
  const layer = new Container();
  layer.position.set(cellX, cellY);
  root.addChild(layer);
  const gx = cellW / 2, gy = cellH * 0.62;
  const scorch = new Graphics();
  scorch.ellipse(0, 0, px * 0.36, px * 0.15).fill({ color: 0x000000, alpha: 0.5 });
  scorch.position.set(gx, gy + px * 0.28);
  layer.addChild(scorch);
  const flash = new Sprite(softGlow());
  flash.anchor.set(0.5);
  flash.blendMode = "add";
  flash.tint = 0xffb25a;
  flash.position.set(gx, gy);
  if (additive) layer.addChild(flash);
  const spr = new Sprite(frames[0]);
  spr.anchor.set(0.5, 0.62);
  if (additive) spr.blendMode = "add";
  spr.width = spr.height = px;
  spr.position.set(gx, gy);
  layer.addChild(spr);
  let clock = 0;
  const LOOP = 1400;
  return {
    update(dt) {
      clock += dt;
      const phase = (clock % LOOP) / LOOP;
      const playing = phase < 0.62;
      spr.visible = playing;
      if (playing) {
        const local = phase / 0.62;
        spr.texture = frames[Math.min(frames.length - 1, Math.floor(local * frames.length))];
        const grow = 0.7 + local * 0.5;
        spr.width = spr.height = px * grow;
        flash.alpha = Math.max(0, 1 - local / 0.4);
        flash.width = flash.height = px * (1.1 + local);
      } else {
        flash.alpha = 0;
      }
      scorch.alpha = 0.5 * (1 - phase * 0.5);
    },
  };
}

async function main() {
  const ROW_H = 150, HEAD = 64;
  const W = 1000;
  const H = HEAD + VFX_ELEMENTS.length * (ROW_H + 24) + 40;
  const app = new Application();
  await app.init({ width: W, height: H, background: 0x0a0c10, antialias: false });
  document.body.appendChild(app.canvas);
  const root = new Container();
  app.stage.addChild(root);

  caption(root, "VFX LAB — efeitos de skill por elemento (noise aditivo, 0 PixelLab)", 16, 12, 0xe8e4d8, 15);
  caption(root, "ESQUERDA: projétil (viajando)        DIREITA: explosão (saindo do chão)", 16, 34, 0x7d8794);

  const colW = (W - 48 - 90) / 2; // 90px de coluna de rótulo à esquerda
  const labX = 12, leftX = 96, rightX = 96 + colW + 16;
  const demos: Demo[] = [];

  for (let r = 0; r < VFX_ELEMENTS.length; r++) {
    const el = VFX_ELEMENTS[r];
    const y = HEAD + r * (ROW_H + 24);
    caption(root, LABEL[el], labX, y + ROW_H / 2 - 8, 0xc2cdd8, 14);
    floorCell(root, leftX, y, colW, ROW_H);
    floorCell(root, rightX, y, colW, ROW_H);
    const add = vfxAdditive(el);
    demos.push(travelDemo(projectileFrames(el), add, 78, leftX, y, colW, ROW_H, root));
    demos.push(blastDemo(blastFrames(el), add, 150, rightX, y, colW, ROW_H, root));
  }

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS;
    for (const d of demos) d.update(dt);
  });
}

main();
