import { Container, Graphics, RenderTexture, Sprite, type Renderer } from "pixi.js";
import { CAMERA_ZOOM, TILE_SIZE } from "../../shared/constants";
import type { MapLight } from "../../shared/types";
import { AMBIENT_COLOR, PLAYER_LIGHT } from "../assets/palette";
import type { SpriteLibrary } from "../assets/sprites";
import type { Camera } from "../Camera";

interface LightVisual {
  sprite: Sprite;
  worldX: number;
  worldY: number;
  radius: number;
  intensity: number;
  flicker: boolean;
  phase: number;
}

/**
 * Iluminação 2D: uma render texture é preenchida com a cor ambiente
 * (escura) e as luzes são somadas (blend add); o resultado multiplica
 * a cena. Tochas tremulam; o jogador carrega uma luz fraca.
 */
export class Lighting {
  /** Sprite final aplicado sobre o mundo. */
  readonly overlay: Sprite;

  private rt: RenderTexture;
  private scene = new Container();
  private ambient = new Graphics();
  private lights: LightVisual[] = [];
  private playerLight: LightVisual;
  private time = 0;

  constructor(
    private sprites: SpriteLibrary,
    width: number,
    height: number,
  ) {
    this.rt = RenderTexture.create({ width, height });
    this.overlay = new Sprite(this.rt);
    this.overlay.blendMode = "multiply";
    this.scene.addChild(this.ambient);
    this.drawAmbient(width, height);

    this.playerLight = this.makeLight(0, 0, PLAYER_LIGHT.color, PLAYER_LIGHT.radius, PLAYER_LIGHT.intensity, false);
  }

  setMapLights(mapLights: MapLight[]): void {
    for (const l of this.lights) l.sprite.destroy();
    this.lights = mapLights.map((l, i) => {
      const lv = this.makeLight(
        (l.x + 0.5) * TILE_SIZE,
        (l.y + 0.35) * TILE_SIZE, // luz centrada na chama, não na base
        l.color,
        l.radius,
        l.intensity,
        l.flicker,
      );
      lv.phase = i * 1.7;
      return lv;
    });
  }

  private makeLight(
    worldX: number,
    worldY: number,
    color: number,
    radius: number,
    intensity: number,
    flicker: boolean,
  ): LightVisual {
    const sprite = new Sprite(this.sprites.light);
    sprite.anchor.set(0.5);
    sprite.blendMode = "add";
    sprite.tint = color;
    this.scene.addChild(sprite);
    return { sprite, worldX, worldY, radius, intensity, flicker, phase: 0 };
  }

  resize(width: number, height: number): void {
    this.rt.destroy(true);
    this.rt = RenderTexture.create({ width, height });
    this.overlay.texture = this.rt;
    this.drawAmbient(width, height);
  }

  private drawAmbient(width: number, height: number): void {
    this.ambient.clear();
    this.ambient.rect(0, 0, width, height).fill(AMBIENT_COLOR);
  }

  setPlayerLightPos(worldX: number, worldY: number): void {
    this.playerLight.worldX = worldX;
    this.playerLight.worldY = worldY;
  }

  update(deltaMS: number, camera: Camera, screenW: number, screenH: number): void {
    this.time += deltaMS;
    const all = [...this.lights, this.playerLight];
    for (const l of all) {
      const sx = (l.worldX - camera.x) * CAMERA_ZOOM + screenW / 2;
      const sy = (l.worldY - camera.y) * CAMERA_ZOOM + screenH / 2;
      l.sprite.position.set(sx, sy);
      const diameterPx = l.radius * 2 * TILE_SIZE * CAMERA_ZOOM;
      l.sprite.width = diameterPx;
      l.sprite.height = diameterPx;
      let a = l.intensity;
      if (l.flicker) {
        a *= 0.86 + 0.09 * Math.sin(this.time * 0.011 + l.phase) + 0.07 * Math.sin(this.time * 0.029 + l.phase * 2.3);
      }
      l.sprite.alpha = Math.max(0, Math.min(1, a));
      // culling simples
      l.sprite.visible = sx > -diameterPx && sy > -diameterPx && sx < screenW + diameterPx && sy < screenH + diameterPx;
    }
  }

  render(renderer: Renderer): void {
    renderer.render({ container: this.scene, target: this.rt, clear: true });
  }
}
